import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Counters
    const cObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.count || '0');
        const suffix = el.dataset.suffix || '';
        if (target === 0) { el.textContent = '0' + suffix; cObs.unobserve(el); return; }
        const dur = target > 10000 ? 2200 : 1400;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
          else { el.textContent = target.toLocaleString() + suffix; cObs.unobserve(el); }
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(el => cObs.observe(el));

    // Step connector
    const connectorObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) document.getElementById('stepConnector')?.classList.add('animated');
      });
    }, { threshold: 0.4 });
    const stepsRow = document.getElementById('stepsRow');
    if (stepsRow) connectorObs.observe(stepsRow);

    // Nav scroll
    const nav = document.getElementById('lv-nav');
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Hero reveal
    document.querySelectorAll('.hero .reveal').forEach(el => {
      const delay = parseFloat((el as HTMLElement).style.transitionDelay || '0') * 1000;
      setTimeout(() => el.classList.add('visible'), delay + 100);
    });

    return () => {
      obs.disconnect(); cObs.disconnect(); connectorObs.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        #lv-root,#lv-root *,#lv-root *::before,#lv-root *::after{box-sizing:border-box;margin:0;padding:0}
        html:has(#lv-root),body:has(#lv-root){background:#0D1B2A !important;color:white !important;font-family:'DM Sans',sans-serif !important}
        #lv-root{font-family:'DM Sans',sans-serif;background:#0D1B2A;color:white;overflow-x:hidden}
        #lv-root h1,#lv-root h2,#lv-root h3,#lv-root h4,#lv-root h5,#lv-root h6{font-family:'DM Serif Display',serif !important;font-weight:400 !important;letter-spacing:0 !important}
        .reveal{opacity:0;transform:translateY(40px);transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1)}
        .reveal.d1{transition-delay:.1s}.reveal.d2{transition-delay:.2s}.reveal.d3{transition-delay:.3s}.reveal.d4{transition-delay:.4s}.reveal.d5{transition-delay:.5s}
        .reveal.visible{opacity:1;transform:translateY(0)}
        #lv-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 48px;display:flex;align-items:center;justify-content:space-between;transition:all .4s ease}
        #lv-nav.scrolled{padding:14px 48px;background:rgba(13,27,42,.9);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.07)}
        .lv-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        .lv-logo-icon{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center}
        .lv-login{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:white;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;padding:8px 20px;border-radius:99px;cursor:pointer;transition:all .2s}
        .lv-login:hover{background:rgba(255,255,255,.18)}
        .lv-hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;background:linear-gradient(160deg,#1A9BD7 0%,#0D6EA8 45%,#0a3d5c 100%);padding:100px 24px 80px}
        .lv-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);opacity:.35}
        .orb1{width:600px;height:600px;background:radial-gradient(circle,rgba(255,255,255,.18) 0%,transparent 70%);top:-200px;left:-100px;animation:orbDrift1 18s ease-in-out infinite}
        .orb2{width:500px;height:500px;background:radial-gradient(circle,rgba(10,70,120,.8) 0%,transparent 70%);bottom:-150px;right:-100px;animation:orbDrift2 22s ease-in-out infinite}
        .orb3{width:300px;height:300px;background:radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 70%);top:50%;right:20%;animation:orbDrift3 14s ease-in-out infinite}
        @keyframes orbDrift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,40px) scale(1.08)}66%{transform:translate(-30px,60px) scale(.95)}}
        @keyframes orbDrift2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-50px,-40px) scale(1.1)}70%{transform:translate(40px,-20px) scale(.92)}}
        @keyframes orbDrift3{0%,100%{transform:translate(0,0);opacity:.3}50%{transform:translate(-30px,-50px);opacity:.5}}
        .lv-rays{position:absolute;inset:0;pointer-events:none;background:conic-gradient(from 200deg at 60% 10%,transparent 0deg,rgba(255,255,255,.025) 20deg,transparent 40deg,transparent 120deg,rgba(255,255,255,.02) 140deg,transparent 160deg)}
        .lv-hero-content{position:relative;z-index:2;max-width:820px}
        .lv-zk{display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:99px;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.1);color:#6ee7b7;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;margin-bottom:32px}
        .lv-zk-dot{width:6px;height:6px;border-radius:50%;background:#34d399;animation:pulseDot 2s ease-in-out infinite}
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .lv-h1{font-family:'DM Serif Display',serif !important;font-size:clamp(56px,8vw,92px) !important;line-height:1 !important;color:white !important;margin-bottom:28px;font-weight:400 !important;letter-spacing:0 !important}
        .lv-h1 em{font-style:italic;font-weight:300 !important}
        .lv-hero-sub{font-size:clamp(16px,2vw,20px);color:rgba(255,255,255,.68);font-weight:300;max-width:560px;margin:0 auto 48px;line-height:1.65;font-family:'DM Sans',sans-serif}
        .lv-trust{margin-top:52px;display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap}
        .lv-trust-item{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.5);font-size:13px;font-family:'DM Sans',sans-serif}
        .lv-trust-item svg{opacity:.6}
        .lv-scroll{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(255,255,255,.3);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'DM Sans',sans-serif}
        .lv-scroll-line{width:1px;height:48px;background:linear-gradient(to bottom,rgba(255,255,255,.4),transparent);animation:scrollGrow 2s ease-in-out infinite}
        @keyframes scrollGrow{0%,100%{transform:scaleY(1);opacity:1}50%{transform:scaleY(.6);opacity:.4}}
        .lv-numbers{background:#0D1B2A;padding:80px 48px;border-bottom:1px solid rgba(255,255,255,.06)}
        .lv-numbers-inner{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
        .lv-num-item{text-align:center;padding:0 24px;border-right:1px solid rgba(255,255,255,.08)}
        .lv-num-item:last-child{border-right:none}
        .lv-num-val{font-family:'DM Serif Display',serif !important;font-size:clamp(38px,5vw,56px) !important;color:white !important;line-height:1;margin-bottom:8px;font-weight:400 !important}
        .lv-num-label{color:rgba(255,255,255,.35);font-size:13px;font-family:'DM Sans',sans-serif}
        .lv-section{padding:120px 48px}
        .lv-container{max-width:1100px;margin:0 auto}
        .lv-label{font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:#1A9BD7;display:block;margin-bottom:16px;font-family:'DM Sans',sans-serif}
        .lv-label.light{color:rgba(255,255,255,.45)}
        .lv-h2{font-family:'DM Serif Display',serif !important;font-size:clamp(32px,4.5vw,52px) !important;color:white !important;line-height:1.1 !important;margin-bottom:20px;font-weight:400 !important;letter-spacing:0 !important}
        .lv-h2 em{font-style:italic;font-weight:300 !important}
        .lv-body{color:rgba(255,255,255,.45);font-size:18px;font-weight:300;line-height:1.65;max-width:540px;font-family:'DM Sans',sans-serif}
        .lv-centered{text-align:center}.lv-centered .lv-body{margin:0 auto}
        .lv-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:64px}
        .lv-card{background:rgba(255,255,255,.04) !important;border:1px solid rgba(255,255,255,.08) !important;border-radius:20px;padding:28px;display:flex;flex-direction:column;transition:border-color .3s,background .3s,transform .3s;backdrop-filter:none !important;box-shadow:none !important}
        .lv-card:hover{border-color:rgba(255,255,255,.14) !important;background:rgba(255,255,255,.06) !important;transform:translateY(-2px)}
        .lv-card h3{font-size:17px !important;font-weight:600 !important;color:white !important;margin-bottom:10px;font-family:'DM Sans',sans-serif !important;letter-spacing:0 !important}
        .lv-card p{color:rgba(255,255,255,.42) !important;font-size:14px !important;line-height:1.65;font-weight:300;flex:1;font-family:'DM Sans',sans-serif !important}
        .lv-card-ico{width:44px;height:44px;border-radius:12px;background:rgba(26,155,215,.15) !important;border:1px solid rgba(26,155,215,.25) !important;display:flex;align-items:center;justify-content:center;margin-bottom:20px;backdrop-filter:none !important;box-shadow:none !important}
        .lv-card-ico.red{background:rgba(239,68,68,.12) !important;border-color:rgba(239,68,68,.22) !important}
        .lv-card-ico.amber{background:rgba(245,158,11,.12) !important;border-color:rgba(245,158,11,.22) !important}
        .lv-card-tag{display:inline-flex;padding:3px 10px;border-radius:6px;background:rgba(26,155,215,.1);border:1px solid rgba(26,155,215,.2);color:#1A9BD7;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;align-self:flex-start;font-family:'DM Sans',sans-serif}
        .lv-enc-flow{background:rgba(255,255,255,.03) !important;border:1px solid rgba(255,255,255,.08) !important;border-radius:24px;padding:48px;margin-top:48px;position:relative;overflow:hidden;backdrop-filter:none !important;box-shadow:none !important}
        .lv-enc-flow::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(26,155,215,.06) 0%,transparent 70%);pointer-events:none}
        .lv-enc-title{text-align:center;color:rgba(255,255,255,.3);font-size:11px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:36px;font-family:'DM Sans',sans-serif}
        .lv-enc-steps{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;z-index:1}
        .lv-enc-node{flex:1;min-width:110px;text-align:center;padding:16px 10px;border-radius:14px;border:1px solid transparent !important;box-shadow:none !important}
        .lv-enc-node.white{border-color:rgba(255,255,255,.12) !important;background:rgba(255,255,255,.04) !important}
        .lv-enc-node.amber{border-color:rgba(245,158,11,.3) !important;background:rgba(245,158,11,.07) !important}
        .lv-enc-node.blue{border-color:rgba(26,155,215,.35) !important;background:rgba(26,155,215,.08) !important}
        .lv-enc-node.green{border-color:rgba(52,211,153,.3) !important;background:rgba(52,211,153,.07) !important}
        .lv-enc-arrow{flex:0;min-width:20px;text-align:center;color:rgba(255,255,255,.2);font-size:18px}
        .lv-enc-val{font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif}
        .lv-enc-node.white .lv-enc-val{color:rgba(255,255,255,.85)}
        .lv-enc-node.amber .lv-enc-val{color:#fbbf24}
        .lv-enc-node.blue .lv-enc-val{color:#1A9BD7}
        .lv-enc-node.green .lv-enc-val{color:#34d399}
        .lv-enc-sub{font-size:11px;color:rgba(255,255,255,.28);margin-top:4px;font-family:'DM Sans',sans-serif}
        .lv-enc-note{text-align:center;color:rgba(255,255,255,.22);font-size:12px;margin-top:28px;position:relative;z-index:1;font-family:'DM Sans',sans-serif}
        .lv-enc-line{position:absolute;top:50%;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(26,155,215,.4) 20%,rgba(26,155,215,.6) 50%,rgba(52,211,153,.4) 80%,transparent 100%);transform:translateY(-50%);animation:flowPulse 3s ease-in-out infinite;pointer-events:none;z-index:0}
        @keyframes flowPulse{0%,100%{opacity:.3}50%{opacity:.8}}
        .lv-process{background:linear-gradient(135deg,#1A9BD7 0%,#0D6EA8 100%);padding:120px 48px;position:relative;overflow:hidden}
        .lv-process::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(255,255,255,.1) 0%,transparent 60%);pointer-events:none}
        .lv-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:32px;margin-top:64px;position:relative;z-index:1}
        .lv-connector{position:absolute;top:28px;left:10%;right:10%;height:1px;background:rgba(255,255,255,.22);overflow:hidden}
        .lv-connector-fill{height:100%;background:rgba(255,255,255,.6);width:0;transition:width 1.5s cubic-bezier(.22,1,.36,1)}
        .lv-connector.animated .lv-connector-fill{width:100%}
        .lv-step{text-align:center}
        .lv-step-circle{width:56px;height:56px;margin:0 auto 16px;border-radius:50%;border:1px solid rgba(255,255,255,.4) !important;background:rgba(255,255,255,.12) !important;backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-weight:500;font-size:18px;color:white !important;transition:all .3s;box-shadow:none !important}
        .lv-step:hover .lv-step-circle{background:rgba(255,255,255,.22) !important;border-color:rgba(255,255,255,.7) !important}
        .lv-step-lbl{color:white !important;font-weight:500;font-size:14px;margin-bottom:4px;font-family:'DM Sans',sans-serif}
        .lv-step-desc{color:rgba(255,255,255,.5) !important;font-size:12px;line-height:1.4;font-family:'DM Sans',sans-serif}
        .lv-features{background:linear-gradient(180deg,#0D1B2A 0%,#091624 100%);padding:120px 48px}
        footer.lv-footer{background:#080f17 !important;border-top:1px solid rgba(255,255,255,.06);padding:64px 48px 40px}
        .lv-footer-top{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px}
        .lv-footer-logo{display:flex;align-items:center;gap:10px;margin-bottom:14px;text-decoration:none}
        .lv-footer-tagline{color:rgba(255,255,255,.28);font-size:13px;line-height:1.6;margin-bottom:16px;font-family:'DM Sans',sans-serif}
        .lv-footer-col h4{color:rgba(255,255,255,.5) !important;font-size:11px !important;font-weight:600 !important;letter-spacing:.15em;text-transform:uppercase;margin-bottom:16px;font-family:'DM Sans',sans-serif !important}
        .lv-footer-col ul{list-style:none}
        .lv-footer-col li{margin-bottom:10px}
        .lv-footer-col a{color:rgba(255,255,255,.3) !important;font-size:13px;text-decoration:none;transition:color .2s;font-family:'DM Sans',sans-serif}
        .lv-footer-col a:hover{color:rgba(255,255,255,.7) !important}
        .lv-footer-bottom{max-width:1100px;margin:0 auto;padding-top:28px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .lv-footer-copy{color:rgba(255,255,255,.22);font-size:12px;font-family:'DM Sans',sans-serif}
        .lv-footer-enc{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.22);font-size:12px;font-family:'DM Sans',sans-serif}
        @media(max-width:900px){.lv-grid3{grid-template-columns:1fr}.lv-steps{grid-template-columns:repeat(2,1fr)}.lv-numbers-inner{grid-template-columns:repeat(2,1fr)}.lv-footer-top{grid-template-columns:1fr 1fr}}
        @media(max-width:600px){#lv-nav{padding:16px 24px}.lv-section,.lv-process,.lv-features{padding:80px 24px}.lv-numbers{padding:60px 24px}}
      `}</style>

      <div id="lv-root">

        {/* NAV */}
        <header id="lv-nav">
          <a href="#" className="lv-logo">
            <div className="lv-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>LegacyVault</span>
          </a>
          <button className="lv-login" onClick={() => navigate('/auth')}>Log in</button>
        </header>

        {/* HERO */}
        <section className="lv-hero">
          <div className="lv-orb orb1" />
          <div className="lv-orb orb2" />
          <div className="lv-orb orb3" />
          <div className="lv-rays" />
          <div className="lv-hero-content">
            <div className="reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="lv-zk"><div className="lv-zk-dot" />Zero-Knowledge Encrypted</div>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.25s' }}>
              <h1 className="lv-h1">One app<br /><em>for your legacy.</em></h1>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.4s' }}>
              <p className="lv-hero-sub">Your documents, accounts and wishes — encrypted in your browser, automatically delivered to the people you trust when it matters most.</p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.55s' }}>
              <div className="lv-trust">
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>AES-256 Encrypted</div>
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>Zero-knowledge</div>
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>GDPR Compliant</div>
                <div className="lv-trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>No plaintext on server</div>
              </div>
            </div>
          </div>
          <div className="lv-scroll"><div className="lv-scroll-line" /><span>Scroll</span></div>
        </section>

        {/* NUMBERS */}
        <div className="lv-numbers">
          <div className="lv-numbers-inner">
            {[{n:256,s:'-bit',l:'AES Encryption'},{n:310000,s:'',l:'PBKDF2 Iterations'},{n:100,s:'%',l:'Client-side keys'},{n:0,s:'',l:'Server-side access to your data'}].map(({n,s,l},i)=>(
              <div key={l} className="lv-num-item reveal" style={{transitionDelay:`${i*0.1}s`}}>
                <div className="lv-num-val" data-count={n} data-suffix={s}>{n}{s}</div>
                <div className="lv-num-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECURITY */}
        <section className="lv-section" style={{background:'#0D1B2A'}}>
          <div className="lv-container">
            <div className="lv-centered reveal">
              <span className="lv-label">Security Architecture</span>
              <h2 className="lv-h2">Built so even we<br /><em>can't read your data.</em></h2>
              <p className="lv-body">Every piece of information is encrypted in your browser before it ever reaches our servers. We store only ciphertext.</p>
            </div>
            <div className="lv-grid3">
              {[
                {tag:'AES-256-GCM',ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,title:'Your key, your data',body:'Your encryption key is derived from your password using PBKDF2 with 310,000 iterations. It never leaves your device. We cannot derive it, reset it, or access it.',cls:''},
                {tag:'Zero-knowledge',ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,title:'Zero-knowledge architecture',body:'Our servers store only encrypted blobs. Our cloud provider, our team — nobody can read your documents, account credentials, or personal messages.',cls:'d1'},
                {tag:'Per-contact keys',ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,title:'Secure contact portals',body:'When your switch activates, each contact receives a unique token. Their portal decrypts locally in their browser — we never see the plaintext at any point.',cls:'d2'},
              ].map(({tag,ico,title,body,cls})=>(
                <div key={title} className={`lv-card reveal ${cls}`}>
                  <div className="lv-card-ico">{ico}</div>
                  <div className="lv-card-tag">{tag}</div>
                  <h3>{title}</h3><p>{body}</p>
                </div>
              ))}
            </div>
            <div className="lv-enc-flow reveal">
              <div className="lv-enc-line" />
              <div className="lv-enc-title">How your data is protected — end to end</div>
              <div className="lv-enc-steps">
                {[{cls:'white',v:'Your Password',s:'Never stored'},{cls:'amber',v:'Master Key',s:'PBKDF2 · 310k iter'},{cls:'blue',v:'Vault Key',s:'AES-256-GCM'},{cls:'green',v:'Ciphertext',s:'Stored on server'}].reduce((acc,node,i,arr)=>{
                  acc.push(<div key={node.v} className={`lv-enc-node ${node.cls}`}><div className="lv-enc-val">{node.v}</div><div className="lv-enc-sub">{node.s}</div></div>);
                  if(i<arr.length-1) acc.push(<div key={`arr${i}`} className="lv-enc-arrow">→</div>);
                  return acc;
                },[] as React.ReactNode[])}
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
              <p className="lv-body" style={{color:'rgba(255,255,255,.55)',margin:'0 auto'}}>Five steps. Configure once. Protected forever.</p>
            </div>
            <div className="lv-steps" id="stepsRow">
              <div className="lv-connector" id="stepConnector"><div className="lv-connector-fill" /></div>
              {[{n:'1',l:'Account',d:'Create your secure account'},{n:'2',l:'Contacts',d:'Add trusted people'},{n:'3',l:'Documents',d:'Upload important files'},{n:'4',l:'Configure',d:'Set your check-in schedule'},{n:'5',l:'Protected',d:'Your legacy is secured'}].map((s,i)=>(
                <div key={s.n} className={`lv-step reveal d${i+1}`}>
                  <div className="lv-step-circle">{s.n}</div>
                  <div className="lv-step-lbl">{s.l}</div>
                  <div className="lv-step-desc">{s.d}</div>
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
                {ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,icoCls:'red',title:"Dead Man's Switch",body:'If you stop checking in, your vault activates automatically after a configurable grace period. Nothing needs to be done by anyone.',cls:''},
                {ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,icoCls:'',title:'Encrypted Vault',body:'Store documents, passwords, bank details, and instructions. All encrypted client-side before it leaves your browser.',cls:'d1'},
                {ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,icoCls:'',title:'Trusted Contacts',body:"Assign exactly which contacts see which data. Each person gets their own private portal, locked with a unique access token.",cls:'d2'},
                {ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,icoCls:'',title:'Document Storage',body:'Upload wills, deeds, insurance policies, letters. Encrypted before upload. Signed download URLs expire in 60 seconds.',cls:'d1'},
                {ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,icoCls:'',title:'Digital Accounts',body:'Catalogue every online account with closure instructions. What to delete, transfer, or memorialize — all specified by you.',cls:'d2'},
                {ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,icoCls:'amber',title:'Security Questions',body:'Require contacts to answer a personal question before accessing their portal. Answers are SHA-256 hashed — never stored as plaintext.',cls:'d3'},
              ].map(({ico,icoCls,title,body,cls})=>(
                <div key={title} className={`lv-card reveal ${cls}`}>
                  <div className={`lv-card-ico ${icoCls}`}>{ico}</div>
                  <h3>{title}</h3><p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lv-footer">
          <div className="lv-footer-top">
            <div>
              <a href="#" className="lv-footer-logo">
                <div className="lv-logo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <span style={{fontSize:17,fontWeight:600,color:'white'}}>LegacyVault</span>
              </a>
              <p className="lv-footer-tagline">Secure your digital legacy.<br/>Protect your loved ones.</p>
              <div className="lv-zk" style={{fontSize:10,padding:'5px 12px'}}><div className="lv-zk-dot"/>Zero-Knowledge</div>
            </div>
            {[{t:'Product',l:['Features','Security','Pricing','FAQ']},{t:'Company',l:['About','Contact','Privacy','Terms']},{t:'Security',l:['Encryption','Zero-knowledge','Compliance','Bug bounty']}].map(({t,l})=>(
              <div key={t} className="lv-footer-col">
                <h4>{t}</h4>
                <ul>{l.map(x=><li key={x}><a href="#">{x}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="lv-footer-bottom">
            <span className="lv-footer-copy">© 2025 LegacyVault. All rights reserved.</span>
            <div className="lv-footer-enc">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              All data encrypted client-side. We cannot read your information.
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};

export default Index;
