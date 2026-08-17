/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

export type Severity = 'Critical' | 'Warning' | 'Info' | 'Unknown';

export type AlertSource = 'NOAA' | 'NBI' | 'FIRMS' | 'Open511' | 'USGS';

export type InfrastructureCategory = 'Weather' | 'Bridge' | 'Wildfire' | 'Road' | 'Flood' | 'Rail' | 'Pipeline';

export interface InfrastructureAlert {
  id: string;
  source: AlertSource;
  category: InfrastructureCategory;
  title: string;
  severity: Severity;
  state: string | null;
  lat: number | null;
  lon: number | null;
  description: string;
  timestamp: string;
  locationName?: string;
  /** Link back to the upstream record, when the source provides one. */
  url?: string;
}

/** Per-source outcome of the last upstream fetch, for diagnostics and degraded-state UI. */
export interface SourceStatus {
  source: AlertSource;
  ok: boolean;
  count: number;
  durationMs: number;
  error?: string;
}

export interface RegionFocus {
  id: string;
  name: string;
  bbox: {
    lat_min: number;
    lat_max: number;
    lon_min: number;
    lon_max: number;
  };
}