import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { s3Service } from '../services/s3Service';
import { User, Camera, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface OnboardingProps {
    userId: string;
    onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            let avatarUrl = '';
            if (avatar) {
                const path = `avatars/${userId}/${Date.now()}_${avatar.name}`;
                await s3Service.uploadImage(avatar, path);
                avatarUrl = await s3Service.getPresignedUrl(path);
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    nickname,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (updateError) throw updateError;
            onComplete();
        } catch (err: any) {
            console.error('Onboarding failed:', err);
            setError(err.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-cream">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(181,130,103,0.1),_transparent_70%)]" />

            <div className="relative w-full max-w-lg silk-panel rounded-[3rem] p-10 lg:p-14 space-y-10 shadow-2xl bg-white/40 backdrop-blur-3xl animate-in zoom-in slide-in-from-bottom-10 duration-1000">
                <div className="space-y-4 text-center">
                    <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 silk-panel border-accent/20">
                        <User className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-light italic text-sienna tracking-tight">Tell us about yourself</h1>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-sienna/50 font-bold leading-relaxed">
                        Personalizing your Atelier space
                    </p>
                </div>

                <form onSubmit={handleComplete} className="space-y-8 animate-in fade-in duration-700 delay-300">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-32 h-32 rounded-full silk-panel border-2 border-dashed border-sienna/20 flex items-center justify-center overflow-hidden bg-white/50 group-hover:border-accent transition-colors duration-500">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <Camera className="w-8 h-8 text-sienna/20 group-hover:text-accent transition-colors mx-auto" />
                                        <span className="text-[8px] uppercase tracking-widest font-bold text-sienna/40">Upload Avatar</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-accent rounded-full border-4 border-cream flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-sienna/30">Your virtual identity in the Cloud</p>
                    </div>

                    <div className="space-y-6">
                        <div className="relative group">
                            <p className="text-[9px] uppercase tracking-widest font-bold text-sienna/60 px-2 mb-2">Display Name</p>
                            <input
                                type="text"
                                required
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="e.g. Master Tracer"
                                className="w-full px-8 py-5 bg-white/50 border border-sienna/5 rounded-3xl text-sienna text-sm focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-sienna/20 shadow-inner"
                            />
                        </div>

                        {error && (
                            <div className="text-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <p className="text-[10px] text-red-500/80 font-bold tracking-wider">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !nickname.trim()}
                            className="w-full py-5 bg-sienna text-cream rounded-3xl text-xs font-bold uppercase tracking-[0.3em] hover:bg-accent shadow-lg shadow-sienna/20 hover:shadow-accent/40 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Ready to Extract <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
