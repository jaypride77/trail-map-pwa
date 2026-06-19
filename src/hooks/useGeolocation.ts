import { useState, useEffect, useRef, useCallback } from 'react';
import type { GeoCoord } from '../types';

export interface GeolocationState {
  position: GeoCoord | null;
  trail: GeoCoord[];
  accuracy: number | null;
  error: string | null;
  supported: boolean;
  clearTrail: () => void;
}

/**
 * Continuously watches GPS position.
 * Abstracted so a React Native implementation can swap in
 * @react-native-community/geolocation behind the same interface.
 */
export function useGeolocation(active: boolean): GeolocationState {
  const supported = 'geolocation' in navigator;
  const [position, setPosition] = useState<GeoCoord | null>(null);
  const [trail, setTrail] = useState<GeoCoord[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !supported) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: GeoCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coord);
        setAccuracy(pos.coords.accuracy);
        setError(null);
        setTrail((prev) => [...prev, coord]);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000 },
    );

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [active, supported]);

  const clearTrail = useCallback(() => setTrail([]), []);

  return { position, trail, accuracy, error, supported, clearTrail };
}
