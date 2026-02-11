import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ImageIcon, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface GalleryItem {
    id: string;
    title: string;
    url: string;
    category: string;
}

interface GalleryProps {
    onSelect: (asset: { url: string; id: string }) => void;
    onClose: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ onSelect, onClose }) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string; count: number }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGalleryData();
    }, []);

    const fetchGalleryData = async () => {
        setIsLoading(true);
        try {
            // Fetch all gallery items
            const { data: galleryData, error: galleryError } = await supabase
                .from('gallery_sketches')
                .select('id, title, category, storage_path')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (galleryError) throw galleryError;

            // Get Supabase storage base URL
            const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;

            // Transform to GalleryItem format
            const transformedItems: GalleryItem[] = (galleryData || []).map(item => ({
                id: item.id,
                title: item.title,
                category: item.category,
                url: `${storageUrl}/${item.storage_path}`
            }));

            setItems(transformedItems);

            // Calculate category counts
            const categoryCounts = transformedItems.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const categoryList = [
                { id: 'anime', name: 'Anime & Manga', count: categoryCounts['anime'] || 0 },
                { id: 'cartoon', name: 'Cartoons & Kids', count: categoryCounts['cartoon'] || 0 },
                { id: 'nature', name: 'Nature & Animals', count: categoryCounts['nature'] || 0 },
                { id: 'general', name: 'General Objects', count: categoryCounts['general'] || 0 }
            ].filter(cat => cat.count > 0);

            setCategories(categoryList);
        } catch (err) {
            console.error('TraceMaster: Failed to load gallery from database', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [items, selectedCategory, searchQuery]);

    return (
        <div className="fixed inset-0 z-[3000] flex flex-col bg-cream/95 backdrop-blur-3xl animate-in fade-in duration-700">
            {/* Header */}
            <header className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-sienna/10 bg-white/40 sticky top-0 z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-accent/20 rounded-xl md:rounded-2xl text-accent">
                        <ImageIcon className="w-5 h-5 md:w-6 md:h-6 border-none" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-light italic text-sienna">Perfect Source Gallery</h2>
                        <p className="text-[8px] md:text-[10px] text-sienna/60 uppercase tracking-[0.2em] md:tracking-[0.4em]">
                            {isLoading ? 'Loading...' : `${items.length} Hand-picked, tracing-ready artworks`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 md:p-4 hover:bg-sienna/5 rounded-full transition-colors text-sienna/60 hover:text-sienna"
                >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </header>

            {/* Controls */}
            <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between bg-white/20 sticky top-[69px] md:top-[89px] z-10 backdrop-blur-md border-b border-sienna/5">
                {/* Category Filter */}
                <div className="flex gap-2 p-1 bg-sienna/5 rounded-full border border-sienna/10 overflow-x-auto max-w-full no-scrollbar w-full md:w-auto">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-accent text-sienna shadow-lg' : 'text-sienna/60 hover:text-sienna'}`}
                    >
                        All ({items.length})
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-accent text-sienna shadow-lg' : 'text-sienna/60 hover:text-sienna'}`}
                        >
                            {cat.name} ({cat.count})
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sienna/40 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="Search curator's picks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-2.5 md:py-3 bg-white/60 border border-sienna/10 rounded-full text-[10px] md:text-xs font-medium focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all text-sienna placeholder:text-sienna/30"
                    />
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6">
                        <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-accent animate-spin-slow" />
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-accent animate-pulse">Syncing Cloud Assets...</p>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 md:gap-6 space-y-4 md:space-y-6">
                        {filteredItems.map((item, idx) => (
                            <div
                                key={item.id}
                                className="break-inside-avoid animate-in fade-in slide-in-from-bottom-5 duration-700"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <button
                                    onClick={() => {
                                        onSelect({ url: item.url, id: item.id });
                                        if (window.navigator.vibrate) window.navigator.vibrate(20);
                                    }}
                                    className="group relative w-full rounded-[1.5rem] md:rounded-[2.5rem] bg-white/40 border border-white/20 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left"
                                >
                                    <div className="relative aspect-auto bg-sienna/5">
                                        <img
                                            src={`${item.url}?width=400&height=500&resize=contain`}
                                            alt={item.title}
                                            className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105 opacity-0"
                                            loading="lazy"
                                            onLoad={(e) => {
                                                const img = e.currentTarget;
                                                img.classList.remove('opacity-0');
                                                img.parentElement?.classList.remove('bg-sienna/5');
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-sienna/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4 md:p-8">
                                            <div className="flex items-center justify-between gap-2 md:gap-4">
                                                <div>
                                                    <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.3em] text-accent mb-0.5 md:mb-1">{item.category}</p>
                                                    <h4 className="text-white text-xs md:text-sm font-light italic leading-tight">{item.title}</h4>
                                                </div>
                                                <div className="p-2 md:p-3 bg-accent rounded-full text-sienna shadow-xl transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100 hidden md:block">
                                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 border-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <Filter className="w-10 h-10 md:w-12 md:h-12" />
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em]">No matching art found</p>
                    </div>
                )}
            </div>

            {/* Footer info */}
            <footer className="px-4 md:px-8 py-3 md:py-4 bg-white/20 backdrop-blur-xl border-t border-sienna/10 text-center">
                <p className="text-[8px] md:text-[9px] text-sienna/40 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">
                    Trace Master Curated Collection &bull; All assets are high-fidelity line art ready for direct tracing
                </p>
            </footer>
        </div>
    );
};

export default Gallery;
