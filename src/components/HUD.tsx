import React, { useState } from 'react';
import { HUDToggle } from './UIPrimitives';
import { Zap, ZapOff, Grid3X3, Image as ImageIcon, RotateCcw, FlipHorizontal, Plus, X, Lock } from 'lucide-react';

interface HUDProps {
    settings: any;
    setSettings: any;
    originalBase64: string;
    setIsLocked: (v: boolean) => void;
    nudge: (dx: number, dy: number) => void;
    mirror: boolean;
    setMirror: (v: boolean) => void;
    resetTransform: () => void;
}

export const HUD: React.FC<HUDProps> = ({
    settings, setSettings, originalBase64, setIsLocked, nudge,
    mirror, setMirror, resetTransform
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleTool = (fn: () => void) => {
        fn();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };

    return (
        <div className="absolute inset-0 pointer-events-none p-6 lg:p-12 z-[1002]">
            {/* Top Right: Status & Quick Lock */}
            <div className="absolute top-6 right-6 lg:top-12 lg:right-12 flex flex-col items-end gap-4 pointer-events-auto">
                <button
                    onClick={() => setIsLocked(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-accent text-sienna dark:text-white rounded-full font-bold text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    <Lock className="w-4 h-4" /> Lock Studio
                </button>
            </div>

            {/* Bottom Right: Expandable Plus Menu */}
            <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 flex flex-col-reverse items-center gap-4 pointer-events-auto">
                {/* Main FAB */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isExpanded ? 'bg-sienna text-white rotate-45' : 'bg-accent text-sienna rotate-0'}`}
                >
                    {isExpanded ? <Plus className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                </button>

                {/* Expanded Tools */}
                <div className={`flex flex-col gap-4 mb-2 transition-all duration-500 origin-bottom ${isExpanded ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20 pointer-events-none'}`}>
                    <ToolButton
                        active={settings.torchOn}
                        onClick={() => toggleTool(() => setSettings((s: any) => ({ ...s, torchOn: !s.torchOn })))}
                        label="Torch"
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
                        active={settings.showReference}
                        onClick={() => toggleTool(() => setSettings((s: any) => ({ ...s, showReference: !s.showReference })))}
                        label="Reference"
                    >
                        <ImageIcon />
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
                        onClick={() => toggleTool(resetTransform)}
                        label="Reset View"
                    >
                        <RotateCcw />
                    </ToolButton>
                </div>
            </div>

            {/* Reference Thumbnail (Fixed position when active) */}
            {settings.showReference && originalBase64 && (
                <div className="absolute top-6 left-6 lg:top-12 lg:left-12 w-40 h-40 lg:w-56 lg:h-56 silk-panel rounded-3xl overflow-hidden border-2 border-accent/40 shadow-2xl animate-in slide-in-from-left duration-700">
                    <img src={originalBase64} className="w-full h-full object-cover grayscale opacity-60" alt="Reference" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[8px] text-white uppercase tracking-widest">Reference</div>
                </div>
            )}
        </div>
    );
};

const ToolButton = ({ active, onClick, children, label }: any) => (
    <div className="flex items-center gap-4 group">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
            {label}
        </span>
        <button
            onClick={onClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${active ? 'bg-accent text-sienna' : 'bg-white/90 backdrop-blur-md text-sienna/70 hover:bg-white hover:text-accent'} shadow-lg border border-white/20`}
        >
            {React.cloneElement(children as React.ReactElement<any>, { className: "w-6 h-6" })}
        </button>
    </div>
);
