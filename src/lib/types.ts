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