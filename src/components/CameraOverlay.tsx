
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

  const startCamera = async () => {
    setError(null);
    let stream: MediaStream | null = null;

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
          // Important for Android: ensure video has metadata before playing
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(resolve).catch(resolve);
              };
            }
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
    const capabilities = videoTrack ? (videoTrack.getCapabilities() as any) : null;
    if (videoTrack && capabilities && capabilities.torch) {
      videoTrack.applyConstraints({
        advanced: [{ torch: settings.torchOn } as any]
      }).catch(e => console.error("Torch unavailable", e));
    }
  }, [settings.torchOn, videoTrack]);

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden no-flicker touch-none select-none"
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
              className="absolute inset-0 pointer-events-none flex items-center justify-center no-flicker transition-transform duration-75"
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
