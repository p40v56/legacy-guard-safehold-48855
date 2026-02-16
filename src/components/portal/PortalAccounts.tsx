import React from 'react';
import { Globe, Monitor, Mail } from 'lucide-react';

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
  if (accounts.length === 0) return null;

  const grouped: Record<string, DigitalAccount[]> = {};
  for (const a of accounts) {
    const t = a.account_type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(a);
  }

  return (
    <div id="accounts" className="space-y-4">
      {Object.entries(grouped).map(([type, accts]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            <h4 className="text-white font-medium text-sm">{ACCOUNT_TYPE_LABELS[type] || type}</h4>
            <span className="text-white/30 text-xs">({accts.length})</span>
          </div>

          {accts.map(acct => (
            <div key={acct.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h5 className="text-white font-medium">{acct.platform || acct.account_name}</h5>
                  {acct.username && (
                    <p className="text-white/50 text-sm">Username: {acct.username}</p>
                  )}
                </div>
                {acct.importance && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    acct.importance === 'critical' ? 'bg-destructive/20 text-destructive' :
                    acct.importance === 'high' ? 'bg-warning/20 text-warning' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {acct.importance}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                {acct.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-white/40" />
                    <span className="text-white/70">{acct.email}</span>
                  </div>
                )}
                {acct.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-white/40" />
                    <a href={acct.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{acct.website_url}</a>
                  </div>
                )}
              </div>

              {acct.closure_action && (
                <div className="mt-3 bg-white/5 rounded-xl p-3">
                  <p className="text-white/50 text-xs font-medium mb-1">Closure Instructions</p>
                  <p className="text-white/80 text-sm">{acct.closure_action}</p>
                </div>
              )}

              {acct.notes && (
                <p className="text-white/60 text-sm mt-2 whitespace-pre-wrap">{acct.notes}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PortalAccounts;
