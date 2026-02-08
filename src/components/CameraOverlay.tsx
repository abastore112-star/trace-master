
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
  const [error, setError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 }
          },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const track = stream.getVideoTracks()[0];
          setVideoTrack(track);
        }
      } catch (err) {
        setError("Optical sensor access required for the projection.");
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

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
            autoPlay playsInline
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
              <img
                src={sketchCanvas.toDataURL()}
                className="max-w-none w-auto h-auto drop-shadow-[0_20px_60px_rgba(255,94,126,0.3)]"
                style={{ imageRendering: 'auto' }}
                alt="Tracing Projection"
              />
            </div>
          )}

          {/* Neutral vignette that works for both themes */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
        </>
      )}
    </div>
  );
};

export default CameraOverlay;
