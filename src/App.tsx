import { useState, useCallback } from 'react';
import type { AppState, CalibrationMode, CalibrationStep, PixelCoord, CalibrationPoint } from './types';
import type { MapCalibration } from './calibration/types';
import { createSinglePointCalibration } from './calibration/singlePoint';
import { createTwoPointCalibration } from './calibration/twoPoint';
import { useGeolocation } from './hooks/useGeolocation';
import { useMapImage } from './hooks/useMapImage';
import { Uploader } from './components/Uploader';
import { MapCanvas } from './components/MapCanvas';
import { Toolbar } from './components/Toolbar';
import './App.css';

const DEFAULT_PIXELS_PER_METER = 2;

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [calibrationMode, setCalibrationMode] = useState<CalibrationMode>('single');
  const [calibrationStep, setCalibrationStep] = useState<CalibrationStep>(1);
  const [pendingPoint, setPendingPoint] = useState<CalibrationPoint | null>(null);
  const [calibration, setCalibration] = useState<MapCalibration | null>(null);
  const [pixelsPerMeter, setPixelsPerMeter] = useState(DEFAULT_PIXELS_PER_METER);
  const [showTrail, setShowTrail] = useState(true);
  const { dataUrl, loading, error, load } = useMapImage();
  const geo = useGeolocation(appState === 'tracking');

  const handleFile = useCallback(
    (file: File) => {
      load(file);
      setCalibration(null);
      setAppState('idle');
    },
    [load],
  );

  function startCalibration(mode: CalibrationMode) {
    setCalibrationMode(mode);
    setCalibrationStep(1);
    setPendingPoint(null);
    setAppState('calibrating');
  }

  function handleRecalibrate() {
    setCalibrationStep(1);
    setPendingPoint(null);
    setAppState('calibrating');
  }

  function handleLoadNew() {
    window.location.reload();
  }

  function handleCalibrationTap(pixel: PixelCoord) {
    if (appState !== 'calibrating') return;

    // Use current GPS if available; fall back to zero coords.
    const geoPosition = geo.position ?? { lat: 0, lng: 0 };
    const point: CalibrationPoint = { pixel, geo: geoPosition };

    if (calibrationMode === 'single') {
      const cal = createSinglePointCalibration(point, pixelsPerMeter);
      setCalibration(cal);
      geo.clearTrail();
      setAppState('tracking');
      return;
    }

    // Two-point: first tap sets pending, second tap completes calibration.
    if (calibrationStep === 1) {
      setPendingPoint(point);
      setCalibrationStep(2);
    } else if (calibrationStep === 2 && pendingPoint) {
      const cal = createTwoPointCalibration(pendingPoint, point);
      setCalibration(cal);
      setPendingPoint(null);
      geo.clearTrail();
      setAppState('tracking');
    }
  }

  function handleScaleChange(v: number) {
    setPixelsPerMeter(v);
    // Only meaningful for single-point calibration; two-point derives its own scale.
    if (calibration?.points.length === 1) {
      setCalibration(createSinglePointCalibration(calibration.points[0], v));
    }
  }

  if (!dataUrl) {
    return <Uploader onFile={handleFile} loading={loading} error={error} />;
  }

  // Show pending first point as a preview dot during two-point step 2.
  const previewCalibration = pendingPoint
    ? createSinglePointCalibration(pendingPoint, pixelsPerMeter)
    : calibration;

  return (
    <div className="mapView">
      <MapCanvas
        imageUrl={dataUrl}
        calibration={previewCalibration}
        livePosition={geo.position}
        trail={showTrail ? geo.trail : []}
        onCalibrationTap={handleCalibrationTap}
        isCalibrating={appState === 'calibrating'}
      />
      <Toolbar
        appState={appState}
        calibrationMode={calibrationMode}
        calibrationStep={calibrationStep}
        calibration={calibration}
        gpsError={geo.error}
        accuracy={geo.accuracy}
        pixelsPerMeter={pixelsPerMeter}
        showTrail={showTrail}
        onStartCalibration={startCalibration}
        onRecalibrate={handleRecalibrate}
        onLoadNew={handleLoadNew}
        onScaleChange={handleScaleChange}
        onToggleTrail={() => setShowTrail((v) => !v)}
        onClearTrail={geo.clearTrail}
      />
    </div>
  );
}
