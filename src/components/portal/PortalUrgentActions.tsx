import React from 'react';
import { Phone, Mail, AlertTriangle, CheckSquare } from 'lucide-react';

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
  category_specific_fields: Record<string, any> | null;
}

interface PortalUrgentActionsProps {
  financialAssets: FinancialAsset[];
}

const PortalUrgentActions: React.FC<PortalUrgentActionsProps> = ({ financialAssets }) => {
  const actions: { label: string; phone?: string | null; email?: string | null }[] = [];

  for (const asset of financialAssets) {
    if (!asset.contact_phone && !asset.contact_email) continue;
    const csf = asset.category_specific_fields || {};
    const refSuffix = asset.reference_number ? ` — Ref: ...${asset.reference_number.slice(-4)}` : '';

    if (asset.category === 'insurance') {
      const policyNum = csf.policy_number ? ` (Policy: ${csf.policy_number})` : '';
      actions.push({ label: `Contact ${asset.institution || asset.name} about life insurance policy${policyNum}${refSuffix}`, phone: asset.contact_phone, email: asset.contact_email });
    } else if (asset.category === 'bank_account') {
      const last4 = asset.reference_number ? asset.reference_number.slice(-4) : '****';
      actions.push({ label: `Contact ${asset.institution || asset.name} about account ending ${last4}`, phone: asset.contact_phone, email: asset.contact_email });
    } else if (asset.category === 'property' && csf.mortgage_provider) {
      const balance = csf.outstanding_mortgage ? ` — outstanding: £${Number(csf.outstanding_mortgage).toLocaleString()}` : '';
      actions.push({ label: `Review mortgage with ${csf.mortgage_provider}${balance}`, phone: asset.contact_phone, email: asset.contact_email });
    } else if (asset.category === 'debt') {
      const balance = csf.outstanding_balance ? ` — £${Number(csf.outstanding_balance).toLocaleString()}` : '';
      actions.push({ label: `Contact ${asset.institution || asset.name} about outstanding debt${balance}`, phone: asset.contact_phone, email: asset.contact_email });
    } else {
      actions.push({ label: `Contact ${asset.institution || asset.name} regarding ${asset.name}`, phone: asset.contact_phone, email: asset.contact_email });
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-amber-500">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="text-base font-semibold text-amber-700">Urgent Actions</h3>
      </div>
      <div className="space-y-3">
        {actions.map((action, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
            <CheckSquare className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm">{action.label}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {action.phone && (
                  <a href={`tel:${action.phone}`} className="inline-flex items-center gap-1 text-blue-600 text-xs hover:underline">
                    <Phone className="w-3 h-3" />{action.phone}
                  </a>
                )}
                {action.email && (
                  <a href={`mailto:${action.email}`} className="inline-flex items-center gap-1 text-blue-600 text-xs hover:underline">
                    <Mail className="w-3 h-3" />{action.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortalUrgentActions;
