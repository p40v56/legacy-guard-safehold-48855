import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields, decryptFields } from '@/lib/crypto';
import { supabase } from '@/integrations/supabase/client';
import type { FinancialAsset, FinancialAssetInsert } from '@/types/financial';

const ENCRYPTED_FINANCIAL_FIELDS = ['name', 'institution', 'reference_number', 'notes', 'contact_name', 'contact_phone', 'contact_email'];

export const useFinancialAssets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vaultKey } = useEncryption();
  const [assets, setAssets] = useState<FinancialAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const decryptedAssets = await Promise.all((data || []).map(async (asset) => {
        if (vaultKey) {
          const decryptedValues = await decryptFields(asset, ENCRYPTED_FINANCIAL_FIELDS, vaultKey);
          return { ...asset, ...decryptedValues } as unknown as FinancialAsset;
        }
        return asset as unknown as FinancialAsset;
      }));

      setAssets(decryptedAssets);
    } catch (error) {
      console.error('Error fetching financial assets:', error);
      toast({ title: 'Error', description: 'Failed to load financial assets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async (assetData: FinancialAssetInsert) => {
    if (!user) return;
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    try {
      let dataToInsert: any = { ...assetData, user_id: user.id };

      if (vaultKey) {
        const fieldsToEncrypt: Record<string, string | null | undefined> = {
          name: assetData.name,
          institution: assetData.institution,
          reference_number: assetData.reference_number,
          notes: assetData.notes,
          contact_name: assetData.contact_name,
          contact_phone: assetData.contact_phone,
          contact_email: assetData.contact_email,
        };
        const encrypted = await encryptFields(fieldsToEncrypt, vaultKey);
        dataToInsert = { ...dataToInsert, ...encrypted };
      }

      const { data, error } = await supabase
        .from('financial_assets')
        .insert([dataToInsert])
        .select()
        .single();
      if (error) throw error;

      // Store plaintext locally
      const localAsset: FinancialAsset = {
        ...(data as unknown as FinancialAsset),
        name: assetData.name,
        institution: assetData.institution || null,
        reference_number: assetData.reference_number || null,
        notes: assetData.notes || null,
        contact_name: assetData.contact_name || null,
        contact_phone: assetData.contact_phone || null,
        contact_email: assetData.contact_email || null,
      };
      setAssets(prev => [localAsset, ...prev]);
      toast({ title: 'Success', description: 'Financial asset added successfully' });
      return data;
    } catch (error) {
      console.error('Error creating financial asset:', error);
      toast({ title: 'Error', description: 'Failed to save financial asset', variant: 'destructive' });
    }
  };

  const updateAsset = async (id: string, assetData: Partial<FinancialAssetInsert>) => {
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    try {
      let dataToUpdate: any = { ...assetData };

      if (vaultKey) {
        const fieldsToEncrypt: Record<string, string | null | undefined> = {};
        for (const field of ENCRYPTED_FINANCIAL_FIELDS) {
          if (field in assetData) {
            fieldsToEncrypt[field] = (assetData as any)[field];
          }
        }
        if (Object.keys(fieldsToEncrypt).length > 0) {
          const encrypted = await encryptFields(fieldsToEncrypt, vaultKey);
          dataToUpdate = { ...dataToUpdate, ...encrypted };
        }
      }

      const { data, error } = await supabase
        .from('financial_assets')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Update local state with plaintext
      setAssets(prev => prev.map(a => a.id === id ? { ...a, ...assetData } as FinancialAsset : a));
      toast({ title: 'Success', description: 'Financial asset updated successfully' });
      return data;
    } catch (error) {
      console.error('Error updating financial asset:', error);
      toast({ title: 'Error', description: 'Failed to update financial asset', variant: 'destructive' });
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_assets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Success', description: 'Financial asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting financial asset:', error);
      toast({ title: 'Error', description: 'Failed to delete financial asset', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) fetchAssets();
  }, [user, vaultKey]);

  return { assets, loading, createAsset, updateAsset, deleteAsset, refetch: fetchAssets };
};
