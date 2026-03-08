import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Shield, Lock, ArrowLeft, AlertTriangle } from 'lucide-react';

const Confirm = () => {
  const [state, setState] = useState<'loading' | 'setup' | 'expired'>('loading');
  const [password, setPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setupNewUser } = useEncryption();

  useEffect(() => {
    const checkSession = async () => {
      // Listen for auth state change from the confirmation link
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
          const uid = session.user.id;
          setUserId(uid);

          // Check if vault already exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('encrypted_vault_key')
            .eq('user_id', uid)
            .single();

          if (profile?.encrypted_vault_key) {
            // Already set up, go to dashboard
            navigate('/dashboard');
          } else {
            setState('setup');
          }
        }
      });

      // Also check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const uid = session.user.id;
        setUserId(uid);

        const { data: profile } = await supabase
          .from('profiles')
          .select('encrypted_vault_key')
          .eq('user_id', uid)
          .single();

        if (profile?.encrypted_vault_key) {
          navigate('/dashboard');
        } else {
          setState('setup');
        }
      }

      // Timeout after 5 seconds
      const timeout = setTimeout(() => {
        setState(prev => prev === 'loading' ? 'expired' : prev);
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    };

    checkSession();
  }, [navigate]);

  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) return;
    setSetupLoading(true);
    try {
      const success = await setupNewUser(password, userId);
      if (!success) throw new Error('Vault setup failed');
      toast({ title: 'Vault created!', description: 'Your secure vault is ready.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to set up vault', variant: 'destructive' });
    } finally {
      setSetupLoading(false);
    }
  };

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
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass-strong rounded-3xl p-8">
            {state === 'loading' && (
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="text-muted-foreground">Confirming your email…</p>
              </div>
            )}

            {state === 'expired' && (
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                <h1 className="text-2xl font-medium text-card-foreground">Confirmation link may have expired</h1>
                <p className="text-muted-foreground">Please sign in to continue.</p>
                <Link to="/auth">
                  <Button variant="outline" className="rounded-2xl mt-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            )}

            {state === 'setup' && (
              <>
                <div className="text-center mb-8">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h1 className="text-2xl font-medium text-card-foreground mb-2">Set up your secure vault</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your password to initialise your encrypted vault. This only happens once.
                  </p>
                </div>

                <form onSubmit={handleSetupVault} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-card-foreground font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="Enter the password you signed up with"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={setupLoading || !password}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                  >
                    {setupLoading && <LoadingSpinner size="sm" className="mr-2" />}
                    Set up vault →
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

export default Confirm;
