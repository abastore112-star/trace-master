import React from 'react';
import { ArrowLeft, Shield, FileText, CreditCard } from 'lucide-react';

interface LegalProps {
    tab: 'terms' | 'privacy' | 'refund';
    onBack: () => void;
    onTabChange: (tab: 'terms' | 'privacy' | 'refund') => void;
}

export const Legal: React.FC<LegalProps> = ({ tab, onBack, onTabChange }) => {
    return (
        <div className="min-h-screen bg-cream text-sienna selection:bg-accent selection:text-sienna p-4 lg:p-12 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-sienna/10 pb-8">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-sienna/5 hover:bg-sienna/10 transition-all text-sienna/60 hover:text-accent border border-sienna/10"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-light italic text-sienna">
                                Atelier <span className="font-bold">Legal</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-sienna/40 font-bold">Standard of Residence</p>
                        </div>
                    </div>

                    <div className="flex bg-sienna/5 p-1 rounded-full border border-sienna/10">
                        <TabButton
                            active={tab === 'terms'}
                            onClick={() => onTabChange('terms')}
                            icon={<FileText className="w-4 h-4" />}
                            label="Terms"
                        />
                        <TabButton
                            active={tab === 'privacy'}
                            onClick={() => onTabChange('privacy')}
                            icon={<Shield className="w-4 h-4" />}
                            label="Privacy"
                        />
                        <TabButton
                            active={tab === 'refund'}
                            onClick={() => onTabChange('refund')}
                            icon={<CreditCard className="w-4 h-4" />}
                            label="Refunds"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-12 py-8">
                    {tab === 'terms' && <TermsOfService />}
                    {tab === 'privacy' && <PrivacyPolicy />}
                    {tab === 'refund' && <RefundPolicy />}
                </div>

                {/* Footer */}
                <div className="pt-12 border-t border-sienna/10 text-center">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-sienna/30 font-bold">
                        TraceMaster Studio • 2025 • Guiding Hands
                    </p>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-sienna text-cream shadow-lg' : 'text-sienna/40 hover:text-sienna'}`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const Section = ({ title, children }: any) => (
    <div className="space-y-4">
        <h3 className="text-xl font-bold uppercase tracking-widest text-accent flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            {title}
        </h3>
        <div className="text-sm text-sienna/70 leading-relaxed font-light space-y-4 prose prose-sienna max-w-none">
            {children}
        </div>
    </div>
);

const TermsOfService = () => (
    <div className="space-y-12">
        <Section title="1. Acceptance of Terms">
            <p>By entering the TraceMaster Atelier, you agree to be bound by these Terms of Service. This is an ethereal agreement between you and TraceMaster Studio.</p>
        </Section>
        <Section title="2. The Service">
            <p>TraceMaster provides AI-augmented artistic guidance tools. Our service includes image extraction, cloud processing, and projection assistance. We reserve the right to modify or discontinue services as the creative winds shift.</p>
        </Section>
        <Section title="3. Content Ownership">
            <p>You retain full ownership of the artwork you create using our tools. TraceMaster does not claim copyright over your physical sketches or digital traced outputs. You are responsible for the references you use.</p>
        </Section>
        <Section title="4. Pro Subscriptions">
            <p>TraceMaster Pro is a lifetime or recurring access tier. Pro activation grants unlimited AI Energy (Cloud HQ Refinement). Access is tied to your account and is non-transferable.</p>
        </Section>
        <Section title="5. Prohibited Use">
            <p>You may not use our Atelier for any illegal purpose, or to automate copyright infringement at scale. We honor the friction of lead on paper; don't break the magic.</p>
        </Section>
    </div>
);

const PrivacyPolicy = () => (
    <div className="space-y-12">
        <Section title="1. Data Collection">
            <p>We collect minimal data to provide our service:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Auth Credentials (via Google/Supabase)</li>
                <li>Atelier Assets (Sketches you choose to save to Cloud)</li>
                <li>Subscription Status (via RevenueCat)</li>
            </ul>
        </Section>
        <Section title="2. Usage">
            <p>Your images are used solely for your creative process. We do not sell your sketches or use them to train baseline models without explicit consent. Your "Atelier Archive" is private and protected by Row Level Security.</p>
        </Section>
        <Section title="3. Cookies">
            <p>We use essential cookies to maintain your login session. No tracking ghosts here.</p>
        </Section>
        <Section title="4. Security">
            <p>We leverage industry-standard encryption through Supabase and S3-compatible storage. We protect your vision as if it were our own.</p>
        </Section>
    </div>
);

const RefundPolicy = () => (
    <div className="space-y-12">
        <Section title="1. Digital Goods">
            <p>TraceMaster Pro and AI Credits are digital services. Due to the immediate nature of digital access and processing costs, we generally do not offer refunds once the service has been used.</p>
        </Section>
        <Section title="2. Pro Membership">
            <p>If you encounter technical failure or purchased in error, contact us within 24 hours. If no Cloud HQ processing has been utilized, we may grant a refund at our discretion.</p>
        </Section>
        <Section title="3. Subscription Cycles">
            <p>Cancellations for recurring plans take effect at the end of the current billing cycle. No partial refunds are provided for unused time.</p>
        </Section>
        <Section title="4. Support">
            <p>We are artists, not just developers. If you have an issue, reach out. We value the human touch over automated rejection.</p>
        </Section>
    </div>
);
