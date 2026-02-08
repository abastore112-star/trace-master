import React from 'react';
import { Moon, Sun, X, Camera, Settings2, ChevronLeft as BackIcon } from 'lucide-react';

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
}

const StudioHeader: React.FC<StudioHeaderProps> = ({
    theme, toggleTheme, onBack, showCamera, setShowCamera, image,
    fileInputRef, handleFileUpload, isSidebarOpen, setIsSidebarOpen
}) => {
    return (
        <nav className="h-16 lg:h-24 px-4 lg:px-12 flex justify-between items-center z-[60] shrink-0 silk-panel border-0 border-b border-sienna/20 shadow-sm">
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

            <div className="flex items-center gap-2 lg:gap-6">
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full bg-sienna/5 hover:bg-sienna/10 transition-all text-sienna/80 hover:text-accent border border-sienna/10"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon className="w-4 h-4 lg:w-5 lg:h-5" /> : <Sun className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                {image && (
                    <button
                        onClick={() => setShowCamera(!showCamera)}
                        className={`px-6 lg:px-10 h-12 lg:h-14 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-3 shadow-xl active:scale-95 ${showCamera ? 'bg-accent text-sienna dark:text-white glow-on-hover' : 'bg-sienna text-cream'}`}
                    >
                        {showCamera ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        <span className="hidden sm:inline">{showCamera ? 'Cease Projection' : 'Launch Lens'}</span>
                        <span className="sm:hidden">{showCamera ? 'Close' : 'AR'}</span>
                    </button>
                )}

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`lg:hidden w-12 h-12 flex items-center justify-center rounded-full border border-sienna/20 transition-all ${isSidebarOpen ? 'bg-accent text-sienna dark:text-white' : 'bg-white/40 shadow-sm'}`}
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
};

export default StudioHeader;
