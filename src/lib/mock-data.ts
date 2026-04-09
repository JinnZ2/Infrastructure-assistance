import { InfrastructureAlert, RegionFocus } from './types';

export const REGIONS: RegionFocus[] = [
  { id: 'MN', name: 'Minnesota', bbox: { lat_min: 46.0, lat_max: 49.0, lon_min: -97.2, lon_max: -89.5 } },
  { id: 'WI', name: 'Wisconsin', bbox: { lat_min: 44.5, lat_max: 47.5, lon_min: -93.0, lon_max: -86.5 } },
  { id: 'MI', name: 'Upper Michigan', bbox: { lat_min: 44.0, lat_max: 48.0, lon_min: -90.0, lon_max: -82.0 } },
  { id: 'IA', name: 'North Iowa', bbox: { lat_min: 42.5, lat_max: 43.5, lon_min: -96.5, lon_max: -90.1 } },
  { id: 'IL', name: 'North Illinois', bbox: { lat_min: 42.0, lat_max: 43.5, lon_min: -89.5, lon_max: -87.5 } },
  { id: 'ND', name: 'East North Dakota', bbox: { lat_min: 47.5, lat_max: 48.9, lon_min: -97.0, lon_max: -95.0 } },
  { id: 'SD', name: 'East South Dakota', bbox: { lat_min: 45.0, lat_max: 46.9, lon_min: -96.9, lon_max: -95.0 } },
];

export const MOCK_ALERTS: InfrastructureAlert[] = [
  {
    id: 'alert-1',
    source: 'Open511',
    category: 'Road',
    title: 'I-94 Closure: Westbound Bridge Maintenance',
    severity: 'Critical',
    state: 'MN',
    lat: 47.8,
    lon: -96.8,
    description: 'Full westbound closure of I-94 near Moorhead for emergency bridge joint repair. Traffic diverted to US-10. Delays of 45+ minutes expected during peak hours. Repairs estimated to complete by Wednesday evening.',
    timestamp: new Date().toISOString(),
    locationName: 'Moorhead, MN'
  },
  {
    id: 'alert-2',
    source: 'NOAA',
    category: 'Weather',
    title: 'Severe Thunderstorm Warning: Lake Superior Basin',
    severity: 'Warning',
    state: 'MI',
    lat: 46.5,
    lon: -87.4,
    description: 'The National Weather Service in Marquette has issued a Severe Thunderstorm Warning for Northern Marquette County. Wind gusts up to 60mph and 1-inch hail possible. Seek shelter immediately.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    locationName: 'Marquette, MI'
  },
  {
    id: 'alert-3',
    source: 'USGS',
    category: 'Flood',
    title: 'Flood Warning: Menominee River',
    severity: 'Critical',
    state: 'WI',
    lat: 45.2,
    lon: -87.6,
    description: 'River stage has exceeded 12.5ft (Flood Stage: 12.0ft). Moderate flooding is occurring. Low-lying agricultural land and sections of Highway 41 may be impacted within the next 12 hours.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    locationName: 'Marinette, WI'
  },
  {
    id: 'alert-4',
    source: 'NBI',
    category: 'Bridge',
    title: 'Bridge Condition: Structural Deficiency Detected',
    severity: 'Warning',
    state: 'IA',
    lat: 43.1,
    lon: -93.2,
    description: 'Annual inspection of bridge #IA-932 over Winnebago River has identified significant corrosion on primary support beams. Load rating reduced to 15 tons effective immediately.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    locationName: 'Mason City, IA'
  },
  {
    id: 'alert-5',
    source: 'FIRMS',
    category: 'Wildfire',
    title: 'Active Hotspot: Boundary Waters Wilderness',
    severity: 'Info',
    state: 'MN',
    lat: 48.1,
    lon: -91.2,
    description: 'Thermal satellite detection suggests a potential vegetation fire. Confidence: High. Forestry services have been notified for aerial reconnaissance.',
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    locationName: 'BWCA, MN'
  },
  {
    id: 'alert-6',
    source: 'Open511',
    category: 'Road',
    title: 'Winter Road Conditions: Black Ice Reported',
    severity: 'Warning',
    state: 'IL',
    lat: 42.4,
    lon: -88.0,
    description: 'Scattered icy patches reported on I-94 between Gurnee and the Wisconsin state line. Multiple spin-offs reported. Maintenance crews are applying salt/sand.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    locationName: 'Gurnee, IL'
  }
];