import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, PoundSterling } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { usePlan } from '@/hooks/usePlan';
import { useFinancialAssets } from '@/hooks/useFinancialAssets';
import UpgradePrompt from '@/components/UpgradePrompt';
import FinancialSummary from '@/components/financials/FinancialSummary';
import FinancialAssetCard from '@/components/financials/FinancialAssetCard';
import FinancialAssetForm from '@/components/financials/FinancialAssetForm';
import SearchInput from '@/components/ui/search-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import type { FinancialAsset, FinancialCategory, FinancialAssetInsert } from '@/types/financial';
import { CATEGORY_LABELS } from '@/types/financial';

const FinancialsTab: React.FC = () => {
  const { plan, limits } = usePlan();
  const { assets, loading, createAsset, updateAsset, deleteAsset } = useFinancialAssets();
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FinancialAsset | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const canAdd = limits.maxFinancialAssets === Infinity || assets.length < limits.maxFinancialAssets;

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        asset.name?.toLowerCase().includes(q) ||
        asset.institution?.toLowerCase().includes(q) ||
        asset.category?.toLowerCase().includes(q) ||
        asset.notes?.toLowerCase().includes(q)
      );
    });
  }, [assets, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, FinancialAsset[]> = {};
    filteredAssets.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [filteredAssets]);

  const handleSubmit = async (data: FinancialAssetInsert) => {
    if (editingAsset) {
      await updateAsset(editingAsset.id, data);
    } else {
      await createAsset(data);
    }
    setShowForm(false);
    setEditingAsset(null);
  };

  const handleEdit = (asset: FinancialAsset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center animate-pulse">
          <PoundSterling className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Document your financial assets to help your loved ones know where to find what matters.
        </p>
        {canAdd && (
          <Button onClick={() => { setEditingAsset(null); setShowForm(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />Add Asset
          </Button>
        )}
      </div>

      {!canAdd && (
        <UpgradePrompt
          message={`Your plan allows up to ${limits.maxFinancialAssets} financial assets. Upgrade to add more.`}
          requiredPlan={plan === 'essential' ? 'family' : 'essential'}
        />
      )}

      {plan === 'free' && assets.length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
          Free plan: financial assets are for your personal reference only and won't be shared with contacts.
        </div>
      )}

      {showForm && (
        <FinancialAssetForm
          initialData={editingAsset}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      <FinancialSummary assets={assets} />

      {assets.length > 0 && (
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search financial assets..."
        />
      )}

      {filteredAssets.length === 0 && !showForm ? (
        searchQuery.trim() ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No assets match "{searchQuery}"</p>
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-2xl bg-muted w-fit mx-auto mb-6">
                  <PoundSterling className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">No financial assets documented yet</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Adding your financial information here will help your loved ones know exactly where to find what matters.
                </p>
                <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 shadow-lg font-semibold">
                  <Plus className="w-4 h-4 mr-2" />Add your first asset
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          {(Object.entries(grouped) as [FinancialCategory, FinancialAsset[]][]).map(([cat, catAssets]) => (
            <Collapsible key={cat} defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="font-semibold text-foreground">{CATEGORY_LABELS[cat]} ({catAssets.length})</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {catAssets.map(asset => (
                  <FinancialAssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
        title="Delete Financial Asset"
        description="Are you sure you want to delete this financial asset? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTargetId) deleteAsset(deleteTargetId); setDeleteTargetId(null); }}
      />
    </div>
  );
};

export default FinancialsTab;
