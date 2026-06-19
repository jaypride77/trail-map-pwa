import type { AppState, CalibrationMode, CalibrationStep } from '../types';
import type { MapCalibration } from '../calibration/types';
import styles from './Toolbar.module.css';

interface Props {
  appState: AppState;
  calibrationMode: CalibrationMode;
  calibrationStep: CalibrationStep;
  calibration: MapCalibration | null;
  gpsError: string | null;
  accuracy: number | null;
  pixelsPerMeter: number;
  showTrail: boolean;
  onStartCalibration: (mode: CalibrationMode) => void;
  onRecalibrate: () => void;
  onLoadNew: () => void;
  onScaleChange: (v: number) => void;
  onToggleTrail: () => void;
  onClearTrail: () => void;
}

export function Toolbar({
  appState,
  calibrationMode,
  calibrationStep,
  calibration,
  gpsError,
  accuracy,
  pixelsPerMeter,
  showTrail,
  onStartCalibration,
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
          <p className={styles.modeLabel}>Calibration method</p>
          <div className={styles.modeRow}>
            <button
              className={`${styles.modeBtn} ${styles.modeBtnLeft}`}
              onClick={() => onStartCalibration('single')}
            >
              <span className={styles.modeBtnTitle}>1-Point</span>
              <span className={styles.modeBtnDesc}>Quick — tap where you stand. Adjust scale manually if needed.</span>
            </button>
            <button
              className={`${styles.modeBtn} ${styles.modeBtnRight}`}
              onClick={() => onStartCalibration('two-point')}
            >
              <span className={styles.modeBtnTitle}>2-Point</span>
              <span className={styles.modeBtnDesc}>Accurate — tap two known locations. Scale and rotation derived automatically.</span>
            </button>
          </div>
          <button className={styles.secondary} onClick={onLoadNew}>
            Load new map
          </button>
        </>
      )}

      {appState === 'calibrating' && calibrationMode === 'single' && (
        <p className={styles.hint}>Tap the map where you are standing</p>
      )}

      {appState === 'calibrating' && calibrationMode === 'two-point' && (
        <>
          <div className={styles.stepIndicator}>
            <span className={calibrationStep === 1 ? styles.stepActive : styles.stepDone}>① First point</span>
            <span className={styles.stepArrow}>→</span>
            <span className={calibrationStep === 2 ? styles.stepActive : styles.stepPending}>② Second point</span>
          </div>
          <p className={styles.hint}>
            {calibrationStep === 1
              ? 'Tap the map where you are standing now'
              : 'Walk to a second known location, then tap it on the map'}
          </p>
        </>
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

          {calibration?.points.length === 1 && (
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
          )}

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
