/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { AlertSource } from '../types';

/**
 * Environment-driven configuration for the live data sources.
 *
 * Every source is opt-in via `ALERT_SOURCES`. Sources that need credentials or a
 * deployment-specific endpoint (Open511, FIRMS, NBI) stay disabled until the
 * matching variable is set, so a default checkout never fires requests that are
 * guaranteed to fail.
 */

/** Two-letter state codes the dashboard covers. */
export const DEFAULT_STATES = ['MN', 'WI', 'MI', 'IA', 'IL', 'ND', 'SD'] as const;

/** Bounding box covering the Upper Midwest focus area (used by bbox-only APIs). */
export const REGION_BBOX = {
  lat_min: 42.0,
  lat_max: 49.0,
  lon_min: -97.2,
  lon_max: -82.0,
} as const;

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

function envInt(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envList(name: string, fallback: readonly string[]): string[] {
  const raw = env(name);
  if (!raw) return [...fallback];
  return raw
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

/** States to query, e.g. ['MN', 'WI', ...]. */
export function configuredStates(): string[] {
  return envList('ALERT_STATES', DEFAULT_STATES);
}

/** Per-request timeout for upstream calls. */
export function requestTimeoutMs(): number {
  return envInt('ALERT_FETCH_TIMEOUT_MS', 15_000);
}

/**
 * `api.weather.gov` requires a User-Agent identifying the application and a
 * contact address; requests without one are rejected or rate-limited.
 */
export function nwsUserAgent(): string {
  return env('NWS_USER_AGENT') ?? 'InfraGuard (https://github.com/JinnZ2/Infrastructure-assistance)';
}

export interface Open511Config {
  baseUrl: string;
  apiKey?: string;
}

/** Open511 needs a deployment URL — there is no single national endpoint. */
export function open511Config(): Open511Config | null {
  const baseUrl = env('OPEN511_BASE_URL');
  if (!baseUrl) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey: env('OPEN511_API_KEY') };
}

export interface FirmsConfig {
  mapKey: string;
  sensor: string;
  days: number;
}

/** NASA FIRMS requires a free MAP_KEY. */
export function firmsConfig(): FirmsConfig | null {
  const mapKey = env('FIRMS_MAP_KEY');
  if (!mapKey) return null;
  return {
    mapKey,
    sensor: env('FIRMS_SENSOR') ?? 'VIIRS_SNPP_NRT',
    days: envInt('FIRMS_DAYS', 1),
  };
}

export interface NbiConfig {
  featureServerUrl: string;
  where: string;
}

/**
 * NBI is published as ArcGIS FeatureServer layers whose field names differ
 * between hosts, so both the URL and the filter are configurable.
 */
export function nbiConfig(): NbiConfig | null {
  const featureServerUrl = env('NBI_FEATURE_SERVER_URL');
  if (!featureServerUrl) return null;
  return {
    featureServerUrl: featureServerUrl.replace(/\/+$/, ''),
    where: env('NBI_WHERE') ?? "BRIDGE_CONDITION = 'P'",
  };
}

/** When true, upstream fetching is skipped entirely and mock data is served. */
export function mockDataEnabled(): boolean {
  return env('ALERTS_USE_MOCK') === 'true';
}

/**
 * Which sources to query. Defaults to the two that need no credentials.
 * Sources listed here but missing their configuration are skipped with a warning.
 */
export function enabledSources(): AlertSource[] {
  const requested = envList('ALERT_SOURCES', ['NOAA', 'USGS']);
  const known: AlertSource[] = ['NOAA', 'USGS', 'Open511', 'NBI', 'FIRMS'];
  const bySlug = new Map(known.map(s => [s.toUpperCase(), s]));
  return requested.map(r => bySlug.get(r)).filter((s): s is AlertSource => Boolean(s));
}
