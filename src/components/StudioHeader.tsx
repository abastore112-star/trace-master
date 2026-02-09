import React from 'react';
import {
    Moon,
    Sun,
    X,
    Camera,
    Settings2,
    ChevronLeft as BackIcon,
    Zap,
    ZapOff,
    Grid3X3,
    FlipHorizontal,
    RefreshCw,
    Maximize
} from 'lucide-react';

interface StudioHeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onBack: () => void;
    showCamera: boolean;
    setShowCamera: (show: boolean) => void;
    image: HTMLImageElement | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    settings: any;
    setSettings: any;
    mirror: boolean;
    setMirror: (v: boolean) => void;
    retryCamera: () => void;
}

const StudioHeader: React.FC<StudioHeaderProps> = ({
    theme, toggleTheme, onBack, showCamera, setShowCamera, image,
    fileInputRef, handleFileUpload,
    isSidebarOpen, setIsSidebarOpen, settings, setSettings, mirror, setMirror, retryCamera
}) => {
    const [isToolsOpen, setIsToolsOpen] = React.useState(false);

    const toggleTool = (fn: () => void) => {
        fn();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };

    return (
        <nav
            className="w-full px-4 lg:px-12 flex justify-between items-center z-[1060] shrink-0 silk-panel border-0 border-b border-sienna/20 shadow-sm"
            style={{
                height: 'var(--hdr-h)',
                paddingTop: 'var(--safe-top)'
            }}
        >
            <div className="flex items-center gap-3 lg:gap-8">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-sienna/5 transition-all text-sienna/70 hover:text-accent"
                >
                    <BackIcon className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-[11px] lg:text-sm font-black uppercase tracking-[0.3em]">Atelier <span className="font-light italic text-accent lowercase tracking-normal">mastery</span></h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
                        <span className="text-[9px] uppercase font-bold text-sienna/60 tracking-widest">Projection Active</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 relative">
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full bg-sienna/5 hover:bg-sienna/10 transition-all text-sienna/80 hover:text-accent border border-sienna/10"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon className="w-4 h-4 lg:w-5 lg:h-5" /> : <Sun className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                {image && (
                    <div className="flex items-center bg-sienna/5 p-1 rounded-full border border-sienna/10">
                        <button
                            onClick={() => setShowCamera(!showCamera)}
                            className={`px-4 lg:px-8 h-10 lg:h-12 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-sm ${showCamera ? 'bg-accent text-sienna dark:text-white' : 'bg-sienna text-cream'}`}
                        >
                            {showCamera ? <X className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{showCamera ? 'Cease' : 'Launch'}</span>
                        </button>

                        <button
                            onClick={() => setIsToolsOpen(!isToolsOpen)}
                            className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full transition-all ${isToolsOpen ? 'text-accent' : 'text-sienna/60'}`}
                        >
                            <Settings2 className={`w-5 h-5 transition-transform duration-500 ${isToolsOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}

                {/* Transparent Tools Dropdown */}
                {isToolsOpen && (
                    <div className="absolute top-full right-0 mt-4 p-2 silk-panel rounded-3xl border border-sienna/10 shadow-2xl flex flex-col gap-1 animate-in slide-in-from-top-4 duration-300 min-w-[140px]">
                        <HeaderTool
                            active={settings.torchOn}
                            onClick={() => { toggleTool(() => setSettings((s: any) => ({ ...s, torchOn: !s.torchOn }))); }}
                            label="Flash"
                            icon={settings.torchOn ? <Zap /> : <ZapOff />}
                        />
                        <HeaderTool
                            active={settings.showGrid}
                            onClick={() => { toggleTool(() => setSettings((s: any) => ({ ...s, showGrid: !s.showGrid }))); }}
                            label="Grid Overlay"
                            icon={<Grid3X3 className="w-4 h-4" />}
                        />
                        <HeaderTool
                            active={mirror}
                            onClick={() => { toggleTool(() => setMirror(!mirror)); }}
                            label="Mirror View"
                            icon={<FlipHorizontal className="w-4 h-4" />}
                        />
                        <HeaderTool
                            active={false}
                            onClick={() => { toggleTool(retryCamera); setIsToolsOpen(false); }}
                            label="Relens Hardware"
                            icon={<RefreshCw className="w-4 h-4" />}
                        />
                    </div>
                )}

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full border border-sienna/20 transition-all ${isSidebarOpen ? 'bg-accent text-sienna dark:text-white' : 'bg-white/40 shadow-sm'}`}
                >
                    <Maximize className="w-4 h-4" />
                </button>
            </div>
        </nav>
    );
};

const HeaderTool = ({ active, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all font-bold text-[9px] uppercase tracking-widest ${active ? 'bg-accent/20 text-accent' : 'text-sienna/70 hover:bg-sienna/5'}`}
    >
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        {label}
    </button>
);

export default StudioHeader;
