import { InfrastructureAlert } from './types';
import { MOCK_ALERTS } from './mock-data';
import { AlertCache } from './alert-cache';

/**
 * Alert data service with a 30-minute cache and disk persistence.
 *
 * The upstream fetcher currently returns mock data. To integrate real APIs,
 * replace `fetchFromUpstream()` with calls to NOAA, Open511, USGS, NBI, FIRMS
 * and normalize each response to `InfrastructureAlert[]`.
 *
 * Cache behavior:
 *  - Fresh data served from memory for 30 minutes after each fetch.
 *  - When stale, a background refresh is attempted.
 *  - If upstream is down, the last successful fetch is served (from memory or disk).
 *  - On cold start, the disk cache (.cache/alerts.json) is loaded automatically.
 */

async function fetchFromUpstream(): Promise<InfrastructureAlert[]> {
  // TODO: Replace with real API calls when data sources are integrated.
  // Example:
  //   const [noaa, open511, usgs] = await Promise.allSettled([
  //     fetchNOAA(),
  //     fetchOpen511(),
  //     fetchUSGS(),
  //   ]);
  //   return [...fulfilled(noaa), ...fulfilled(open511), ...fulfilled(usgs)];
  return MOCK_ALERTS;
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

/** Force a cache refresh (e.g. for a manual "refresh now" button). */
export async function refreshAlerts(): Promise<InfrastructureAlert[]> {
  return alertCache.refresh();
}

/** Filter alerts by search query and region. */
export function filterAlerts(
  alerts: InfrastructureAlert[],
  query: string,
  region: string
): InfrastructureAlert[] {
  const q = query.toLowerCase();
  return alerts.filter(alert => {
    const matchesSearch = !q ||
      alert.title.toLowerCase().includes(q) ||
      alert.description.toLowerCase().includes(q);
    const matchesRegion = region === 'all' || alert.state === region;
    return matchesSearch && matchesRegion;
  });
}
