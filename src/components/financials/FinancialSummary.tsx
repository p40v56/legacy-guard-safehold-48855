import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark, Shield, TrendingUp, Wallet, Home, CreditCard, Package, FileText, Phone, RefreshCw } from 'lucide-react';
import type { FinancialAsset, FinancialCategory } from '@/types/financial';
import { CATEGORY_LABELS } from '@/types/financial';
import { CURRENCIES, formatCurrencyValue, getCurrency, getAssetCurrency, fetchFxRates, convertCurrency, FxRates } from '@/lib/currency';

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
  const [fxRates, setFxRates] = useState<FxRates | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);

  // Determine currencies used
  const currencyCounts: Record<string, number> = {};
  const currencyTotals: Record<string, number> = {};
  assets.forEach(a => {
    const cur = getAssetCurrency(a.category_specific_fields as Record<string, any>);
    currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
    currencyTotals[cur] = (currencyTotals[cur] || 0) + (a.estimated_value || 0);
  });

  const sortedCurrencies = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1]);
  const defaultCurrency = sortedCurrencies[0]?.[0] || 'GBP';
  const mainCurrency = displayCurrency || defaultCurrency;
  const mainCurrencyInfo = getCurrency(mainCurrency);
  const isMultiCurrency = sortedCurrencies.length > 1;
  const needsConversion = isMultiCurrency || (displayCurrency && displayCurrency !== defaultCurrency);

  // Fetch FX rates when conversion needed
  useEffect(() => {
    if (!needsConversion) return;
    setFxLoading(true);
    fetchFxRates('USD').then(rates => {
      setFxRates(rates);
      setFxLoading(false);
    });
  }, [needsConversion]);

  if (assets.length === 0) return null;

  // Calculate converted total
  const hasValues = assets.some(a => a.estimated_value && a.estimated_value > 0);

  let convertedTotal = 0;
  if (needsConversion && fxRates) {
    assets.forEach(a => {
      const cur = getAssetCurrency(a.category_specific_fields as Record<string, any>);
      convertedTotal += convertCurrency(a.estimated_value || 0, cur, mainCurrency, fxRates);
    });
  } else if (!needsConversion) {
    convertedTotal = assets.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
  }

  const byCategory = assets.reduce<Record<string, { count: number; value: number }>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = { count: 0, value: 0 };
    acc[a.category].count++;
    if (needsConversion && fxRates) {
      const cur = getAssetCurrency(a.category_specific_fields as Record<string, any>);
      acc[a.category].value += convertCurrency(a.estimated_value || 0, cur, mainCurrency, fxRates);
    } else if (!needsConversion) {
      acc[a.category].value += a.estimated_value || 0;
    }
    return acc;
  }, {});

  const withContact = assets.filter(a => a.contact_name || a.contact_phone || a.contact_email).length;
  const withDocs = assets.filter(a => a.attached_document_ids && a.attached_document_ids.length > 0).length;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="text-lg font-bold text-primary">{mainCurrencyInfo.symbol}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Financial Summary</h3>
          </div>
          <Select value={mainCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code} className="text-xs">
                  {c.symbol} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasValues && (
          <div className="mb-4 p-4 rounded-xl bg-muted/30">
            <p className="text-sm text-muted-foreground mb-1">
              Total Estimated Value
              {needsConversion && <span className="ml-1 text-xs">(converted to {mainCurrency})</span>}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground">
                {fxLoading && needsConversion ? '...' : formatCurrencyValue(convertedTotal, mainCurrency)}
              </p>
              {needsConversion && fxRates && (
                <span className="text-xs text-muted-foreground">≈</span>
              )}
            </div>

            {/* Per-currency breakdown */}
            {isMultiCurrency && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                {sortedCurrencies.map(([cur]) => {
                  const total = currencyTotals[cur] || 0;
                  if (total === 0) return null;
                  const curInfo = getCurrency(cur);
                  return (
                    <div key={cur} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{curInfo.symbol}</span>
                        {cur}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                          {currencyCounts[cur]} {currencyCounts[cur] === 1 ? 'asset' : 'assets'}
                        </Badge>
                      </span>
                      <span className="font-medium text-foreground">{formatCurrencyValue(total, cur)}</span>
                    </div>
                  );
                })}
                {fxRates && (
                  <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    FX rates via ECB · cached {new Date(fxRates.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}
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
                  {data.value > 0 && (
                    <span className="text-muted-foreground ml-1">
                      · {isMultiCurrency ? '≈ ' : ''}{formatCurrencyValue(data.value, mainCurrency)}
                    </span>
                  )}
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
