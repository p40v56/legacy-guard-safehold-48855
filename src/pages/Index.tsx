import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  ArrowRight, 
  Check, 
  Timer, 
  Users, 
  FileText, 
  Lock, 
  Bell, 
  Heart, 
  Star, 
  ChevronDown,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const resetSteps = () => {
    setActiveStep(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0a2e] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-4 bg-violet-500/20 rounded-3xl blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const steps = [
    { num: '01', label: 'Account', description: 'Create your secure account' },
    { num: '02', label: 'Contacts', description: 'Add trusted people' },
    { num: '03', label: 'Documents', description: 'Upload important files' },
    { num: '04', label: 'Configure', description: 'Set check-in schedule' },
    { num: '05', label: 'Protected', description: 'Your legacy is secured' },
  ];

  const features = [
    {
      icon: Timer,
      title: "Smart Check-ins",
      description: "Automated verification system with customizable frequency. Miss a check-in? Your contacts are notified."
    },
    {
      icon: Users,
      title: "Trusted Network",
      description: "Define primary, secondary, and professional contacts with granular permissions for each."
    },
    {
      icon: FileText,
      title: "Secure Vault",
      description: "Bank-grade encryption for your documents. Only released to the right people at the right time."
    },
    {
      icon: Lock,
      title: "End-to-End Security",
      description: "Your data is encrypted at rest and in transit. Even we can't access your private documents."
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Multi-channel notifications via email, SMS, and push. Never miss an important check-in."
    },
    {
      icon: Heart,
      title: "Peace of Mind",
      description: "Know that your loved ones will have access to what they need, when they need it."
    }
  ];

  const testimonials = [
    {
      text: "LegacyVault gave me peace of mind knowing my family will have access to everything important if something happens to me.",
      author: "Sarah M.",
      role: "Small Business Owner",
      rating: 5
    },
    {
      text: "The check-in system is brilliant. Simple but effective. I've recommended it to everyone in my family.",
      author: "James T.",
      role: "Software Engineer",
      rating: 5
    },
    {
      text: "Finally, a solution that handles digital legacy properly. The interface is beautiful and intuitive.",
      author: "Maria L.",
      role: "Financial Advisor",
      rating: 5
    },
    {
      text: "Set it up in 10 minutes. Now I never worry about my family being locked out of important accounts.",
      author: "David K.",
      role: "Retired Teacher",
      rating: 5
    }
  ];

  const unifyFeatures = [
    {
      title: "All contacts",
      subtitle: "One Place",
      description: "Manage all your trusted contacts in a single dashboard"
    },
    {
      title: "Add or share",
      subtitle: "in a few taps",
      description: "Easily add documents or share access with your contacts"
    },
    {
      title: "Multiple check-in",
      subtitle: "methods",
      description: "Email, SMS, app notification, or manual confirmation"
    },
    {
      title: "Fast and secure",
      subtitle: "transactions",
      description: "Bank-grade encryption for all your sensitive data"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f0518] overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <Shield className="w-9 h-9 text-white transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-violet-500/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">LegacyVault</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors text-sm font-medium">How it works</a>
            <a href="#testimonials" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Testimonials</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-5 font-medium"
              onClick={handleLogin}
            >
              Log in
            </Button>
            <Button 
              className="bg-white text-violet-900 hover:bg-white/90 rounded-full px-6 font-semibold shadow-lg shadow-violet-500/20"
              onClick={handleGetStarted}
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-32 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
        </div>

        {/* 3D Shield Stack */}
        <div className="absolute top-1/4 right-[10%] lg:right-[15%] transform pointer-events-none hidden lg:block">
          <div className="shield-stack-container">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="shield-layer"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  transform: `translate(${i * 15}px, ${-i * 15}px) scale(${1 - i * 0.1})`,
                  opacity: 1 - i * 0.25
                }}
              >
                <div className="shield-icon-wrapper">
                  <Shield className="w-16 h-16 text-white/80" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.1] mb-8 animate-fade-in-up">
            One app
            <br />
            <span className="italic font-light text-white/90">for your legacy</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-12 animate-fade-in-up animation-delay-200">
            Secure your digital legacy. Protect your loved ones with an intelligent dead man's switch that ensures they receive what matters most.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="group cta-button-primary text-white rounded-full px-10 py-7 text-lg font-semibold border-0"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-white/50 text-sm">
            <span>Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Unify Section */}
      <section id="features" className="dark-section py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6">
              Unify your legacy
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Everything your loved ones need, protected and ready when they need it most.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {['Add', 'Share', 'Protect', 'Notify'].map((item, i) => (
              <div 
                key={i}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all cursor-pointer
                  ${i === 0 ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'}`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-violet-500/30 group-hover:to-purple-500/20 transition-all">
                  <feature.icon className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Unify Features List */}
          <div className="mt-20 grid md:grid-cols-2 gap-6">
            {unifyFeatures.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{item.title} <span className="text-white/50">{item.subtitle}</span></h4>
                  <p className="text-white/40 text-sm mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="hero-gradient py-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-white/40 text-sm uppercase tracking-[0.2em] font-medium">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mt-4">
              fast & secure
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-2">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`step-item-new text-center relative ${index === activeStep ? 'active' : ''}`}
              >
                {index < steps.length - 1 && (
                  <div className="step-connector hidden md:block" />
                )}
                <span className="text-violet-400/60 text-sm font-medium mb-3 block">{step.num}</span>
                <div className={`step-circle mx-auto mb-4 ${index === activeStep ? 'active' : ''}`}>
                  <Check className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium block">{step.label}</span>
                <span className="text-white/40 text-xs mt-1 block hidden md:block">{step.description}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline"
              className="rounded-full px-6 py-2 text-white/70 border-white/20 hover:bg-white/10 hover:text-white bg-transparent"
              onClick={resetSteps}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
                All your digital legacy,
                <br />
                <span className="text-violet-600">in one place.</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Join thousands of users who trust LegacyVault to protect their most important digital assets and ensure their loved ones are taken care of.
              </p>
              <div className="space-y-4">
                {[
                  'Bank-grade encryption for all documents',
                  'Customizable check-in frequencies',
                  'Multi-tier contact system',
                  'Secure document sharing'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="mt-8 bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8"
              >
                Start protecting now
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </div>
            
            {/* App Preview Card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-3xl p-8 lg:p-12">
                <div className="bg-white rounded-2xl shadow-xl shadow-violet-500/10 p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Check-in Required</div>
                      <div className="text-sm text-gray-500">Due in 3 days</div>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">Trusted Contacts</span>
                      </div>
                      <span className="text-violet-600 font-medium">3 active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">Documents</span>
                      </div>
                      <span className="text-violet-600 font-medium">12 secured</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">Vault Status</span>
                      </div>
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Protected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-violet-200/50 rounded-full blur-2xl" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-200/50 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="dark-section py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Hear it from our clients
            </h2>
            <p className="text-white/50 text-lg">
              Join thousands who've secured their digital legacy
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-violet-400 text-sm font-medium">Recommended</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-violet-400 text-violet-400" />
                    ))}
                  </div>
                </div>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-medium">{testimonial.author}</div>
                    <div className="text-white/40 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="hero-gradient py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6">
            1 million users,
            <br />
            <span className="text-white/80">plus you.</span>
          </h2>
          <p className="text-white/60 text-lg mb-10">
            It only takes a few seconds to get started.
          </p>
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="group bg-white text-violet-900 hover:bg-white/95 rounded-full px-10 py-7 text-lg font-semibold shadow-xl shadow-violet-500/20"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0310] py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-violet-400" />
                <span className="text-xl font-semibold text-white">LegacyVault</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Secure your digital legacy and protect your loved ones with intelligent automation.
              </p>
            </div>
            
            {[
              { title: 'Get Started', links: [{ label: 'Sign up', action: handleGetStarted }, { label: 'Login', action: handleLogin }, { label: 'Pricing', href: '#' }] },
              { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Security', href: '#' }, { label: 'FAQ', href: '#' }] },
              { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Privacy', href: '#' }] }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="text-white font-medium mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      {link.action ? (
                        <button 
                          onClick={link.action}
                          className="text-white/40 hover:text-white/70 transition-colors text-sm"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a href={link.href} className="text-white/40 hover:text-white/70 transition-colors text-sm">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              © 2024 LegacyVault. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">Terms</a>
              <a href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">Privacy</a>
              <a href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="floating-nav-new px-2 py-2 flex items-center gap-1">
          <Button 
            variant="ghost" 
            className="rounded-full px-5 py-2 text-violet-900 bg-violet-100 hover:bg-violet-200 font-medium"
          >
            <Shield className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-full px-5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
            onClick={handleGetStarted}
          >
            Features
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-full px-5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
          >
            Security
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-full px-5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
          >
            About
          </Button>
        </div>
      </nav>

      {/* Support button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          className="rounded-full bg-white shadow-lg shadow-violet-500/20 hover:shadow-xl text-gray-700 hover:text-gray-900 px-5 border-0"
        >
          💬 Support
        </Button>
      </div>
    </div>
  );
};

export default Index;
