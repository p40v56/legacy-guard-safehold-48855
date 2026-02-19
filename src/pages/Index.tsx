import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';
import DeadMansSwitchDemo from '@/components/landing/DeadMansSwitchDemo';
import { motion, useReducedMotion } from 'framer-motion';

/* ───────── Scroll-triggered wrapper ───────── */
const FadeUp = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ───────── Phone mockup ───────── */
const PhoneMockup = () => (
  <motion.div
    animate={{ y: [-10, 10, -10] }}
    transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
    className="relative w-[280px] md:w-[300px]"
  >
    <div className="rounded-[32px] border-[6px] border-white/20 bg-[#0D1B2A] p-5 shadow-2xl">
      <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
      {[
        { label: 'Trusted Contacts', value: '3 added' },
        { label: 'Documents', value: '12 secured' },
        { label: 'Vault Status', value: 'Protected' },
      ].map((row, i) => (
        <div key={i} className="flex items-center justify-between py-3 px-4 mb-2 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.12]">
          <span className="text-white/70 text-sm">{row.label}</span>
          <span className={`text-sm font-medium ${i === 2 ? 'text-emerald-400' : 'text-[#1A9BD7]'}`}>{row.value}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (user && !loading) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleGetStarted = () => navigate('/auth');
  const handleLogin = () => navigate('/auth');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
          <Shield className="w-8 h-8 text-[#1A9BD7]" />
        </div>
      </div>
    );
  }


  const steps = [
    { num: '1', label: 'Account', desc: 'Create your secure account' },
    { num: '2', label: 'Contacts', desc: 'Add your trusted people' },
    { num: '3', label: 'Documents', desc: 'Upload important files' },
    { num: '4', label: 'Configure', desc: 'Set your check-in schedule' },
    { num: '5', label: 'Protected', desc: 'Your legacy is secured' },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#0D1B2A]">

      {/* ─── 1. NAV ─── */}
      <motion.header
        initial={reduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: 'rgba(13,27,42,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-xl font-semibold text-white tracking-tight">LegacyVault</span>
          </div>
          <button onClick={handleLogin} className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            Log in
          </button>
        </div>
      </motion.header>

      {/* ─── 2. HERO ─── */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20 relative" style={{ background: 'linear-gradient(135deg, #1A9BD7, #0D6EA8)' }}>
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <motion.h1
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-6"
            >
              One app<br /><span className="italic font-light">for your legacy</span>
            </motion.h1>
            <motion.p
              initial={reduced ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/80 max-w-lg mb-10"
            >
              Secure your digital legacy. Protect your loved ones with an intelligent dead man's switch.
            </motion.p>
            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="group bg-white text-[#1A9BD7] hover:bg-white/95 hover:scale-[1.03] rounded-full px-10 py-7 text-lg font-semibold shadow-xl transition-transform"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-white/50 text-sm mt-5">Available on iOS and Android</p>
            </motion.div>
          </div>
          {/* Right: phone mockup */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex justify-center"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* ─── 3. DEAD MAN'S SWITCH DEMO ─── */}
      <DeadMansSwitchDemo />

      {/* ─── 4. PROCESS ─── */}
      <section id="how-it-works" className="py-32 px-6" style={{ background: 'linear-gradient(135deg, #1A9BD7, #0D6EA8)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <span className="text-white/50 text-sm font-semibold uppercase tracking-[0.2em]">How it works</span>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mt-4">Simple. Automatic. Secure.</h2>
          </FadeUp>
          <div className="relative">
            {/* Connecting line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-white/30 origin-left"
            />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {steps.map((step, i) => (
                <FadeUp key={i} delay={0.4 + i * 0.15} className="text-center relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                    <span className="text-white font-bold text-lg">{step.num}</span>
                  </div>
                  <span className="text-white font-medium block mb-1">{step.label}</span>
                  <span className="text-white/50 text-xs">{step.desc}</span>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ─── 5. FINAL CTA ─── */}
      <section className="py-32 px-6 relative" style={{ background: 'linear-gradient(135deg, #1A9BD7, #0D6EA8)' }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeUp>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
              Protect what matters most.
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="text-white/70 text-lg mb-10">Your family is either protected or they're not.</p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="group bg-white text-[#1A9BD7] hover:bg-white/95 hover:scale-[1.03] rounded-full px-10 py-7 text-lg font-semibold shadow-xl transition-transform"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </FadeUp>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="bg-[#0D1B2A] border-t border-white/10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-[#1A9BD7]" />
                <span className="text-xl font-semibold text-white">LegacyVault</span>
              </div>
              <p className="text-white/40 text-sm">Secure your digital legacy and protect your loved ones.</p>
            </div>
            {[
              { title: 'Get Started', links: ['Home', 'Login', 'Pricing'] },
              { title: 'Product', links: ['Features', 'Security', 'FAQ'] },
              { title: 'Company', links: ['About', 'Contact', 'Privacy'] },
            ].map((s, i) => (
              <div key={i}>
                <h4 className="text-white font-medium mb-4">{s.title}</h4>
                <ul className="space-y-2">
                  {s.links.map((l, j) => (
                    <li key={j}><a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">© 2024 LegacyVault. All rights reserved.</p>
            <div className="flex gap-6">
              {['Terms', 'Privacy', 'Cookies'].map((l, i) => (
                <a key={i} href="#" className="text-white/40 hover:text-white text-sm transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
