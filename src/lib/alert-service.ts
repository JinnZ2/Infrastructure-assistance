import { InfrastructureAlert } from './types';
import { MOCK_ALERTS } from './mock-data';

/**
 * Alert data service. Currently returns mock data but designed to be swapped
 * for real API integrations (NOAA, Open511, USGS, NBI, FIRMS).
 */

export async function fetchAlerts(): Promise<InfrastructureAlert[]> {
  // TODO: Replace with real API calls when data sources are integrated.
  // Each source would have its own fetcher that normalizes to InfrastructureAlert.
  return MOCK_ALERTS;
}

export async function fetchAlertById(id: string): Promise<InfrastructureAlert | null> {
  const alerts = await fetchAlerts();
  return alerts.find(a => a.id === id) ?? null;
}

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
