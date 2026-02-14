import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Grid, List, Search, Clock, Trash2, Edit2, Play, Sparkles, LogOut, CreditCard, Zap } from 'lucide-react';
import { s3Service } from '../services/s3Service';

interface Project {
    id: string;
    name: string;
    thumbnail_s3_key: string | null;
    thumbnail_url?: string;
    created_at: string;
    original_s3_key?: string;
    processed_s3_key?: string;
    options?: any;
}

interface ProjectsDashboardProps {
    onNewProject: () => void;
    onSelectProject: (id: string, project?: Project) => void;
    onLogout: () => void;
    aiCredits: number;
    profile: any;
    onUpgrade: () => void;
    onAdmin?: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
    onNewProject,
    onSelectProject,
    onLogout,
    aiCredits,
    profile,
    onUpgrade,
    onAdmin
}) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        fetchProjects(true);
    }, []);

    const fetchProjects = async (reset = false) => {
        const currentPage = reset ? 0 : page;
        setIsLoading(true);

        const from = currentPage * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Failed to fetch projects:', error);
        } else if (data) {
            const projectsWithUrls = await Promise.all(data.map(async (p: any) => {
                if (p.thumbnail_s3_key) {
                    try {
                        const url = await s3Service.getPresignedUrl(p.thumbnail_s3_key);
                        return { ...p, thumbnail_url: url };
                    } catch (e) {
                        console.error('Presign failed for project:', p.id, e);
                        return p;
                    }
                }
                return p;
            }));

            if (reset) {
                setProjects(projectsWithUrls);
                setPage(1);
            } else {
                setProjects(prev => [...prev, ...projectsWithUrls]);
                setPage(prev => prev + 1);
            }

            const totalFetched = reset ? projectsWithUrls.length : projects.length + projectsWithUrls.length;
            setHasMore(totalFetched < (count || 0));
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project?')) return;

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Delete failed:', error);
        } else {
            setProjects(prev => prev.filter(p => p.id !== id));
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream overflow-x-hidden pt-32 pb-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,_rgba(181,130,103,0.05),_transparent_40%)]" />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 space-y-12 sm:space-y-16 relative">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 pb-8 border-b border-sienna/10">
                    <div className="flex items-center gap-4 sm:gap-6 group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-accent to-sienna rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur" />
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white shadow-2xl overflow-hidden bg-white/50">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.nickname} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent">
                                        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-full border-4 border-cream flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                                {profile?.is_pro ? '∞' : aiCredits}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                                <p className="text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-sienna/40 font-bold">TraceMaster Resident</p>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light italic text-sienna break-words">
                                Atelier <span className="font-bold">{profile?.nickname || 'Master'}</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-6">
                        <div className="hidden md:flex items-center gap-3 px-5 sm:px-6 lg:px-8 py-3 bg-white/40 rounded-full border border-sienna/5">
                            <div className="text-center border-r border-sienna/10 pr-3 sm:pr-4 lg:pr-6">
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-sienna">{projects.length}</p>
                                <p className="text-[8px] uppercase tracking-widest text-sienna/30 font-bold">Sketches</p>
                            </div>
                            <div className="text-center pl-2">
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-accent">{profile?.is_pro ? 'Unlimited' : aiCredits}</p>
                                <p className="text-[8px] uppercase tracking-widest text-accent/40 font-bold">{profile?.is_pro ? 'Pro Member' : 'Credits'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                            {/* New Project button - visible on all screens */}
                            <button
                                onClick={() => {
                                    const totalCount = projects.length + (hasMore ? 1 : 0); // Estimate if count not stored, but better to use the count from DB.
                                    // Actually, let's use a ref or state for total count.
                                    // Current code doesn't store total count in state, only hasMore.
                                    // However, we can use the `count` returned from supabase if we store it.
                                    // For now, let's assume the user has < 10 projects if they are hitting the limit.
                                    // A safer check is: if not pro, and we have >= 10 projects loaded OR we know count is >= 10.

                                    // Let's modify the fetchProjects to store count first.
                                    // But I can't modify state outside this block easily without modifying the component logic first.
                                    // So I will update component logic in next step.
                                    // For now, I'll use a placeholder logic that I will refine.
                                    // Wait, I should do `multi_replace` or just rewrite the component part?
                                    // I'll rewrite the component state usage in a separate `replace_file_content` if needed, 
                                    // but I can just do it all here if I am careful.

                                    // Let's rely on `projects.length` for now if the user has < 12 projects (page size).
                                    // If `hasMore` is true, then length is at least 12, which is > 10.
                                    // So:
                                    const isPro = profile?.is_pro;
                                    const effectiveCount = hasMore ? 100 : projects.length; // Treat hasMore as "many"

                                    if (!isPro && effectiveCount >= 10) {
                                        alert("Free Limit Reached.\n\nYou have reached the limit of 10 projects for the free tier. Please upgrade to Pro for unlimited projects.");
                                        onUpgrade();
                                        return;
                                    }
                                    onNewProject();
                                }}
                                className="px-5 sm:px-6 lg:px-8 py-3 lg:py-4 bg-sienna text-cream rounded-full lg:rounded-[2rem] flex items-center justify-center gap-2 lg:gap-3 group hover:bg-accent transition-all duration-500 shadow-xl shadow-sienna/20 hover:shadow-accent/40"
                            >
                                <Plus className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-90 transition-transform duration-500" />
                                <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap">New Project</span>
                            </button>

                            {profile?.is_pro ? (
                                <button
                                    onClick={onUpgrade}
                                    className="px-4 sm:px-5 lg:px-6 py-3 bg-accent/10 hover:bg-accent/20 transition-all text-sienna flex items-center justify-center gap-2 rounded-full border border-accent/20"
                                    title="Manage Subscription"
                                >
                                    <CreditCard className="w-4 h-4 text-accent shrink-0" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Master Status</span>
                                </button>
                            ) : (
                                <button
                                    onClick={onUpgrade}
                                    className="px-4 sm:px-5 lg:px-6 py-3 bg-accent text-sienna hover:bg-sienna hover:text-accent transition-all flex items-center justify-center gap-2 rounded-full border border-accent/20 shadow-lg shadow-accent/20 animate-pulse hover:animate-none"
                                    title="Upgrade to Pro Access"
                                >
                                    <Zap className="w-4 h-4 shrink-0" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Upgrade to Pro</span>
                                </button>
                            )}
                            <button
                                onClick={onLogout}
                                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-sienna/5 hover:bg-sienna/10 transition-all text-sienna/60 hover:text-accent border border-sienna/10"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {profile?.is_admin && onAdmin && (
                            <button
                                onClick={onAdmin}
                                className="px-5 sm:px-6 lg:px-8 py-3 lg:py-4 bg-sienna/10 text-sienna rounded-full lg:rounded-[2rem] flex items-center justify-center gap-2 lg:gap-3 group hover:bg-sienna hover:text-white transition-all duration-500 border border-sienna/10"
                            >
                                <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap">Admin Panel</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Grid className="w-4 h-4 text-accent" />
                                <h2 className="text-2xl sm:text-3xl font-light italic text-sienna">The Gallery Archive</h2>
                            </div>
                        </div>

                        <div className="relative flex-1 max-w-xl group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-sienna/30 group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your sketches..."
                                className="w-full pl-14 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-5 bg-white/40 border border-sienna/5 rounded-2xl text-sienna text-sm focus:outline-none transition-all placeholder:text-sienna/20 shadow-sm"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-[4/5] rounded-[3rem] bg-white/10 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="py-32 sm:py-40 text-center space-y-8 silk-panel rounded-[3rem] sm:rounded-[4rem] border-dashed border-2 border-sienna/10 bg-white/5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sienna/5 rounded-full flex items-center justify-center mx-auto">
                                <Grid className="w-7 h-7 sm:w-8 sm:h-8 text-sienna/20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl sm:text-2xl font-light italic text-sienna">The archive is empty</h3>
                                <p className="text-[10px] uppercase tracking-widest text-sienna/40 font-bold px-4">Start your first trace to see your sketches here</p>
                            </div>
                            <button onClick={onNewProject} className="text-[9px] uppercase tracking-[.4em] font-bold text-accent hover:text-sienna transition-all">Begin Extraction</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            {filteredProjects.map((project, idx) => (
                                <div
                                    key={project.id}
                                    onClick={() => onSelectProject(project.id, project)}
                                    className="group relative aspect-[4/5] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer animate-in fade-in zoom-in slide-in-from-bottom-6"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="absolute inset-0 bg-cream/50">
                                        {project.thumbnail_url ? (
                                            <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-sienna/10" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-sienna/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                    </div>

                                    <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <button
                                            onClick={(e) => handleDelete(project.id, e)}
                                            className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-accent transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 space-y-2 sm:space-y-3">
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Clock className="w-3 h-3 text-white" />
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-white">
                                                {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-light italic text-white line-clamp-1">{project.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && hasMore && filteredProjects.length > 0 && (
                        <div className="flex justify-center pt-12">
                            <button
                                onClick={() => fetchProjects(false)}
                                className="px-10 sm:px-12 py-4 sm:py-5 bg-sienna/5 hover:bg-sienna hover:text-cream text-sienna rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] transition-all border border-sienna/10 shadow-lg"
                            >
                                <span className="flex items-center gap-3">
                                    Load More Projects
                                    <Sparkles className="w-4 h-4" />
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};
