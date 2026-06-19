import { useState, useCallback } from 'react';
import { loadMapImage } from '../upload/loader';

export interface MapImageState {
  dataUrl: string | null;
  loading: boolean;
  error: string | null;
  load: (file: File) => Promise<void>;
  commitRotation: (rotatedUrl: string) => void;
}

export function useMapImage(): MapImageState {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const url = await loadMapImage(file);
      setDataUrl(url);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, []);

  const commitRotation = useCallback((rotatedUrl: string) => {
    setDataUrl(rotatedUrl);
  }, []);

  return { dataUrl, loading, error, load, commitRotation };
}
