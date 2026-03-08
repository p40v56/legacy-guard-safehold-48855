import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Phone, Mail, AlertTriangle, ArrowLeft, Landmark, Shield as ShieldIcon, TrendingUp, Wallet, Home, CreditCard, Package, Copy, Check, FileText, Download, Eye, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrencyValue, getCurrency, getAssetCurrency, fetchFxRates, convertCurrency, FxRates } from '@/lib/currency';

interface AttachedDocument {
  id: string;
  title: string;
  file_path: string | null;
  document_type: string;
  file_data?: string | null;
  file_type?: string | null;
}

interface FinancialAsset {
  id: string;
  name: string;
  category: string;
  institution: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  reference_number: string | null;
  estimated_value: number | null;
  notes: string | null;
  category_specific_fields: Record<string, any> | null;
  updated_at?: string | null;
  attached_documents?: AttachedDocument[];
}

const CATEGORY_LABELS: Record<string, string> = {
  bank_account: 'Bank Accounts',
  insurance: 'Insurance Policies',
  investment: 'Investments',
  pension: 'Pensions & Retirement',
  property: 'Properties',
  debt: 'Debts & Liabilities',
  other: 'Other Assets',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bank_account: <Landmark className="w-4 h-4" />,
  insurance: <ShieldIcon className="w-4 h-4" />,
  investment: <TrendingUp className="w-4 h-4" />,
  pension: <Wallet className="w-4 h-4" />,
  property: <Home className="w-4 h-4" />,
  debt: <CreditCard className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

const CATEGORY_ORDER = ['insurance', 'bank_account', 'investment', 'pension', 'property', 'debt', 'other'];

const DOC_TYPE_LABELS: Record<string, string> = {
  legal: 'Legal', financial: 'Financial', medical: 'Medical', personal: 'Personal',
  insurance: 'Insurance', property: 'Property', other: 'Other',
};

interface PortalFinancialsProps {
  financialAssets: FinancialAsset[];
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-gray-400 hover:text-gray-600 transition-colors" title="Copy reference number">
      {copied ? <Check className="w-3.5 h-3.5 inline text-green-500" /> : <Copy className="w-3.5 h-3.5 inline" />}
    </button>
  );
};

const PortalFinancials: React.FC<PortalFinancialsProps> = ({ financialAssets }) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [fxRates, setFxRates] = useState<FxRates | null>(null);
  const { token } = useParams();
  const navigate = useNavigate();

  // Determine currencies used
  const currencyCounts: Record<string, number> = {};
  const currencyTotals: Record<string, number> = {};
  financialAssets.forEach(a => {
    const cur = getAssetCurrency(a.category_specific_fields);
    currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
    currencyTotals[cur] = (currencyTotals[cur] || 0) + (a.estimated_value || 0);
  });
  const sortedCurrencies = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1]);
  const mainCurrency = sortedCurrencies[0]?.[0] || 'GBP';
  const isMultiCurrency = sortedCurrencies.length > 1;

  useEffect(() => {
    if (!isMultiCurrency) return;
    fetchFxRates('USD').then(setFxRates);
  }, [isMultiCurrency]);

  const formatAssetCurrency = (v: number, csf: Record<string, any> | null) =>
    formatCurrencyValue(v, getAssetCurrency(csf));

  if (financialAssets.length === 0) return null;

  const filteredAssets = financialAssets.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.institution?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q);
  });

  const grouped: Record<string, FinancialAsset[]> = {};
  for (const a of filteredAssets) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  }

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleDocDownload = (doc: AttachedDocument) => {
    if (!doc.file_data) return;
    try {
      const binary = atob(doc.file_data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: doc.file_type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Calculate totals with FX conversion
  const calcConvertedTotal = (filterFn: (a: FinancialAsset) => boolean, valueExtractor?: (a: FinancialAsset) => number) => {
    return financialAssets.filter(filterFn).reduce((sum, a) => {
      const val = valueExtractor ? valueExtractor(a) : (a.estimated_value || 0);
      const cur = getAssetCurrency(a.category_specific_fields);
      if (isMultiCurrency && fxRates) {
        return sum + convertCurrency(val, cur, mainCurrency, fxRates);
      }
      return sum + val;
    }, 0);
  };

  const assetTotal = calcConvertedTotal(a => a.category !== 'debt');
  const debtTotal = calcConvertedTotal(
    a => a.category === 'debt',
    a => {
      const csf = a.category_specific_fields || {};
      return csf.outstanding_balance ? Number(csf.outstanding_balance) : (a.estimated_value || 0);
    }
  );
  const netValue = assetTotal - debtTotal;
  const hasDebts = debtTotal > 0;

  const renderCategoryFields = (asset: FinancialAsset) => {
    const csf = asset.category_specific_fields || {};
    const fmtVal = (v: number) => formatAssetCurrency(v, csf);
    const fields: { label: string; value: string }[] = [];

    if (asset.category === 'bank_account') {
      if (csf.account_subtype) fields.push({ label: 'Account Type', value: csf.account_subtype });
      if (csf.sort_code) fields.push({ label: 'Sort Code', value: csf.sort_code });
      if (csf.joint_holder) fields.push({ label: 'Joint Holder', value: csf.joint_holder });
    } else if (asset.category === 'insurance') {
      if (csf.policy_number) fields.push({ label: 'Policy Number', value: csf.policy_number });
      if (csf.policy_type) fields.push({ label: 'Policy Type', value: csf.policy_type });
      if (csf.coverage_amount) fields.push({ label: 'Coverage', value: fmtVal(Number(csf.coverage_amount)) });
      if (csf.premium) fields.push({ label: 'Premium', value: fmtVal(Number(csf.premium)) });
      if (csf.beneficiary) fields.push({ label: 'Beneficiary', value: csf.beneficiary });
      if (csf.expiry_date) fields.push({ label: 'Expiry', value: new Date(csf.expiry_date).toLocaleDateString() });
    } else if (asset.category === 'investment') {
      if (csf.platform) fields.push({ label: 'Platform', value: csf.platform });
      if (csf.investment_type) fields.push({ label: 'Type', value: csf.investment_type });
      if (csf.beneficiary) fields.push({ label: 'Beneficiary', value: csf.beneficiary });
    } else if (asset.category === 'pension') {
      if (csf.pension_type) fields.push({ label: 'Type', value: csf.pension_type });
      if (csf.beneficiary) fields.push({ label: 'Beneficiary', value: csf.beneficiary });
      if (csf.expression_of_wish) fields.push({ label: 'Expression of Wish', value: csf.expression_of_wish ? 'Filed' : 'Not filed' });
    } else if (asset.category === 'property') {
      if (csf.address) fields.push({ label: 'Address', value: csf.address });
      if (csf.ownership_type) fields.push({ label: 'Ownership', value: csf.ownership_type });
      if (csf.mortgage_provider) fields.push({ label: 'Mortgage Provider', value: csf.mortgage_provider });
      if (csf.outstanding_mortgage) fields.push({ label: 'Outstanding Mortgage', value: fmtVal(Number(csf.outstanding_mortgage)) });
      if (csf.co_owner) fields.push({ label: 'Co-owner', value: csf.co_owner });
    } else if (asset.category === 'debt') {
      if (csf.debt_type) fields.push({ label: 'Debt Type', value: csf.debt_type });
      if (csf.outstanding_balance) fields.push({ label: 'Outstanding', value: fmtVal(Number(csf.outstanding_balance)) });
      if (csf.monthly_payment) fields.push({ label: 'Monthly Payment', value: fmtVal(Number(csf.monthly_payment)) });
      if (csf.insurance_on_debt != null) fields.push({ label: 'Death Coverage', value: csf.insurance_on_debt ? 'Yes' : 'No' });
    }

    return fields;
  };

  const renderAttachedDocs = (docs?: AttachedDocument[]) => {
    if (!docs || docs.length === 0) return null;
    return (
      <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-gray-600 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          Attached Documents
        </div>
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{doc.title}</span>
              <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
            </div>
            {doc.file_data && (
              <button
                onClick={() => handleDocDownload(doc)}
                className="text-blue-600 hover:underline text-xs flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(`/portal/${token}/overview`)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
      </button>

      <p className="text-gray-400 text-xs italic">
        Only assets shared with you are shown here. Other trusted contacts may see a different selection.
      </p>

      {/* Summary bar */}
      {(assetTotal > 0 || debtTotal > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">
              Total assets
              {isMultiCurrency && <span className="text-xs ml-1">(≈ {mainCurrency})</span>}
            </span>
            <span className="text-gray-900 font-semibold">{formatCurrencyValue(assetTotal, mainCurrency)}</span>
          </div>
          {hasDebts && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Total liabilities</span>
                <span className="text-red-600 font-semibold">−{formatCurrencyValue(debtTotal, mainCurrency)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">Net estate value</span>
                <span className={`text-lg font-semibold ${netValue >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {netValue >= 0 ? formatCurrencyValue(netValue, mainCurrency) : `−${formatCurrencyValue(Math.abs(netValue), mainCurrency)}`}
                </span>
              </div>
            </>
          )}

          {/* Per-currency breakdown */}
          {isMultiCurrency && (
            <div className="border-t border-gray-200 pt-3 mt-2 space-y-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">By currency</p>
              {sortedCurrencies.map(([cur]) => {
                const total = currencyTotals[cur] || 0;
                if (total === 0) return null;
                const curInfo = getCurrency(cur);
                return (
                  <div key={cur} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {curInfo.symbol} {cur}
                      <span className="text-xs text-gray-400 ml-1">({currencyCounts[cur]} {currencyCounts[cur] === 1 ? 'asset' : 'assets'})</span>
                    </span>
                    <span className="text-gray-900 font-medium">{formatCurrencyValue(total, cur)}</span>
                  </div>
                );
              })}
              {fxRates && (
                <p className="text-[10px] text-gray-400 pt-1 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" />
                  FX rates via ECB
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Death certificate guidance */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
        <h4 className="text-blue-900 font-semibold text-sm mb-2">📋 Before you begin: Death Certificate</h4>
        <ul className="text-blue-800 text-xs leading-relaxed space-y-1.5 list-disc list-inside">
          <li>You will need <strong>certified copies of the death certificate</strong> for almost every institution below.</li>
          <li>Order at least <strong>10 certified copies</strong> — most organisations require an original, not a photocopy.</li>
          <li>Obtain copies from the <strong>local register office</strong> where the death was registered, or order online via the General Register Office.</li>
          <li>Start with <strong>insurance claims</strong> first — many have time-sensitive deadlines (typically 6–12 months).</li>
        </ul>
      </div>

      {financialAssets.length >= 3 && (
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 mb-4"
        />
      )}

      {CATEGORY_ORDER.filter(cat => grouped[cat]).map(cat => {
        const catAssets = grouped[cat];
        const isOpen = openCategories.has(cat);

        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-500">{CATEGORY_ICONS[cat]}</span>
              <span className="text-gray-900 font-medium flex-1">{CATEGORY_LABELS[cat] || cat}</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full mr-2">{catAssets.length}</span>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-200 divide-y divide-gray-100">
                {catAssets.map(asset => {
                  const categoryFields = renderCategoryFields(asset);

                  return (
                    <div key={asset.id} className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-gray-900 font-medium">{asset.name}</h4>
                          {asset.institution && <p className="text-gray-500 text-sm">{asset.institution}</p>}
                        </div>
                        {asset.estimated_value != null && asset.estimated_value > 0 && (
                          <span className="text-gray-900 font-semibold text-sm whitespace-nowrap">
                            {formatAssetCurrency(asset.estimated_value, asset.category_specific_fields)}
                          </span>
                        )}
                      </div>

                      {asset.reference_number && (
                        <div className="text-sm flex items-center">
                          <span className="text-gray-500">Reference: </span>
                          <span className="text-gray-900 font-mono ml-1">{asset.reference_number}</span>
                          <CopyButton text={asset.reference_number} />
                        </div>
                      )}

                      {categoryFields.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          {categoryFields.map((f, i) => (
                            <div key={i}>
                              <span className="text-gray-500">{f.label}: </span>
                              <span className="text-gray-900 font-medium">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(asset.category_specific_fields || {}).death_claim_process && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-800 text-xs font-semibold">Death Claim Process</span>
                          </div>
                          <p className="text-amber-900 text-sm whitespace-pre-wrap">{(asset.category_specific_fields || {}).death_claim_process}</p>
                        </div>
                      )}

                      {asset.notes && <p className="text-gray-600 text-sm whitespace-pre-wrap">{asset.notes}</p>}

                      {renderAttachedDocs(asset.attached_documents)}

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          {asset.contact_name && <span className="text-gray-700">{asset.contact_name}</span>}
                          {asset.contact_phone && (
                            <a href={`tel:${asset.contact_phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <Phone className="w-3 h-3" />{asset.contact_phone}
                            </a>
                          )}
                          {asset.contact_email && (
                            <a href={`mailto:${asset.contact_email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <Mail className="w-3 h-3" />{asset.contact_email}
                            </a>
                          )}
                        </div>
                        {asset.updated_at && (
                          <span className="text-gray-400 text-xs">
                            Updated {new Date(asset.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PortalFinancials;
