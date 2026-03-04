import React from 'react';
import { Globe, Monitor, Mail, ArrowLeft, FileText, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface AttachedDocument {
  id: string;
  title: string;
  file_path: string | null;
  document_type: string;
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
  closure_action: string | null;
  importance: string | null;
  updated_at?: string | null;
  attached_documents?: AttachedDocument[];
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

  if (accounts.length === 0) return null;

  const grouped: Record<string, DigitalAccount[]> = {};
  for (const a of accounts) {
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

  const handleDocDownload = async (doc: AttachedDocument) => {
    if (!doc.file_path) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/get-document-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ token, documentId: doc.id, filePath: doc.file_path }),
      });
      if (!response.ok) throw new Error('Failed to get download URL');
      const result = await response.json();
      if (result.signedUrl) window.open(result.signedUrl, '_blank');
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
            {doc.file_path && (
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

      {Object.entries(grouped).map(([type, accts]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-500" />
            <h4 className="text-gray-900 font-medium text-sm">{ACCOUNT_TYPE_LABELS[type] || type}</h4>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{accts.length}</span>
          </div>

          {accts.map(acct => {
            const closure = acct.closure_action ? (closureLabels[acct.closure_action] || { title: acct.closure_action, guidance: '' }) : null;

            return (
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
      ))}
    </div>
  );
};

export default PortalAccounts;
