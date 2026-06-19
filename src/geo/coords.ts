import type { GeoCoord, PixelCoord } from '../types';

const METERS_PER_DEG_LAT = 111_320;

export function metersPerDegLng(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

/** Displacement in meters (north, east) from origin to target. */
export function geoToMeters(origin: GeoCoord, target: GeoCoord): { north: number; east: number } {
  const north = (target.lat - origin.lat) * METERS_PER_DEG_LAT;
  const east = (target.lng - origin.lng) * metersPerDegLng(origin.lat);
  return { north, east };
}

/** Meters displacement → pixel offset given pixels-per-meter scale. */
export function metersToPixels(
  north: number,
  east: number,
  pixelsPerMeter: number,
): PixelCoord {
  // Screen Y increases downward; north decreases Y.
  return {
    x: east * pixelsPerMeter,
    y: -north * pixelsPerMeter,
  };
}

/**
 * Derive pixels-per-meter from two calibration points.
 * Used by two-point calibration; exported here so both calibration
 * modules share the same geo math.
 */
export function deriveScale(
  geoA: GeoCoord,
  pixelA: PixelCoord,
  geoB: GeoCoord,
  pixelB: PixelCoord,
): number {
  const { north, east } = geoToMeters(geoA, geoB);
  const geoDistMeters = Math.sqrt(north ** 2 + east ** 2);
  const pixelDist = Math.sqrt((pixelB.x - pixelA.x) ** 2 + (pixelB.y - pixelA.y) ** 2);
  if (geoDistMeters === 0) return 1;
  return pixelDist / geoDistMeters;
}
