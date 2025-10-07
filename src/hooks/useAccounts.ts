
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccountsService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

type AccountType = 'social' | 'financial' | 'email' | 'cloud' | 'subscription' | 'other';
type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
type ClosureAction = 'delete' | 'memorialize' | 'transfer' | 'download';

interface DigitalAccount {
  id: string;
  platform: string;
  username?: string;
  email?: string;
  account_type: AccountType;
  importance: ImportanceLevel;
  closure_action: ClosureAction;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export const useAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<DigitalAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const data = await AccountsService.getAccounts(user.id);
      // Transform the data to match our interface
      const transformedData: DigitalAccount[] = data.map(account => ({
        id: account.id,
        platform: account.platform,
        username: account.username || undefined,
        email: account.email || undefined,
        account_type: account.account_type as AccountType,
        importance: account.importance as ImportanceLevel,
        closure_action: account.closure_action as ClosureAction,
        notes: account.notes || undefined,
        created_at: account.created_at,
        updated_at: account.updated_at || undefined,
      }));
      setAccounts(transformedData);
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

  const createAccount = async (formData: Omit<DigitalAccount, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      // Add account_name using platform as the name
      const accountData = {
        ...formData,
        account_name: formData.platform, // Database requires account_name (NOT NULL)
      };
      const newAccount = await AccountsService.createAccount(user.id, accountData);
      // Transform the returned data
      const transformedAccount: DigitalAccount = {
        id: newAccount.id,
        platform: newAccount.platform,
        username: newAccount.username || undefined,
        email: newAccount.email || undefined,
        account_type: newAccount.account_type as AccountType,
        importance: newAccount.importance as ImportanceLevel,
        closure_action: newAccount.closure_action as ClosureAction,
        notes: newAccount.notes || undefined,
        created_at: newAccount.created_at,
        updated_at: newAccount.updated_at || undefined,
      };
      setAccounts(prev => [...prev, transformedAccount]);
      
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

  const updateAccount = async (accountId: string, formData: Omit<DigitalAccount, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Add account_name using platform as the name
      const accountData = {
        ...formData,
        account_name: formData.platform, // Database requires account_name (NOT NULL)
      };
      const updatedAccount = await AccountsService.updateAccount(accountId, accountData);
      // Transform the returned data
      const transformedAccount: DigitalAccount = {
        id: updatedAccount.id,
        platform: updatedAccount.platform,
        username: updatedAccount.username || undefined,
        email: updatedAccount.email || undefined,
        account_type: updatedAccount.account_type as AccountType,
        importance: updatedAccount.importance as ImportanceLevel,
        closure_action: updatedAccount.closure_action as ClosureAction,
        notes: updatedAccount.notes || undefined,
        created_at: updatedAccount.created_at,
        updated_at: updatedAccount.updated_at || undefined,
      };
      setAccounts(prev => prev.map(account => 
        account.id === accountId ? transformedAccount : account
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
      await AccountsService.deleteAccount(accountId);
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
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  return {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
