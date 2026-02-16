import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { FinancialAsset, FinancialAssetInsert } from '@/types/financial';

export const useFinancialAssets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
      setAssets((data || []) as unknown as FinancialAsset[]);
    } catch (error) {
      console.error('Error fetching financial assets:', error);
      toast({ title: 'Error', description: 'Failed to load financial assets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async (assetData: FinancialAssetInsert) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .insert([{ ...assetData, user_id: user.id } as any])
        .select()
        .single();
      if (error) throw error;
      setAssets(prev => [data as unknown as FinancialAsset, ...prev]);
      toast({ title: 'Success', description: 'Financial asset added successfully' });
      return data;
    } catch (error) {
      console.error('Error creating financial asset:', error);
      toast({ title: 'Error', description: 'Failed to save financial asset', variant: 'destructive' });
    }
  };

  const updateAsset = async (id: string, assetData: Partial<FinancialAssetInsert>) => {
    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .update(assetData as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setAssets(prev => prev.map(a => a.id === id ? (data as unknown as FinancialAsset) : a));
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
  }, [user]);

  return { assets, loading, createAsset, updateAsset, deleteAsset, refetch: fetchAssets };
};
