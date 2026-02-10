
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, MousePointer2, Sparkles, PenTool,
  Frame, Hand, Check, Plus, Quote,
  Zap, Palette, Menu, X, Sun, Moon
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShowGallery: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onFileUpload, onShowGallery, fileInputRef, toggleTheme, theme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => observer.observe(el));

    return () => reveals.forEach(el => observer.unobserve(el));
  }, []);

  return (
    <div className="bg-cream text-sienna selection:bg-accent selection:text-sienna overflow-x-hidden transition-colors duration-500 max-w-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-4 lg:px-12 py-4 lg:py-8 flex justify-between items-center bg-cream/95 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none transition-all duration-500 border-b border-sienna/10 md:border-b-0 max-w-full">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center transition-transform group-hover:rotate-12 shadow-lg shadow-accent/40">
            <Frame className="w-5 h-5 text-sienna dark:text-white" />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.4em]">TraceMaster</span>
        </div>

        <div className="hidden md:flex items-center gap-12 text-[11px] font-bold uppercase tracking-[0.2em]">
          <a href="#philosophy" className="text-sienna/80 hover:text-accent transition-all hover:tracking-[0.3em]">Philosophy</a>
          <a href="#atelier" className="text-sienna/80 hover:text-accent transition-all hover:tracking-[0.3em]">Atelier</a>
          <button
            onClick={onShowGallery}
            className="text-sienna/80 hover:text-accent transition-all hover:tracking-[0.3em] font-bold uppercase"
          >
            Art Library
          </button>
          <a href="#reactions" className="text-sienna/80 hover:text-accent transition-all hover:tracking-[0.3em]">Reactions</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-3 lg:p-4 rounded-full bg-sienna/5 hover:bg-sienna/10 transition-all text-sienna/80 hover:text-accent border border-sienna/10"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={onStart}
            className="px-8 py-3 bg-sienna text-cream border border-sienna/10 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent hover:text-sienna dark:hover:text-white transition-all shadow-xl"
          >
            Studio
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 text-sienna/90"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-cream flex flex-col items-center justify-center p-10 space-y-10 animate-in fade-in duration-500">
          <a href="#philosophy" onClick={() => setIsMenuOpen(false)} className="text-4xl font-light italic hover:text-accent transition-colors">Philosophy</a>
          <a href="#atelier" onClick={() => setIsMenuOpen(false)} className="text-4xl font-light italic hover:text-accent transition-colors">Atelier</a>
          <button onClick={() => { onShowGallery(); setIsMenuOpen(false); }} className="text-4xl font-light italic hover:text-accent transition-colors">Art Library</button>
          <a href="#reactions" onClick={() => setIsMenuOpen(false)} className="text-4xl font-light italic hover:text-accent transition-colors">Reactions</a>
          <button onClick={() => { onStart(); setIsMenuOpen(false); }} className="text-4xl font-bold uppercase tracking-[0.2em] text-accent">Studio</button>
        </div>
      )}

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 text-center relative overflow-hidden">
        <div className="max-w-5xl space-y-12 z-10">
          <div className="space-y-6 reveal active">
            <span className="text-[11px] uppercase font-bold tracking-[0.6em] text-sienna/70 px-4 inline-block mb-2">Chapter I: The Awakening</span>
            <h1 className="text-[12vw] lg:text-[9vw] font-light italic leading-[0.85] tracking-tighter">
              Light meets <br className="lg:hidden" /> <span className="text-accent">lead.</span>
            </h1>
            <p className="text-base lg:text-xl text-sienna/80 max-w-sm lg:max-w-2xl mx-auto font-light leading-relaxed px-4">
              The ethereal bridge between digital vision and physical creation.
              Project the invisible onto your canvas with cinematic precision.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 reveal delay-1 active">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto group relative px-14 py-7 bg-sienna text-cream rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative flex items-center justify-center gap-4 font-bold text-[11px] uppercase tracking-[0.3em]">
                Begin the Vision <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileUpload} />
          </div>
        </div>

        <div className="absolute top-[20%] left-[5%] float-anim opacity-10 hidden lg:block"><PenTool className="w-32 h-32 text-accent" /></div>
        <div className="absolute bottom-[10%] right-[5%] float-anim opacity-10 hidden lg:block" style={{ animationDelay: '-2s' }}><Sparkles className="w-40 h-40 text-accent" /></div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 lg:py-48 px-4 bg-petal/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 reveal">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-accent">Our Philosophy</span>
            <h2 className="text-6xl lg:text-8xl font-light italic leading-tight">Digital ghosts, <br /> physical hands.</h2>
            <p className="text-xl text-sienna/80 leading-relaxed font-light">
              We believe technology shouldn't replace the human touch; it should illuminate it. TraceMaster is built for artists who find joy in the friction of pencil on grain, providing a guiding light for every stroke.
            </p>
            <div className="pt-10 grid grid-cols-2 gap-10 border-t border-sienna/30">
              <div className="space-y-2">
                <h4 className="text-4xl font-semibold italic text-accent">0.2s</h4>
                <p className="text-[10px] uppercase tracking-widest text-sienna/70">Real-time AR Sync</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-4xl font-semibold italic text-accent">Pure</h4>
                <p className="text-[10px] uppercase tracking-widest text-sienna/70">Analog Spirit</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-square silk-panel rounded-[4rem] flex items-center justify-center p-16 overflow-hidden reveal delay-1 shadow-2xl border-sienna/20">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-transparent"></div>
            <Hand className="w-32 h-32 lg:w-48 lg:h-48 text-accent float-anim" />
            <div className="absolute bottom-16 text-[11px] font-bold uppercase tracking-[0.4em] text-sienna/60">Tactile Precision</div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="atelier" className="py-24 lg:py-48 px-4">
        <div className="max-w-6xl mx-auto space-y-32">
          <div className="text-center space-y-8 reveal">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-sienna/70">The Architecture</span>
            <h2 className="text-5xl lg:text-7xl font-light italic">Mastery in Every Layer.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Adaptive Lens"
              desc="Automatic image analysis instantly optimizes lines for your specific lighting and paper grain."
              delay="reveal"
            />
            <FeatureCard
              icon={<Palette className="w-8 h-8" />}
              title="Palette Guide"
              desc="Extracts core pigments from your reference to help you match physical paints or colored pencils."
              delay="reveal delay-1"
            />
            <FeatureCard
              icon={<MousePointer2 className="w-8 h-8" />}
              title="Micro-Nudge"
              desc="Fine-tune your projection with sub-pixel spatial controls for absolute alignment accuracy."
              delay="reveal delay-2"
            />
          </div>
        </div>
      </section>

      {/* Reactions Section */}
      <section id="reactions" className="py-24 lg:py-48 px-4 bg-sienna text-cream relative transition-colors duration-700">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-32 reveal">
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-accent">Voices</span>
              <h2 className="text-6xl lg:text-9xl font-light italic">Atelier Reactions.</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <TestimonialCard
              name="Julianne R."
              role="Oil Painter"
              text="Magic in my pocket. The lines float over my canvas, letting me focus on the emotion of the stroke."
              delay="reveal"
            />
            <TestimonialCard
              name="Marcus T."
              role="Architect"
              text="For on-site spatial studies, TraceMaster is unparalleled. It replaces a studio-worth of equipment."
              delay="reveal delay-1"
            />
            <TestimonialCard
              name="Aria Sol"
              role="Illustrator"
              text="The color guide tool bridges the gap between my screen and my physical pigment tubes perfectly."
              delay="reveal delay-2"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-48 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="p-16 border border-sienna/30 rounded-[4rem] space-y-12 group hover:border-accent/80 transition-all reveal shadow-md bg-white/60">
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-sienna/70">The Apprentice</span>
              <h3 className="text-5xl font-light italic">Free Tier.</h3>
            </div>
            <ul className="space-y-6 text-sm font-medium text-sienna/90">
              <PricingItem text="Basic AR Projection" />
              <PricingItem text="Standard Trace Filters" />
              <PricingItem text="Unlimited Sessions" />
            </ul>
            <button onClick={onStart} className="w-full py-6 border border-sienna/30 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-sienna hover:text-cream transition-all font-black">Start Now</button>
          </div>

          <div className="p-16 bg-accent text-sienna dark:text-white rounded-[4rem] space-y-12 relative overflow-hidden shadow-2xl reveal delay-1 border border-accent/40">
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-sienna/80 dark:text-white/70">The Master</span>
              <h3 className="text-5xl font-light italic">$19 <span className="text-base font-normal">Lifetime</span></h3>
            </div>
            <ul className="space-y-6 text-sm font-black dark:font-medium">
              <PricingItem text="Premium Studio Filters" />
              <PricingItem text="Full Palette Extraction" />
              <PricingItem text="Spatial Lock Pro" />
              <PricingItem text="Priority Haptic Feedback" />
            </ul>
            <button onClick={onStart} className="w-full py-6 bg-sienna text-cream dark:bg-cream dark:text-accent rounded-full text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Unlock Atelier</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-8 border-t border-sienna/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16 text-center md:text-left">
          <div className="space-y-6">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/50">
                <Frame className="w-4 h-4 text-sienna dark:text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.4em]">TraceMaster</span>
            </div>
            <p className="text-xs text-sienna/70 max-w-xs font-light leading-relaxed">
              Made for the friction of lead on paper. Guiding hands, honoring crafts.
            </p>
          </div>
          <div className="flex gap-16 text-[10px] font-bold uppercase tracking-widest text-sienna/80">
            <a href="#" className="hover:text-accent transition-colors">Instagram</a>
            <a href="#" className="hover:text-accent transition-colors">Twitter</a>
            <a href="#" className="hover:text-accent transition-colors">Legal</a>
          </div>
        </div>
        <div className="text-center pt-20 text-[9px] font-bold uppercase tracking-[0.4em] text-sienna/40">
          © 2025 TraceMaster Studio • Created for creators
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: any) => (
  <div className={`p-12 silk-panel rounded-[4rem] space-y-8 hover:-translate-y-3 transition-all duration-500 group ${delay} shadow-xl shadow-sienna/10 border-sienna/20`}>
    <div className="w-16 h-16 bg-accent/30 rounded-3xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-inner shadow-accent/20 border border-accent/10">{icon}</div>
    <div className="space-y-4">
      <h4 className="text-2xl font-semibold italic">{title}</h4>
      <p className="text-sm text-sienna/80 leading-relaxed font-light">{desc}</p>
    </div>
  </div>
);

const TestimonialCard = ({ name, role, text, delay }: any) => (
  <div className={`p-14 border border-white/20 bg-white/10 rounded-[4rem] space-y-8 ${delay} backdrop-blur-md shadow-inner`}>
    <Quote className="w-10 h-10 text-accent/50" />
    <p className="text-base italic leading-relaxed text-white">"{text}"</p>
    <div className="pt-6 flex items-center gap-5 border-t border-white/10">
      <div className="w-12 h-12 rounded-full bg-accent/40 flex items-center justify-center text-sm font-bold italic text-sienna dark:text-accent shadow-lg border border-accent/20">{name.charAt(0)}</div>
      <div>
        <h5 className="text-[11px] font-bold uppercase tracking-widest text-white">{name}</h5>
        <p className="text-[10px] uppercase tracking-widest text-white/80">{role}</p>
      </div>
    </div>
  </div>
);

const PricingItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-4">
    <Check className="w-5 h-5 text-inherit opacity-90" />
    <span>{text}</span>
  </li>
);

export default LandingPage;
