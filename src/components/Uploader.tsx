import React, { useRef, DragEvent } from 'react';
import styles from './Uploader.module.css';

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const ACCEPTED = ['image/png', 'image/jpeg', 'application/pdf'];

export function Uploader({ onFile, loading, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED.includes(file.type)) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Trail Map</h1>
      <div
        className={styles.dropzone}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {loading ? (
          <p>Loading map…</p>
        ) : (
          <>
            <p className={styles.icon}>🗺️</p>
            <p>Drop a map here or tap to choose</p>
            <p className={styles.hint}>PDF, PNG, or JPG</p>
          </>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}
