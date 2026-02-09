import React from 'react';
import { Sparkles, ChevronUp, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { TabButton, InspectorSection, ControlSlider, OptionToggle, NudgeButton } from './UIPrimitives';
import { ProcessingOptions, TransformState } from '../types/types';

interface StudioSidebarProps {
    image: HTMLImageElement | null;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    activeTab: 'lens' | 'palette';
    setActiveTab: (tab: 'lens' | 'palette') => void;
    options: ProcessingOptions;
    setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
    opacity: number;
    setOpacity: (v: number) => void;
    mirror: boolean;
    setMirror: (v: boolean) => void;
    transform: TransformState;
    setTransform: React.Dispatch<React.SetStateAction<TransformState>>;
    palette: string[];
    autoTuneManually: () => void;
    nudge: (dx: number, dy: number) => void;
    settings: { lockWake: boolean };
    setSettings: any;
    visible: boolean;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
    image, isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab,
    options, setOptions, opacity, setOpacity, mirror, setMirror,
    transform, setTransform, palette, autoTuneManually, nudge,
    settings, setSettings, visible
}) => {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    return (
        <aside
            className={`
        fixed lg:static inset-x-0 bottom-0 lg:inset-auto
        lg:w-[420px] lg:flex flex-col gap-8 shrink-0 
        transition-all duration-700 ease-out z-[1070]
        bg-white/60 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none
        ${isSidebarOpen ? 'translate-y-0 h-[65vh] lg:h-auto opacity-100' : 'translate-y-full lg:translate-y-0 h-0 lg:h-auto opacity-0 lg:opacity-100'}
        ${visible ? 'lg:opacity-100' : 'opacity-0 pointer-events-none translate-y-20 lg:translate-y-0'}
        lg:p-0 rounded-t-[4rem] lg:rounded-none lg:shadow-none touch-auto
        ${!image ? 'lg:opacity-10 lg:pointer-events-none' : ''}
      `}
            style={{
                paddingLeft: 'max(0px, var(--safe-left))',
                paddingRight: 'max(0px, var(--safe-right))'
            }}
        >
            <div className="lg:hidden w-16 h-1.5 bg-sienna/30 rounded-full mx-auto mb-8 mt-6 shrink-0" onClick={() => setIsSidebarOpen(false)} />

            <div className="px-8 lg:px-0 flex flex-col gap-8 h-full overflow-hidden">
                <div className="flex gap-2 p-1.5 bg-sienna/5 rounded-full border border-sienna/20 silk-panel shadow-inner shrink-0">
                    <TabButton active={activeTab === 'lens'} onClick={() => setActiveTab('lens')}>Optical</TabButton>
                    <TabButton active={activeTab === 'palette'} onClick={() => setActiveTab('palette')}>Guide</TabButton>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-12 scroll-smooth custom-scrollbar pb-40">
                    {activeTab === 'lens' && (
                        <div className="space-y-10 animate-in fade-in duration-700 silk-panel p-6 rounded-[3rem] border border-sienna/10 backdrop-blur-2xl">
                            <div className="flex justify-between items-center px-2">
                                <div className="flex gap-2 w-full justify-between">
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${showAdvanced ? 'bg-accent text-sienna shadow-lg' : 'bg-sienna/10 text-sienna/60'}`}
                                    >
                                        {showAdvanced ? 'Simple Mode' : 'Advanced Tuning'}
                                    </button>
                                    <button
                                        onClick={autoTuneManually}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-[9px] font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-sienna dark:hover:text-white transition-all glow-on-hover shadow-sm"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Optimize Vision
                                    </button>
                                </div>
                            </div>

                            <InspectorSection
                                title="Lens Refinement"
                                info="Adjusts the edge detection and line weight of your reference image. Threshold controls the line density - lower values capture more ghost-like details."
                            >
                                <div className="space-y-10">
                                    {showAdvanced ? (
                                        <>
                                            <ControlSlider label="Line Distillation" value={options.threshold} min={0} max={150} onChange={(v: number) => setOptions(o => ({ ...o, threshold: v }))} />
                                            <ControlSlider label="Pencil Grain" value={options.edgeStrength} min={1} max={150} onChange={(v: number) => setOptions(o => ({ ...o, edgeStrength: v }))} />
                                        </>
                                    ) : (
                                        <ControlSlider
                                            label="Tracing Intensity"
                                            value={options.threshold}
                                            min={10} max={120}
                                            onChange={(v: number) => setOptions(o => ({ ...o, threshold: v, edgeStrength: v - 5 }))}
                                        />
                                    )}
                                    <ControlSlider label="Ghost Opacity" value={opacity} min={0} max={1} step={0.01} onChange={(v: number) => setOpacity(v)} />
                                </div>
                            </InspectorSection>

                            <InspectorSection
                                title="Control Panel"
                                info="Core visibility and spatial controls. Mirrors your projection for hand-specific tracing or toggles a professional alignment grid."
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    {showAdvanced && <OptionToggle active={options.invert} onClick={() => setOptions(o => ({ ...o, invert: !o.invert }))}>Invert Luminance</OptionToggle>}
                                    <OptionToggle active={mirror} onClick={() => setMirror(!mirror)}>Mirror Projection</OptionToggle>
                                    <OptionToggle active={settings.lockWake} onClick={() => setSettings((s: any) => ({ ...s, lockWake: !s.lockWake }))}>Prevent Sleep</OptionToggle>
                                </div>
                            </InspectorSection>
                        </div>
                    )}

                    {activeTab === 'palette' && (
                        <div className="space-y-10 animate-in fade-in duration-700 silk-panel p-6 rounded-[3rem] border border-sienna/10 backdrop-blur-2xl">
                            <InspectorSection
                                title="Pigment Extraction"
                                info="Analyzes your reference art to extract the most prominent brand colors and pigment values for physical mixing."
                            >
                                <p className="text-[12px] text-sienna/70 font-light italic leading-relaxed mb-8 px-2 text-center">Sampled hues from your vision to aid physical paint mixing and selection.</p>
                                <div className="grid grid-cols-4 gap-4 px-2 pb-4">
                                    {palette.map((c, i) => (
                                        <div key={i} className="group relative">
                                            <div
                                                className="w-full aspect-square rounded-2xl border border-sienna/20 shadow-lg transition-all group-hover:scale-110 cursor-pointer"
                                                style={{ backgroundColor: c }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(c);
                                                    if (window.navigator.vibrate) window.navigator.vibrate(10);
                                                }}
                                            />
                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-sienna/70">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </InspectorSection>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default StudioSidebar;
