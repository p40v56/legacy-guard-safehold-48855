import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, Shield, TrendingUp, Wallet, Home, CreditCard, Package, FileText, Phone } from 'lucide-react';
import type { FinancialAsset, FinancialCategory } from '@/types/financial';
import { CATEGORY_LABELS } from '@/types/financial';
import { formatCurrencyValue, getCurrency } from '@/lib/currency';

const CATEGORY_ICON_MAP: Record<FinancialCategory, React.ReactNode> = {
  bank_account: <Landmark className="w-4 h-4" />,
  insurance: <Shield className="w-4 h-4" />,
  investment: <TrendingUp className="w-4 h-4" />,
  pension: <Wallet className="w-4 h-4" />,
  property: <Home className="w-4 h-4" />,
  debt: <CreditCard className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

interface FinancialSummaryProps {
  assets: FinancialAsset[];
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ assets }) => {
  if (assets.length === 0) return null;

  const totalValue = assets.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
  const hasValues = assets.some(a => a.estimated_value && a.estimated_value > 0);

  const byCategory = assets.reduce<Record<string, { count: number; value: number }>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = { count: 0, value: 0 };
    acc[a.category].count++;
    acc[a.category].value += a.estimated_value || 0;
    return acc;
  }, {});

  const withContact = assets.filter(a => a.contact_name || a.contact_phone || a.contact_email).length;
  const withDocs = assets.filter(a => a.attached_document_ids && a.attached_document_ids.length > 0).length;

  // Determine predominant currency
  const currencyCounts: Record<string, number> = {};
  assets.forEach(a => {
    const cur = (a.category_specific_fields as any)?.currency || 'GBP';
    currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
  });
  const mainCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'GBP';
  const mainCurrencyInfo = getCurrency(mainCurrency);

  const formatCurrency = (v: number, cur?: string) => formatCurrencyValue(v, cur || mainCurrency);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <span className="text-lg font-bold text-primary">{mainCurrencyInfo.symbol}</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Financial Summary</h3>
        </div>

        {hasValues && (
          <div className="mb-4 p-4 rounded-xl bg-muted/30">
            <p className="text-sm text-muted-foreground mb-1">Total Estimated Value</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {(Object.entries(byCategory) as [FinancialCategory, { count: number; value: number }][]).map(([cat, data]) => (
            <div key={cat} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">{CATEGORY_ICON_MAP[cat as FinancialCategory]}</span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{CATEGORY_LABELS[cat as FinancialCategory]}</p>
                <p className="text-sm font-medium text-foreground">
                  {data.count} {data.count === 1 ? 'asset' : 'assets'}
                  {data.value > 0 && <span className="text-muted-foreground ml-1">· {formatCurrency(data.value)}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            <span>{withContact} of {assets.length} have contact info</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span>{withDocs} of {assets.length} have documents</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummary;
