/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert, Severity } from '../types';
import { configuredStates } from './config';
import { stateForPoint } from './geo';
import { fetchJson } from './http';

/**
 * USGS river gauges, flagged against published National Weather Service flood
 * stages.
 *
 * Two endpoints are joined by site number:
 *  1. WaterWatch flood-stage thresholds (action / flood / moderate / major), and
 *  2. NWIS instantaneous values for parameter 00065 (gage height, feet).
 *
 * A site becomes an alert only when its current stage reaches its own published
 * action stage — the thresholds come from the data, never from a guess here.
 */

const FLOOD_STAGE_URL = 'https://waterwatch.usgs.gov/webservices/floodstage';
const NWIS_IV_URL = 'https://waterservices.usgs.gov/nwis/iv/';

/** Gage height, in feet. */
const GAGE_HEIGHT_PARAM = '00065';

/** NWIS uses -999999 as its no-data sentinel. */
const NWIS_NO_DATA = -999999;

export interface FloodStageSite {
  site_no?: string;
  action_stage?: string | number;
  flood_stage?: string | number;
  moderate_flood_stage?: string | number;
  major_flood_stage?: string | number;
}

export interface FloodStageResponse {
  sites?: FloodStageSite[];
}

export interface NwisTimeSeries {
  sourceInfo?: {
    siteName?: string;
    siteCode?: { value?: string }[];
    geoLocation?: { geogLocation?: { latitude?: number; longitude?: number } };
  };
  values?: { value?: { value?: string; dateTime?: string }[] }[];
}

export interface NwisResponse {
  value?: { timeSeries?: NwisTimeSeries[] };
}

interface Thresholds {
  action: number | null;
  flood: number | null;
  moderate: number | null;
  major: number | null;
}

function toNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Index published thresholds by site number. */
export function indexFloodStages(responses: FloodStageResponse[]): Map<string, Thresholds> {
  const index = new Map<string, Thresholds>();
  for (const response of responses) {
    for (const site of response.sites ?? []) {
      if (!site.site_no) continue;
      index.set(site.site_no, {
        action: toNumber(site.action_stage),
        flood: toNumber(site.flood_stage),
        moderate: toNumber(site.moderate_flood_stage),
        major: toNumber(site.major_flood_stage),
      });
    }
  }
  return index;
}

/**
 * Classify a stage reading against a site's own thresholds.
 * Returns null when the reading is below action stage or nothing is published.
 */
function classify(stage: number, thresholds: Thresholds): { severity: Severity; label: string } | null {
  if (thresholds.major !== null && stage >= thresholds.major) {
    return { severity: 'Critical', label: 'Major flooding' };
  }
  if (thresholds.moderate !== null && stage >= thresholds.moderate) {
    return { severity: 'Critical', label: 'Moderate flooding' };
  }
  if (thresholds.flood !== null && stage >= thresholds.flood) {
    return { severity: 'Warning', label: 'Minor flooding' };
  }
  if (thresholds.action !== null && stage >= thresholds.action) {
    return { severity: 'Info', label: 'Near flood stage' };
  }
  return null;
}

function describe(
  siteName: string,
  stage: number,
  label: string,
  thresholds: Thresholds,
  observedAt: string
): string {
  const published = [
    thresholds.action !== null ? `action ${thresholds.action}ft` : null,
    thresholds.flood !== null ? `flood ${thresholds.flood}ft` : null,
    thresholds.moderate !== null ? `moderate ${thresholds.moderate}ft` : null,
    thresholds.major !== null ? `major ${thresholds.major}ft` : null,
  ].filter(Boolean).join(', ');

  return (
    `${label} at ${siteName}. Gage height is ${stage}ft as of ${observedAt}. ` +
    `Published NWS stages: ${published}.`
  );
}

/** Pure transform joining stage readings to thresholds. Exported for testing. */
export function normalizeUsgs(
  readings: NwisResponse,
  thresholdsBySite: Map<string, Thresholds>
): InfrastructureAlert[] {
  const alerts: InfrastructureAlert[] = [];

  for (const series of readings.value?.timeSeries ?? []) {
    const siteNo = series.sourceInfo?.siteCode?.[0]?.value;
    if (!siteNo) continue;

    const thresholds = thresholdsBySite.get(siteNo);
    if (!thresholds) continue;

    // Readings are ordered oldest-first; the last entry is the current stage.
    const points = series.values?.[0]?.value ?? [];
    const latest = points[points.length - 1];
    const stage = toNumber(latest?.value);
    if (stage === null || stage <= NWIS_NO_DATA) continue;

    const classification = classify(stage, thresholds);
    if (!classification) continue;

    const geo = series.sourceInfo?.geoLocation?.geogLocation;
    const lat = typeof geo?.latitude === 'number' ? geo.latitude : null;
    const lon = typeof geo?.longitude === 'number' ? geo.longitude : null;
    const siteName = series.sourceInfo?.siteName?.trim() || `USGS ${siteNo}`;
    const observedAt = latest?.dateTime ?? new Date().toISOString();

    alerts.push({
      id: `usgs:${siteNo}`,
      source: 'USGS',
      category: 'Flood',
      title: `${classification.label}: ${siteName}`,
      severity: classification.severity,
      state: stateForPoint(lat !== null && lon !== null ? { lat, lon } : null),
      lat,
      lon,
      description: describe(siteName, stage, classification.label, thresholds, observedAt),
      timestamp: observedAt,
      locationName: siteName,
      url: `https://waterdata.usgs.gov/monitoring-location/${siteNo}/`,
    });
  }

  return alerts;
}

/** Fetch gauge readings and flag those at or above their published action stage. */
export async function fetchUsgs(): Promise<InfrastructureAlert[]> {
  const states = configuredStates();

  // WaterWatch serves one state per request; NWIS accepts one stateCd too.
  const stageResponses = await Promise.all(
    states.map(state =>
      fetchJson<FloodStageResponse>(
        `${FLOOD_STAGE_URL}?format=json&state=${encodeURIComponent(state.toLowerCase())}`
      )
    )
  );
  const thresholdsBySite = indexFloodStages(stageResponses);

  const readingResponses = await Promise.all(
    states.map(state =>
      fetchJson<NwisResponse>(
        `${NWIS_IV_URL}?format=json&stateCd=${encodeURIComponent(state.toLowerCase())}` +
          `&parameterCd=${GAGE_HEIGHT_PARAM}&siteStatus=active`
      )
    )
  );

  return readingResponses.flatMap(response => normalizeUsgs(response, thresholdsBySite));
}
