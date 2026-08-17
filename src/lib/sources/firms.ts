/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert, Severity } from '../types';
import { FirmsConfig, firmsConfig } from './config';
import { inRegion, regionBboxParam, stateForPoint } from './geo';
import { fetchText } from './http';

/**
 * NASA FIRMS active fire detections.
 *
 * Endpoint: /api/area/csv/{MAP_KEY}/{SENSOR}/{west,south,east,north}/{days}
 * Requires a free MAP_KEY, so the source stays disabled until `FIRMS_MAP_KEY`
 * is set. The response is CSV, not JSON.
 */

const FIRMS_AREA_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

/**
 * VIIRS reports confidence as l/n/h; MODIS reports it as a 0-100 percentage.
 * Both appear in the same `confidence` column depending on the sensor.
 */
function mapConfidence(confidence: string): Severity {
  const value = confidence.trim().toLowerCase();
  if (value === 'h' || value === 'high') return 'Critical';
  if (value === 'n' || value === 'nominal') return 'Warning';
  if (value === 'l' || value === 'low') return 'Info';

  const percent = Number.parseFloat(value);
  if (Number.isFinite(percent)) {
    if (percent >= 80) return 'Critical';
    if (percent >= 30) return 'Warning';
    return 'Info';
  }
  return 'Unknown';
}

/** Split a CSV line, tolerating quoted fields. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map(f => f.trim());
}

/**
 * FIRMS reports `acq_date` (YYYY-MM-DD) and `acq_time` (HHMM, UTC) separately.
 */
function toIsoTimestamp(acqDate: string, acqTime: string): string {
  const padded = (acqTime || '0').padStart(4, '0');
  const iso = `${acqDate}T${padded.slice(0, 2)}:${padded.slice(2, 4)}:00Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/** Pure transform from FIRMS CSV text to dashboard alerts. Exported for testing. */
export function normalizeFirms(csv: string, sensor: string): InfrastructureAlert[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map(h => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const latIdx = col('latitude');
  const lonIdx = col('longitude');
  if (latIdx === -1 || lonIdx === -1) return [];

  const dateIdx = col('acq_date');
  const timeIdx = col('acq_time');
  const confIdx = col('confidence');
  const frpIdx = col('frp');
  const satIdx = col('satellite');
  const dayNightIdx = col('daynight');

  const alerts: InfrastructureAlert[] = [];

  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const lat = Number.parseFloat(fields[latIdx]);
    const lon = Number.parseFloat(fields[lonIdx]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    // The API takes a bbox, but re-check so a widened box never leaks through.
    if (!inRegion({ lat, lon })) continue;

    const acqDate = dateIdx === -1 ? '' : fields[dateIdx];
    const acqTime = timeIdx === -1 ? '' : fields[timeIdx];
    const timestamp = toIsoTimestamp(acqDate, acqTime);
    const state = stateForPoint({ lat, lon });
    const frp = frpIdx === -1 ? null : Number.parseFloat(fields[frpIdx]);
    const satellite = satIdx === -1 ? sensor : fields[satIdx] || sensor;

    const details = [
      Number.isFinite(frp as number) ? `Fire radiative power ${frp} MW.` : null,
      dayNightIdx !== -1 && fields[dayNightIdx]
        ? `Detected during ${fields[dayNightIdx].toUpperCase() === 'D' ? 'daytime' : 'nighttime'} overpass.`
        : null,
      `Satellite: ${satellite}.`,
    ].filter(Boolean);

    alerts.push({
      // Lat/lon/time uniquely identify a detection pixel; FIRMS has no event id.
      id: `firms:${sensor}:${lat},${lon}:${timestamp}`,
      source: 'FIRMS',
      category: 'Wildfire',
      title: `Active fire detection${state ? ` in ${state}` : ''}`,
      severity: confIdx === -1 ? 'Unknown' : mapConfidence(fields[confIdx]),
      state,
      lat,
      lon,
      description: `Thermal anomaly detected at ${lat}, ${lon}. ${details.join(' ')}`,
      timestamp,
      locationName: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
    });
  }

  return alerts;
}

/** Fetch active fire detections for the region. */
export async function fetchFirms(config: FirmsConfig | null = firmsConfig()): Promise<InfrastructureAlert[]> {
  if (!config) {
    throw new Error('FIRMS is enabled but FIRMS_MAP_KEY is not set');
  }

  const url = `${FIRMS_AREA_URL}/${encodeURIComponent(config.mapKey)}/${encodeURIComponent(config.sensor)}/${regionBboxParam()}/${config.days}`;
  const csv = await fetchText(url);

  // FIRMS returns a plain-text error body (not CSV) for a bad key or sensor.
  if (!csv.toLowerCase().startsWith('country_id') && !csv.toLowerCase().includes('latitude')) {
    throw new Error(`FIRMS returned an unexpected response: ${csv.slice(0, 120)}`);
  }

  return normalizeFirms(csv, config.sensor);
}
