import React from 'react';
import { Sparkles, Image as ImageIcon, ChevronUp, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
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
    deviceTier: 'LOW' | 'MID' | 'HIGH';
    visible: boolean;
    eraserMode: boolean;
    setEraserMode: (v: boolean) => void;
    isCloudHQ: boolean;
    setIsCloudHQ: (v: boolean) => void;
    cloudModel: 'anime' | 'realistic';
    setCloudModel: (v: 'anime' | 'realistic') => void;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
    image, isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab,
    options, setOptions, opacity, setOpacity, mirror, setMirror,
    transform, setTransform, palette, autoTuneManually, nudge,
    settings, setSettings, deviceTier, visible, eraserMode, setEraserMode,
    isCloudHQ, setIsCloudHQ, cloudModel, setCloudModel
}) => {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    const WaitStateOverlay = ({ children, title }: { children: React.ReactNode, title?: string }) => {
        if (image) return <>{children}</>;
        return (
            <div className="relative group">
                <div className="blur-xl pointer-events-none opacity-20 grayscale transition-all duration-700">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-1000">
                    <div className="bg-sienna/5 border border-sienna/20 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-sienna/40" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-sienna/40">Waiting for Vision</span>
                    </div>
                </div>
            </div>
        );
    };

    const DisabledOverlayForSketch = ({ children }: { children: React.ReactNode }) => {
        if (!options.isPerfectSketch) return <>{children}</>;
        return (
            <div className="relative group">
                <div className="blur-md pointer-events-none opacity-40 grayscale transition-all duration-500">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-sienna/20 shadow-lg">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sienna">Perfect Sketch Mode</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <aside
            className={`
        fixed lg:static inset-x-0 bottom-0 lg:inset-auto
        lg:w-[420px] flex flex-col shrink-0 
        transition-all duration-700 ease-out z-[1070]
        bg-white/90 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none
        ${isSidebarOpen ? 'translate-y-0 opacity-100' : 'translate-y-full lg:translate-y-0 opacity-0 lg:opacity-100'}
        ${visible || !image ? 'lg:opacity-100' : 'opacity-0 pointer-events-none translate-y-20 lg:translate-y-0'}
        rounded-t-[2.5rem] lg:rounded-none touch-auto
        max-h-[80vh] lg:max-h-none
        border-t-4 border-sienna/10 lg:border-none
        shadow-2xl lg:shadow-none
      `}
            style={{
                paddingLeft: 'max(0px, var(--safe-left))',
                paddingRight: 'max(0px, var(--safe-right))'
            }}
        >
            {/* Mobile Drawer Handle */}
            <div
                className="lg:hidden flex justify-center py-3 cursor-pointer active:scale-95 transition-transform shrink-0"
                onClick={() => setIsSidebarOpen(false)}
            >
                <div className="w-16 h-1.5 bg-sienna/30 rounded-full" />
            </div>

            {/* Tab Switcher - Fixed at top */}
            <div className="px-6 lg:px-0 shrink-0 pb-4 lg:pb-0">
                <div className="flex gap-2 p-1.5 bg-sienna/5 rounded-full border border-sienna/20 silk-panel shadow-inner">
                    <TabButton active={activeTab === 'lens'} onClick={() => setActiveTab('lens')}>Optical</TabButton>
                    <TabButton active={activeTab === 'palette'} onClick={() => setActiveTab('palette')}>Guide</TabButton>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 lg:px-0 pb-6 lg:pb-0 custom-scrollbar min-h-0">

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
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => {
                                            const newVal = !isCloudHQ;
                                            setIsCloudHQ(newVal);
                                            localStorage.setItem('tm_cloud_hq', String(newVal));
                                        }}
                                        className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${isCloudHQ ? 'bg-accent text-white shadow-lg' : 'bg-sienna/10 text-sienna/40'}`}
                                    >
                                        {isCloudHQ ? 'Cloud HQ On' : 'Cloud HQ Off'}
                                    </button>

                                    {isCloudHQ && (
                                        <button
                                            onClick={() => autoTuneManually()}
                                            className="flex items-center gap-2 px-4 py-2 bg-sienna text-cream rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-accent transition-all animate-in slide-in-from-left-2 duration-300"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" /> Refine with AI
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <InspectorSection
                            title="Lens Refinement"
                            info="Adjusts the edge detection and line weight of your reference image. Threshold controls the line density - lower values capture more ghost-like details."
                        >
                            <WaitStateOverlay>
                                <div className="space-y-10">
                                    <DisabledOverlayForSketch>
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
                                    </DisabledOverlayForSketch>
                                    <ControlSlider label="Ghost Opacity" value={opacity} min={0} max={1} step={0.01} onChange={(v: number) => setOpacity(v)} />
                                </div>
                            </WaitStateOverlay>
                        </InspectorSection>

                        <InspectorSection
                            title="Control Panel"
                            info="Core visibility and spatial controls. Mirrors your projection for hand-specific tracing or toggles a professional alignment grid."
                        >
                            <div className="grid grid-cols-1 gap-4">
                                {showAdvanced && (
                                    <>
                                        <WaitStateOverlay>
                                            <DisabledOverlayForSketch>
                                                <OptionToggle active={options.invert} onClick={() => setOptions(o => ({ ...o, invert: !o.invert }))}>Invert Luminance</OptionToggle>
                                            </DisabledOverlayForSketch>
                                        </WaitStateOverlay>
                                        <div className="flex flex-col gap-2 p-4 bg-sienna/5 rounded-3xl border border-sienna/10 animate-in fade-in slide-in-from-top-2 duration-500">
                                            <label className="text-[9px] uppercase tracking-widest font-bold text-sienna/40 px-1">AI Engine Mode</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCloudModel('realistic');
                                                        localStorage.setItem('tm_cloud_model', 'realistic');
                                                    }}
                                                    className={`flex-1 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${cloudModel === 'realistic' ? 'bg-sienna text-cream shadow-lg' : 'bg-white/40 text-sienna/40 hover:bg-white/60'}`}
                                                >
                                                    Realistic
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCloudModel('anime');
                                                        localStorage.setItem('tm_cloud_model', 'anime');
                                                    }}
                                                    className={`flex-1 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${cloudModel === 'anime' ? 'bg-sienna text-cream shadow-lg' : 'bg-white/40 text-sienna/40 hover:bg-white/60'}`}
                                                >
                                                    Anime
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <WaitStateOverlay>
                                    <OptionToggle active={eraserMode} onClick={() => setEraserMode(!eraserMode)}>Magic Eraser</OptionToggle>
                                </WaitStateOverlay>
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
                            <WaitStateOverlay>
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
                            </WaitStateOverlay>
                        </InspectorSection>
                    </div>
                )}
            </div>
        </aside >
    );
};

export default StudioSidebar;
