/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert, Severity } from '../types';
import { NbiConfig, nbiConfig } from './config';
import { configuredStates } from './config';
import { stateForPoint } from './geo';
import { fetchJson } from './http';

/**
 * National Bridge Inventory structures in poor condition.
 *
 * NBI is published as ArcGIS FeatureServer layers, and field naming differs
 * between hosts (`BRIDGE_CONDITION` vs `bridge_condition`, `LAT_016` vs
 * `latitude`, ...). Both the layer URL and the filter come from the environment,
 * and attribute reads probe the common spellings rather than assuming one.
 *
 * NBI is an annual inventory, not a live feed: these are standing condition
 * flags, so they are emitted at Warning/Info, never Critical.
 */

export interface ArcGisFeature {
  attributes?: Record<string, unknown>;
  geometry?: { x?: number; y?: number };
}

export interface ArcGisResponse {
  features?: ArcGisFeature[];
  error?: { message?: string };
}

/** Read the first present key from a set of candidate spellings. */
function attr(attributes: Record<string, unknown>, ...candidates: string[]): unknown {
  const lowered = new Map(Object.entries(attributes).map(([k, v]) => [k.toLowerCase(), v]));
  for (const candidate of candidates) {
    const value = lowered.get(candidate.toLowerCase());
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : null;
}

/**
 * NBI stores latitude/longitude as packed DDMMSSss integers in the raw files.
 * Hosted layers usually expose decimal degrees; detect the packed form by
 * magnitude and convert.
 */
function toDecimalDegrees(raw: number | null, isLongitude: boolean): number | null {
  if (raw === null) return null;
  const limit = isLongitude ? 180 : 90;
  if (Math.abs(raw) <= limit) return raw;

  const packed = Math.abs(raw);
  const degrees = Math.floor(packed / 1_000_000);
  const minutes = Math.floor((packed % 1_000_000) / 10_000);
  const seconds = (packed % 10_000) / 100;
  const decimal = degrees + minutes / 60 + seconds / 3600;
  if (decimal > limit) return null;
  // NBI stores west longitudes unsigned.
  return isLongitude ? -decimal : decimal;
}

/** `P` = poor, `F` = fair, `G` = good. */
function mapCondition(condition: string | null): { severity: Severity; label: string } {
  switch ((condition ?? '').toUpperCase()) {
    case 'P':
    case 'POOR':
      return { severity: 'Warning', label: 'Poor condition' };
    case 'F':
    case 'FAIR':
      return { severity: 'Info', label: 'Fair condition' };
    default:
      return { severity: 'Info', label: 'Condition flagged' };
  }
}

/** Pure transform from an ArcGIS query response to dashboard alerts. Exported for testing. */
export function normalizeNbi(response: ArcGisResponse): InfrastructureAlert[] {
  if (response.error) {
    throw new Error(`NBI feature service error: ${response.error.message ?? 'unknown'}`);
  }

  const allowedStates = new Set(configuredStates());
  const alerts: InfrastructureAlert[] = [];

  for (const feature of response.features ?? []) {
    const attributes = feature.attributes;
    if (!attributes) continue;

    const structureNumber = asString(attr(attributes, 'STRUCTURE_NUMBER_008', 'structure_number', 'BRIDGE_ID'));
    if (!structureNumber) continue;

    const lat = toDecimalDegrees(
      asNumber(feature.geometry?.y ?? attr(attributes, 'LAT_016', 'latitude', 'lat')),
      false
    );
    const lon = toDecimalDegrees(
      asNumber(feature.geometry?.x ?? attr(attributes, 'LONG_017', 'longitude', 'lon')),
      true
    );
    const point = lat !== null && lon !== null ? { lat, lon } : null;

    const state = asString(attr(attributes, 'STATE_CODE', 'state_code', 'STATE')) ?? stateForPoint(point);
    // A misconfigured `where` clause shouldn't drag in the whole country.
    if (state && /^[A-Z]{2}$/.test(state) && !allowedStates.has(state)) continue;

    const condition = asString(attr(attributes, 'BRIDGE_CONDITION', 'bridge_condition'));
    const { severity, label } = mapCondition(condition);
    const carried = asString(attr(attributes, 'FACILITY_CARRIED_007', 'facility_carried'));
    const crossed = asString(attr(attributes, 'FEATURES_DESC_006A', 'features_desc'));
    const location = asString(attr(attributes, 'LOCATION_009', 'location'));
    const year = asString(attr(attributes, 'YEAR_BUILT_027', 'year_built'));
    const adt = asNumber(attr(attributes, 'ADT_029', 'adt'));
    const inspected = asString(attr(attributes, 'DATE_OF_INSPECT_090', 'date_of_inspect'));

    const description = [
      `${label} bridge (NBI structure ${structureNumber}).`,
      carried ? `Carries ${carried}${crossed ? ` over ${crossed}` : ''}.` : null,
      location ? `Location: ${location}.` : null,
      year ? `Built ${year}.` : null,
      adt !== null ? `Average daily traffic: ${adt.toLocaleString('en-US')}.` : null,
      inspected ? `Last inspection record: ${inspected}.` : null,
      'Source is the annual National Bridge Inventory, not a real-time feed.',
    ].filter(Boolean).join(' ');

    alerts.push({
      id: `nbi:${structureNumber}`,
      source: 'NBI',
      category: 'Bridge',
      title: `${label}: ${carried ?? `Structure ${structureNumber}`}`,
      severity,
      state: state && /^[A-Z]{2}$/.test(state) ? state : null,
      lat,
      lon,
      description,
      timestamp: inspected ?? new Date().toISOString(),
      locationName: location ?? carried ?? undefined,
    });
  }

  return alerts;
}

/** Query the configured NBI feature service for flagged structures. */
export async function fetchNbi(config: NbiConfig | null = nbiConfig()): Promise<InfrastructureAlert[]> {
  if (!config) {
    throw new Error('NBI is enabled but NBI_FEATURE_SERVER_URL is not set');
  }

  const url = new URL(`${config.featureServerUrl}/query`);
  url.searchParams.set('where', config.where);
  url.searchParams.set('outFields', '*');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('f', 'json');

  const response = await fetchJson<ArcGisResponse>(url.toString());
  return normalizeNbi(response);
}
