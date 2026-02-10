import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, ArrowRight, Sparkles, Globe, Chrome } from 'lucide-react';

export const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (authError) {
            setError(authError.message);
        } else {
            setIsSent(true);
        }
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-cream">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(181,130,103,0.1),_transparent_70%)] animate-pulse" />

            <div className="relative w-full max-w-lg silk-panel rounded-[3rem] p-10 lg:p-14 space-y-10 shadow-2xl bg-white/40 backdrop-blur-3xl animate-in zoom-in slide-in-from-bottom-10 duration-1000">
                <div className="space-y-4 text-center">
                    <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-8 silk-panel border-accent/20 rotate-3 hover:rotate-6 transition-transform duration-500">
                        <Sparkles className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className="text-4xl font-light italic text-sienna tracking-tight">Atelier TraceMaster</h1>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-sienna/50 font-bold leading-relaxed">
                        High-Fidelity Sketching <span className="text-accent mx-2">•</span> Precision Re-imagined
                    </p>
                </div>

                {isSent ? (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-8 bg-accent/5 rounded-[2rem] border border-accent/10 space-y-4">
                            <Mail className="w-8 h-8 text-accent mx-auto" />
                            <h3 className="text-xl font-medium text-sienna">Magic Link Sent</h3>
                            <p className="text-sm text-sienna/60">Check your inbox for a secure login link to the Atelier.</p>
                        </div>
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-[10px] uppercase tracking-widest font-bold text-sienna/40 hover:text-sienna/80 transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="space-y-4">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-4 py-5 bg-white rounded-3xl border border-sienna/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
                            >
                                <div className="w-6 h-6 flex items-center justify-center bg-[#4285F4]/10 rounded-full">
                                    <Chrome className="w-3.5 h-3.5 text-[#4285F4]" />
                                </div>
                                <span className="text-sm font-medium text-sienna/80">Continue with Google</span>
                            </button>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-sienna/5" />
                                <span className="text-[9px] uppercase tracking-widest text-sienna/30 font-bold">Or use Atelier Link</span>
                                <div className="h-px flex-1 bg-sienna/5" />
                            </div>

                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-sienna/30 group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-14 pr-8 py-5 bg-white/50 border border-sienna/5 rounded-3xl text-sienna text-sm focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-sienna/20 shadow-inner"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-sienna text-cream rounded-3xl text-xs font-bold uppercase tracking-[0.3em] hover:bg-accent shadow-lg shadow-sienna/20 hover:shadow-accent/40 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? 'Verifying...' : (
                                        <>
                                            Enter the Atelier <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {error && (
                            <div className="text-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <p className="text-[10px] text-red-500/80 font-bold tracking-wider">{error}</p>
                            </div>
                        )}

                        <div className="text-center space-y-2">
                            <p className="text-[9px] text-sienna/30 tracking-widest font-medium uppercase">
                                Privacy is our standard <span className="mx-2">•</span> End-to-end cloud protection
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-40">
                <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-sienna" />
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-sienna">Global Nodes Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-sienna" />
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-sienna">AI Clusters Ready</span>
                </div>
            </div>
        </div>
    );
};
