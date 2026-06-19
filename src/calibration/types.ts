import type { GeoCoord, PixelCoord, CalibrationPoint } from '../types';

export interface MapCalibration {
  /** All calibration points (1 for single-point, 2 for two-point). */
  points: CalibrationPoint[];
  /** Pixels per meter — derived or user-set. */
  pixelsPerMeter: number;
  /** Convert a GPS coordinate to a pixel position on the map image. */
  geoToPixel(geo: GeoCoord): PixelCoord;
}
