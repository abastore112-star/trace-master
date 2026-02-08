import React, { useState } from 'react';
import { Zap, ZapOff, Grid3X3, Image as ImageIcon, RotateCcw, FlipHorizontal, Plus, X, Lock, Maximize, Compass, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface HUDProps {
    settings: any;
    setSettings: any;
    originalBase64: string;
    setIsLocked: (v: boolean) => void;
    nudge: (dx: number, dy: number) => void;
    mirror: boolean;
    setMirror: (v: boolean) => void;
    resetTransform: () => void;
    transform: any;
    setTransform: any;
}

export const HUD: React.FC<HUDProps> = ({
    settings, setSettings, originalBase64, setIsLocked, nudge,
    mirror, setMirror, resetTransform, transform, setTransform
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleTool = (fn: () => void) => {
        fn();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };

    return (
        <div className={`absolute inset-0 pointer-events-none transition-all duration-700 z-[1002] ${isExpanded ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}>
            {/* Top Right: Status & Quick Lock */}
            <div className="absolute top-6 right-6 lg:top-12 lg:right-12 flex flex-col items-end gap-4 pointer-events-auto">
                <button
                    onClick={() => setIsLocked(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-accent text-sienna dark:bg-white dark:text-sienna rounded-full font-bold text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    <Lock className="w-4 h-4" /> Lock Studio
                </button>
            </div>

            {/* Bottom Right: Unified Control Hub (FAB) */}
            <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 flex flex-col-reverse items-end gap-5 pointer-events-auto max-h-[90vh]">
                {/* Main FAB Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl z-50 
                    ${isExpanded ? 'bg-sienna text-white rotate-45 scale-90' : 'bg-accent text-sienna dark:bg-white dark:text-sienna rotate-0 scale-100 hover:scale-105'}`}
                >
                    <Plus className="w-8 h-8" />
                </button>

                {/* Expanded Tools Panel */}
                <div className={`flex flex-col gap-4 mb-2 transition-all duration-500 origin-bottom-right overflow-y-auto custom-scrollbar pr-2 max-w-[320px] 
                ${isExpanded ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20 pointer-events-none'}`}>

                    {/* Spatial Controls Section (Scale, Rotate, Nudge) */}
                    <div className="bg-white/95 dark:bg-sienna/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl space-y-6">
                        <HUDSlider
                            label="Projection Scale"
                            icon={<Maximize className="w-3.5 h-3.5" />}
                            value={transform.scale} min={0.2} max={4} step={0.01}
                            onChange={(v: number) => setTransform((t: any) => ({ ...t, scale: v }))}
                        />
                        <HUDSlider
                            label="Atelier Angle"
                            icon={<Compass className="w-3.5 h-3.5" />}
                            value={transform.rotation} min={-180} max={180}
                            onChange={(v: number) => setTransform((t: any) => ({ ...t, rotation: v }))}
                        />

                        {/* Precise Spatial Nudge */}
                        <div className="pt-4 space-y-4 border-t border-sienna/10 dark:border-white/10">
                            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-sienna/40 dark:text-white/40 text-center">Precise Spatial Nudge</p>
                            <div className="flex flex-col items-center gap-2">
                                <HUDNudgeButton onClick={() => nudge(0, -1)}><ChevronUp /></HUDNudgeButton>
                                <div className="flex gap-2">
                                    <HUDNudgeButton onClick={() => nudge(-1, 0)}><ChevronLeft /></HUDNudgeButton>
                                    <HUDNudgeButton onClick={() => resetTransform()}><RotateCcw /></HUDNudgeButton>
                                    <HUDNudgeButton onClick={() => nudge(1, 0)}><ChevronRight /></HUDNudgeButton>
                                </div>
                                <HUDNudgeButton onClick={() => nudge(0, 1)}><ChevronDown /></HUDNudgeButton>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Toggles Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <ToolButton
                            active={settings.torchOn}
                            onClick={() => toggleTool(() => setSettings((s: any) => ({ ...s, torchOn: !s.torchOn })))}
                            label="Flash"
                        >
                            {settings.torchOn ? <Zap /> : <ZapOff />}
                        </ToolButton>

                        <ToolButton
                            active={settings.showGrid}
                            onClick={() => toggleTool(() => setSettings((s: any) => ({ ...s, showGrid: !s.showGrid })))}
                            label="Grid"
                        >
                            <Grid3X3 />
                        </ToolButton>

                        <ToolButton
                            active={mirror}
                            onClick={() => toggleTool(() => setMirror(!mirror))}
                            label="Mirror"
                        >
                            <FlipHorizontal />
                        </ToolButton>

                        <ToolButton
                            active={settings.showReference}
                            onClick={() => toggleTool(() => setSettings((s: any) => ({ ...s, showReference: !s.showReference })))}
                            label="Reference"
                        >
                            <ImageIcon />
                        </ToolButton>
                    </div>
                </div>
            </div>

            {/* Reference Thumbnail */}
            {settings.showReference && originalBase64 && (
                <div className="absolute top-6 left-6 lg:top-12 lg:left-12 w-40 h-40 lg:w-56 lg:h-56 silk-panel rounded-3xl overflow-hidden border-2 border-accent/40 shadow-2xl animate-in slide-in-from-left duration-700 pointer-events-auto">
                    <img src={originalBase64} className="w-full h-full object-contain grayscale opacity-60" alt="Reference" />
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[8px] text-white uppercase tracking-[0.2em] font-bold">Trace Reference</div>
                </div>
            )}
        </div>
    );
};

const ToolButton = ({ active, onClick, children, label, wide }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 p-4 rounded-full transition-all shadow-lg border border-white/20 active:scale-95 ${wide ? 'w-full px-6' : 'w-full justify-center'} ${active ? 'bg-accent text-sienna dark:bg-white dark:text-sienna' : 'bg-white/95 dark:bg-sienna/95 backdrop-blur-md text-sienna/70 dark:text-white/70 hover:bg-white hover:text-accent'}`}
    >
        <div className="flex items-center gap-2">
            {React.cloneElement(children as React.ReactElement<any>, { className: "w-4 h-4" })}
            <span className="text-[8px] font-bold uppercase tracking-widest leading-none">{label}</span>
        </div>
    </button>
);

const HUDNudgeButton = ({ onClick, children }: any) => (
    <button
        onClick={onClick}
        className="w-10 h-10 rounded-full bg-sienna/5 dark:bg-white/5 border border-sienna/10 dark:border-white/10 flex items-center justify-center text-sienna dark:text-white hover:bg-accent hover:text-sienna dark:hover:bg-white dark:hover:text-sienna transition-all active:scale-90"
    >
        {React.cloneElement(children as React.ReactElement<any>, { className: "w-4 h-4" })}
    </button>
);

const HUDSlider = ({ label, icon, value, min, max, step = 1, onChange }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-sienna/60 dark:text-white/60">
            <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-accent dark:text-white">{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-sienna/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
        />
    </div>
);
