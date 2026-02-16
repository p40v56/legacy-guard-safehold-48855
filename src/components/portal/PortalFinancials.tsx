import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Phone, Mail, AlertTriangle, ArrowLeft, Landmark, Shield as ShieldIcon, TrendingUp, Wallet, Home, CreditCard, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

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

interface PortalFinancialsProps {
  financialAssets: FinancialAsset[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);

const PortalFinancials: React.FC<PortalFinancialsProps> = ({ financialAssets }) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const { token } = useParams();
  const navigate = useNavigate();

  if (financialAssets.length === 0) return null;

  const grouped: Record<string, FinancialAsset[]> = {};
  for (const a of financialAssets) {
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

  const totalValue = financialAssets.reduce((sum, a) => sum + (a.estimated_value || 0), 0);

  const renderCategoryFields = (asset: FinancialAsset) => {
    const csf = asset.category_specific_fields || {};
    const fields: { label: string; value: string }[] = [];

    if (asset.category === 'bank_account') {
      if (csf.account_subtype) fields.push({ label: 'Account Type', value: csf.account_subtype });
      if (csf.sort_code) fields.push({ label: 'Sort Code', value: csf.sort_code });
      if (csf.joint_holder) fields.push({ label: 'Joint Holder', value: csf.joint_holder });
    } else if (asset.category === 'insurance') {
      if (csf.policy_number) fields.push({ label: 'Policy Number', value: csf.policy_number });
      if (csf.policy_type) fields.push({ label: 'Policy Type', value: csf.policy_type });
      if (csf.coverage_amount) fields.push({ label: 'Coverage', value: formatCurrency(Number(csf.coverage_amount)) });
      if (csf.premium) fields.push({ label: 'Premium', value: formatCurrency(Number(csf.premium)) });
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
      if (csf.outstanding_mortgage) fields.push({ label: 'Outstanding Mortgage', value: formatCurrency(Number(csf.outstanding_mortgage)) });
      if (csf.co_owner) fields.push({ label: 'Co-owner', value: csf.co_owner });
    } else if (asset.category === 'debt') {
      if (csf.debt_type) fields.push({ label: 'Debt Type', value: csf.debt_type });
      if (csf.outstanding_balance) fields.push({ label: 'Outstanding', value: formatCurrency(Number(csf.outstanding_balance)) });
      if (csf.monthly_payment) fields.push({ label: 'Monthly Payment', value: formatCurrency(Number(csf.monthly_payment)) });
      if (csf.insurance_on_debt != null) fields.push({ label: 'Death Coverage', value: csf.insurance_on_debt ? 'Yes' : 'No' });
    }

    return fields;
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(`/portal/${token}/overview`)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
      </button>

      {/* Summary bar */}
      {totalValue > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <span className="text-gray-500 text-sm">Total estimated value</span>
          <span className="text-gray-900 text-lg font-semibold">{formatCurrency(totalValue)}</span>
        </div>
      )}

      {/* Guide */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-gray-600 text-xs leading-relaxed">
          💡 For each institution listed below, you will typically need to provide a certified copy of the death certificate. Start with insurance policies as they may have time-sensitive claims.
        </p>
      </div>

      {CATEGORY_ORDER.filter(cat => grouped[cat]).map(cat => {
        const assets = grouped[cat];
        const isOpen = openCategories.has(cat);

        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-500">{CATEGORY_ICONS[cat]}</span>
              <span className="text-gray-900 font-medium flex-1">{CATEGORY_LABELS[cat] || cat}</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full mr-2">{assets.length}</span>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-200 divide-y divide-gray-100">
                {assets.map(asset => {
                  const csf = asset.category_specific_fields || {};
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
                            {formatCurrency(asset.estimated_value)}
                          </span>
                        )}
                      </div>

                      {asset.reference_number && (
                        <div className="text-sm">
                          <span className="text-gray-500">Reference: </span>
                          <span className="text-gray-900 font-mono">{asset.reference_number}</span>
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

                      {csf.death_claim_process && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-800 text-xs font-semibold">Death Claim Process</span>
                          </div>
                          <p className="text-amber-900 text-sm whitespace-pre-wrap">{csf.death_claim_process}</p>
                        </div>
                      )}

                      {asset.notes && <p className="text-gray-600 text-sm whitespace-pre-wrap">{asset.notes}</p>}

                      {(asset.contact_name || asset.contact_phone || asset.contact_email) && (
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
                      )}
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
