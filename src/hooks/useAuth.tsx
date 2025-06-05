
import { useState, useEffect, createContext, useContext } from 'react';

// Mock user type to replace Supabase User
interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface AuthContextType {
  user: MockUser | null;
  session: { user: MockUser } | null;
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

// Mock user data
const MOCK_USER: MockUser = {
  id: 'test-user-id',
  email: 'test@test.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'User'
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [session, setSession] = useState<{ user: MockUser } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const storedUser = localStorage.getItem('mock_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setSession({ user: userData });
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('mock_user');
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

// Mock sign in function for the auth modal
export const mockSignIn = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (email === 'test@test.com' && password === '123456789') {
    localStorage.setItem('mock_user', JSON.stringify(MOCK_USER));
    return { user: MOCK_USER, error: null };
  } else {
    return { user: null, error: { message: 'Invalid email or password' } };
  }
};

// Mock sign up function
export const mockSignUp = async (email: string, password: string, firstName: string, lastName: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newUser: MockUser = {
    id: `user-${Date.now()}`,
    email,
    user_metadata: {
      first_name: firstName,
      last_name: lastName
    }
  };
  
  localStorage.setItem('mock_user', JSON.stringify(newUser));
  return { user: newUser, error: null };
};
