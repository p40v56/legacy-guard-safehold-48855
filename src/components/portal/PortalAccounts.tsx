import React from 'react';
import { Globe, Monitor, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface DigitalAccount {
  id: string;
  account_name: string;
  account_type: string;
  platform: string | null;
  username: string | null;
  email: string | null;
  website_url: string | null;
  notes: string | null;
  closure_action: string | null;
  importance: string | null;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  banking: 'Banking & Finance',
  social_media: 'Social Media',
  email: 'Email',
  shopping: 'Shopping',
  utilities: 'Utilities',
  healthcare: 'Healthcare',
  entertainment: 'Entertainment',
  other: 'Other',
};

interface PortalAccountsProps {
  accounts: DigitalAccount[];
}

const PortalAccounts: React.FC<PortalAccountsProps> = ({ accounts }) => {
  const { token } = useParams();
  const navigate = useNavigate();

  if (accounts.length === 0) return null;

  const grouped: Record<string, DigitalAccount[]> = {};
  for (const a of accounts) {
    const t = a.account_type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(a);
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(`/portal/${token}/overview`)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
      </button>

      {Object.entries(grouped).map(([type, accts]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-500" />
            <h4 className="text-gray-900 font-medium text-sm">{ACCOUNT_TYPE_LABELS[type] || type}</h4>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{accts.length}</span>
          </div>

          {accts.map(acct => (
            <div key={acct.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h5 className="text-gray-900 font-medium">{acct.platform || acct.account_name}</h5>
                  {acct.username && <p className="text-gray-500 text-sm">Username: {acct.username}</p>}
                </div>
                {acct.importance && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    acct.importance === 'critical' ? 'bg-red-100 text-red-700' :
                    acct.importance === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {acct.importance}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                {acct.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <a href={`mailto:${acct.email}`} className="text-blue-600 hover:underline">{acct.email}</a>
                  </div>
                )}
                {acct.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <a href={acct.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{acct.website_url}</a>
                  </div>
                )}
              </div>

              {acct.closure_action && (() => {
                const closureLabels: Record<string, { title: string; guidance: string }> = {
                  delete: { title: 'Delete this account', guidance: 'Contact the platform directly to request account deletion.' },
                  memorialize: { title: 'Memorialize this account', guidance: 'Contact the platform to request memorialization in their memory.' },
                  transfer: { title: 'Transfer this account', guidance: 'Transfer this account to a designated recipient as instructed in the notes.' },
                  download: { title: 'Download data before closing', guidance: "Use the platform's data export feature to download all data, then request closure." },
                };
                const info = closureLabels[acct.closure_action] || { title: acct.closure_action, guidance: '' };
                return (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-800 text-sm font-medium">{info.title}</p>
                    {info.guidance && <p className="text-gray-500 text-xs mt-0.5">{info.guidance}</p>}
                  </div>
                );
              })()}

              {acct.notes && <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{acct.notes}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PortalAccounts;
