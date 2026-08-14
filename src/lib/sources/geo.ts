/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { REGION_BBOX } from './config';

/**
 * Full-extent bounding boxes for the covered states.
 *
 * Deliberately not `REGIONS` from mock-data: those are narrow dashboard focus
 * areas ("North Iowa", "East North Dakota") and would leave most real
 * coordinates in a state unlabelled. These are whole-state extents, used only to
 * infer a state code for feeds that report coordinates but no state.
 */
const STATE_BBOXES: { id: string; lat_min: number; lat_max: number; lon_min: number; lon_max: number }[] = [
  { id: 'MN', lat_min: 43.499, lat_max: 49.384, lon_min: -97.239, lon_max: -89.489 },
  { id: 'WI', lat_min: 42.492, lat_max: 47.081, lon_min: -92.889, lon_max: -86.764 },
  { id: 'MI', lat_min: 41.696, lat_max: 48.306, lon_min: -90.418, lon_max: -82.122 },
  { id: 'IA', lat_min: 40.375, lat_max: 43.502, lon_min: -96.640, lon_max: -90.140 },
  { id: 'IL', lat_min: 36.970, lat_max: 42.508, lon_min: -91.513, lon_max: -87.494 },
  { id: 'ND', lat_min: 45.935, lat_max: 49.001, lon_min: -104.049, lon_max: -96.554 },
  { id: 'SD', lat_min: 42.480, lat_max: 45.945, lon_min: -104.058, lon_max: -96.436 },
];

/** Minimal GeoJSON geometry shapes we accept from upstream feeds. */
export type GeoJsonGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString' | 'MultiPoint'; coordinates: [number, number][] }
  | { type: 'Polygon' | 'MultiLineString'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] }
  | { type: 'GeometryCollection'; geometries: GeoJsonGeometry[] }
  | null
  | undefined;

export interface LatLon {
  lat: number;
  lon: number;
}

/** Flatten arbitrarily nested GeoJSON coordinate arrays into [lon, lat] pairs. */
function collectPositions(geometry: GeoJsonGeometry, out: [number, number][] = []): [number, number][] {
  if (!geometry) return out;

  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries ?? []) collectPositions(child, out);
    return out;
  }

  const walk = (node: unknown): void => {
    if (!Array.isArray(node) || node.length === 0) return;
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      out.push([node[0], node[1]]);
      return;
    }

    // A list of positions is a LineString or a polygon ring. GeoJSON closes
    // rings by repeating the first position last; counting it twice pulls the
    // mean toward that corner, so drop the duplicate.
    const first = node[0];
    const last = node[node.length - 1];
    const isPositionList = Array.isArray(first) && typeof first[0] === 'number';
    const isClosedRing =
      isPositionList &&
      node.length > 1 &&
      Array.isArray(last) &&
      first[0] === last[0] &&
      first[1] === last[1];

    const end = isClosedRing ? node.length - 1 : node.length;
    for (let i = 0; i < end; i++) walk(node[i]);
  };
  walk((geometry as { coordinates?: unknown }).coordinates);
  return out;
}

/**
 * Representative point for a geometry: the mean of its vertices.
 *
 * This is a centre-of-vertices, not a true area centroid — good enough to drop a
 * marker on a warning polygon, and it never lands outside the feed's own extent
 * badly enough to matter at dashboard zoom levels.
 */
export function geometryCentroid(geometry: GeoJsonGeometry): LatLon | null {
  const positions = collectPositions(geometry);
  if (positions.length === 0) return null;

  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of positions) {
    sumLon += lon;
    sumLat += lat;
  }
  return {
    lat: round5(sumLat / positions.length),
    lon: round5(sumLon / positions.length),
  };
}

function round5(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

/** True when a point falls inside the overall Upper Midwest bounding box. */
export function inRegion(point: LatLon): boolean {
  return (
    point.lat >= REGION_BBOX.lat_min &&
    point.lat <= REGION_BBOX.lat_max &&
    point.lon >= REGION_BBOX.lon_min &&
    point.lon <= REGION_BBOX.lon_max
  );
}

/**
 * Best-effort state code for a coordinate.
 *
 * Rectangles overlap around state borders, so the smallest containing box wins.
 * This is an approximation — a point near a border can be attributed to the
 * neighbouring state — so callers prefer an authoritative state field from the
 * feed itself (NWS UGC codes, Open511 area ids) and fall back to this only when
 * the feed reports coordinates alone. Returns null outside all covered states.
 */
export function stateForPoint(point: LatLon | null): string | null {
  if (!point) return null;

  let best: { id: string; area: number } | null = null;
  for (const box of STATE_BBOXES) {
    const { lat_min, lat_max, lon_min, lon_max } = box;
    if (point.lat < lat_min || point.lat > lat_max) continue;
    if (point.lon < lon_min || point.lon > lon_max) continue;
    const area = (lat_max - lat_min) * (lon_max - lon_min);
    if (!best || area < best.area) best = { id: box.id, area };
  }
  return best?.id ?? null;
}

/** `[west, south, east, north]` string for APIs that take a bbox parameter. */
export function regionBboxParam(): string {
  return [
    REGION_BBOX.lon_min,
    REGION_BBOX.lat_min,
    REGION_BBOX.lon_max,
    REGION_BBOX.lat_max,
  ].join(',');
}
