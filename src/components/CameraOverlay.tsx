
import React, { useEffect, useRef, useState } from 'react';
import { TransformState, AppSettings } from '../types/types';

interface CameraOverlayProps {
  sketchCanvas: HTMLCanvasElement | null;
  opacity: number;
  mirror: boolean;
  transform: TransformState;
  settings: AppSettings;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ sketchCanvas, opacity, mirror, transform, settings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const projectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      // Don't restart if we already have a live track
      if (videoTrack && videoTrack.readyState === 'live') return;

      const constraintSets = [
        { video: { facingMode: 'environment', width: { ideal: 3840 }, height: { ideal: 2160 } } },
        { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } },
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment' } }
      ];

      for (const constraints of constraintSets) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: false });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Explicitly set muted and playsInline via JS for extra browser compatibility
            videoRef.current.muted = true;
            videoRef.current.setAttribute('playsinline', 'true');

            // Wait for metadata before playing
            await new Promise((resolve) => {
              if (videoRef.current) videoRef.current.onloadedmetadata = resolve;
              else resolve(null);
            });

            await videoRef.current.play();
            const track = stream.getVideoTracks()[0];
            setVideoTrack(track);
            setError(null);
            break;
          }
        } catch (err: any) {
          console.warn(`Constraint set failed (${err.name}):`, constraints);
          // If the source is busy (e.g. from a previous unmount that hasn't cleared), wait 500ms
          if (err.name === 'NotReadableError' || err.name === 'SourceUnavailableError') {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      if (!stream) {
        setError("Optical sensor access required. Please check permissions.");
      }
    };

    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [videoTrack]); // Re-run if track dies

  // Sync sketch to projection canvas for high performance
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
    <div className="relative w-full h-full bg-black overflow-hidden no-flicker">
      {error ? (
        <div className="flex items-center justify-center h-full text-white/40 p-10 text-center font-light italic">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover opacity-80 ${mirror ? 'scale-x-[-1]' : ''}`}
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
              className="absolute inset-0 pointer-events-none flex items-center justify-center no-flicker"
              style={{
                opacity,
                transform: `
                  translate(${transform.x}px, ${transform.y}px) 
                  scale(${transform.scale}) 
                  rotate(${transform.rotation}deg)
                  ${mirror ? 'scaleX(-1)' : ''}
                `,
                transition: 'none',
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
