import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/contexts/EncryptionContext';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Shield, Mail, Lock, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unlock, setupNewUser } = useEncryption();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Unlock the encryption vault with the user's password
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const unlocked = await unlock(formData.password, user.id);
        if (!unlocked) {
          // First time after migration — setup encryption
          await setupNewUser(formData.password, user.id);
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-xl font-semibold text-white">LegacyVault</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Auth Card */}
          <div className="glass-strong rounded-3xl p-8">
            {mode === 'signin' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-medium text-card-foreground mb-2">
                    Welcome to LegacyVault
                  </h1>
                  <p className="text-muted-foreground">
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-card-foreground font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-card-foreground font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-primary hover:underline mt-1 text-right w-full block"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                  >
                    {loading && <LoadingSpinner size="sm" className="mr-2" />}
                    Sign In
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Secure your digital legacy with zero-knowledge encryption.
                  </p>
                </div>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-medium text-card-foreground mb-2">
                    Reset Password
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your email to receive a reset link
                  </p>
                </div>

                {forgotSent ? (
                  <div className="space-y-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                      <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-card-foreground font-medium mb-1">Check your email</p>
                      <p className="text-sm text-muted-foreground">
                        We've sent a password reset link to <strong>{forgotEmail}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setForgotSent(false); setForgotEmail(''); }}
                      className="text-sm text-primary hover:underline w-full text-center block"
                    >
                      ← Back to sign in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-card-foreground font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                          placeholder="Enter your email"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                    >
                      {loading && <LoadingSpinner size="sm" className="mr-2" />}
                      Send reset link
                    </Button>

                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setForgotEmail(''); }}
                      className="text-sm text-primary hover:underline w-full text-center block"
                    >
                      ← Back to sign in
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
