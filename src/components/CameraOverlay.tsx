
import React, { useEffect, useRef, useState } from 'react';
import { TransformState, AppSettings } from '../types/types';

interface CameraOverlayProps {
  sketchCanvas: HTMLCanvasElement | null;
  opacity: number;
  mirror: boolean;
  transform: TransformState;
  settings: AppSettings;
  setTransform: React.Dispatch<React.SetStateAction<TransformState>>;
  isLocked: boolean;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ sketchCanvas, opacity, mirror, transform, settings, setTransform, isLocked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const projectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Gesture State
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastDistance = useRef<number | null>(null);

  const startCamera = async () => {
    setError(null);
    let stream: MediaStream | null = null;
    // ... rest of startCamera ...

    // Comprehensive constraint fallback sequence
    const constraintSets = [
      { video: { facingMode: 'environment', width: { ideal: 3840 }, height: { ideal: 2160 } } }, // 4K
      { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } }, // 1080p
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },  // 720p
      { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },   // 480p
      { video: { facingMode: 'environment' } }, // Default environment
      { video: true } // Absolute fallback
    ];

    for (const constraints of constraintSets) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await new Promise<void>((resolve) => {
            const v = videoRef.current;
            if (!v) return resolve();

            const onReady = () => {
              v.onplaying = null;
              v.onloadedmetadata = null;
              resolve();
            };

            v.onplaying = onReady;
            v.onloadedmetadata = onReady;

            // Timeout to prevent infinite hang on legacy hardware
            setTimeout(onReady, 2000);

            v.play().catch(() => {
              console.warn("Manual play play required?");
              resolve();
            });
          });

          const track = stream.getVideoTracks()[0];
          setVideoTrack(track);
          console.log(`Lens initialized with:`, constraints);
          break;
        }
      } catch (err: any) {
        console.warn(`Constraint set failed: ${err.name} - ${err.message}`, constraints);
        // Continue to next set
      }
    }

    if (!stream) {
      setError(`Lens failed: Hardware busy or permission denied. (Retry with Relens or check browser settings)`);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [retryCount]);

  const forceRestartLens = () => {
    setRetryCount(prev => prev + 1);
    if (window.navigator.vibrate) window.navigator.vibrate([30, 10, 30]);
  };

  useEffect(() => {
    if (sketchCanvas && projectionCanvasRef.current) {
      const pCtx = projectionCanvasRef.current.getContext('2d');
      if (pCtx) {
        projectionCanvasRef.current.width = sketchCanvas.width;
        projectionCanvasRef.current.height = sketchCanvas.height;
        pCtx.drawImage(sketchCanvas, 0, 0);
      }
    }
  }, [sketchCanvas]);

  useEffect(() => {
    if (videoTrack) {
      const capabilities = videoTrack.getCapabilities() as any;
      if (capabilities?.torch) {
        // Debounce torch to prevent flickering on hardware latency
        const timer = setTimeout(() => {
          videoTrack.applyConstraints({
            advanced: [{ torch: settings.torchOn } as any]
          }).catch(e => console.warn("Torch failed", e));
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [settings.torchOn, videoTrack]);

  // Gesture Logic
  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked) return;
    setIsDragging(true);

    if ('touches' in e) {
      if (e.touches.length === 1) {
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        lastDistance.current = getDistance(e.touches[0], e.touches[1]);
      }
    } else {
      lastPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || isLocked) return;

    if ('touches' in e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastPos.current.x;
        const dy = touch.clientY - lastPos.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2) {
        const dist = getDistance(e.touches[0], e.touches[1]);
        if (lastDistance.current !== null) {
          const delta = dist / lastDistance.current;
          setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(10, prev.scale * delta)) }));
        }
        lastDistance.current = dist;
      }
    } else {
      const mouse = e as React.MouseEvent;
      const dx = mouse.clientX - lastPos.current.x;
      const dy = mouse.clientY - lastPos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: mouse.clientX, y: mouse.clientY };
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    lastDistance.current = null;
  };

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden no-flicker touch-none select-none"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {error ? (
        <div className="flex items-center justify-center h-full text-white/40 p-10 text-center font-light italic">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover opacity-80 pointer-events-none ${mirror ? 'scale-x-[-1]' : ''}`}
            style={{ filter: 'contrast(1.1) brightness(0.9)' }}
          />

          {settings.showGrid && (
            <div className="absolute inset-0 pointer-events-none grid" style={{
              gridTemplateColumns: `repeat(${settings.gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${settings.gridSize}, 1fr)`
            }}>
              {Array.from({ length: settings.gridSize * settings.gridSize }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/10" />
              ))}
            </div>
          )}

          {sketchCanvas && (
            <div
              className={`absolute inset-0 pointer-events-none flex items-center justify-center no-flicker ${isDragging ? 'transition-none' : 'transition-transform duration-150'}`}
              style={{
                opacity,
                transform: `
                  translate(${transform.x}px, ${transform.y}px) 
                  scale(${transform.scale}) 
                  rotate(${transform.rotation}deg)
                  ${mirror ? 'scaleX(-1)' : ''}
                `,
                willChange: 'transform, opacity'
              }}
            >
              <canvas
                ref={projectionCanvasRef}
                className="max-w-none w-auto h-auto drop-shadow-[0_20px_60px_rgba(255,94,126,0.3)]"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
        </>
      )}
    </div>
  );
};

export default CameraOverlay;
