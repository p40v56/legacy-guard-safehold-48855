import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Shield, Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
  if (password.length === 0) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-destructive', width: '20%' };
  if (score === 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (score === 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (score === 4) return { label: 'Strong', color: 'bg-primary', width: '80%' };
  return { label: 'Very Strong', color: 'bg-success', width: '100%' };
};

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryDetected, setRecoveryDetected] = useState(false);
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryDetected(true);
      }
    });

    // Timeout: if no recovery event after 3 seconds, show expired
    const timeout = setTimeout(() => {
      setRecoveryDetected((current) => {
        if (!current) setExpired(true);
        return current;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "Password updated", description: "Your password has been reset successfully." });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-xl font-semibold text-white">LegacyVault</span>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass-strong rounded-3xl p-8">
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <h1 className="text-2xl font-medium text-card-foreground">Password updated successfully</h1>
                <p className="text-muted-foreground">Redirecting to your dashboard…</p>
              </div>
            ) : expired ? (
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                <h1 className="text-2xl font-medium text-card-foreground">Invalid or expired reset link</h1>
                <p className="text-muted-foreground">This password reset link is no longer valid. Please request a new one.</p>
                <Link to="/auth">
                  <Button variant="outline" className="rounded-2xl mt-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : !recoveryDetected ? (
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="text-muted-foreground">Verifying reset link…</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-medium text-card-foreground mb-2">Set New Password</h1>
                  <p className="text-muted-foreground">Choose a strong password for your vault</p>
                </div>

                <form onSubmit={handleReset} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-card-foreground font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="At least 8 characters"
                        required
                        autoFocus
                      />
                    </div>
                    {newPassword.length > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-card-foreground font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                      <p className="text-sm text-destructive">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                  >
                    {loading && <LoadingSpinner size="sm" className="mr-2" />}
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
