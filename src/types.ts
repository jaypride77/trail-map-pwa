export interface GeoCoord {
  lat: number;
  lng: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export interface CalibrationPoint {
  pixel: PixelCoord;
  geo: GeoCoord;
}

export type AppState = 'idle' | 'calibrating' | 'tracking';
export type CalibrationMode = 'single' | 'two-point';
export type CalibrationStep = 1 | 2;
