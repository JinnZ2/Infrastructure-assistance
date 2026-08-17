/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { InfrastructureAlert } from './types';

/**
 * Pure, dependency-free alert filtering.
 *
 * This lives apart from `alert-service.ts` on purpose: the service pulls in the
 * disk-backed cache, which imports `fs` and therefore cannot be bundled into a
 * client component. The dashboard is a client component and only needs this
 * function, so keeping it here is what lets both sides import what they need.
 */

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
