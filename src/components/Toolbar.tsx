import type { AppState } from '../types';
import type { MapCalibration } from '../calibration/types';
import styles from './Toolbar.module.css';

interface Props {
  appState: AppState;
  calibration: MapCalibration | null;
  gpsError: string | null;
  accuracy: number | null;
  pixelsPerMeter: number;
  showTrail: boolean;
  onSetLocation: () => void;
  onRecalibrate: () => void;
  onLoadNew: () => void;
  onScaleChange: (v: number) => void;
  onToggleTrail: () => void;
  onClearTrail: () => void;
}

export function Toolbar({
  appState,
  calibration,
  gpsError,
  accuracy,
  pixelsPerMeter,
  showTrail,
  onSetLocation,
  onRecalibrate,
  onLoadNew,
  onScaleChange,
  onToggleTrail,
  onClearTrail,
}: Props) {
  return (
    <div className={styles.bar}>
      {appState === 'idle' && (
        <>
          <button className={styles.primary} onClick={onSetLocation}>
            📍 Set my location
          </button>
          <button className={styles.secondary} onClick={onLoadNew}>
            Load new map
          </button>
        </>
      )}

      {appState === 'calibrating' && (
        <p className={styles.hint}>Tap the map where you are standing</p>
      )}

      {appState === 'tracking' && (
        <>
          <div className={styles.status}>
            {gpsError ? (
              <span className={styles.error}>GPS error: {gpsError}</span>
            ) : accuracy !== null ? (
              <span className={styles.accuracy}>±{Math.round(accuracy)} m</span>
            ) : (
              <span className={styles.acquiring}>Acquiring GPS…</span>
            )}
          </div>

          <div className={styles.scaleRow}>
            <label className={styles.scaleLabel}>
              Scale
              <input
                type="range"
                min={0.1}
                max={20}
                step={0.1}
                value={pixelsPerMeter}
                onChange={(e) => onScaleChange(Number(e.target.value))}
                className={styles.slider}
              />
              <span>{pixelsPerMeter.toFixed(1)} px/m</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button className={styles.secondary} onClick={onToggleTrail}>
              {showTrail ? '🔵 Trail on' : '⚫ Trail off'}
            </button>
            <button className={styles.secondary} onClick={onClearTrail}>
              Clear trail
            </button>
          </div>
          <div className={styles.actions}>
            <button className={styles.secondary} onClick={onRecalibrate}>
              Re-calibrate
            </button>
            <button className={styles.secondary} onClick={onLoadNew}>
              New map
            </button>
          </div>
        </>
      )}
    </div>
  );
}
