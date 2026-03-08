import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/contexts/EncryptionContext';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Shield, Mail, Lock, ArrowLeft, AlertTriangle, Smartphone } from 'lucide-react';

const getPasswordStrength = (password: string): { label: string; color: string; width: string; score: number } => {
  if (password.length === 0) return { label: '', color: '', width: '0%', score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-destructive', width: '20%', score };
  if (score === 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%', score };
  if (score === 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%', score };
  if (score === 4) return { label: 'Strong', color: 'bg-primary', width: '80%', score };
  return { label: 'Very Strong', color: 'bg-success', width: '100%', score };
};

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
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
  const [searchParams] = useSearchParams();

  // Signup state
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup') setMode('signup');
  }, []);

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
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser) {
        // Check if MFA is required
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactor = factorsData?.totp?.find(f => f.status === 'verified');

        if (verifiedFactor) {
          // MFA is enabled — challenge it
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: verifiedFactor.id,
          });
          if (challengeError) throw challengeError;

          setMfaFactorId(verifiedFactor.id);
          setMfaChallengeId(challengeData.id);
          setMfaRequired(true);
          setLoading(false);
          return; // Stop here — wait for MFA code input
        }

        // No MFA — proceed normally with vault unlock
        const unlocked = await unlock(formData.password, signedInUser.id);
        if (!unlocked) {
          await setupNewUser(formData.password, signedInUser.id);
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      const planParam = searchParams.get('plan');
      if (planParam === 'essential' || planParam === 'family') {
        navigate(`/settings?tab=account&checkout=${planParam}`);
      } else {
        navigate('/dashboard');
      }
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

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || !mfaChallengeId || mfaCode.length !== 6) return;
    setMfaLoading(true);
    setMfaError(null);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });
      if (error) {
        setMfaError('Incorrect code. Please try again.');
        setMfaCode('');
        return;
      }

      // MFA verified — proceed with vault unlock
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (verifiedUser) {
        const unlocked = await unlock(formData.password, verifiedUser.id);
        if (!unlocked) {
          await setupNewUser(formData.password, verifiedUser.id);
        }
      }
      toast({ title: 'Welcome back!', description: 'You have been signed in successfully.' });

      const planParam = searchParams.get('plan');
      if (planParam === 'essential' || planParam === 'family') {
        navigate(`/settings?tab=account&checkout=${planParam}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setMfaError(error.message || 'Verification failed. Please try again.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!validateEmail(signupData.email)) newErrors.email = 'Please enter a valid email address';
    if (signupData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (signupData.password !== signupData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (getPasswordStrength(signupData.password).score < 2) newErrors.password = 'Password is too weak. Use a mix of letters, numbers, and symbols.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSignupLoading(true);
    setErrors({});
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      });
      if (error) throw error;

      // If email confirmation is disabled, user is logged in immediately
      if (data.session) {
        await setupNewUser(signupData.password, data.user!.id);
        toast({ title: 'Account created!', description: 'Welcome to LegacyVault.' });
        navigate('/dashboard');
      } else {
        // Email confirmation required
        setSignupComplete(true);
      }
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } finally {
      setSignupLoading(false);
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

  const signupStrength = getPasswordStrength(signupData.password);

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
            {mfaRequired ? (
              <form onSubmit={handleMfaVerify} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Smartphone className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-medium text-card-foreground">
                    Two-factor verification
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={mfaCode}
                    onChange={e => {
                      setMfaCode(e.target.value.replace(/\D/g, ''));
                      setMfaError(null);
                    }}
                    placeholder="000000"
                    autoFocus
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] h-16 rounded-2xl bg-muted/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  {mfaError && (
                    <p className="text-sm text-destructive text-center">{mfaError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={mfaCode.length !== 6 || mfaLoading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify'}
                </Button>

                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setMfaRequired(false);
                    setMfaCode('');
                    setMfaError(null);
                    setFormData({ email: '', password: '' });
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to sign in
                </button>
              </form>
            ) : (
            <>
            {(mode === 'signin' || mode === 'signup') && !signupComplete && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-medium text-card-foreground mb-2">
                    Welcome to LegacyVault
                  </h1>
                  <p className="text-muted-foreground">
                    {mode === 'signin' ? 'Sign in to your account' : 'Create your secure account'}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 mb-6">
                  <button
                    onClick={() => { setMode('signin'); setErrors({}); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'signin' ? 'bg-card text-card-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMode('signup'); setErrors({}); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'signup' ? 'bg-card text-card-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Create Account
                  </button>
                </div>
              </>
            )}

            {mode === 'signin' && (
              <>
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

            {mode === 'signup' && !signupComplete && (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-card-foreground font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => { setSignupData(d => ({ ...d, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                      className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={signupData.password}
                      onChange={(e) => { setSignupData(d => ({ ...d, password: e.target.value })); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                      className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>
                  {signupData.password.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${signupStrength.color}`} style={{ width: signupStrength.width }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{signupStrength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your password is your encryption key. If you forget it, your data cannot be recovered by anyone — including us. Store it somewhere safe.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => { setSignupData(d => ({ ...d, confirmPassword: e.target.value })); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' })); }}
                      className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                >
                  {signupLoading && <LoadingSpinner size="sm" className="mr-2" />}
                  Create Account
                </Button>
              </form>
            )}

            {mode === 'signup' && signupComplete && (
              <div className="text-center space-y-4 py-4">
                <Mail className="w-12 h-12 text-primary mx-auto" />
                <h2 className="text-xl font-medium text-card-foreground">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                  We've sent a confirmation link to <strong>{signupData.email}</strong>.
                  Click the link to activate your account.
                </p>
                <p className="text-sm text-muted-foreground">
                  Didn't receive it? Check your spam folder or{' '}
                  <button
                    onClick={() => setSignupComplete(false)}
                    className="text-primary hover:underline"
                  >
                    try again
                  </button>.
                </p>
              </div>
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
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
