
import { useState, useEffect, createContext, useContext } from 'react';
import { User, MockAuthResponse } from '@/types/common';
import { MockDataService } from '@/services/mockDataService';

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  loading: boolean;
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
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = MockDataService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setSession({ user: currentUser });
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    MockDataService.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const mockSignIn = async (email: string, password: string): Promise<MockAuthResponse> => {
  return MockDataService.signIn(email, password);
};

export const mockSignUp = async (email: string, password: string, firstName: string, lastName: string): Promise<MockAuthResponse> => {
  return MockDataService.signUp(email, password, firstName, lastName);
};
