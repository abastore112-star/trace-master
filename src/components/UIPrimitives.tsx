import React from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

export const TabButton = ({ active, onClick, children }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.3em] rounded-full transition-all ${active ? 'bg-accent text-sienna dark:text-white shadow-xl' : 'text-sienna/70 hover:text-sienna'}`}
    >
        {children}
    </button>
);

export const InspectorSection = ({ title, children }: any) => (
    <div className="space-y-8">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent border-l-2 border-accent pl-4">{title}</h3>
        <div className="space-y-8">{children}</div>
    </div>
);

export const ControlSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
    <div className="space-y-4">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-sienna/90">
            <span>{label}</span>
            <span className="text-accent font-black">{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
);

export const OptionToggle = ({ active, onClick, children }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-between px-8 py-5 rounded-[2rem] border transition-all ${active ? 'bg-accent/20 border-accent text-sienna dark:text-accent font-bold' : 'bg-white/60 border-sienna/20 text-sienna/70 hover:border-sienna/40 shadow-sm'}`}
    >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{children}</span>
        {active ? <Eye className="w-5 h-5 text-accent" /> : <EyeOff className="w-5 h-5 opacity-50" />}
    </button>
);

export const HUDToggle = ({ active, onClick, children }: any) => (
    <button
        onClick={onClick}
        className={`w-12 h-12 lg:w-16 lg:h-16 silk-panel rounded-full flex items-center justify-center transition-all shadow-md border border-sienna/10 ${active ? 'bg-accent border-accent text-sienna dark:text-white' : 'text-sienna/70 hover:text-accent hover:bg-accent/10'}`}
    >
        {React.cloneElement(children as React.ReactElement<any>, { className: "w-6 h-6" })}
    </button>
);

export const NudgeButton = ({ onClick, children }: any) => (
    <button
        onClick={onClick}
        className="w-12 h-12 lg:w-16 lg:h-16 silk-panel rounded-full flex items-center justify-center text-sienna/70 hover:text-accent hover:bg-accent/15 transition-all active:scale-90 border-sienna/20 shadow-sm"
    >
        {React.cloneElement(children as React.ReactElement<any>, { className: "w-6 h-6" })}
    </button>
);
