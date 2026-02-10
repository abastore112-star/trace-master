import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ImageIcon, Lock, Unlock, Library } from 'lucide-react';
import CameraOverlay from './components/CameraOverlay';
import LandingPage from './LandingPage';
import StudioHeader from './components/StudioHeader';
import StudioSidebar from './components/StudioSidebar';
import Gallery from './components/Gallery';
import { HUD } from './components/HUD';
import { applyFilters, extractPalette, analyzeImageForPresets, applyAutoTransparency, magicEraser } from './utils/imageProcessing';
import { ProcessingOptions, TransformState, AppSettings } from './types/types';
import { useTheme } from './utils/useTheme';
import { getDeviceTier, getTierScale, DeviceInfo } from './utils/deviceInfo';
import { initModel, extractNaturalSketch } from './services/mlVisionService';

const SketchPreview: React.FC<{
  sketchCanvas: HTMLCanvasElement | null,
  mirror: boolean,
  onErase?: (x: number, y: number) => void,
  eraserMode?: boolean
}> = ({ sketchCanvas, mirror, onErase, eraserMode }) => {
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!eraserMode || !onErase || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;

    // Account for object-contain letterboxing
    const canvasRatio = canvas.width / canvas.height;
    const rectRatio = rect.width / rect.height;

    let actualWidth = rect.width;
    let actualHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (rectRatio > canvasRatio) {
      // Pillarboxed (bars on sides)
      actualWidth = rect.height * canvasRatio;
      offsetX = (rect.width - actualWidth) / 2;
    } else {
      // Letterboxed (bars on top/bottom)
      actualHeight = rect.width / canvasRatio;
      offsetY = (rect.height - actualHeight) / 2;
    }

    const x = Math.round(((e.clientX - (rect.left + offsetX)) / actualWidth) * canvas.width);
    const y = Math.round(((e.clientY - (rect.top + offsetY)) / actualHeight) * canvas.height);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      onErase(x, y);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      className={`max-w-full max-h-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)] ${mirror ? 'scale-x-[-1]' : ''} ${eraserMode ? 'cursor-crosshair' : ''}`}
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
  const [eraserMode, setEraserMode] = useState(false);
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ img: HTMLImageElement, base64: string } | null>(null);

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

  const [deviceInfo] = useState<DeviceInfo>(getDeviceTier());
  const tierScale = getTierScale(deviceInfo.tier);

  const [uiVisible, setUiVisible] = useState(true);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wakeUI = useCallback(() => {
    setUiVisible(true);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      setUiVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    initModel(); // Initialize ML model on mount
  }, []);

  useEffect(() => {
    if (view === 'studio') {
      wakeUI();
      const events = ['mousedown', 'mousemove', 'touchstart', 'scroll', 'keydown'];
      events.forEach(e => window.addEventListener(e, wakeUI));
      return () => {
        if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
        events.forEach(e => window.removeEventListener(e, wakeUI));
      };
    }
  }, [view, wakeUI]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const isProcessingRef = useRef(false);
  const nextUpdateRef = useRef<{ img: HTMLImageElement, opts: ProcessingOptions } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setPendingUpload({ img, base64 });
          setSelectionModalOpen(true);
          if (window.navigator.vibrate) window.navigator.vibrate(40);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelect = (url: string) => {
    setIsAutoTuning(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setOriginalBase64(url);
      setImage(img);
      setPalette(extractPalette(img));

      const screenWidth = window.innerWidth * 0.8;
      const screenHeight = window.innerHeight * 0.8;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const scaleX = screenWidth / imgWidth;
      const scaleY = screenHeight / imgHeight;
      const initialScale = Math.min(scaleX, scaleY, 1.0);

      setTransform({
        scale: parseFloat(initialScale.toFixed(2)),
        x: 0,
        y: 0,
        rotation: 0
      });

      const presets = analyzeImageForPresets(img);
      const finalOptions = {
        ...options,
        ...presets,
        isPerfectSketch: true // Always perfect from gallery
      } as ProcessingOptions;

      setOptions(finalOptions);

      // Handle transparency
      if (hiddenCanvasRef.current) {
        setTimeout(() => {
          if (hiddenCanvasRef.current) {
            applyAutoTransparency(hiddenCanvasRef.current);
            const transparentCanvas = document.createElement('canvas');
            transparentCanvas.width = hiddenCanvasRef.current.width;
            transparentCanvas.height = hiddenCanvasRef.current.height;
            transparentCanvas.getContext('2d')?.drawImage(hiddenCanvasRef.current, 0, 0);
            setSketchCanvas(transparentCanvas);
            setIsAutoTuning(false);
          }
        }, 100);
      }

      setShowGallery(false);
      setView('studio');
      setIsSidebarOpen(false);
      setTimeout(() => setIsAutoTuning(false), 1200);
      if (window.navigator.vibrate) window.navigator.vibrate(40);
    };
    img.src = url;
  };

  const onSelectType = (isML: boolean) => {
    if (!pendingUpload) return;
    const { img, base64 } = pendingUpload;

    setOriginalBase64(base64);
    setImage(img);
    setPalette(extractPalette(img));
    setIsAutoTuning(true);

    // Adaptive Scaling & Centering
    const screenWidth = window.innerWidth * 0.8;
    const screenHeight = window.innerHeight * 0.8;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const scaleX = screenWidth / imgWidth;
    const scaleY = screenHeight / imgHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.0);

    setTransform({
      scale: parseFloat(initialScale.toFixed(2)),
      x: 0,
      y: 0,
      rotation: 0
    });

    const presets = analyzeImageForPresets(img);
    const finalOptions = {
      ...options,
      ...presets,
      isPerfectSketch: !isML // If user says it's a sketch, we treat it as perfect source
    } as ProcessingOptions;

    setOptions(finalOptions);

    if (!isML) {
      // User says it's a sketch: Just apply auto-transparency and bypass ML
      if (hiddenCanvasRef.current) {
        setTimeout(() => {
          if (hiddenCanvasRef.current) {
            applyAutoTransparency(hiddenCanvasRef.current);
            const transparentCanvas = document.createElement('canvas');
            transparentCanvas.width = hiddenCanvasRef.current.width;
            transparentCanvas.height = hiddenCanvasRef.current.height;
            transparentCanvas.getContext('2d')?.drawImage(hiddenCanvasRef.current, 0, 0);
            setSketchCanvas(transparentCanvas);
            setIsAutoTuning(false);
          }
        }, 100);
      }
    } else {
      // User says it's a photo: Standard ML Refine
      setTimeout(() => {
        autoTuneManually(img);
      }, 300);
    }

    setSelectionModalOpen(false);
    setPendingUpload(null);
    setView('studio');
    setIsSidebarOpen(false);
    setTimeout(() => setIsAutoTuning(false), 1200);
  };

  const processWorkerRequest = useCallback((img: HTMLImageElement, opts: ProcessingOptions) => {
    if (!workerRef.current || !hiddenCanvasRef.current) return;

    isProcessingRef.current = true;
    const hCanvas = hiddenCanvasRef.current;
    const hCtx = hCanvas.getContext('2d', { willReadFrequently: true });
    if (!hCtx) return;

    // Preparation pass (Brightness/Contrast and Scaling) on main thread
    // This is fast enough as it uses native browser filters
    const MAX_DIM = tierScale.maxDim;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    hCanvas.width = w;
    hCanvas.height = h;

    hCtx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%)`;
    hCtx.drawImage(img, 0, 0, w, h);
    hCtx.filter = 'none';

    const imageData = hCtx.getImageData(0, 0, w, h);
    workerRef.current.postMessage({ imageData, options: opts }, [imageData.data.buffer]);
  }, []);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./utils/imageWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { imageData } = e.data;
      if (hiddenCanvasRef.current) {
        const hCanvas = hiddenCanvasRef.current;
        hCanvas.getContext('2d')?.putImageData(imageData, 0, 0);

        const newCanvas = document.createElement('canvas');
        newCanvas.width = hCanvas.width;
        newCanvas.height = hCanvas.height;
        const nCtx = newCanvas.getContext('2d');
        if (nCtx) {
          nCtx.drawImage(hCanvas, 0, 0);
          setSketchCanvas(newCanvas);
        }
      }

      isProcessingRef.current = false;
      // If an update was requested while we were busy, do it now
      if (nextUpdateRef.current) {
        processWorkerRequest(nextUpdateRef.current.img, nextUpdateRef.current.opts);
        nextUpdateRef.current = null;
      }
    };

    return () => workerRef.current?.terminate();
  }, [processWorkerRequest]);

  const updateSketch = useCallback((img: HTMLImageElement, opts: ProcessingOptions) => {
    if (isProcessingRef.current) {
      nextUpdateRef.current = { img, opts };
    } else {
      // Add tier-based debounce to prevent saturating low-end CPUs
      const debounce = tierScale.workerDebounce;
      if (debounce > 0) {
        setTimeout(() => processWorkerRequest(img, opts), debounce);
      } else {
        processWorkerRequest(img, opts);
      }
    }
  }, [processWorkerRequest, tierScale.workerDebounce]);

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

  const autoTuneManually = async (targetImg?: HTMLImageElement) => {
    const activeImg = targetImg || image;
    if (!activeImg || !hiddenCanvasRef.current) return;
    setIsAutoTuning(true);

    try {
      // Draw to hidden canvas first if we are processing a new image
      const hCanvas = hiddenCanvasRef.current;
      const hCtx = hCanvas.getContext('2d');
      if (hCtx) {
        hCanvas.width = activeImg.naturalWidth;
        hCanvas.height = activeImg.naturalHeight;
        hCtx.drawImage(activeImg, 0, 0);
      }

      // Phase 2: ML-Powered Natural Sketch Extraction
      const mlResult = await extractNaturalSketch(hCanvas);
      if (mlResult) {
        const mlCanvas = document.createElement('canvas');
        mlCanvas.width = mlResult.width;
        mlCanvas.height = mlResult.height;
        mlCanvas.getContext('2d')?.putImageData(mlResult, 0, 0);
        setSketchCanvas(mlCanvas);
      } else {
        // Fallback to algorithmic tuning if ML fails
        const presets = analyzeImageForPresets(image);
        setOptions(o => ({ ...o, ...presets }));
      }
    } catch (err) {
      console.error('TraceMaster: ML Tuning failed, falling back:', err);
      const presets = analyzeImageForPresets(image);
      setOptions(o => ({ ...o, ...presets }));
    }

    setTimeout(() => setIsAutoTuning(false), 1000);
    if (window.navigator.vibrate) window.navigator.vibrate([10, 20]);
  };

  const handleMagicErase = (x: number, y: number) => {
    if (!image) return;

    // Call the worker with magic eraser action
    // Higher tolerance (50) for patterns as requested by user
    const eraseOptions: ProcessingOptions = {
      ...options,
      specialAction: 'magicEraser',
      startX: x,
      startY: y,
      tolerance: 60
    };
    processWorkerRequest(image, eraseOptions);
    if (window.navigator.vibrate) window.navigator.vibrate(20);
  };

  return (
    <div className={`h-[100dvh] transition-colors duration-400 ${view === 'landing' ? 'overflow-auto' : 'flex flex-col bg-cream overflow-hidden text-sienna'}`}>
      {view === 'landing' ? (
        <LandingPage
          onStart={() => {
            setView('studio');
            setShowGallery(false);
          }}
          onFileUpload={handleFileUpload}
          onShowGallery={() => {
            setView('studio');
            setShowGallery(true);
          }}
          fileInputRef={fileInputRef}
          toggleTheme={toggleTheme}
          theme={theme}
        />
      ) : (
        <>
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
              deviceTier={deviceInfo.tier}
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
                visible={uiVisible}
              />
            )}

            {isLocked && (
              <div className="absolute bottom-8 right-8 pointer-events-auto z-[1001] animate-in fade-in zoom-in duration-500">
                <button
                  onClick={() => {
                    setIsLocked(false);
                    if (window.navigator.vibrate) window.navigator.vibrate([20, 40, 20]);
                  }}
                  className="w-14 h-14 bg-white/40 backdrop-blur-3xl border border-white/20 text-sienna rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-white/60 group"
                  title="Unlock Workspace"
                >
                  <Unlock className="w-5 h-5 transition-transform group-hover:rotate-12" />
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
            visible={showCamera ? uiVisible : true}
            onShowGallery={() => setShowGallery(true)}
          />

          <div className="flex-1 flex p-3 lg:p-8 gap-8 overflow-hidden relative no-flicker">
            <div className="flex-1 relative silk-panel rounded-[2rem] lg:rounded-[4rem] overflow-hidden group bg-white/10 shadow-2xl">
              {!image ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in zoom-in slide-in-from-bottom-10 duration-1000">
                  <div className="space-y-4 max-w-2xl">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 silk-panel border-accent/20">
                      <Sparkles className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-4xl lg:text-6xl font-light italic text-sienna tracking-tight">Enter the Atelier.</h3>
                    <p className="text-[10px] lg:text-xs text-sienna/60 uppercase tracking-[0.6em] font-bold">Choose your path to begin the projection.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10 w-full max-w-4xl px-4">
                    {/* Option 1: Curated Library */}
                    <button
                      onClick={() => setShowGallery(true)}
                      className="group relative h-56 sm:h-72 lg:h-96 rounded-[3rem] lg:rounded-[4rem] overflow-hidden border border-sienna/10 bg-white/40 hover:bg-white/80 transition-all duration-700 shadow-2xl hover:-translate-y-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-transparent to-transparent group-hover:scale-110 transition-transform duration-1000" />
                      <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-500 shadow-inner">
                          <Library className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <div className="text-center space-y-2">
                          <h4 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-sienna">The Archive</h4>
                          <p className="text-[10px] uppercase tracking-widest text-sienna/50 font-bold">Curated Master Sketches</p>
                        </div>
                        <div className="pt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                          <span className="px-6 py-2 bg-sienna text-cream text-[9px] font-bold uppercase tracking-widest rounded-full">Explore Gallery</span>
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Upload */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative h-56 sm:h-72 lg:h-96 rounded-[3rem] lg:rounded-[4rem] overflow-hidden border border-sienna/10 bg-white/40 hover:bg-white/80 transition-all duration-700 shadow-2xl hover:-translate-y-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-sienna/10 via-transparent to-transparent group-hover:scale-110 transition-transform duration-1000" />
                      <div className="relative h-full flex flex-col items-center justify-center p-8 space-y-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-sienna/10 flex items-center justify-center text-sienna/60 group-hover:bg-sienna group-hover:text-white transition-all duration-500 shadow-inner">
                          <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <div className="text-center space-y-2">
                          <h4 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-sienna">Your Vision</h4>
                          <p className="text-[10px] uppercase tracking-widest text-sienna/50 font-bold">Upload Local Art Files</p>
                        </div>
                        <div className="pt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                          <span className="px-6 py-2 bg-accent text-sienna text-[9px] font-bold uppercase tracking-widest rounded-full">Choose Image</span>
                        </div>
                      </div>
                    </button>
                  </div>
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
                        onErase={handleMagicErase}
                        eraserMode={eraserMode}
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
              deviceTier={deviceInfo.tier}
              visible={uiVisible}
              eraserMode={eraserMode}
              setEraserMode={setEraserMode}
            />

            {isSidebarOpen && (
              <div className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[65]" onClick={() => setIsSidebarOpen(false)} />
            )}
          </div>
        </>
      )}

      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Gallery V2 - Global Access via overlay */}
      {showGallery && (
        <Gallery
          onSelect={handleGallerySelect}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Upload Selection Modal */}
      {selectionModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-sienna/20 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setSelectionModalOpen(false)} />
          <div className="relative w-full max-w-lg silk-panel rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in slide-in-from-bottom-10 duration-500 border border-white/40">
            <div className="space-y-2 text-center">
              <Sparkles className="w-12 h-12 text-accent mx-auto animate-pulse" />
              <h2 className="text-3xl font-light italic">Refinement Intelligence</h2>
              <p className="text-[10px] text-sienna/60 uppercase tracking-[0.4em]">Tell us more about your source art.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <button
                onClick={() => onSelectType(false)}
                className="group relative overflow-hidden p-6 rounded-[2rem] bg-white/40 hover:bg-white/60 border border-white/20 transition-all duration-300 transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">Sketch (Preserve Source)</h3>
                    <p className="text-xs text-sienna/70 leading-relaxed">Your art is already a sketch. We'll keep every single detail and just ghost the background.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectType(true)}
                className="group relative overflow-hidden p-6 rounded-[2rem] bg-white/40 hover:bg-white/60 border border-white/20 transition-all duration-300 transform hover:-translate-y-1 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">Photo (ML Extraction)</h3>
                    <p className="text-xs text-sienna/70 leading-relaxed">This is a photo or color image. We'll use AI to extract clean, perfect line art for you.</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setSelectionModalOpen(false)}
              className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.4em] text-sienna/40 hover:text-sienna/80 transition-colors"
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );

};

export default App;
