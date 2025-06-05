import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Users, FileText, Key, Bell } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import Navigation from '@/components/layout/Navigation';
const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuth(true);
  };
  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  // Show loading state while checking auth
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>;
  }
  const features = [{
    icon: Clock,
    title: "Dead Man's Switch",
    description: "Automated check-in system with customizable frequency and emergency protocols"
  }, {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "End-to-end encryption and zero-knowledge architecture protect your digital legacy"
  }, {
    icon: Key,
    title: "Digital Asset Management",
    description: "Securely store and organize all your digital accounts, passwords, and access codes"
  }, {
    icon: Users,
    title: "Contact Hierarchy",
    description: "Define primary, secondary, and professional contacts with granular permissions"
  }, {
    icon: FileText,
    title: "Automated Documents",
    description: "Generate legal documents and closure letters automatically when needed"
  }, {
    icon: Bell,
    title: "Smart Notifications",
    description: "Multi-channel alerts ensure your system stays active and your contacts stay informed"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation onSignIn={handleSignIn} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20" />
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Badge className="mb-6 bg-blue-600/20 text-blue-100 border-blue-400/30">
              🔒 Bank-Grade Security
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Secure Your
              <span className="block text-emerald-400">Digital Legacy</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Protect your loved ones with an intelligent dead man's switch system that automatically manages your digital assets when you can't.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                Start Your Legacy Plan
              </Button>
              
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Complete Digital Estate Planning
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Everything you need to ensure your digital life is properly managed and transferred
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 transition-all duration-300 transform hover:scale-105">
                  <CardHeader>
                    <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-blue-200 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-12">Built for Security & Trust</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">GDPR Compliant</h4>
              <p className="text-blue-200">Full compliance with European privacy regulations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Zero-Knowledge</h4>
              <p className="text-blue-200">We can't access your data, even if we wanted to</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Legal Framework</h4>
              <p className="text-blue-200">Designed for French digital death law compliance</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Don't Leave Your Digital Life to Chance
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start building your digital legacy plan today. Your future self and loved ones will thank you.
          </p>
          
        </div>
      </section>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} mode={authMode} onModeChange={setAuthMode} />
    </div>;
};
export default Index;