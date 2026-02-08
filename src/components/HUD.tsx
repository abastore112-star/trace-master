import React from 'react';
import CameraOverlay from './CameraOverlay';
import { HUDToggle, NudgeButton } from './UIPrimitives';
import { Zap, ZapOff, Grid3X3, Image as ImageIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Unlock, Lock } from 'lucide-react';

interface HUDProps {
    settings: any;
    setSettings: any;
    originalBase64: string;
    setIsLocked: (v: boolean) => void;
    nudge: (dx: number, dy: number) => void;
}

export const HUD: React.FC<HUDProps> = ({ settings, setSettings, originalBase64, setIsLocked, nudge }) => {
    return (
        <>
            <div className="absolute top-6 left-6 lg:top-12 lg:left-12 flex flex-col gap-3 lg:gap-4 pointer-events-auto">
                <HUDToggle active={settings.torchOn} onClick={() => setSettings((s: any) => ({ ...s, torchOn: !s.torchOn }))}>
                    {settings.torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </HUDToggle>
                <HUDToggle active={settings.showGrid} onClick={() => setSettings((s: any) => ({ ...s, showGrid: !s.showGrid }))}>
                    <Grid3X3 className="w-5 h-5" />
                </HUDToggle>
                <HUDToggle active={settings.showReference} onClick={() => setSettings((s: any) => ({ ...s, showReference: !s.showReference }))}>
                    <ImageIcon className="w-5 h-5" />
                </HUDToggle>
            </div>

            <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 flex flex-col items-end gap-6 pointer-events-auto">
                {settings.showReference && originalBase64 && (
                    <div className="w-32 h-32 lg:w-48 lg:h-48 silk-panel rounded-3xl overflow-hidden border-2 border-accent/40 animate-in slide-in-from-bottom duration-700 shadow-2xl">
                        <img src={originalBase64} className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-opacity duration-700" />
                    </div>
                )}
                <button
                    onClick={() => setIsLocked(true)}
                    className="px-8 py-4 lg:px-12 lg:py-6 bg-accent text-sienna dark:text-white rounded-full font-bold text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all glow-on-hover"
                >
                    Lock Studio
                </button>
            </div>

            <div className="absolute bottom-6 left-6 lg:bottom-12 lg:left-12 flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-all duration-500">
                <NudgeButton onClick={() => nudge(0, -5)}><ChevronUp /></NudgeButton>
                <div className="flex gap-2">
                    <NudgeButton onClick={() => nudge(-5, 0)}><ChevronLeft /></NudgeButton>
                    <NudgeButton onClick={() => nudge(5, 0)}><ChevronRight /></NudgeButton>
                </div>
                <NudgeButton onClick={() => nudge(0, 5)}><ChevronDown /></NudgeButton>
            </div>
        </>
    );
};
