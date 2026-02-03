import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Check, Timer, Users, FileText, Lock, Bell, Heart, Star, ChevronDown, Sparkles, RefreshCw, Home } from 'lucide-react';

const AppStoreBadge = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="6" fill="#000"/>
    <path d="M24.769 20.3c-.024-2.652 2.166-3.931 2.266-3.992-1.235-1.805-3.156-2.052-3.838-2.078-1.625-.168-3.187.969-4.012.969-.84 0-2.109-.951-3.477-.923-1.775.026-3.427 1.048-4.339 2.645-1.867 3.233-.476 7.998 1.319 10.615.893 1.28 1.943 2.711 3.31 2.66 1.337-.055 1.837-.855 3.45-.855 1.598 0 2.068.855 3.462.824 1.435-.023 2.342-1.288 3.205-2.58 1.024-1.47 1.437-2.916 1.458-2.99-.033-.013-2.78-1.066-2.804-4.245v-.05z" fill="#fff"/>
    <path d="M22.037 12.21c.725-.903 1.222-2.134 1.086-3.382-1.052.046-2.352.72-3.107 1.606-.67.785-1.27 2.066-1.115 3.27 1.18.09 2.39-.595 3.136-1.494z" fill="#fff"/>
    <text x="42" y="15" fill="#fff" fontSize="8" fontFamily="system-ui">Download on the</text>
    <text x="42" y="27" fill="#fff" fontSize="12" fontWeight="600" fontFamily="system-ui">App Store</text>
  </svg>
);

const GooglePlayBadge = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 135 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="135" height="40" rx="6" fill="#000"/>
    <path d="M10.434 7.538c-.29.307-.462.786-.462 1.408v22.108c0 .622.172 1.1.463 1.406l.074.072 12.386-12.387v-.29L10.51 7.467l-.075.071z" fill="url(#gp1)"/>
    <path d="M27.022 24.278l-4.127-4.133v-.29l4.127-4.133.093.054 4.893 2.779c1.397.793 1.397 2.092 0 2.886l-4.893 2.78-.093.057z" fill="url(#gp2)"/>
    <path d="M27.116 24.222l-4.22-4.222-12.46 12.461c.46.488 1.222.548 2.08.062l14.6-8.3" fill="url(#gp3)"/>
    <path d="M27.116 15.778l-14.6-8.3c-.858-.487-1.62-.427-2.08.061l12.46 12.461 4.22-4.222z" fill="url(#gp4)"/>
    <text x="47" y="14" fill="#fff" fontSize="7" fontFamily="system-ui">GET IT ON</text>
    <text x="47" y="27" fill="#fff" fontSize="13" fontWeight="500" fontFamily="system-ui">Google Play</text>
    <defs>
      <linearGradient id="gp1" x1="21.8" y1="8.7" x2="5" y2="25.5" gradientUnits="userSpaceOnUse"><stop stopColor="#00A0FF"/><stop offset="1" stopColor="#00E3FF"/></linearGradient>
      <linearGradient id="gp2" x1="33.8" y1="20" x2="9.6" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#FFE000"/><stop offset="1" stopColor="#FF9C00"/></linearGradient>
      <linearGradient id="gp3" x1="24.8" y1="22.3" x2="2" y2="45" gradientUnits="userSpaceOnUse"><stop stopColor="#FF3A44"/><stop offset="1" stopColor="#C31162"/></linearGradient>
      <linearGradient id="gp4" x1="7.3" y1=".2" x2="17.5" y2="10.3" gradientUnits="userSpaceOnUse"><stop stopColor="#32A071"/><stop offset="1" stopColor="#00F076"/></linearGradient>
    </defs>
  </svg>
);

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % 5), 2500);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => navigate('/auth');
  const handleLogin = () => navigate('/auth');
  const resetSteps = () => setActiveStep(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-sky-300 to-blue-300 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center animate-pulse">
          <Shield className="w-8 h-8 text-sky-600" />
        </div>
      </div>
    );
  }

  const steps = [
    { num: '01', label: 'Account' },
    { num: '02', label: 'Contacts' },
    { num: '03', label: 'Documents' },
    { num: '04', label: 'Configure' },
    { num: '05', label: 'Protected' },
  ];

  const features = [
    { icon: Timer, title: "Smart Check-ins", description: "Automated verification with customizable frequency." },
    { icon: Users, title: "Trusted Network", description: "Define contacts with granular permissions." },
    { icon: FileText, title: "Secure Vault", description: "Bank-grade encryption for your documents." },
    { icon: Lock, title: "End-to-End Security", description: "Your data is encrypted at rest and in transit." },
    { icon: Bell, title: "Smart Alerts", description: "Multi-channel notifications via email, SMS, and push." },
    { icon: Heart, title: "Peace of Mind", description: "Know your loved ones will have what they need." }
  ];

  const testimonials = [
    { text: "LegacyVault gave me peace of mind knowing my family will have access to everything important.", author: "Sarah M.", role: "Business Owner" },
    { text: "The check-in system is brilliant. Simple but effective.", author: "James T.", role: "Engineer" },
    { text: "Finally, a solution that handles digital legacy properly.", author: "Maria L.", role: "Financial Advisor" },
    { text: "Set it up in 10 minutes. Now I never worry.", author: "David K.", role: "Teacher" }
  ];

  return (
    <div className="min-h-screen bg-sky-50 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-9 h-9 text-white" />
            <span className="text-xl font-semibold text-white">LegacyVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10 rounded-full px-5" onClick={handleLogin}>Log in</Button>
            <Button className="bg-white text-sky-700 hover:bg-white/90 rounded-full px-6 font-semibold" onClick={handleGetStarted}>Sign up</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient-sky min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-32 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl" />
        </div>

        <div className="absolute top-1/4 right-[15%] hidden lg:block pointer-events-none">
          <div className="relative w-64 h-64">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="absolute inset-0 flex items-center justify-center animate-float" style={{ animationDelay: `${i * 0.2}s`, transform: `translate(${i * 12}px, ${-i * 12}px) scale(${1 - i * 0.1})`, opacity: 1 - i * 0.2 }}>
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8">
                  <Shield className="w-14 h-14 text-white/80" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`max-w-4xl mx-auto text-center relative z-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight mb-8">
            One app<br /><span className="italic font-light">for your legacy</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto mb-12">
            Secure your digital legacy. Protect your loved ones with an intelligent dead man's switch.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="group bg-white text-sky-700 hover:bg-white/95 rounded-full px-10 py-7 text-lg font-semibold shadow-xl">
            Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <div className="flex gap-4 justify-center mt-8">
            <a href="#" className="opacity-80 hover:opacity-100 transition-opacity"><AppStoreBadge className="h-10" /></a>
            <a href="#" className="opacity-80 hover:opacity-100 transition-opacity"><GooglePlayBadge className="h-10" /></a>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-white/60 text-sm flex flex-col items-center gap-2">
          <span>Scroll</span><ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="dark-section-sky py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">Unify your legacy</h2>
            <p className="text-white/50 text-lg">Everything your loved ones need, protected and ready.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="feature-card-sky group">
                <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sky-500/30 transition-all">
                  <f.icon className="w-7 h-7 text-sky-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-white/50">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="hero-gradient-sky py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-white/50 text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mt-4">fast & secure</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div key={i} className={`text-center relative ${i === activeStep ? 'scale-105' : ''} transition-transform`}>
                {i < 4 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-sky-400/50 to-sky-400/10" />}
                <span className="text-sky-300/60 text-sm">{step.num}</span>
                <div className={`w-14 h-14 mx-auto my-4 rounded-2xl flex items-center justify-center transition-all ${i === activeStep ? 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/50' : 'bg-white/10'}`}>
                  <Check className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium">{step.label}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" className="rounded-full px-6 text-white/70 border-white/20 hover:bg-white/10 bg-transparent" onClick={resetSteps}>
              <RefreshCw className="w-4 h-4 mr-2" />Restart
            </Button>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">All your digital legacy, <span className="text-primary">in one place.</span></h2>
            <p className="text-muted-foreground text-lg mb-8">Join thousands who trust LegacyVault to protect their digital assets.</p>
            <div className="space-y-4">
              {['Bank-grade encryption', 'Customizable check-ins', 'Multi-tier contacts', 'Secure sharing'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center"><Check className="w-4 h-4 text-primary" /></div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={handleGetStarted} className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
              Start protecting now <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <div className="glass rounded-3xl p-8">
              <div className="bg-card rounded-2xl shadow-xl p-6 space-y-4 border border-border">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                  <div><div className="font-semibold text-card-foreground">Check-in Required</div><div className="text-sm text-muted-foreground">Due in 3 days</div></div>
                </div>
                {[{ icon: Users, label: 'Trusted Contacts', value: '3 active' }, { icon: FileText, label: 'Documents', value: '12 secured' }, { icon: Lock, label: 'Vault Status', value: 'Protected', green: true }].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3"><item.icon className="w-5 h-5 text-muted-foreground" /><span className="text-card-foreground">{item.label}</span></div>
                    <span className={item.green ? 'text-success font-medium' : 'text-primary font-medium'}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="dark-section-sky py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">Hear it from our clients</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card-sky">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sky-400 text-sm font-medium">Recommended</span>
                  <div className="flex gap-0.5 ml-auto">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-sky-400 text-sky-400" />)}</div>
                </div>
                <p className="text-white/80 text-lg mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">{t.author.split(' ').map(n => n[0]).join('')}</div>
                  <div><div className="text-white font-medium">{t.author}</div><div className="text-white/40 text-sm">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="hero-gradient-sky py-32 px-6 relative">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">1 million users,<br /><span className="text-white/80">plus you.</span></h2>
          <p className="text-white/70 text-lg mb-10">It only takes a few seconds to get started.</p>
          <Button size="lg" onClick={handleGetStarted} className="group bg-white text-primary hover:bg-white/95 rounded-full px-10 py-7 text-lg font-semibold shadow-xl">
            Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4"><Shield className="w-8 h-8 text-primary" /><span className="text-xl font-semibold text-foreground">LegacyVault</span></div>
              <p className="text-muted-foreground text-sm">Secure your digital legacy and protect your loved ones.</p>
            </div>
            {[{ title: 'Get Started', links: ['Sign up', 'Login', 'Pricing'] }, { title: 'Product', links: ['Features', 'Security', 'FAQ'] }, { title: 'Company', links: ['About', 'Contact', 'Privacy'] }].map((s, i) => (
              <div key={i}><h4 className="text-foreground font-medium mb-4">{s.title}</h4><ul className="space-y-2">{s.links.map((l, j) => <li key={j}><a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{l}</a></li>)}</ul></div>
            ))}
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">© 2024 LegacyVault. All rights reserved.</p>
            <div className="flex gap-6">{['Terms', 'Privacy', 'Cookies'].map((l, i) => <a key={i} href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{l}</a>)}</div>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Nav - Jeton Style */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="floating-nav px-2 py-2 flex items-center gap-1">
          <a href="#" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-medium text-sm">
            <Home className="w-4 h-4" />Home
          </a>
          <a href="#features" className="px-5 py-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-sm transition-colors">Features</a>
          <a href="#how-it-works" className="px-5 py-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-sm transition-colors">Process</a>
          <a href="#testimonials" className="px-5 py-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-sm transition-colors">About</a>
        </div>
      </nav>
    </div>
  );
};

export default Index;
