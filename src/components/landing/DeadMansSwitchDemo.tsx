import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

/* ─── Constants ─── */
const STEPS = ['Setup', 'Switch activated', 'Grace period', 'Notifications', 'Portal', 'Complete'];
const CIRC = 2 * Math.PI * 86; // ~540.35

const fmt = (totalSec: number) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/* ─── Step dots ─── */
const StepDots = ({ current }: { current: number }) => (
  <div className="flex items-center gap-1.5">
    {STEPS.map((_, i) => (
      <div
        key={i}
        className="h-[5px] rounded-full transition-all duration-350"
        style={{
          width: i === current ? 16 : 5,
          background: i < current ? 'rgba(26,155,215,0.38)' : i === current ? '#1A9BD7' : 'rgba(255,255,255,0.16)',
        }}
      />
    ))}
  </div>
);

/* ─── Shared fade wrapper ─── */
const Act = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (
  <AnimatePresence mode="wait">
    {visible && (
      <motion.div
        key="act"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12 z-[1]"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] tracking-[2.5px] text-white/[0.38] uppercase mb-9 flex items-center gap-2.5">
    <span className="w-7 h-px bg-white/[0.08]" />
    {children}
    <span className="w-7 h-px bg-white/[0.08]" />
  </p>
);

/* ────────────────────────────────────────────────────── */
/* ─── STEP 0: Setup ─── */
const SetupStep = ({ onDone }: { onDone: () => void }) => {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [grace, setGrace] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDeadline(30), 1000);
    const t2 = setTimeout(() => setGrace(48), 2000);
    const t3 = setTimeout(() => setShowConfirm(true), 2900);
    const t4 = setTimeout(onDone, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  const Chip = ({ selected, label }: { selected: boolean; label: string }) => (
    <span
      className="py-2 px-[18px] rounded-full border text-[13px] transition-all duration-350 cursor-default"
      style={{
        background: selected ? '#1A9BD7' : 'transparent',
        borderColor: selected ? '#1A9BD7' : 'rgba(255,255,255,0.08)',
        color: selected ? 'white' : 'rgba(255,255,255,0.62)',
        boxShadow: selected ? '0 0 0 4px rgba(26,155,215,0.18)' : 'none',
      }}
    >
      {label}
    </span>
  );

  return (
    <>
      <Tag>Step 1 — You configure the switch</Tag>
      <div className="bg-[#13202f] border border-white/[0.08] rounded-[20px] p-7 sm:p-9 w-full max-w-[440px]">
        <h3 className="text-xl font-medium text-white mb-1.5">Configure your switch</h3>
        <p className="text-[13.5px] text-white/[0.62] leading-relaxed mb-7">Set how long before your vault activates, and a grace period so a mistake doesn't trigger it by accident.</p>
        <div className="text-[10px] tracking-[2px] uppercase text-white/[0.38] mb-2.5">Check-in deadline</div>
        <div className="flex gap-2 flex-wrap mb-6">
          {[14, 30, 60, 90].map(d => <Chip key={d} selected={deadline === d} label={`${d} days`} />)}
        </div>
        <div className="text-[10px] tracking-[2px] uppercase text-white/[0.38] mb-2.5">Grace period</div>
        <div className="flex gap-2 flex-wrap mb-6">
          {[24, 48, 72].map(g => <Chip key={g} selected={grace === g} label={`${g} hrs`} />)}
        </div>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={showConfirm ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.5 }}
          className="w-full py-3.5 bg-[#1A9BD7] rounded-[10px] text-white text-sm font-medium cursor-default"
        >
          Confirm settings →
        </motion.button>
      </div>
    </>
  );
};

/* ─── STEP 1: Timer ─── */
const TimerStep = ({ onDone }: { onDone: () => void }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showRing, setShowRing] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const t1 = setTimeout(() => setShowBanner(true), 300);
    const t2 = setTimeout(() => setShowRing(true), 1800);
    const t3 = setTimeout(() => setShowCaption(true), 2600);
    const t4 = setTimeout(() => {
      const t0 = performance.now();
      const dur = 4000;
      const frame = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        setProgress(p);
        if (p < 1) rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (progress >= 1) {
      const t = setTimeout(onDone, 1500);
      return () => clearTimeout(t);
    }
  }, [progress, onDone]);

  const strokeColor = progress < 0.6 ? '#1A9BD7' : progress < 0.85 ? '#F59E0B' : '#EF4444';
  const numColor = progress < 0.6 ? 'white' : progress < 0.85 ? '#F59E0B' : '#EF4444';

  return (
    <>
      <Tag>Step 2 — Switch activated</Tag>
      <div className="flex flex-col items-center gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={showBanner ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 bg-red-500/10 border border-red-500/[0.28] rounded-[14px] py-4 px-6 w-full max-w-[420px]"
        >
          <span className="text-[28px] flex-shrink-0">⚡</span>
          <div>
            <div className="text-[15px] font-medium text-red-400 mb-0.5">Dead man's switch triggered</div>
            <div className="text-[12.5px] text-red-400/70 leading-snug">No check-in detected. Starting 48-hour countdown.</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={showRing ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="relative w-[200px] h-[200px]"
        >
          <svg className="w-[200px] h-[200px] -rotate-90" viewBox="0 0 200 200">
            <circle fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" cx="100" cy="100" r="86" />
            <circle fill="none" stroke={strokeColor} strokeWidth="9" strokeLinecap="round" cx="100" cy="100" r="86" strokeDasharray={CIRC} strokeDashoffset={CIRC * progress} style={{ transition: 'stroke 0.3s' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[32px] leading-none tabular-nums transition-colors duration-500" style={{ color: numColor, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(Math.round(48 * 3600 * (1 - progress)))}
            </span>
            <span className="text-[11px] tracking-[1.2px] uppercase text-white/[0.38] mt-0.5">hours remaining</span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={showCaption ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[13.5px] text-white/[0.62] text-center"
        >
          Counting down to vault activation
        </motion.p>
      </div>
    </>
  );
};

/* ─── STEP 2: Grace Period ─── */
const GraceStep = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState([false, false, false]);
  const rafRef = useRef<number>();

  useEffect(() => {
    const t0 = performance.now();
    const dur = 5000;
    const frame = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setProgress(p);
      setEvents([p > 0.22, p > 0.54, p > 0.84]);
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (progress >= 1) {
      const t = setTimeout(onDone, 1800);
      return () => clearTimeout(t);
    }
  }, [progress, onDone]);

  const rem = 1 - progress;
  const clockColor = progress < 0.55 ? '#F59E0B' : '#EF4444';

  const eventData = [
    { icon: '📧', bg: 'rgba(245,158,11,0.1)', title: 'Email reminder sent', sub: "— James, your vault activates soon." },
    { icon: '📱', bg: 'rgba(245,158,11,0.1)', title: 'Push notification', sub: '— Last chance to check in.' },
    { icon: '⚡', bg: 'rgba(239,68,68,0.1)', title: 'No response.', sub: ' Vault activation beginning now.' },
  ];

  return (
    <>
      <Tag>Step 3 — Grace period expiring</Tag>
      <div className="w-full max-w-[480px] flex flex-col items-center">
        <div className="text-[72px] leading-none tabular-nums transition-colors duration-700 tracking-tight mb-2.5" style={{ color: clockColor, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(Math.round(24 * 3600 * rem))}
        </div>
        <div className="text-[11px] tracking-[2.5px] uppercase text-white/[0.38] mb-8">Grace period remaining</div>
        <div className="flex justify-between text-[12px] text-white/[0.38] mb-2 w-full">
          <span>Time left</span><span>{Math.round(rem * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden mb-8">
          <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#F59E0B,#EF4444)', transform: `scaleX(${rem})`, transformOrigin: 'left' }} />
        </div>
        <div className="flex flex-col gap-3 w-full">
          {eventData.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={events[i] ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3.5"
            >
              <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] flex-shrink-0" style={{ background: e.bg }}>{e.icon}</div>
              <div className="text-[13px] text-white/[0.62] leading-snug"><strong className="text-white font-medium">{e.title}</strong>{e.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

/* ─── STEP 3: Emails ─── */
const EmailsStep = ({ onDone }: { onDone: () => void }) => {
  const [shown, setShown] = useState([false, false, false]);
  const [delivered, setDelivered] = useState([false, false, false]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShown(s => { const n = [...s]; n[0] = true; return n; }), 300),
      setTimeout(() => { setDelivered(s => { const n = [...s]; n[0] = true; return n; }); setShown(s => { const n = [...s]; n[1] = true; return n; }); }, 1100),
      setTimeout(() => { setDelivered(s => { const n = [...s]; n[1] = true; return n; }); setShown(s => { const n = [...s]; n[2] = true; return n; }); }, 1900),
      setTimeout(() => setDelivered(s => { const n = [...s]; n[2] = true; return n; }), 2700),
      setTimeout(onDone, 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const contacts = [
    { initial: 'S', role: 'Partner', name: 'Sarah', msg: '"You have been granted access to James\'s vault."' },
    { initial: 'T', role: 'Solicitor', name: 'Tom', msg: '"Your client\'s documents are ready for review."' },
    { initial: 'E', role: 'Daughter', name: 'Emma', msg: '"Dad left something for you."' },
  ];

  return (
    <>
      <Tag>Step 4 — Contacts notified</Tag>
      <div className="flex gap-4 items-stretch justify-center w-full flex-wrap">
        {contacts.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 28 }}
            animate={shown[i] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#13202f] border border-white/[0.08] rounded-2xl p-5 w-[196px] flex flex-col gap-2"
          >
            <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#1A9BD7] to-[#0a5e93] flex items-center justify-center text-sm font-semibold text-white">{c.initial}</div>
            <div className="text-[9.5px] tracking-[1.8px] text-[#1A9BD7] uppercase">{c.role}</div>
            <div className="text-[15px] font-medium text-white">{c.name}</div>
            <div className="text-[12px] text-white/[0.38] leading-relaxed flex-1">{c.msg}</div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={delivered[i] ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-1.5 text-[11.5px] text-emerald-500"
            >
              <span>✓</span> Delivered
            </motion.div>
          </motion.div>
        ))}
      </div>
    </>
  );
};

/* ─── STEP 4: Portal ─── */
const PortalStep = ({ onDone }: { onDone: () => void }) => {
  const [showBrowser, setShowBrowser] = useState(false);
  const [docs, setDocs] = useState([false, false, false]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowBrowser(true), 400),
      setTimeout(() => setDocs(s => { const n = [...s]; n[0] = true; return n; }), 1400),
      setTimeout(() => setDocs(s => { const n = [...s]; n[1] = true; return n; }), 2200),
      setTimeout(() => setDocs(s => { const n = [...s]; n[2] = true; return n; }), 3000),
      setTimeout(onDone, 5800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const docList = [
    { icon: '📄', name: 'Property Deeds' },
    { icon: '🛡️', name: 'Insurance Policy' },
    { icon: '✉️', name: 'Personal Letter' },
  ];

  return (
    <>
      <Tag>Step 5 — Private portal unlocked</Tag>
      <div className="w-full max-w-[580px]">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={showBrowser ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#0d1a27] border border-white/[0.08] rounded-[14px] overflow-hidden"
        >
          {/* Browser bar */}
          <div className="bg-white/[0.04] py-2.5 px-4 flex items-center gap-2.5 border-b border-white/[0.08]">
            <div className="flex gap-[5px]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 bg-white/[0.05] rounded-md py-1 px-2.5 text-[11.5px] text-white/40 font-mono">vault.legacyvault.com/sarah</div>
            <span className="text-[10.5px] text-emerald-500 flex items-center gap-1 whitespace-nowrap">🔒 Secure</span>
          </div>
          {/* Body */}
          <div className="flex min-h-[230px]">
            {/* Sidebar */}
            <div className="w-[136px] border-r border-white/[0.08] bg-white/[0.02] p-5 flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1A9BD7] to-[#0a5e93] flex items-center justify-center text-base font-semibold text-white mb-1">S</div>
              <div className="text-[13.5px] font-medium text-white">Sarah</div>
              <div className="text-[10px] text-white/[0.38] tracking-wider">Partner</div>
              <div className="mt-3 text-[10px] py-0.5 px-2.5 rounded-full bg-emerald-500/[0.12] text-emerald-500 border border-emerald-500/[0.22]">● Active</div>
            </div>
            {/* Main */}
            <div className="flex-1 p-5 flex flex-col gap-2.5">
              <div className="text-[10px] tracking-[2px] text-white/[0.38] uppercase mb-1">Your documents</div>
              {docList.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={docs[i] ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55 }}
                  className="flex items-center gap-2.5 py-2.5 px-3 bg-white/[0.03] border border-white/[0.05] rounded-[9px]"
                >
                  <span className="text-base w-[26px] text-center">{d.icon}</span>
                  <span className="text-[13px] flex-1 text-white/[0.62]">{d.name}</span>
                  <span className="text-[9.5px] py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">Unlocked</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

/* ─── STEP 5: Complete ─── */
const CompleteStep = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const [cards, setCards] = useState([false, false, false]);
  const [showMsg, setShowMsg] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCards(s => { const n = [...s]; n[0] = true; return n; }), 300),
      setTimeout(() => setCards(s => { const n = [...s]; n[1] = true; return n; }), 700),
      setTimeout(() => setCards(s => { const n = [...s]; n[2] = true; return n; }), 1100),
      setTimeout(() => setShowMsg(true), 2000),
      setTimeout(() => setShowCta(true), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const contacts = [
    { initial: 'S', name: 'Sarah', role: 'Partner' },
    { initial: 'T', name: 'Tom', role: 'Solicitor' },
    { initial: 'E', name: 'Emma', role: 'Daughter' },
  ];

  return (
    <>
      <Tag>Complete</Tag>
      <div className="flex flex-col items-center">
        <div className="flex gap-3.5 mb-9 flex-wrap justify-center">
          {contacts.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={cards[i] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-[#13202f] border border-white/[0.08] rounded-[14px] p-5 w-[160px] flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A9BD7] to-[#0a5e93] flex items-center justify-center text-[15px] font-semibold text-white mb-0.5">{c.initial}</div>
              <div className="text-sm font-medium text-white">{c.name}</div>
              <div className="text-[10px] text-white/[0.38] tracking-wider">{c.role}</div>
              <div className="text-[10px] py-0.5 px-2.5 rounded-full bg-emerald-500/[0.12] text-emerald-500 border border-emerald-500/[0.22]">Portal Active</div>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={showMsg ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[15px] text-white/[0.62] text-center max-w-[380px] leading-relaxed mb-5"
        >
          Each contact sees only what you chose to share with them. Nothing more.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={showCta ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          onClick={onGetStarted}
          className="text-[13.5px] text-[#1A9BD7] border-b border-transparent hover:border-[#1A9BD7] pb-px cursor-pointer bg-transparent"
        >
          See how to set it up →
        </motion.button>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════ */
/* ─── MAIN COMPONENT ─── */
/* ════════════════════════════════════════════════ */
const DeadMansSwitchDemo = () => {
  const [step, setStep] = useState(0);
  const [key, setKey] = useState(0); // for replay
  

  const next = useCallback(() => setStep(s => s + 1), []);

  const replay = () => {
    setStep(0);
    setKey(k => k + 1);
  };

  const handleGetStarted = () => {
    const el = document.getElementById('get-started-cta');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-[120px] px-6 bg-[#0D1B2A] flex flex-col items-center">
      <p className="text-[10.5px] font-semibold tracking-[3.5px] text-[#1A9BD7] uppercase text-center mb-4">The Dead Man's Switch</p>
      <h2 className="text-[clamp(30px,4vw,50px)] font-normal text-center leading-[1.15] mb-3 text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
        What happens when you<br /><em>stop checking in.</em>
      </h2>
      <p className="text-white/[0.38] text-center text-[15px] font-light mb-[52px]">Everything below is automatic. You configure it once.</p>

      {/* Stage */}
      <div
        key={key}
        className="w-full max-w-[820px] h-[580px] bg-[#0e1e2e] border border-white/[0.08] rounded-3xl relative overflow-hidden"
      >
        {/* Subtle glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse, rgba(26,155,215,0.07) 0%, transparent 65%)' }} />

        <Act visible={step === 0}><SetupStep onDone={next} /></Act>
        <Act visible={step === 1}><TimerStep onDone={next} /></Act>
        <Act visible={step === 2}><GraceStep onDone={next} /></Act>
        <Act visible={step === 3}><EmailsStep onDone={next} /></Act>
        <Act visible={step === 4}><PortalStep onDone={next} /></Act>
        <Act visible={step === 5}><CompleteStep onGetStarted={handleGetStarted} /></Act>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center gap-5 flex-wrap justify-center">
        <StepDots current={step} />
        <span className="text-[11.5px] text-white/[0.38] min-w-[110px] text-center">{STEPS[step]}</span>
        <button
          onClick={replay}
          className="bg-transparent border border-white/[0.08] text-white/[0.38] py-1.5 px-4 rounded-full text-[11.5px] cursor-pointer tracking-wide hover:text-white/60 hover:border-white/20 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" /> Replay
        </button>
      </div>
    </section>
  );
};

export default DeadMansSwitchDemo;
