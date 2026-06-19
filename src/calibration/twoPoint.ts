import type { GeoCoord, PixelCoord, CalibrationPoint } from '../types';
import type { MapCalibration } from './types';
import { geoToMeters, metersToPixels, deriveScale } from '../geo/coords';

/**
 * Two-point calibration: user taps two known locations on the image and
 * provides GPS coordinates for each. This derives both scale and rotation,
 * giving accurate position across the full map extent.
 *
 * Not yet exposed in the UI — the architecture is in place for a future
 * calibration flow that prompts for a second reference point.
 */
export function createTwoPointCalibration(
  pointA: CalibrationPoint,
  pointB: CalibrationPoint,
): MapCalibration {
  const pixelsPerMeter = deriveScale(pointA.geo, pointA.pixel, pointB.geo, pointB.pixel);

  // Rotation angle: bearing from A→B in geo vs. pixel space.
  const { north, east } = geoToMeters(pointA.geo, pointB.geo);
  const geoBearing = Math.atan2(east, north); // radians clockwise from north
  const pixelBearing = Math.atan2(
    pointB.pixel.y - pointA.pixel.y,
    pointB.pixel.x - pointA.pixel.x,
  );
  // Pixel Y is inverted relative to geo north, so adjust:
  const rotationOffset = pixelBearing - (Math.PI / 2 - geoBearing);

  function geoToPixel(geo: GeoCoord): PixelCoord {
    const { north: dn, east: de } = geoToMeters(pointA.geo, geo);
    const raw = metersToPixels(dn, de, pixelsPerMeter);
    // Apply rotation around anchor pixel A.
    const cos = Math.cos(rotationOffset);
    const sin = Math.sin(rotationOffset);
    return {
      x: pointA.pixel.x + raw.x * cos - raw.y * sin,
      y: pointA.pixel.y + raw.x * sin + raw.y * cos,
    };
  }

  return {
    points: [pointA, pointB],
    pixelsPerMeter,
    geoToPixel,
  };
}
