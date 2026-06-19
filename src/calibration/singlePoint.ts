import type { GeoCoord, PixelCoord, CalibrationPoint } from '../types';
import type { MapCalibration } from './types';
import { geoToMeters, metersToPixels } from '../geo/coords';

/**
 * One-point calibration: user taps a pixel and confirms their GPS position.
 * Position is tracked by applying metric displacement from the anchor point.
 *
 * Limitation: pixelsPerMeter must be user-supplied or estimated — there is no
 * way to derive scale from a single reference point. Two-point calibration
 * (seetwoPOint.ts) removes this limitation.
 */
export function createSinglePointCalibration(
  anchor: CalibrationPoint,
  pixelsPerMeter: number,
): MapCalibration {
  function geoToPixel(geo: GeoCoord): PixelCoord {
    const { north, east } = geoToMeters(anchor.geo, geo);
    const offset = metersToPixels(north, east, pixelsPerMeter);
    return {
      x: anchor.pixel.x + offset.x,
      y: anchor.pixel.y + offset.y,
    };
  }

  return {
    points: [anchor],
    pixelsPerMeter,
    geoToPixel,
  };
}
