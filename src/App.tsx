import { useState, useCallback } from 'react';
import type { AppState, CalibrationMode, CalibrationStep, PixelCoord, CalibrationPoint } from './types';
import type { MapCalibration } from './calibration/types';
import { createSinglePointCalibration } from './calibration/singlePoint';
import { createTwoPointCalibration } from './calibration/twoPoint';
import { rotateImageDataUrl } from './upload/rotate';
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
  const [rotation, setRotation] = useState(0);
  const { dataUrl, loading, error, load, commitRotation } = useMapImage();
  const geo = useGeolocation(appState === 'tracking');

  const handleFile = useCallback(
    (file: File) => {
      load(file).then(() => {
        setRotation(0);
        setCalibration(null);
        setAppState('orienting');
      });
    },
    [load],
  );

  async function handleConfirmOrientation() {
    if (!dataUrl) return;
    if (rotation === 0) {
      setAppState('idle');
      return;
    }
    const rotated = await rotateImageDataUrl(dataUrl, rotation);
    commitRotation(rotated);
    setRotation(0);
    setAppState('idle');
  }

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

  function handleReorient() {
    setRotation(0);
    setAppState('orienting');
  }

  function handleLoadNew() {
    window.location.reload();
  }

  function handleCalibrationTap(pixel: PixelCoord) {
    if (appState !== 'calibrating') return;

    const geoPosition = geo.position ?? { lat: 0, lng: 0 };
    const point: CalibrationPoint = { pixel, geo: geoPosition };

    if (calibrationMode === 'single') {
      const cal = createSinglePointCalibration(point, pixelsPerMeter);
      setCalibration(cal);
      geo.clearTrail();
      setAppState('tracking');
      return;
    }

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
    if (calibration?.points.length === 1) {
      setCalibration(createSinglePointCalibration(calibration.points[0], v));
    }
  }

  if (!dataUrl) {
    return <Uploader onFile={handleFile} loading={loading} error={error} />;
  }

  const previewCalibration = pendingPoint
    ? createSinglePointCalibration(pendingPoint, pixelsPerMeter)
    : calibration;

  return (
    <div className="mapView">
      <MapCanvas
        imageUrl={dataUrl}
        calibration={appState === 'orienting' ? null : previewCalibration}
        livePosition={appState === 'tracking' ? geo.position : null}
        trail={showTrail ? geo.trail : []}
        onCalibrationTap={handleCalibrationTap}
        isCalibrating={appState === 'calibrating'}
        rotation={appState === 'orienting' ? rotation : 0}
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
        rotation={rotation}
        onStartCalibration={startCalibration}
        onRecalibrate={handleRecalibrate}
        onReorient={handleReorient}
        onLoadNew={handleLoadNew}
        onScaleChange={handleScaleChange}
        onToggleTrail={() => setShowTrail((v) => !v)}
        onClearTrail={geo.clearTrail}
        onRotationChange={setRotation}
        onConfirmOrientation={handleConfirmOrientation}
      />
    </div>
  );
}
