import React from 'react';
import { RotateCcw, Lock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

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

            {/* Bottom Right: Minimal Nudge Panel */}
            <div
                className="fixed flex flex-col items-end gap-3 pointer-events-auto z-[1050]"
                style={{
                    bottom: 'calc(var(--safe-bottom) + 1.5rem)',
                    right: 'calc(var(--safe-right) + 1rem)'
                }}
            >
                {/* Spatial Controls (Inspector Lite) */}
                <div className="bg-white/95 dark:bg-[#12100e] backdrop-blur-3xl p-4 lg:p-5 rounded-[2.5rem] border border-sienna/10 dark:border-white/5 shadow-2xl space-y-4 w-[110px] lg:w-[130px] shrink-0 flex flex-col items-center">
                    <span className="text-[7px] font-black uppercase tracking-widest text-accent/60">Position</span>
                    <div className="flex flex-col items-center gap-1 opacity-90">
                        <HUDNudgeButton onClick={() => nudge(0, -1)}><ChevronUp /></HUDNudgeButton>
                        <div className="flex gap-1">
                            <HUDNudgeButton onClick={() => nudge(-1, 0)}><ChevronLeft /></HUDNudgeButton>
                            <HUDNudgeButton onClick={() => resetTransform()}><RotateCcw /></HUDNudgeButton>
                            <HUDNudgeButton onClick={() => nudge(1, 0)}><ChevronRight /></HUDNudgeButton>
                        </div>
                        <HUDNudgeButton onClick={() => nudge(0, 1)}><ChevronDown /></HUDNudgeButton>
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

const HUDNudgeButton = ({ onClick, children }: any) => (
    <button
        onClick={onClick}
        className="w-8 h-8 rounded-full bg-sienna/5 dark:bg-white/5 border border-sienna/5 dark:border-white/5 flex items-center justify-center text-sienna dark:text-white/60 hover:bg-accent hover:text-sienna dark:hover:bg-white dark:hover:text-sienna transition-all active:scale-95"
    >
        {React.cloneElement(children as React.ReactElement<any>, { className: "w-3 h-3" })}
    </button>
);
