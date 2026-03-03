import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff, Landmark, Shield, TrendingUp, Wallet, Home, CreditCard, Package, Phone, Mail, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FinancialAsset, FinancialCategory } from '@/types/financial';
import { CATEGORY_LABELS } from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';
import { useEncryption } from '@/contexts/EncryptionContext';
import { decryptFields } from '@/lib/crypto';

const CATEGORY_ICON_MAP: Record<FinancialCategory, React.ReactNode> = {
  bank_account: <Landmark className="w-5 h-5" />,
  insurance: <Shield className="w-5 h-5" />,
  investment: <TrendingUp className="w-5 h-5" />,
  pension: <Wallet className="w-5 h-5" />,
  property: <Home className="w-5 h-5" />,
  debt: <CreditCard className="w-5 h-5" />,
  other: <Package className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<FinancialCategory, string> = {
  bank_account: 'bg-primary/20 text-primary border-primary/30',
  insurance: 'bg-success/20 text-success border-success/30',
  investment: 'bg-accent/20 text-accent border-accent/30',
  pension: 'bg-warning/20 text-warning border-warning/30',
  property: 'bg-primary/20 text-primary border-primary/30',
  debt: 'bg-destructive/20 text-destructive border-destructive/30',
  other: 'bg-muted text-muted-foreground border-muted',
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

  const maskedRef = asset.reference_number
    ? '••••' + asset.reference_number.slice(-4)
    : null;

  const csf = asset.category_specific_fields || {};

  return (
    <Card className="bg-card border-border hover:bg-card/80 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors text-muted-foreground group-hover:text-primary">
                {CATEGORY_ICON_MAP[asset.category]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">{asset.name}</h3>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <Badge variant="secondary" className={`text-xs font-medium ${CATEGORY_COLORS[asset.category]}`}>
                    {CATEGORY_LABELS[asset.category]}
                  </Badge>
                  {asset.institution && (
                    <span className="text-sm text-muted-foreground">{asset.institution}</span>
                  )}
                </div>
              </div>
              {asset.estimated_value != null && asset.estimated_value > 0 && (
                <span className="text-lg font-bold text-foreground whitespace-nowrap">
                  {formatCurrency(asset.estimated_value)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {maskedRef && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Ref:</span>
                  <span className="text-foreground font-mono">{showRef ? asset.reference_number : maskedRef}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowRef(!showRef)}>
                    {showRef ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
              {asset.contact_name && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{asset.contact_name}</span>
                  {asset.contact_phone && <span className="text-muted-foreground">· {asset.contact_phone}</span>}
                </div>
              )}
              {asset.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{asset.contact_email}</span>
                </div>
              )}

              {/* Category-specific highlights */}
              {asset.category === 'bank_account' && csf.account_subtype && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Type:</span>
                  <span className="text-foreground capitalize">{csf.account_subtype}</span>
                </div>
              )}
              {asset.category === 'insurance' && csf.coverage_amount && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Coverage:</span>
                  <span className="text-foreground">{formatCurrency(Number(csf.coverage_amount))}</span>
                </div>
              )}
              {asset.category === 'insurance' && csf.beneficiary && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Beneficiary:</span>
                  <span className="text-foreground">{csf.beneficiary}</span>
                </div>
              )}
              {asset.category === 'property' && csf.address && (
                <div className="flex items-center gap-2 col-span-2">
                  <span className="text-muted-foreground font-medium">Address:</span>
                  <span className="text-foreground">{csf.address}</span>
                </div>
              )}
              {asset.category === 'debt' && csf.outstanding_balance && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Balance:</span>
                  <span className="text-destructive font-medium">{formatCurrency(Number(csf.outstanding_balance))}</span>
                </div>
              )}
            </div>

            {asset.notes && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed line-clamp-2">{asset.notes}</p>
            )}

            {linkedDocs.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                {linkedDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => navigate('/documents')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    📄 {doc.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 ml-4">
            <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialAssetCard;
