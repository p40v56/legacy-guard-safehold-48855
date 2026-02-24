import React, { useState, useEffect } from 'react';
import { Phone, Mail, AlertTriangle, Square, CheckSquare } from 'lucide-react';

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
  token?: string;
}

const CATEGORY_PRIORITY: Record<string, number> = {
  insurance: 0,
  bank_account: 1,
  debt: 2,
  property: 3,
  pension: 4,
  investment: 5,
  other: 6,
};

const PortalUrgentActions: React.FC<PortalUrgentActionsProps> = ({ financialAssets, token }) => {
  const storageKey = `portal-actions-done-${token || 'default'}`;

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...completedIds]));
  }, [completedIds, storageKey]);

  const toggleComplete = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const actions: { id: string; label: string; phone?: string | null; email?: string | null; priority: number }[] = [];

  for (const asset of financialAssets) {
    if (!asset.contact_phone && !asset.contact_email) continue;
    const csf = asset.category_specific_fields || {};
    const refSuffix = asset.reference_number ? ` — Ref: ...${asset.reference_number.slice(-4)}` : '';
    const priority = CATEGORY_PRIORITY[asset.category] ?? 6;

    if (asset.category === 'insurance') {
      const policyNum = csf.policy_number ? ` (Policy: ${csf.policy_number})` : '';
      actions.push({ id: asset.id, label: `Contact ${asset.institution || asset.name} about life insurance policy${policyNum}${refSuffix}`, phone: asset.contact_phone, email: asset.contact_email, priority });
    } else if (asset.category === 'bank_account') {
      const last4 = asset.reference_number ? asset.reference_number.slice(-4) : '****';
      actions.push({ id: asset.id, label: `Contact ${asset.institution || asset.name} about account ending ${last4}`, phone: asset.contact_phone, email: asset.contact_email, priority });
    } else if (asset.category === 'property' && csf.mortgage_provider) {
      const balance = csf.outstanding_mortgage ? ` — outstanding: £${Number(csf.outstanding_mortgage).toLocaleString()}` : '';
      actions.push({ id: asset.id, label: `Review mortgage with ${csf.mortgage_provider}${balance}`, phone: asset.contact_phone, email: asset.contact_email, priority });
    } else if (asset.category === 'debt') {
      const balance = csf.outstanding_balance ? ` — £${Number(csf.outstanding_balance).toLocaleString()}` : '';
      actions.push({ id: asset.id, label: `Contact ${asset.institution || asset.name} about outstanding debt${balance}`, phone: asset.contact_phone, email: asset.contact_email, priority });
    } else {
      actions.push({ id: asset.id, label: `Contact ${asset.institution || asset.name} regarding ${asset.name}`, phone: asset.contact_phone, email: asset.contact_email, priority });
    }
  }

  if (actions.length === 0) return null;

  // Sort by priority (insurance first)
  actions.sort((a, b) => a.priority - b.priority);

  const completedCount = actions.filter(a => completedIds.has(a.id)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-amber-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-semibold text-amber-700">Urgent Actions</h3>
        </div>
        {completedCount > 0 && (
          <span className="text-xs text-gray-500">{completedCount}/{actions.length} completed</span>
        )}
      </div>
      <div className="space-y-3">
        {actions.map((action) => {
          const done = completedIds.has(action.id);
          return (
            <div key={action.id} className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${done ? 'bg-green-50/50 opacity-60' : 'bg-gray-50'}`}>
              <button
                onClick={() => toggleComplete(action.id)}
                className="mt-0.5 shrink-0 focus:outline-none"
                aria-label={done ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {done
                  ? <CheckSquare className="w-4 h-4 text-green-600" />
                  : <Square className="w-4 h-4 text-amber-600 hover:text-amber-800" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{action.label}</p>
                {!done && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortalUrgentActions;
