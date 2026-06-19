import { useRef, useEffect, useState, useCallback } from 'react';
import type { PixelCoord, GeoCoord } from '../types';
import type { MapCalibration } from '../calibration/types';
import styles from './MapCanvas.module.css';

interface Props {
  imageUrl: string;
  calibration: MapCalibration | null;
  livePosition: GeoCoord | null;
  trail: GeoCoord[];
  /** Preview rotation in degrees applied only during the orienting step. */
  rotation?: number;
  /** Called when the user taps the map during calibration. */
  onCalibrationTap?: (pixel: PixelCoord) => void;
  isCalibrating: boolean;
}

export function MapCanvas({ imageUrl, calibration, livePosition, trail, rotation = 0, onCalibrationTap, isCalibrating }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Pan / zoom state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const dragStart = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      fitToCanvas(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  function fitToCanvas(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: cw, height: ch } = canvas.getBoundingClientRect();
    const scale = Math.min(cw / img.width, ch / img.height, 1);
    const x = (cw - img.width * scale) / 2;
    const y = (ch - img.height * scale) / 2;
    setTransform({ scale, x, y });
  }

  // Redraw whenever transform, image, calibration, or position changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const { scale, x, y } = transform;
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (rotation !== 0) {
      // Rotate around image center for the orientation preview.
      ctx.translate(img.width / 2, img.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-img.width / 2, -img.height / 2);
    }
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Draw calibration anchor dots
    if (calibration) {
      for (const pt of calibration.points) {
        drawDot(ctx, toScreen(pt.pixel, transform), '#f5a623', 8);
      }
    }

    // Draw trail
    if (calibration && trail.length > 1) {
      ctx.beginPath();
      const first = toScreen(calibration.geoToPixel(trail[0]), transform);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < trail.length; i++) {
        const pt = toScreen(calibration.geoToPixel(trail[i]), transform);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = 'rgba(74, 144, 226, 0.6)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw live position
    if (calibration && livePosition) {
      const px = calibration.geoToPixel(livePosition);
      const screen = toScreen(px, transform);
      drawPulseDot(ctx, screen);
    }
  }, [transform, imageUrl, calibration, livePosition, trail, rotation]);

  // --- Interaction handlers ---

  function canvasPixel(e: React.MouseEvent | React.TouchEvent): PixelCoord {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } =
      'touches' in e ? e.changedTouches[0] : e;
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    return fromScreen({ x: screenX, y: screenY }, transform);
  }

  function handlePointerDown(e: React.MouseEvent) {
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
  }

  function handlePointerMove(e: React.MouseEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setTransform((t) => ({ ...t, x: dragStart.current!.tx + dx, y: dragStart.current!.ty + dy }));
  }

  function handlePointerUp(e: React.MouseEvent) {
    const wasDrag =
      dragStart.current &&
      (Math.abs(e.clientX - dragStart.current.mx) > 4 ||
        Math.abs(e.clientY - dragStart.current.my) > 4);
    dragStart.current = null;
    if (!wasDrag && isCalibrating && onCalibrationTap) {
      onCalibrationTap(canvasPixel(e));
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    zoom(e.deltaY < 0 ? 1.1 : 0.9, mx, my);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      lastPinchDist.current = pinchDist(e);
    } else {
      dragStart.current = {
        mx: e.touches[0].clientX,
        my: e.touches[0].clientY,
        tx: transform.x,
        ty: transform.y,
      };
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dist = pinchDist(e);
      const factor = dist / lastPinchDist.current;
      lastPinchDist.current = dist;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
      const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
      zoom(factor, mx, my);
    } else if (dragStart.current && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStart.current.mx;
      const dy = e.touches[0].clientY - dragStart.current.my;
      setTransform((t) => ({ ...t, x: dragStart.current!.tx + dx, y: dragStart.current!.ty + dy }));
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (lastPinchDist.current !== null) {
      lastPinchDist.current = null;
      return;
    }
    const wasDrag =
      dragStart.current &&
      e.changedTouches.length === 1 &&
      (Math.abs(e.changedTouches[0].clientX - dragStart.current.mx) > 8 ||
        Math.abs(e.changedTouches[0].clientY - dragStart.current.my) > 8);
    dragStart.current = null;
    if (!wasDrag && isCalibrating && onCalibrationTap) {
      onCalibrationTap(canvasPixel(e));
    }
  }

  function zoom(factor: number, mx: number, my: number) {
    setTransform((t) => {
      const newScale = Math.min(Math.max(t.scale * factor, 0.1), 20);
      const ratio = newScale / t.scale;
      return {
        scale: newScale,
        x: mx - ratio * (mx - t.x),
        y: my - ratio * (my - t.y),
      };
    });
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas} ${isCalibrating ? styles.crosshair : ''}`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={() => { dragStart.current = null; }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

// --- Coordinate helpers ---

function toScreen(pixel: PixelCoord, t: { scale: number; x: number; y: number }): PixelCoord {
  return { x: pixel.x * t.scale + t.x, y: pixel.y * t.scale + t.y };
}

function fromScreen(screen: PixelCoord, t: { scale: number; x: number; y: number }): PixelCoord {
  return { x: (screen.x - t.x) / t.scale, y: (screen.y - t.y) / t.scale };
}

function pinchDist(e: React.TouchEvent): number {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// --- Drawing helpers ---

function drawDot(ctx: CanvasRenderingContext2D, pos: PixelCoord, color: string, r: number) {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPulseDot(ctx: CanvasRenderingContext2D, pos: PixelCoord) {
  // Accuracy ring
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(74, 144, 226, 0.2)';
  ctx.fill();

  // Inner dot
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#4a90e2';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}
