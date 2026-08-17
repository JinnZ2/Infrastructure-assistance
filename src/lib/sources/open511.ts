/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert, Severity } from '../types';
import { Open511Config, open511Config } from './config';
import { GeoJsonGeometry, geometryCentroid, stateForPoint } from './geo';
import { fetchJson } from './http';

/**
 * Open511 road events.
 *
 * Open511 is a specification, not a single service — each DOT runs its own
 * deployment, so the base URL comes from `OPEN511_BASE_URL` and the source stays
 * disabled until it is set. Deployments that require a key read `OPEN511_API_KEY`.
 */

export interface Open511Event {
  id?: string;
  url?: string;
  headline?: string;
  description?: string;
  status?: string;
  severity?: string;
  event_type?: string;
  updated?: string;
  created?: string;
  geography?: GeoJsonGeometry;
  areas?: { name?: string; id?: string }[];
  roads?: { name?: string; direction?: string }[];
}

export interface Open511Response {
  events?: Open511Event[];
}

/** Open511 severity vocabulary → dashboard severity. */
function mapSeverity(severity?: string): Severity {
  switch ((severity ?? '').toUpperCase()) {
    case 'MAJOR':
      return 'Critical';
    case 'MODERATE':
      return 'Warning';
    case 'MINOR':
      return 'Info';
    default:
      return 'Unknown';
  }
}

/**
 * Area names in Open511 deployments are often `.../areas/mn.hennepin` style ids
 * or plain names; pull a two-letter state out when one is recognisable.
 */
function stateFromAreas(event: Open511Event): string | null {
  for (const area of event.areas ?? []) {
    const candidate = area.id ?? '';
    const match = candidate.match(/(?:^|[/.])([a-z]{2})(?:[/.]|$)/i);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

/** Pure transform from an Open511 response to dashboard alerts. Exported for testing. */
export function normalizeOpen511(response: Open511Response): InfrastructureAlert[] {
  const alerts: InfrastructureAlert[] = [];

  for (const event of response.events ?? []) {
    if (!event.id) continue;
    // ARCHIVED events describe things that already ended.
    if (event.status && event.status.toUpperCase() === 'ARCHIVED') continue;

    const centroid = geometryCentroid(event.geography);
    const roads = (event.roads ?? [])
      .map(r => [r.name, r.direction].filter(Boolean).join(' '))
      .filter(Boolean);
    const areaName = event.areas?.[0]?.name;

    alerts.push({
      id: `open511:${event.id}`,
      source: 'Open511',
      category: 'Road',
      title: event.headline?.trim() || event.event_type?.trim() || 'Road Event',
      severity: mapSeverity(event.severity),
      state: stateFromAreas(event) ?? stateForPoint(centroid),
      lat: centroid?.lat ?? null,
      lon: centroid?.lon ?? null,
      description:
        event.description?.trim() ||
        (roads.length > 0 ? `Affected roads: ${roads.join(', ')}.` : 'No description provided.'),
      timestamp: event.updated || event.created || new Date().toISOString(),
      locationName: roads[0] || areaName || undefined,
      url: event.url,
    });
  }

  return alerts;
}

/** Fetch active road events from the configured Open511 deployment. */
export async function fetchOpen511(config: Open511Config | null = open511Config()): Promise<InfrastructureAlert[]> {
  if (!config) {
    throw new Error('Open511 is enabled but OPEN511_BASE_URL is not set');
  }

  const url = new URL(`${config.baseUrl}/events`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('status', 'ACTIVE');
  if (config.apiKey) {
    url.searchParams.set('key', config.apiKey);
  }

  const response = await fetchJson<Open511Response>(url.toString());
  return normalizeOpen511(response);
}
