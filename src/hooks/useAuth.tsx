
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDeactivated: boolean;
  mfaPending: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);

  const checkDeactivated = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('deactivated')
        .eq('user_id', userId)
        .maybeSingle();
      setIsDeactivated(data?.deactivated ?? false);
    } catch {
      setIsDeactivated(false);
    }
  };

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        setMfaPending(false);
        return;
      }
      // If user has MFA enrolled (nextLevel is aal2) but current session is only aal1
      // then MFA verification is still pending
      setMfaPending(data.currentLevel === 'aal1' && data.nextLevel === 'aal2');
    } catch {
      setMfaPending(false);
    }
  };

  useEffect(() => {
    let initialCheckDone = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkDeactivated(session.user.id);
          checkMfaStatus();
        } else {
          setIsDeactivated(false);
          setMfaPending(false);
        }
        initialCheckDone = true;
        setLoading(false);
      }
    );

    // THEN check for existing session — but skip if onAuthStateChange already fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialCheckDone) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkDeactivated(session.user.id);
          checkMfaStatus();
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsDeactivated(false);
    setMfaPending(false);
  };

  const value = {
    user,
    session,
    loading,
    isDeactivated,
    mfaPending,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
