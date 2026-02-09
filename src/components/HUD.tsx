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

export const HUD: React.FC<HUDProps & { visible: boolean }> = ({
    settings, setSettings, originalBase64, setIsLocked, nudge,
    mirror, setMirror, resetTransform, transform, setTransform,
    retryCamera, visible
}) => {
    return (
        <div
            className={`absolute inset-0 pointer-events-none z-[1002] transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{
                paddingTop: 'calc(var(--safe-top) + 1.5rem)',
                paddingBottom: 'calc(var(--safe-bottom) + 1.5rem)',
                paddingLeft: 'calc(var(--safe-left) + 1.5rem)',
                paddingRight: 'calc(var(--safe-right) + 1.5rem)',
            }}
        >
            {/* Top Left: Quick Lock - Pushed down to avoid Header overlap */}
            <div
                className="absolute left-[var(--safe-left)] ml-6 lg:ml-12 pointer-events-auto transition-all duration-500"
                style={{ top: 'calc(var(--safe-top) + var(--hdr-h) + 1rem)' }}
            >
                <button
                    onClick={() => setIsLocked(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-accent text-sienna dark:bg-white dark:text-sienna rounded-full font-bold text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all border border-accent/20"
                >
                    <Lock className="w-4 h-4" /> Lock Atelier
                </button>
            </div>

            {/* Bottom Left: Nudge Panel - Moved to side */}
            <div
                className="fixed flex flex-col items-start gap-3 pointer-events-auto z-[1050]"
                style={{
                    bottom: 'calc(var(--safe-bottom) + 1.5rem)',
                    left: 'calc(var(--safe-left) + 1rem)'
                }}
            >
                <div className="bg-white/95 dark:bg-[#12100e] backdrop-blur-3xl p-4 lg:p-5 rounded-[2.5rem] border border-sienna/10 dark:border-white/5 shadow-2xl space-y-4 w-[110px] lg:w-[130px] flex flex-col items-center">
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
                <div className="absolute top-6 right-6 lg:top-12 lg:right-12 w-32 h-32 lg:w-48 lg:h-48 silk-panel rounded-2xl overflow-hidden border border-accent/20 shadow-2xl animate-in slide-in-from-right duration-700 pointer-events-auto">
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
