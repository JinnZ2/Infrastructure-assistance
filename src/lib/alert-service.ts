/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert, SourceStatus } from './types';
import { MOCK_ALERTS } from './mock-data';
import { AlertCache } from './alert-cache';
import { fetchAllSources, sortAlerts } from './sources';
import { enabledSources, mockDataEnabled } from './sources/config';

/**
 * Alert data service with a 30-minute cache and disk persistence.
 *
 * Live sources (NOAA, USGS, Open511, NBI, FIRMS) are queried through
 * `src/lib/sources`; which ones run is controlled by `ALERT_SOURCES`. Set
 * `ALERTS_USE_MOCK=true` — or enable no sources at all — to serve the demo data
 * in `mock-data.ts` instead.
 *
 * Cache behavior:
 *  - Fresh data served from memory for 30 minutes after each fetch.
 *  - When stale, a background refresh is attempted.
 *  - If upstream is down, the last successful fetch is served (from memory or disk).
 *  - On cold start, the disk cache (.cache/alerts.json) is loaded automatically.
 */

/** Outcome of the most recent upstream attempt, surfaced through the API route. */
let lastSourceStatuses: SourceStatus[] = [];

async function fetchFromUpstream(): Promise<InfrastructureAlert[]> {
  const sources = enabledSources();

  if (mockDataEnabled() || sources.length === 0) {
    lastSourceStatuses = [];
    return sortAlerts(MOCK_ALERTS);
  }

  const { alerts, sources: statuses } = await fetchAllSources();
  lastSourceStatuses = statuses;

  // Partial results are fine — a single source going down shouldn't blank the
  // dashboard. But if every source failed, throw so the cache serves its last
  // known-good set instead of caching an empty list for 30 minutes.
  if (statuses.length > 0 && statuses.every(status => !status.ok)) {
    const reasons = statuses.map(s => `${s.source}: ${s.error}`).join('; ');
    throw new Error(`All alert sources failed — ${reasons}`);
  }

  return alerts;
}

// Singleton cache instance — shared across all requests in the server process.
// The 30-minute TTL means at most ~48 upstream fetches per day.
const alertCache = new AlertCache(fetchFromUpstream, {
  ttlMs: 30 * 60 * 1000, // 30 minutes
});

/** Fetch alerts through the cache layer. */
export async function fetchAlerts(): Promise<InfrastructureAlert[]> {
  return alertCache.get();
}

/** Get a single alert by ID (uses the cached set). */
export async function fetchAlertById(id: string): Promise<InfrastructureAlert | null> {
  const alerts = await fetchAlerts();
  return alerts.find(a => a.id === id) ?? null;
}

/** Cache diagnostics (age, staleness). */
export function cacheStatus() {
  return alertCache.status();
}

/** Per-source outcome of the most recent upstream attempt. */
export function sourceStatuses(): SourceStatus[] {
  return lastSourceStatuses;
}

/** Force a cache refresh (e.g. for a manual "refresh now" button). */
export async function refreshAlerts(): Promise<InfrastructureAlert[]> {
  return alertCache.refresh();
}

// Re-exported for server-side callers. Client components must import it from
// '@/lib/alert-filters' directly — importing it from here would pull the
// disk-backed cache (and its `fs` dependency) into the browser bundle.
export { filterAlerts } from './alert-filters';
