/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { AlertSource, InfrastructureAlert, SourceStatus, Severity } from '../types';
import { enabledSources } from './config';
import { fetchFirms } from './firms';
import { fetchNbi } from './nbi';
import { fetchNoaa } from './noaa';
import { fetchOpen511 } from './open511';
import { fetchUsgs } from './usgs';

/**
 * Runs every enabled source concurrently and merges the results.
 *
 * One source failing must never take the dashboard down, so each is settled
 * independently and its outcome reported back through `SourceStatus`. The caller
 * decides what to do with a partial result; the cache layer keeps serving the
 * last good set when everything fails.
 */

const FETCHERS: Record<AlertSource, () => Promise<InfrastructureAlert[]>> = {
  NOAA: fetchNoaa,
  USGS: fetchUsgs,
  Open511: fetchOpen511,
  NBI: fetchNbi,
  FIRMS: fetchFirms,
};

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  Warning: 1,
  Info: 2,
  Unknown: 3,
};

export interface AggregateResult {
  alerts: InfrastructureAlert[];
  sources: SourceStatus[];
}

/** Most severe first, then newest first. */
export function sortAlerts(alerts: InfrastructureAlert[]): InfrastructureAlert[] {
  return [...alerts].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return Date.parse(b.timestamp) - Date.parse(a.timestamp);
  });
}

/** Drop repeats of the same upstream id, keeping the first occurrence. */
export function dedupeAlerts(alerts: InfrastructureAlert[]): InfrastructureAlert[] {
  const seen = new Set<string>();
  const unique: InfrastructureAlert[] = [];
  for (const alert of alerts) {
    if (seen.has(alert.id)) continue;
    seen.add(alert.id);
    unique.push(alert);
  }
  return unique;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Fetch from all enabled sources, isolating failures per source. */
export async function fetchAllSources(): Promise<AggregateResult> {
  const sources = enabledSources();

  const settled = await Promise.all(
    sources.map(async (source): Promise<{ status: SourceStatus; alerts: InfrastructureAlert[] }> => {
      const startedAt = Date.now();
      try {
        const alerts = await FETCHERS[source]();
        return {
          alerts,
          status: { source, ok: true, count: alerts.length, durationMs: Date.now() - startedAt },
        };
      } catch (error) {
        console.error(`[sources] ${source} fetch failed:`, error);
        return {
          alerts: [],
          status: {
            source,
            ok: false,
            count: 0,
            durationMs: Date.now() - startedAt,
            error: errorMessage(error),
          },
        };
      }
    })
  );

  const alerts = sortAlerts(dedupeAlerts(settled.flatMap(result => result.alerts)));
  return { alerts, sources: settled.map(result => result.status) };
}
