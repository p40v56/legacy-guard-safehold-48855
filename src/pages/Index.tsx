
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Users, FileText, Key, Bell, ArrowRight, Sparkles, Star } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';

const Index = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };
  
  const handleSignIn = () => {
    navigate('/auth');
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Clock,
      title: "Dead Man's Switch",
      description: "Automated check-in system with customizable frequency and emergency protocols",
      gradient: "from-emerald-500 to-teal-500",
      delay: "0ms"
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "End-to-end encryption and zero-knowledge architecture protect your digital legacy",
      gradient: "from-blue-500 to-cyan-500",
      delay: "100ms"
    },
    {
      icon: Key,
      title: "Digital Asset Management",
      description: "Securely store and organize all your digital accounts, passwords, and access codes",
      gradient: "from-purple-500 to-pink-500",
      delay: "200ms"
    },
    {
      icon: Users,
      title: "Contact Hierarchy",
      description: "Define primary, secondary, and professional contacts with granular permissions",
      gradient: "from-orange-500 to-red-500",
      delay: "300ms"
    },
    {
      icon: FileText,
      title: "Automated Documents",
      description: "Generate legal documents and closure letters automatically when needed",
      gradient: "from-indigo-500 to-purple-500",
      delay: "400ms"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Multi-channel alerts ensure your system stays active and your contacts stay informed",
      gradient: "from-green-500 to-emerald-500",
      delay: "500ms"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900"></div>
      
      {/* Animated Mesh Background */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
        }}
      ></div>
      
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-sm"></div>
          </div>
        ))}
      </div>

      <Navigation onSignIn={handleSignIn} />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10" />
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        ></div>

        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
              <Badge className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-emerald-400/30 text-emerald-100 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Next-Gen Digital Estate Planning
              </Badge>
            </div>

            {/* Main Heading with Gradient Animation */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight animate-slide-up">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent bg-300% animate-gradient">
                Secure Your
              </span>
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent bg-300% animate-gradient-reverse">
                Digital Legacy
              </span>
            </h1>

            {/* Subtitle with Typewriter Effect */}
            <p className="text-xl md:text-2xl mb-12 text-blue-100/90 max-w-4xl mx-auto leading-relaxed animate-fade-in-delayed">
              Protect your loved ones with an intelligent dead man's switch system that automatically manages your digital assets when you can't.
            </p>

            {/* CTA Buttons with Hover Effects */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="group relative px-8 py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-0 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 animate-bounce-in"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Legacy Plan
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="group px-8 py-4 text-lg font-semibold rounded-2xl border-2 border-blue-400/30 text-blue-100 bg-slate-900/50 backdrop-blur-sm hover:bg-blue-500/10 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 animate-bounce-in-delayed"
              >
                <span className="flex items-center gap-2">
                  Watch Demo
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </span>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center items-center gap-8 text-sm text-slate-400 animate-fade-in-slow">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>Enterprise Grade</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>GDPR Compliant</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <span>Zero Knowledge</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid with Stagger Animation */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Complete Digital Estate Planning
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto leading-relaxed">
              Everything you need to ensure your digital life is properly managed and transferred
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group relative bg-slate-800/30 border-slate-700/50 backdrop-blur-xl hover:bg-slate-700/40 transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 animate-slide-up-stagger overflow-hidden"
                  style={{ animationDelay: feature.delay }}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`}></div>
                  
                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-lg">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-700`}></div>
                  </div>
                  
                  <CardHeader className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-blue-100 transition-all duration-500">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-blue-200/80 text-base leading-relaxed group-hover:text-blue-100/90 transition-colors duration-500">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section with Parallax */}
      <section 
        className="py-32 relative"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-white mb-16 animate-fade-in">Built for Security & Trust</h3>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: "GDPR Compliant", desc: "Full compliance with European privacy regulations", color: "blue" },
              { icon: Key, title: "Zero-Knowledge", desc: "We can't access your data, even if we wanted to", color: "emerald" },
              { icon: FileText, title: "Legal Framework", desc: "Designed for French digital death law compliance", color: "purple" }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="group text-center animate-slide-up" style={{ animationDelay: `${index * 200}ms` }}>
                  <div className={`w-24 h-24 bg-${item.color}-600/20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-${item.color}-500/30`}>
                    <Icon className={`w-12 h-12 text-${item.color}-400 transition-transform duration-500 group-hover:scale-110`} />
                  </div>
                  <h4 className="text-2xl font-semibold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-blue-100 transition-all duration-500">
                    {item.title}
                  </h4>
                  <p className="text-blue-200/80 leading-relaxed group-hover:text-blue-100/90 transition-colors duration-500">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA with Animated Background */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent animate-pulse"></div>
        
        <div className="container mx-auto px-4 text-center relative">
          <h3 className="text-5xl font-bold text-white mb-8 animate-fade-in">
            Don't Leave Your Digital Life to Chance
          </h3>
          <p className="text-xl text-blue-100/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-delayed">
            Start building your digital legacy plan today. Your future self and loved ones will thank you.
          </p>
          
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="group relative px-12 py-6 text-xl font-semibold rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-0 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl hover:shadow-emerald-500/30 animate-bounce-in"
          >
            <span className="relative z-10 flex items-center gap-3">
              Begin Your Digital Legacy
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl scale-110"></div>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
