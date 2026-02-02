import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Check, Timer, Users, FileText } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  }

  const steps = [
    { num: '01', label: 'Create Account' },
    { num: '02', label: 'Add Contacts' },
    { num: '03', label: 'Configure' },
    { num: '04', label: 'Stay Safe' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-xl font-semibold text-white">LegacyVault</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={handleLogin}
            >
              Log in
            </Button>
            <Button 
              className="bg-white text-primary hover:bg-white/90 rounded-full px-6"
              onClick={handleGetStarted}
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-32 relative">
        {/* 3D Stack Element */}
        <div className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-48 h-48 md:w-64 md:h-64 jeton-stack float-element opacity-80" />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white leading-tight mb-6">
            One app
            <br />
            <span className="italic font-light">for all needs</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto mb-12">
            Secure your digital legacy. Protect your loved ones with an intelligent dead man's switch system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="group bg-white text-primary hover:bg-white/95 rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
            Scroll
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-card-foreground mb-4">
              All your digital legacy,
              <br />
              <span className="text-primary">in one app.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of users who trust LegacyVault to protect their digital assets and loved ones.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Timer,
                title: "Dead Man's Switch",
                description: "Automated check-in system with customizable frequency and emergency protocols"
              },
              {
                icon: Users,
                title: "Trusted Contacts",
                description: "Define primary, secondary, and professional contacts with granular permissions"
              },
              {
                icon: FileText,
                title: "Legacy Documents",
                description: "Securely store and share important documents with your trusted contacts"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group p-8 rounded-3xl bg-muted/50 hover:bg-muted transition-all duration-300 interactive-card"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-medium text-card-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-white/60 text-sm uppercase tracking-wider">Simple</span>
            <h2 className="text-3xl md:text-4xl font-medium text-white mt-2">
              fast & safe
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="step-item text-center">
                <span className="step-number">{step.num}</span>
                <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto my-4 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-card-foreground mb-4">
            All your finances, in one app.
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join 1M+ happy users today.
          </p>
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-medium"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="floating-nav px-2 py-2 flex items-center gap-1">
          <Button 
            variant="ghost" 
            className="rounded-full px-4 py-2 text-card-foreground bg-primary/10"
          >
            <Shield className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-full px-4 py-2 text-muted-foreground hover:text-card-foreground hover:bg-muted"
            onClick={handleGetStarted}
          >
            Personal
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-full px-4 py-2 text-muted-foreground hover:text-card-foreground hover:bg-muted"
          >
            Features
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-full px-4 py-2 text-muted-foreground hover:text-card-foreground hover:bg-muted"
          >
            About
          </Button>
        </div>
      </nav>

      {/* Support button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          variant="outline" 
          className="rounded-full bg-white/95 border-none shadow-lg hover:shadow-xl text-card-foreground"
        >
          💬 Support
        </Button>
      </div>
    </div>
  );
};

export default Index;
