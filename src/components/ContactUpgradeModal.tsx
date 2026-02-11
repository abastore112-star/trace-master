import React from 'react';
import { X, Phone, Mail, Sparkles, ChevronRight, MessageSquare } from 'lucide-react';

interface ContactUpgradeModalProps {
    onClose: () => void;
}

export const ContactUpgradeModal: React.FC<ContactUpgradeModalProps> = ({ onClose }) => {
    const phone = import.meta.env.VITE_CONTACT_PHONE || '03079218039';
    const email = import.meta.env.VITE_CONTACT_EMAIL || 'support@tracemaster.app';

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-sienna/20 backdrop-blur-xl p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-cream rounded-[3.5rem] p-10 lg:p-14 space-y-10 shadow-2xl relative overflow-hidden border border-sienna/10 animate-in zoom-in duration-500">
                {/* Decorative background elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sienna/5 rounded-full blur-3xl" />

                <div className="absolute top-0 right-0 p-8">
                    <button
                        onClick={onClose}
                        className="p-3 bg-sienna/5 rounded-full text-sienna/40 hover:text-accent transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4 relative">
                    <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center text-accent shadow-inner">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-light italic text-sienna leading-tight tracking-tight">Expand the Atelier.</h2>
                    <p className="text-xs text-sienna/60 leading-relaxed font-medium uppercase tracking-widest">
                        Unlock the full potential of high-fidelity cloud extraction.
                    </p>
                </div>

                <div className="space-y-6 relative">
                    <p className="text-sm text-sienna/70 leading-relaxed font-light italic">
                        Premium access is currently handled via direct consultation to ensure every artist gets the right tier of collective energy.
                    </p>

                    <div className="space-y-3">
                        <a
                            href={`tel:${phone.replace(/\s/g, '')}`}
                            className="flex items-center gap-4 p-5 bg-white/60 rounded-3xl border border-sienna/5 hover:border-accent/40 transition-all group"
                        >
                            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-sienna/40">Direct Line</p>
                                <p className="text-sm font-bold text-sienna">{phone}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 ml-auto text-sienna/20 group-hover:text-accent transition-all" />
                        </a>

                        <a
                            href={`mailto:${email}`}
                            className="flex items-center gap-4 p-5 bg-white/60 rounded-3xl border border-sienna/5 hover:border-accent/40 transition-all group"
                        >
                            <div className="w-10 h-10 bg-sienna/5 rounded-full flex items-center justify-center text-sienna/40 group-hover:bg-sienna group-hover:text-white transition-all">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-sienna/40">Email Correspondence</p>
                                <p className="text-sm font-bold text-sienna">{email}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 ml-auto text-sienna/20 group-hover:text-accent transition-all" />
                        </a>
                    </div>
                </div>

                <div className="pt-4 text-center">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-sienna/30 font-bold mb-6">
                        Personal support &bull; Guided Setup &bull; Pro Features
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-6 bg-sienna text-cream rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-accent transition-all shadow-xl shadow-sienna/20 flex items-center justify-center gap-3"
                    >
                        Return to Workspace
                    </button>
                </div>
            </div>
        </div>
    );
};
