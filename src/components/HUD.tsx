import React, { useState } from 'react';
import { Zap, ZapOff, Grid3X3, Image as ImageIcon, RotateCcw, FlipHorizontal, Plus, Lock, Maximize, Compass, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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
    retryCamera: () => void;
}

export const HUD: React.FC<HUDProps> = ({
    settings, setSettings, originalBase64, setIsLocked, nudge,
    mirror, setMirror, resetTransform, transform, setTransform,
    retryCamera
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleTool = (fn: () => void) => {
        fn();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };

    return (
        <div
            className="absolute inset-0 pointer-events-none z-[1002]"
            style={{
                paddingTop: 'calc(var(--safe-top) + 1.5rem)',
                paddingBottom: 'calc(var(--safe-bottom) + 1.5rem)',
                paddingLeft: 'calc(var(--safe-left) + 1.5rem)',
                paddingRight: 'calc(var(--safe-right) + 1.5rem)',
            }}
        >
            {/* Top Right: Status & Quick Lock */}
            <div className="absolute top-[var(--safe-top)] right-[var(--safe-right)] mt-6 mr-6 lg:mt-12 lg:mr-12 flex flex-col items-end gap-4 pointer-events-auto">
                <button
                    onClick={() => setIsLocked(true)}
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-accent text-sienna dark:bg-white dark:text-sienna rounded-full font-bold text-[9px] uppercase tracking-[0.3em] shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                    <Lock className="w-3.5 h-3.5" /> Lock
                </button>
            </div>

            {/* Bottom Right: Unified Action Bar (Horizontal Expansion) */}
            <div
                className="absolute flex items-center justify-end gap-3 pointer-events-auto flex-row-reverse max-w-[calc(100vw-3rem)] overflow-visible"
                style={{
                    bottom: 'calc(var(--safe-bottom) + 1.5rem)',
                    right: 'calc(var(--safe-right) + 1.5rem)'
                }}
            >
                {/* Main FAB Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 shrink-0
                    ${isExpanded ? 'bg-sienna text-white rotate-45 scale-90' : 'bg-accent text-sienna dark:bg-white dark:text-sienna rotate-0 scale-100 hover:scale-105'}`}
                >
                    <Plus className="w-7 h-7" />
                </button>

                {/* Expanded Tools Panel (Expands to Left) */}
                <div className={`flex items-end gap-2 lg:gap-3 transition-all duration-500 origin-right pr-2
                ${isExpanded ? 'scale-100 opacity-100 translate-x-0' : 'scale-0 opacity-0 translate-x-20 pointer-events-none'}`}>

                    {/* Spatial Controls Popover (Compact Block) */}
                    <div className="bg-white/95 dark:bg-[#12100e] backdrop-blur-3xl p-4 lg:p-5 rounded-[2rem] border border-sienna/10 dark:border-white/5 shadow-2xl space-y-4 lg:space-y-5 w-[140px] lg:w-[180px] shrink-0">
                        <HUDSlider
                            label="Scale"
                            icon={<Maximize className="w-3 h-3" />}
                            value={transform.scale} min={0.2} max={4} step={0.01}
                            onChange={(v: number) => setTransform((t: any) => ({ ...t, scale: v }))}
                        />
                        <HUDSlider
                            label="Angle"
                            icon={<Compass className="w-3 h-3" />}
                            value={transform.rotation} min={-180} max={180}
                            onChange={(v: number) => setTransform((t: any) => ({ ...t, rotation: v }))}
                        />

                        {/* Compact Nudge Grid */}
                        <div className="flex flex-col items-center gap-1 opacity-80 pt-1">
                            <HUDNudgeButton onClick={() => nudge(0, -1)}><ChevronUp /></HUDNudgeButton>
                            <div className="flex gap-1">
                                <HUDNudgeButton onClick={() => nudge(-1, 0)}><ChevronLeft /></HUDNudgeButton>
                                <HUDNudgeButton onClick={() => resetTransform()}><RotateCcw /></HUDNudgeButton>
                                <HUDNudgeButton onClick={() => nudge(1, 0)}><ChevronRight /></HUDNudgeButton>
                            </div>
                            <HUDNudgeButton onClick={() => nudge(0, 1)}><ChevronDown /></HUDNudgeButton>
                        </div>
                    </div>

                    {/* Compact Toggle Strip (Horizontal) */}
                    <div className="flex bg-white/95 dark:bg-[#12100e] backdrop-blur-3xl p-2 rounded-full border border-sienna/10 dark:border-white/5 shadow-2xl items-center gap-1.5 h-14 lg:h-16">
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
                            active={false}
                            onClick={() => toggleTool(retryCamera)}
                            label="Relens"
                        >
                            <RefreshCw />
                        </ToolButton>

                        <ToolButton
                            active={settings.showReference}
                            onClick={() => toggleTool(() => setSettings((s: any) => ({ ...s, showReference: !s.showReference })))}
                            label="Ref"
                        >
                            <ImageIcon />
                        </ToolButton>
                    </div>
                </div>
            </div>

            {/* Reference Thumbnail */}
            {settings.showReference && originalBase64 && (
                <div className="absolute top-6 left-6 lg:top-12 lg:left-12 w-32 h-32 lg:w-48 lg:h-48 silk-panel rounded-2xl overflow-hidden border border-accent/20 shadow-2xl animate-in slide-in-from-left duration-700 pointer-events-auto">
                    <img src={originalBase64} className="w-full h-full object-contain grayscale opacity-60" alt="Reference" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-[7px] text-white uppercase tracking-[0.2em] font-bold">Ref Art</div>
                </div>
            )}
        </div>
    );
};

const ToolButton = ({ active, onClick, children, label }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full transition-all active:scale-90 relative group
        ${active
                ? 'bg-accent text-sienna dark:bg-white dark:text-sienna shadow-lg'
                : 'text-sienna/60 dark:text-white/60 hover:bg-sienna/5 dark:hover:bg-white/5'}`}
    >
        {React.cloneElement(children as React.ReactElement<any>, { className: "w-4 h-4 lg:w-5 lg:h-5" })}
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-sienna dark:bg-white text-white dark:text-sienna text-[7px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
            {label}
        </span>
    </button>
);

const HUDNudgeButton = ({ onClick, children }: any) => (
    <button
        onClick={onClick}
        className="w-8 h-8 rounded-full bg-sienna/5 dark:bg-white/5 border border-sienna/5 dark:border-white/5 flex items-center justify-center text-sienna dark:text-white/60 hover:bg-accent hover:text-sienna dark:hover:bg-white dark:hover:text-sienna transition-all active:scale-90"
    >
        {React.cloneElement(children as React.ReactElement<any>, { className: "w-3 h-3" })}
    </button>
);

const HUDSlider = ({ label, icon, value, min, max, step = 1, onChange }: any) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-[0.2em] text-sienna/40 dark:text-white/40">
            <span className="flex items-center gap-1.5">{icon} {label}</span>
            <span className="text-accent dark:text-white/80">{typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-0.5 bg-sienna/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
        />
    </div>
);
