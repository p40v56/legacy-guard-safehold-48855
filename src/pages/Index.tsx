import { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) navigate('/dashboard');
  }, [user, loading, navigate]);

  // Generate stable particle positions
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      left: `${(i * 37 + 13) % 100}%`,
      size: 2 + (i % 3),
      duration: 8 + (i % 7) * 2,
      delay: (i * 0.7) % 6,
      opacity: 0.15 + (i % 4) * 0.08,
    })), []);

  useEffect(() => {
    // Use rAF to ensure DOM is fully painted before observing
    const raf = requestAnimationFrame(() => {
      const revealEls = document.querySelectorAll('#lv-root .reveal');
      
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver(
          (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
          { threshold: 0.01, rootMargin: '0px 0px 100px 0px' }
        );
        revealEls.forEach((el) => obs.observe(el));
        observerRef = obs;
      } else {
        // No IO support — show everything
        revealEls.forEach((el) => el.classList.add('visible'));
      }

      // Fallback: make all reveals visible after 2s in case observer fails
      fallbackTimer = setTimeout(() => {
        document.querySelectorAll('#lv-root .reveal:not(.visible)').forEach((el) => el.classList.add('visible'));
      }, 2000);
    });

    let observerRef: IntersectionObserver | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    // Counters
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.count || '0');
        const suffix = el.dataset.suffix || '';
        if (target === 0) { el.textContent = '0' + suffix; cObs.unobserve(el); return; }
        const dur = target > 10000 ? 2800 : 1800;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step); else
          { el.textContent = target.toLocaleString() + suffix; cObs.unobserve(el); }
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach((el) => cObs.observe(el));

    // Step connector
    const connectorObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) document.getElementById('stepConnector')?.classList.add('animated');
      });
    }, { threshold: 0.4 });
    const stepsRow = document.getElementById('stepsRow');
    if (stepsRow) connectorObs.observe(stepsRow);

    // Nav scroll
    const nav = document.getElementById('lv-nav');
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      observerRef?.disconnect(); cObs.disconnect(); connectorObs.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
      </div>
    </div>);

  return (
    <>
      <div id="lv-root">

        {/* NAV */}
        <header id="lv-nav">
          <a href="#" className="lv-logo">
            <div className="lv-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>LegacyVault</span>
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button className="lv-login" onClick={() => navigate('/auth')}>Log in</button>
          </nav>
        </header>

        {/* HERO */}
        <section className="lv-hero">
          <div className="lv-orb orb1" />
          <div className="lv-orb orb2" />
          <div className="lv-orb orb3" />
          <div className="lv-orb orb4" />
          <div className="lv-rays" />
          {/* Floating particles */}
          <div className="lv-particles">
            {particles.map((p, i) => (
              <div key={i} className="lv-particle" style={{
                left: p.left,
                width: p.size, height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                opacity: p.opacity,
              }} />
            ))}
          </div>
          <div className="lv-hero-content">
            <div className="reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="lv-zk"><div className="lv-zk-dot" />Zero-Knowledge Encrypted</div>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.25s' }}>
              <h1 className="lv-h1">One app<br /><em>for your legacy.</em></h1>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.4s' }}>
              <p className="lv-hero-sub">An encrypted digital contingency system that safeguards your messages, documents, account details, and final wishes — automatically transmitting to designated recipients if you stop checking in.</p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.55s' }}>
              <div className="lv-hero-cta">
                <button className="lv-btn-primary" onClick={() => navigate('/auth?mode=signup')}>
                  Get started free
                </button>
                <button className="lv-btn-ghost" onClick={() => navigate('/auth')}>
                  Sign in
                </button>
              </div>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.7s' }}>
              <div className="lv-trust">
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>AES-256 Encrypted</div>
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>Zero-knowledge</div>
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>GDPR Compliant</div>
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>No plaintext on server</div>
                <a
                  href="/crypto-verification.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lv-trust-item"
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  Encryption — publicly verifiable
                </a>
              </div>
            </div>
          </div>
          <div className="lv-scroll"><div className="lv-scroll-line" /><span>Scroll</span></div>
        </section>

        {/* NUMBERS */}
        <div className="lv-numbers">
          <div className="lv-numbers-inner">
            {[{ n: 256, s: '-bit', l: 'AES Encryption' }, { n: 310000, s: '', l: 'PBKDF2 Iterations' }, { n: 100, s: '%', l: 'Client-side keys' }, { n: 0, s: '', l: 'Server-side access to your data' }].map(({ n, s, l }, i) =>
              <div key={l} className="lv-num-item reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="lv-num-val" data-count={n} data-suffix={s}>{n}{s}</div>
                <div className="lv-num-label">{l}</div>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY */}
        <section className="lv-section" style={{ background: '#0D1B2A' }}>
          <div className="lv-container">
            <div className="lv-centered reveal">
              <span className="lv-label">Security Architecture</span>
              <h2 className="lv-h2">Built so even we<br /><em>can't read your data.</em></h2>
              <p className="lv-body">Every piece of information is encrypted in your browser before it ever reaches our servers. We store only ciphertext.</p>
            </div>
            <div className="lv-grid3">
              {[
                { tag: 'AES-256-GCM', ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>, title: 'Your key, your data', body: 'Your encryption key is derived from your password using PBKDF2 with 310,000 iterations. It never leaves your device. We cannot derive it, reset it, or access it.', cls: '' },
                { tag: 'Zero-knowledge', ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>, title: 'Zero-knowledge architecture', body: 'Our servers store only encrypted blobs. Our cloud provider, our team — nobody can read your documents, account credentials, or personal messages.', cls: 'd1' },
                { tag: 'Per-contact keys', ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, title: 'Secure contact portals', body: 'When your switch activates, each contact receives a unique token. Their portal decrypts locally in their browser — we never see the plaintext at any point.', cls: 'd2' },
              ].map(({ tag, ico, title, body, cls }) =>
                <div key={title} className={`lv-card reveal ${cls}`}>
                  <div className="lv-card-ico">{ico}</div>
                  <div className="lv-card-tag">{tag}</div>
                  <h3>{title}</h3><p>{body}</p>
                </div>
              )}
            </div>
            <div className="lv-enc-flow reveal">
              <div className="lv-enc-line" />
              <div className="lv-enc-title">How your data is protected — end to end</div>
              <div className="lv-enc-steps">
                {[{ cls: 'white', v: 'Your Password', s: 'Never stored' }, { cls: 'amber', v: 'Master Key', s: 'PBKDF2 · 310k iter' }, { cls: 'blue', v: 'Vault Key', s: 'AES-256-GCM' }, { cls: 'green', v: 'Ciphertext', s: 'Stored on server' }].reduce((acc, node, i, arr) => {
                  acc.push(<div key={node.v} className={`lv-enc-node ${node.cls}`}><div className="lv-enc-val">{node.v}</div><div className="lv-enc-sub">{node.s}</div></div>);
                  if (i < arr.length - 1) acc.push(<div key={`arr${i}`} className="lv-enc-arrow"><span>→</span></div>);
                  return acc;
                }, [] as React.ReactNode[])}
              </div>
              <p className="lv-enc-note">Keys exist only in your browser's memory. Cleared on lock or sign-out.</p>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="lv-process" id="how-it-works">
          <div className="lv-container">
            <div className="lv-centered reveal">
              <span className="lv-label light">Set up in 10 minutes</span>
              <h2 className="lv-h2">Simple. Automatic. Secure.</h2>
              <p className="lv-body" style={{ color: 'rgba(255,255,255,.55)', margin: '0 auto' }}>Five steps. Configure once. Protected forever.</p>
            </div>
            <div className="lv-steps" id="stepsRow">
              <div className="lv-connector" id="stepConnector"><div className="lv-connector-fill" /></div>
              {[{ n: '1', l: 'Account', d: 'Create your secure account' }, { n: '2', l: 'Contacts', d: 'Add trusted people' }, { n: '3', l: 'Documents', d: 'Upload important files' }, { n: '4', l: 'Configure', d: 'Set your check-in schedule' }, { n: '5', l: 'Protected', d: 'Your legacy is secured' }].map((s, i) =>
                <div key={s.n} className={`lv-step reveal d${i + 1}`}>
                  <div className="lv-step-circle">{s.n}</div>
                  <div className="lv-step-lbl">{s.l}</div>
                  <div className="lv-step-desc">{s.d}</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="lv-section" id="pricing" style={{ background: '#0D1B2A' }}>
          <div className="lv-container">
            <div className="lv-centered reveal">
              <span className="lv-label">Pricing</span>
              <h2 className="lv-h2">Simple, honest pricing.</h2>
              <p className="lv-body" style={{ color: 'rgba(255,255,255,.55)', margin: '0 auto' }}>One-time annual payment. No monthly fees. No surprises.</p>
            </div>
            <div className="lv-grid3" style={{ alignItems: 'stretch' }}>
              {[
                {
                  name: 'Free', price: '£0', period: 'forever', highlight: false,
                  features: ['1 trusted contact', '1 text document', '2 financial assets', 'Contact portal', 'Basic check-in switch'],
                  cta: 'Get started',
                },
                {
                  name: 'Essential', price: '£49', period: 'per year', highlight: true,
                  features: ['5 trusted contacts', '20 documents', '500 MB storage', '10 financial assets', '10 digital accounts', 'Custom email templates', 'Security questions', 'Activation rules'],
                  cta: 'Upgrade to Essential',
                },
                {
                  name: 'Family', price: '£99', period: 'per year', highlight: false,
                  features: ['Unlimited contacts', 'Unlimited documents', '5 GB storage', 'Unlimited financial assets', 'Unlimited digital accounts', 'Everything in Essential'],
                  cta: 'Upgrade to Family',
                },
              ].map(({ name, price, period, features, cta, highlight }, cardIdx) => (
                <div key={name} className={`lv-pricing-card reveal ${highlight ? 'highlight' : ''} d${cardIdx + 1}`}>
                  {highlight && <div className="lv-pricing-badge">Most Popular</div>}
                  <div>
                    <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{name}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                      <span style={{ fontSize: 36, fontWeight: 700, color: 'white', fontFamily: "'DM Serif Display', serif", letterSpacing: '-0.02em' }}>{price}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{period}</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13.5, color: 'rgba(255,255,255,.65)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={highlight ? '#1A9BD7' : 'rgba(255,255,255,0.35)'} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    className={highlight ? 'lv-btn-primary' : 'lv-btn-ghost'}
                    style={{ width: '100%', marginTop: 28 }}
                    onClick={() => {
                      if (name === 'Free') navigate('/auth?mode=signup');
                      else navigate(`/auth?mode=signup&plan=${name.toLowerCase()}`);
                    }}
                  >
                    {cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lv-features">
          <div className="lv-container">
            <div className="lv-centered reveal">
              <span className="lv-label">What you get</span>
              <h2 className="lv-h2">Everything your family needs.<br /><em>Nothing they shouldn't see.</em></h2>
            </div>
            <div className="lv-grid3">
              {[
                { ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, icoCls: 'red', title: "Dead Man's Switch", body: 'If you stop checking in, your vault activates automatically after a configurable grace period. Nothing needs to be done by anyone.', cls: '' },
                { ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, icoCls: '', title: 'Encrypted Vault', body: 'Store documents, passwords, bank details, and instructions. All encrypted client-side before it leaves your browser.', cls: 'd1' },
                { ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, icoCls: '', title: 'Trusted Contacts', body: "Assign exactly which contacts see which data. Each person gets their own private portal, locked with a unique access token.", cls: 'd2' },
                { ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>, icoCls: '', title: 'Document Storage', body: 'Upload wills, deeds, insurance policies, letters. Encrypted before upload. Signed download URLs expire in 60 seconds.', cls: 'd1' },
                { ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>, icoCls: '', title: 'Digital Accounts', body: 'Catalogue every online account with closure instructions. What to delete, transfer, or memorialize — all specified by you.', cls: 'd2' },
                { ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, icoCls: 'amber', title: 'Security Questions', body: 'Require contacts to answer a personal question before accessing their portal. Answers are SHA-256 hashed — never stored as plaintext.', cls: 'd3' },
              ].map(({ ico, icoCls, title, body, cls }) =>
                <div key={title} className={`lv-card reveal ${cls}`}>
                  <div className={`lv-card-ico ${icoCls}`}>{ico}</div>
                  <h3>{title}</h3><p>{body}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lv-footer">
          <div className="lv-footer-top">
            <div>
              <a href="#" className="lv-footer-logo">
                <div className="lv-logo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
                <span style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>LegacyVault</span>
              </a>
              <p className="lv-footer-tagline">Secure your digital legacy.<br />Protect your loved ones.</p>
              <div className="lv-zk" style={{ fontSize: 10, padding: '5px 12px' }}><div className="lv-zk-dot" />Zero-Knowledge</div>
            </div>
            <div className="lv-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
            <div className="lv-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
              </ul>
            </div>
            <div className="lv-footer-col">
              <h4>Security</h4>
              <ul>
                <li><a href="#">Encryption</a></li>
                <li><a href="#">Zero-knowledge</a></li>
                <li><a href="#">Compliance</a></li>
                <li><a href="#">Bug bounty</a></li>
              </ul>
            </div>
          </div>
          <div className="lv-footer-bottom">
            <span className="lv-footer-copy">© {new Date().getFullYear()} LegacyVault. All rights reserved.</span>
            <div className="lv-footer-enc">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              All data encrypted client-side. We cannot read your information.
            </div>
          </div>
        </footer>

      </div>
    </>);
};

export default Index;
