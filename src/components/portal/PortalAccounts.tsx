import React, { useState } from 'react';
import { Globe, Monitor, Mail, ArrowLeft, FileText, Download, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface AttachedDocument {
  id: string;
  title: string;
  file_path: string | null;
  document_type: string;
  file_data?: string | null;
  file_type?: string | null;
}

interface DigitalAccount {
  id: string;
  account_name: string;
  account_type: string;
  platform: string | null;
  username: string | null;
  email: string | null;
  website_url: string | null;
  notes: string | null;
  credentials?: string | null;
  closure_action: string | null;
  importance: string | null;
  updated_at?: string | null;
  attached_documents?: AttachedDocument[];
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  social: 'Social Media',
  email: 'Email',
  work: 'Work & Professional',
  entertainment: 'Entertainment',
  financial: 'Financial',
  other: 'Other',
};

const IMPORTANCE_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const DOC_TYPE_LABELS: Record<string, string> = {
  legal: 'Legal', financial: 'Financial', medical: 'Medical', personal: 'Personal',
  insurance: 'Insurance', property: 'Property', other: 'Other',
};

interface PortalAccountsProps {
  accounts: DigitalAccount[];
}

const PortalAccounts: React.FC<PortalAccountsProps> = ({ accounts }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [revealedCredentials, setRevealedCredentials] = useState<Set<string>>(new Set());
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  if (accounts.length === 0) return null;

  const filteredAccounts = accounts.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (a.account_name || '').toLowerCase().includes(q) || (a.platform || '').toLowerCase().includes(q) || (a.account_type || '').toLowerCase().includes(q);
  });

  const grouped: Record<string, DigitalAccount[]> = {};
  for (const a of filteredAccounts) {
    const t = a.account_type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(a);
  }

  // Sort each group by importance
  for (const type of Object.keys(grouped)) {
    grouped[type].sort((a, b) =>
      (IMPORTANCE_ORDER[a.importance as string] ?? 4) -
      (IMPORTANCE_ORDER[b.importance as string] ?? 4)
    );
  }

  const closureLabels: Record<string, { title: string; guidance: string }> = {
    delete: { title: 'Delete this account', guidance: 'Contact the platform directly to request account deletion.' },
    memorialize: { title: 'Memorialize this account', guidance: 'Contact the platform to request memorialization in their memory.' },
    transfer: { title: 'Transfer this account', guidance: 'Transfer this account to a designated recipient as instructed in the notes.' },
    download: { title: 'Download data before closing', guidance: "Use the platform's data export feature to download all data, then request closure." },
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

      {accounts.length >= 3 && (
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search accounts..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 mb-4"
        />
      )}

      {Object.entries(grouped).map(([type, accts]) => {
        const isOpen = openCategories.has(type);
        return (
          <div key={type} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => {
                setOpenCategories(prev => {
                  const next = new Set(prev);
                  next.has(type) ? next.delete(type) : next.add(type);
                  return next;
                });
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Monitor className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900 font-medium flex-1">{ACCOUNT_TYPE_LABELS[type] || type}</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full mr-2">{accts.length}</span>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-200 divide-y divide-gray-100">
                {accts.map(acct => {
                  const closure = acct.closure_action ? (closureLabels[acct.closure_action] || { title: acct.closure_action, guidance: '' }) : null;

                  return (
                    <div key={acct.id} className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h5 className="text-gray-900 font-medium">{acct.platform || acct.account_name}</h5>
                          {acct.username && <p className="text-gray-500 text-sm">Username: {acct.username}</p>}
                          {acct.credentials && (
                            <div className="flex items-center gap-2 mt-1">
                              <Lock className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500 text-sm">
                                {revealedCredentials.has(acct.id) ? acct.credentials : '••••••••'}
                              </span>
                              <button
                                onClick={() => setRevealedCredentials(prev => {
                                  const next = new Set(prev);
                                  next.has(acct.id) ? next.delete(acct.id) : next.add(acct.id);
                                  return next;
                                })}
                                className="text-blue-500 text-xs hover:underline ml-1"
                              >
                                {revealedCredentials.has(acct.id) ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                          )}
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

                      {closure && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-800 text-sm font-medium">{closure.title}</p>
                          {closure.guidance && <p className="text-gray-500 text-xs mt-0.5">{closure.guidance}</p>}
                        </div>
                      )}

                      {acct.notes && <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{acct.notes}</p>}

                      {renderAttachedDocs(acct.attached_documents)}

                      {acct.updated_at && (
                        <p className="text-gray-400 text-xs mt-3">
                          Updated {new Date(acct.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
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

export default PortalAccounts;
