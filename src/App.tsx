import { useState, useCallback } from 'react';
import type { AppState, PixelCoord } from './types';
import type { MapCalibration } from './calibration/types';
import { createSinglePointCalibration } from './calibration/singlePoint';
import { useGeolocation } from './hooks/useGeolocation';
import { useMapImage } from './hooks/useMapImage';
import { Uploader } from './components/Uploader';
import { MapCanvas } from './components/MapCanvas';
import { Toolbar } from './components/Toolbar';
import './App.css';

const DEFAULT_PIXELS_PER_METER = 2;

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
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

  function handleSetLocation() {
    setAppState('calibrating');
  }

  function handleRecalibrate() {
    setAppState('calibrating');
  }

  function handleLoadNew() {
    window.location.reload();
  }

  function handleCalibrationTap(pixel: PixelCoord) {
    if (appState !== 'calibrating') return;

    // Use current GPS if available; fall back to zero so the dot is visible
    // even without a signal — user can adjust scale and re-calibrate later.
    const geoPosition = geo.position ?? { lat: 0, lng: 0 };

    const cal = createSinglePointCalibration(
      { pixel, geo: geoPosition },
      pixelsPerMeter,
    );
    setCalibration(cal);
    geo.clearTrail();
    setAppState('tracking');
  }

  function handleScaleChange(v: number) {
    setPixelsPerMeter(v);
    if (calibration?.points[0]) {
      setCalibration(createSinglePointCalibration(calibration.points[0], v));
    }
  }

  if (!dataUrl) {
    return <Uploader onFile={handleFile} loading={loading} error={error} />;
  }

  return (
    <div className="mapView">
      <MapCanvas
        imageUrl={dataUrl}
        calibration={calibration}
        livePosition={geo.position}
        trail={showTrail ? geo.trail : []}
        onCalibrationTap={handleCalibrationTap}
        isCalibrating={appState === 'calibrating'}
      />
      <Toolbar
        appState={appState}
        calibration={calibration}
        gpsError={geo.error}
        accuracy={geo.accuracy}
        pixelsPerMeter={pixelsPerMeter}
        showTrail={showTrail}
        onSetLocation={handleSetLocation}
        onRecalibrate={handleRecalibrate}
        onLoadNew={handleLoadNew}
        onScaleChange={handleScaleChange}
        onToggleTrail={() => setShowTrail((v) => !v)}
        onClearTrail={geo.clearTrail}
      />
    </div>
  );
}
