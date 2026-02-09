import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ImageIcon, Lock, Unlock } from 'lucide-react';
import CameraOverlay from './components/CameraOverlay';
import LandingPage from './LandingPage';
import StudioHeader from './components/StudioHeader';
import StudioSidebar from './components/StudioSidebar';
import { HUD } from './components/HUD';
import { applyFilters, extractPalette, analyzeImageForPresets } from './utils/imageProcessing';
import { ProcessingOptions, TransformState, AppSettings } from './types/types';
import { useTheme } from './utils/useTheme';

const SketchPreview: React.FC<{ sketchCanvas: HTMLCanvasElement | null, mirror: boolean }> = ({ sketchCanvas, mirror }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (sketchCanvas && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = sketchCanvas.width;
        canvasRef.current.height = sketchCanvas.height;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(sketchCanvas, 0, 0);
      }
    }
  }, [sketchCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full max-h-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)] ${mirror ? 'scale-x-[-1]' : ''}`}
    />
  );
};

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<'landing' | 'studio'>('landing');

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string>("");
  const [sketchCanvas, setSketchCanvas] = useState<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [palette, setPalette] = useState<string[]>([]);
  const [opacity, setOpacity] = useState(0.4);
  const [mirror, setMirror] = useState(false);
  const [activeTab, setActiveTab] = useState<'lens' | 'palette'>('lens');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAutoTuning, setIsAutoTuning] = useState(false);

  const [options, setOptions] = useState<ProcessingOptions>({
    threshold: 45,
    edgeStrength: 40,
    invert: false,
    contrast: 100,
    brightness: 100,
    blend: 0
  });

  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    x: 0,
    y: 0,
    rotation: 0
  });

  const [settings, setSettings] = useState<AppSettings>({
    showGrid: false,
    gridSize: 3,
    torchOn: false,
    showReference: false,
    lockWake: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setOriginalBase64(base64);
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setPalette(extractPalette(img));
          setIsAutoTuning(true);

          // Adaptive Scaling & Centering
          const screenWidth = window.innerWidth * 0.8; // 80% safety margin
          const screenHeight = window.innerHeight * 0.8;
          const imgWidth = img.naturalWidth;
          const imgHeight = img.naturalHeight;

          const scaleX = screenWidth / imgWidth;
          const scaleY = screenHeight / imgHeight;
          const initialScale = Math.min(scaleX, scaleY, 1.0); // Don't upsale by default

          setTransform({
            scale: parseFloat(initialScale.toFixed(2)),
            x: 0,
            y: 0,
            rotation: 0
          });

          const presets = analyzeImageForPresets(img);
          const finalOptions = { ...options, ...presets } as ProcessingOptions;
          setOptions(finalOptions);
          updateSketch(img, finalOptions);
          setView('studio');
          setIsSidebarOpen(false);
          setTimeout(() => setIsAutoTuning(false), 1200);
          if (window.navigator.vibrate) window.navigator.vibrate(40);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSketch = useCallback((img: HTMLImageElement, opts: ProcessingOptions) => {
    if (hiddenCanvasRef.current) {
      applyFilters(hiddenCanvasRef.current, img, opts);
      const newCanvas = document.createElement('canvas');
      newCanvas.width = hiddenCanvasRef.current.width;
      newCanvas.height = hiddenCanvasRef.current.height;
      newCanvas.getContext('2d')?.drawImage(hiddenCanvasRef.current, 0, 0);
      setSketchCanvas(newCanvas);
    }
  }, []);

  useEffect(() => {
    if (image) updateSketch(image, options);
  }, [image, options, updateSketch]);

  const resetTransform = useCallback(() => {
    if (!image) return;
    const screenWidth = window.innerWidth * 0.8;
    const screenHeight = window.innerHeight * 0.8;
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    const scaleX = screenWidth / imgWidth;
    const scaleY = screenHeight / imgHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.0);
    setTransform({
      scale: parseFloat(initialScale.toFixed(2)),
      x: 0,
      y: 0,
      rotation: 0
    });
    if (window.navigator.vibrate) window.navigator.vibrate(20);
  }, [image]);

  const nudge = (dx: number, dy: number) => {
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  const [cameraKey, setCameraKey] = useState(0);

  const retryCamera = () => {
    setCameraKey(prev => prev + 1);
    if (window.navigator.vibrate) window.navigator.vibrate([30, 10, 30]);
  };

  const autoTuneManually = () => {
    if (!image) return;
    setIsAutoTuning(true);
    const presets = analyzeImageForPresets(image);
    setOptions(o => ({ ...o, ...presets }));
    setTimeout(() => setIsAutoTuning(false), 1000);
    if (window.navigator.vibrate) window.navigator.vibrate([10, 20]);
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={() => setView('studio')}
        onFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
        toggleTheme={toggleTheme}
        theme={theme}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-cream overflow-hidden text-sienna transition-colors duration-400">
      {/* Persistent Camera Overlay - Never unmounts to prevent source errors */}
      <div
        className={`fixed inset-0 transition-opacity duration-700 ${isLocked ? 'z-[1000] opacity-100' : (showCamera && view === 'studio' ? 'z-10 opacity-100' : 'z-[-1] opacity-0 pointer-events-none')}`}
        style={{ pointerEvents: isLocked || (showCamera && view === 'studio') ? 'auto' : 'none' }}
      >
        <CameraOverlay
          key={`camera-${cameraKey}`}
          sketchCanvas={sketchCanvas}
          opacity={opacity}
          mirror={mirror}
          transform={transform}
          settings={settings}
          setTransform={setTransform}
          isLocked={isLocked}
        />

        {!isLocked && (showCamera || view === 'studio') && (
          <HUD
            settings={settings}
            setSettings={setSettings}
            originalBase64={originalBase64}
            setIsLocked={setIsLocked}
            nudge={nudge}
            mirror={mirror}
            setMirror={setMirror}
            resetTransform={resetTransform}
            transform={transform}
            setTransform={setTransform}
            retryCamera={retryCamera}
          />
        )}

        {isLocked && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 pointer-events-auto z-[1001]">
            <div className="flex items-center gap-3 px-6 py-3 silk-panel rounded-full text-[10px] font-bold uppercase tracking-[0.4em] text-accent animate-pulse">
              <Lock className="w-4 h-4" /> Locked Atelier
            </div>
            <button
              onClick={() => {
                setIsLocked(false);
                if (window.navigator.vibrate) window.navigator.vibrate([20, 40, 20]);
              }}
              className="px-12 py-6 bg-cream/90 backdrop-blur-3xl border border-accent/20 text-sienna rounded-full font-bold text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center gap-4 hover:bg-cream"
            >
              <Unlock className="w-4 h-4" /> Return to Studio
            </button>
          </div>
        )}
      </div>

      <StudioHeader
        theme={theme}
        toggleTheme={toggleTheme}
        onBack={() => setView('landing')}
        showCamera={showCamera}
        setShowCamera={setShowCamera}
        image={image}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        settings={settings}
        setSettings={setSettings}
        mirror={mirror}
        setMirror={setMirror}
        retryCamera={retryCamera}
      />

      <div className="flex-1 flex p-3 lg:p-8 gap-8 overflow-hidden relative no-flicker">
        <div className="flex-1 relative silk-panel rounded-[2rem] lg:rounded-[4rem] overflow-hidden group bg-white/10 shadow-2xl">
          {!image ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-10 animate-in zoom-in duration-1000">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-petal/40 rounded-full flex items-center justify-center float-anim shadow-lg shadow-accent/20">
                <ImageIcon className="w-8 h-8 lg:w-12 lg:h-12 text-accent" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl lg:text-4xl font-light italic">Waiting for vision.</h3>
                <p className="text-[10px] lg:text-xs text-sienna/70 uppercase tracking-[0.4em]">The canvas awaits its digital ghost.</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-5 bg-accent text-sienna dark:text-white rounded-full text-[11px] font-bold uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all"
              >
                Upload Your Art
              </button>
            </div>
          ) : (
            <>
              {isAutoTuning && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-cream/70 backdrop-blur-xl animate-in fade-in duration-500">
                  <div className="flex flex-col items-center gap-6">
                    <Sparkles className="w-16 h-16 text-accent animate-bounce" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.6em] text-accent animate-pulse">Distilling Lines...</span>
                  </div>
                </div>
              )}

              {/* Preview Mode (When camera is off) */}
              {!showCamera && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-cream/10 p-8 no-flicker transition-opacity duration-300"
                  style={{ opacity }}
                >
                  <SketchPreview
                    sketchCanvas={sketchCanvas}
                    mirror={mirror}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <StudioSidebar
          image={image}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          options={options}
          setOptions={setOptions}
          opacity={opacity}
          setOpacity={setOpacity}
          mirror={mirror}
          setMirror={setMirror}
          transform={transform}
          setTransform={setTransform}
          palette={palette}
          autoTuneManually={autoTuneManually}
          nudge={nudge}
          settings={settings}
          setSettings={setSettings}
        />

        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[65]" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>

      <canvas ref={hiddenCanvasRef} className="hidden" />
    </div>
  );

};

export default App;
