
import { UserSettings, DashboardStats, User, MockAuthResponse } from '@/types/common';

export class MockDataService {
  private static readonly MOCK_USER: User = {
    id: 'test-user-id',
    email: 'test@test.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    }
  };

  private static readonly MOCK_SETTINGS: UserSettings = {
    check_in_frequency: 'weekly',
    grace_period_hours: 72,
    is_active: true,
    last_check_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    next_check_in_due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline_mode: 'frequency',
    custom_deadline: null,
  };

  static async getUserSettings(): Promise<UserSettings> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...this.MOCK_SETTINGS };
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      contactsCount: 3,
      accountsCount: 8,
      documentsCount: 5,
      userSettings: { ...this.MOCK_SETTINGS }
    };
  }

  static async signIn(email: string, password: string): Promise<MockAuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === 'test@test.com' && password === '123456789') {
      localStorage.setItem('mock_user', JSON.stringify(this.MOCK_USER));
      return { user: this.MOCK_USER, error: null };
    } else {
      return { user: null, error: { message: 'Invalid email or password' } };
    }
  }

  static async signUp(email: string, password: string, firstName: string, lastName: string): Promise<MockAuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    };
    
    localStorage.setItem('mock_user', JSON.stringify(newUser));
    return { user: newUser, error: null };
  }

  static getCurrentUser(): User | null {
    const storedUser = localStorage.getItem('mock_user');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  static signOut(): void {
    localStorage.removeItem('mock_user');
  }
}
