
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type AccountType = 'email' | 'social' | 'financial' | 'work' | 'entertainment' | 'other';

interface DigitalAccount {
  id: string;
  account_name: string;
  platform: string;
  account_type: AccountType;
  email?: string;
  username?: string;
  website_url?: string;
  notes?: string;
  created_at: string;
}

export const useAccounts = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<DigitalAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      // Mock data - in a real app this would come from your backend
      const mockAccounts: DigitalAccount[] = [
        {
          id: '1',
          account_name: 'Personal Gmail',
          platform: 'Gmail',
          account_type: 'email',
          email: 'test@test.com',
          website_url: 'https://gmail.com',
          notes: 'Primary email account',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          account_name: 'Social Media',
          platform: 'Facebook',
          account_type: 'social',
          username: 'testuser',
          website_url: 'https://facebook.com',
          created_at: new Date().toISOString(),
        }
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (formData: Omit<DigitalAccount, 'id' | 'created_at'>) => {
    try {
      const newAccount: DigitalAccount = {
        ...formData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      setAccounts(prev => [...prev, newAccount]);
      
      toast({
        title: "Success",
        description: "Account added successfully",
      });
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const updateAccount = async (accountId: string, formData: Omit<DigitalAccount, 'id' | 'created_at'>) => {
    try {
      setAccounts(prev => prev.map(account => 
        account.id === accountId 
          ? { ...account, ...formData }
          : account
      ));
      
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
      setAccounts(prev => prev.filter(account => account.id !== accountId));
      
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
