import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff, Landmark, ShieldCheck, TrendingUp, Wallet, Home, CreditCard, Package, Phone, Mail, FileText, Copy, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FinancialAsset, FinancialCategory } from '@/types/financial';
import { CATEGORY_LABELS } from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';
import { useEncryption } from '@/contexts/EncryptionContext';
import { decryptFields } from '@/lib/crypto';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; bg: string; iconColor: string }> = {
  bank_account: { icon: <Landmark className="w-5 h-5" />, bg: 'bg-blue-500/15', iconColor: 'text-blue-500' },
  insurance: { icon: <ShieldCheck className="w-5 h-5" />, bg: 'bg-emerald-500/15', iconColor: 'text-emerald-500' },
  investment: { icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-purple-500/15', iconColor: 'text-purple-500' },
  pension: { icon: <Wallet className="w-5 h-5" />, bg: 'bg-amber-500/15', iconColor: 'text-amber-500' },
  property: { icon: <Home className="w-5 h-5" />, bg: 'bg-orange-500/15', iconColor: 'text-orange-500' },
  debt: { icon: <CreditCard className="w-5 h-5" />, bg: 'bg-red-500/15', iconColor: 'text-red-500' },
  other: { icon: <Package className="w-5 h-5" />, bg: 'bg-gray-500/15', iconColor: 'text-gray-400' },
};

interface FinancialAssetCardProps {
  asset: FinancialAsset;
  onEdit: (asset: FinancialAsset) => void;
  onDelete: (id: string) => void;
}

const FinancialAssetCard: React.FC<FinancialAssetCardProps> = ({ asset, onEdit, onDelete }) => {
  const [showRef, setShowRef] = useState(false);
  const [linkedDocs, setLinkedDocs] = useState<{id: string; title: string}[]>([]);
  const navigate = useNavigate();
  const { vaultKey } = useEncryption();

  useEffect(() => {
    const docIds = asset.attached_document_ids;
    if (!docIds || docIds.length === 0) return;
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('legacy_documents')
        .select('id, title, title_iv')
        .in('id', docIds);
      if (!data) return;
      const docs = await Promise.all(data.map(async (doc) => {
        let title = doc.title;
        if (vaultKey && doc.title_iv) {
          try {
            const decrypted = await decryptFields(doc, ['title'], vaultKey);
            title = decrypted.title || doc.title;
          } catch { /* use raw */ }
        }
        return { id: doc.id, title };
      }));
      setLinkedDocs(docs);
    };
    fetchDocs();
  }, [asset.attached_document_ids, vaultKey]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);

  const csf = asset.category_specific_fields || {};
  const typeConfig = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.other;

  return (
    <Card className="bg-card border-border hover:bg-card/80 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            {/* Category icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
              <span className={typeConfig.iconColor}>{typeConfig.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Title + badges row */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-semibold text-foreground truncate">{asset.name}</h3>
                <Badge variant="secondary" className="text-xs font-medium">
                  {CATEGORY_LABELS[asset.category]}
                </Badge>
                {asset.institution && (
                  <span className="text-sm text-muted-foreground">{asset.institution}</span>
                )}
                {asset.estimated_value != null && asset.estimated_value > 0 && (
                  <span className="text-base font-bold text-foreground whitespace-nowrap ml-auto">
                    {formatCurrency(asset.estimated_value)}
                  </span>
                )}
              </div>

              {/* Category-specific highlights */}
              <div className="space-y-1 text-sm mt-2">
                {asset.category === 'bank_account' && csf.account_subtype && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Type</span>
                    <span className="text-foreground capitalize">{csf.account_subtype}</span>
                  </div>
                )}
                {asset.category === 'insurance' && csf.coverage_amount && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Coverage</span>
                    <span className="text-foreground">{formatCurrency(Number(csf.coverage_amount))}</span>
                  </div>
                )}
                {asset.category === 'insurance' && csf.beneficiary && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Beneficiary</span>
                    <span className="text-foreground">{csf.beneficiary}</span>
                  </div>
                )}
                {asset.category === 'property' && csf.address && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Address</span>
                    <span className="text-foreground">{csf.address}</span>
                  </div>
                )}
                {asset.category === 'debt' && csf.outstanding_balance && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Balance</span>
                    <span className="text-destructive font-medium">{formatCurrency(Number(csf.outstanding_balance))}</span>
                  </div>
                )}
              </div>

              {/* Reference number */}
              {asset.reference_number && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="text-muted-foreground w-8 shrink-0">Ref:</span>
                  <span className="font-mono text-card-foreground">
                    {showRef ? asset.reference_number : `${'●'.repeat(4)}${asset.reference_number?.slice(-4) || ''}`}
                  </span>
                  <button
                    onClick={() => setShowRef(p => !p)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-2 py-0.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    {showRef ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showRef ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(asset.reference_number || '')}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-lg hover:bg-muted/50 transition-colors"
                    title="Copy reference number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Notes */}
              {asset.notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-card-foreground/70">📝 </span>{asset.notes}
                </p>
              )}

              {/* Institution contact */}
              {(asset.contact_name || asset.contact_phone || asset.contact_email) && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Institution contact</p>
                  <div className="flex flex-wrap gap-3">
                    {asset.contact_name && (
                      <span className="text-sm text-card-foreground font-medium">{asset.contact_name}</span>
                    )}
                    {asset.contact_phone && (
                      <a href={`tel:${asset.contact_phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5" />{asset.contact_phone}
                      </a>
                    )}
                    {asset.contact_email && (
                      <a href={`mailto:${asset.contact_email}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Mail className="w-3.5 h-3.5" />{asset.contact_email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Completeness indicator */}
              {(!asset.contact_phone && !asset.contact_email) && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  No contact information — your contacts won't know who to call for this asset.
                </div>
              )}

              {/* Linked documents */}
              {linkedDocs.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground shrink-0">📎 Linked:</span>
                  {linkedDocs.map(doc => (
                    <span key={doc.id} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                      <FileText className="w-3 h-3" />
                      {doc.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit/Delete buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(asset)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => onDelete(asset.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialAssetCard;
