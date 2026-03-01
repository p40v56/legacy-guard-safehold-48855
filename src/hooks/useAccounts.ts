
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccountsService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields, decryptFields } from '@/lib/crypto';

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
  credentials?: string;
  created_at: string;
  updated_at?: string;
}

// Fields that get encrypted before storage
const ENCRYPTED_FIELDS = ['account_name', 'username', 'credentials', 'website_url', 'notes', 'email', 'platform'];

export const useAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vaultKey, isUnlocked } = useEncryption();
  const [accounts, setAccounts] = useState<DigitalAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const data = await AccountsService.getAccounts(user.id);
      
      // Decrypt fields if vault is unlocked
      const transformedData: DigitalAccount[] = await Promise.all(data.map(async (account) => {
        let decrypted = account;
        if (vaultKey) {
          const decryptedValues = await decryptFields(account, ENCRYPTED_FIELDS, vaultKey);
          decrypted = { ...account, ...decryptedValues };
        }
        return {
          id: decrypted.id,
          platform: decrypted.platform || '',
          username: decrypted.username || undefined,
          email: decrypted.email || undefined,
          account_type: decrypted.account_type as AccountType,
          importance: decrypted.importance as ImportanceLevel,
          closure_action: decrypted.closure_action as ClosureAction,
          notes: decrypted.notes || undefined,
          credentials: decrypted.credentials || undefined,
          created_at: decrypted.created_at,
          updated_at: decrypted.updated_at || undefined,
        };
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
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    
    try {
      let accountData: any = {
        ...formData,
        account_name: formData.platform,
      };

      // Encrypt fields before sending to database
      if (vaultKey) {
        const fieldsToEncrypt: Record<string, string | null | undefined> = {
          account_name: formData.platform,
          username: formData.username,
          platform: formData.platform,
          email: formData.email,
          notes: formData.notes,
          credentials: formData.credentials,
        };
        const encrypted = await encryptFields(fieldsToEncrypt, vaultKey);
        accountData = { ...accountData, ...encrypted };
      }

      const newAccount = await AccountsService.createAccount(user.id, accountData);
      
      // Use original plaintext for local state
      const transformedAccount: DigitalAccount = {
        id: newAccount.id,
        platform: formData.platform,
        username: formData.username || undefined,
        email: formData.email || undefined,
        account_type: formData.account_type,
        importance: formData.importance,
        closure_action: formData.closure_action,
        notes: formData.notes || undefined,
        credentials: formData.credentials || undefined,
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
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    try {
      let accountData: any = {
        ...formData,
        account_name: formData.platform,
      };

      if (vaultKey) {
        const fieldsToEncrypt: Record<string, string | null | undefined> = {
          account_name: formData.platform,
          username: formData.username,
          platform: formData.platform,
          email: formData.email,
          notes: formData.notes,
          credentials: formData.credentials,
        };
        const encrypted = await encryptFields(fieldsToEncrypt, vaultKey);
        accountData = { ...accountData, ...encrypted };
      }

      const updatedAccount = await AccountsService.updateAccount(accountId, accountData);
      
      const transformedAccount: DigitalAccount = {
        id: updatedAccount.id,
        platform: formData.platform,
        username: formData.username || undefined,
        email: formData.email || undefined,
        account_type: formData.account_type,
        importance: formData.importance,
        closure_action: formData.closure_action,
        notes: formData.notes || undefined,
        credentials: formData.credentials || undefined,
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
  }, [user, vaultKey]);

  return {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
