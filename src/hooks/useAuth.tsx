
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDeactivated: boolean;
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

  const checkDeactivated = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('deactivated')
        .eq('user_id', userId)
        .single();
      setIsDeactivated(data?.deactivated ?? false);
    } catch {
      setIsDeactivated(false);
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
        } else {
          setIsDeactivated(false);
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
  };

  const value = {
    user,
    session,
    loading,
    isDeactivated,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
