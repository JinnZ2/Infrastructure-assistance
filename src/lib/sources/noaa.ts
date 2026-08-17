/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert, InfrastructureCategory, Severity } from '../types';
import { configuredStates, nwsUserAgent } from './config';
import { GeoJsonGeometry, geometryCentroid, stateForPoint } from './geo';
import { fetchJson } from './http';

/**
 * NOAA / National Weather Service active alerts.
 *
 * Endpoint: https://api.weather.gov/alerts/active?area=MN,WI,...
 * No API key; the service requires a descriptive User-Agent (see config).
 */

const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active';

export interface NwsAlertProperties {
  id?: string;
  event?: string;
  headline?: string | null;
  description?: string | null;
  instruction?: string | null;
  severity?: string | null;
  areaDesc?: string | null;
  sent?: string | null;
  effective?: string | null;
  onset?: string | null;
  geocode?: { UGC?: string[]; SAME?: string[] } | null;
}

export interface NwsFeature {
  id?: string;
  geometry?: GeoJsonGeometry;
  properties?: NwsAlertProperties;
}

export interface NwsAlertResponse {
  features?: NwsFeature[];
}

/** NWS severity vocabulary → dashboard severity. */
function mapSeverity(severity?: string | null): Severity {
  switch ((severity ?? '').toLowerCase()) {
    case 'extreme':
    case 'severe':
      return 'Critical';
    case 'moderate':
      return 'Warning';
    case 'minor':
      return 'Info';
    default:
      return 'Unknown';
  }
}

/**
 * NWS event names are free-ish text ("Flood Warning", "Red Flag Warning").
 * Route the ones that map onto a non-weather infrastructure category.
 */
function mapCategory(event?: string | null): InfrastructureCategory {
  const name = (event ?? '').toLowerCase();
  if (name.includes('flood')) return 'Flood';
  if (name.includes('fire') || name.includes('red flag')) return 'Wildfire';
  return 'Weather';
}

/**
 * UGC codes look like `MNZ060` / `WIC075` — the first two characters are the
 * state. Falls back to the geometry when no UGC is present.
 */
function stateFromFeature(props: NwsAlertProperties, centroid: ReturnType<typeof geometryCentroid>): string | null {
  const ugc = props.geocode?.UGC ?? [];
  for (const code of ugc) {
    const prefix = code.slice(0, 2).toUpperCase();
    if (/^[A-Z]{2}$/.test(prefix)) return prefix;
  }
  return stateForPoint(centroid);
}

/** Pure transform from an NWS response to dashboard alerts. Exported for testing. */
export function normalizeNoaa(response: NwsAlertResponse): InfrastructureAlert[] {
  const features = response.features ?? [];
  const alerts: InfrastructureAlert[] = [];

  for (const feature of features) {
    const props = feature.properties;
    if (!props) continue;

    const id = props.id ?? feature.id;
    if (!id) continue;

    const centroid = geometryCentroid(feature.geometry);
    const description = [props.description, props.instruction]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    alerts.push({
      id: `noaa:${id}`,
      source: 'NOAA',
      category: mapCategory(props.event),
      title: props.headline?.trim() || props.event?.trim() || 'NWS Alert',
      severity: mapSeverity(props.severity),
      state: stateFromFeature(props, centroid),
      lat: centroid?.lat ?? null,
      lon: centroid?.lon ?? null,
      description: description || 'No description provided by the National Weather Service.',
      timestamp: props.onset || props.effective || props.sent || new Date().toISOString(),
      locationName: props.areaDesc?.trim() || undefined,
      url: typeof props.id === 'string' && props.id.startsWith('http') ? props.id : undefined,
    });
  }

  return alerts;
}

/** Fetch active NWS alerts for the configured states. */
export async function fetchNoaa(): Promise<InfrastructureAlert[]> {
  const states = configuredStates();
  const url = `${NWS_ALERTS_URL}?area=${encodeURIComponent(states.join(','))}`;

  const response = await fetchJson<NwsAlertResponse>(url, {
    headers: {
      // The NWS GeoJSON media type pins the response schema version.
      Accept: 'application/geo+json',
      'User-Agent': nwsUserAgent(),
    },
  });

  return normalizeNoaa(response);
}
