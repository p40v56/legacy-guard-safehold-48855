
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [deactivated, setDeactivated] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!user) { setCheckingProfile(false); return; }
    const checkProfile = async () => {
      try {
        const { data } = await supabase.from('profiles').select('deactivated').eq('user_id', user.id).single();
        if (data?.deactivated) setDeactivated(true);
      } catch { /* ignore */ }
      setCheckingProfile(false);
    };
    checkProfile();
  }, [user]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (deactivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <ShieldX className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Account Deactivated</h1>
          <p className="text-muted-foreground mb-6">
            Your account has been deactivated by an administrator. If you believe this is an error, please contact support@legacyvault.app.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
