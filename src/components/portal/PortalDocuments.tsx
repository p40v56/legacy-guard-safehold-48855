import React from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface PortalDocument {
  id: string;
  title: string;
  content: string | null;
  document_type: string;
  description: string | null;
  created_at: string;
  file_path?: string | null;
}

interface PortalDocumentsProps {
  documents: PortalDocument[];
}

const formatDocumentType = (type: string) =>
  type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const PortalDocuments: React.FC<PortalDocumentsProps> = ({ documents }) => {
  const { token } = useParams();
  const navigate = useNavigate();

  if (documents.length === 0) return null;

  const grouped: Record<string, PortalDocument[]> = {};
  for (const doc of documents) {
    const t = doc.document_type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(doc);
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(`/portal/${token}/overview`)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
      </button>

      {Object.entries(grouped).map(([docType, docs]) => (
        <div key={docType} className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="text-gray-900 font-medium text-sm">{formatDocumentType(docType)}</h4>
            <span className="text-gray-400 text-xs">({docs.length})</span>
          </div>

          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h5 className="text-gray-900 font-medium mb-1">{doc.title}</h5>
              {doc.description && <p className="text-gray-500 text-sm mb-3">{doc.description}</p>}
              {doc.content && (
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto mb-3">
                  {doc.content}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">
                  {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {doc.file_path && (
                  <button
                    onClick={async () => {
                      try {
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
                        const response = await fetch(`${supabaseUrl}/functions/v1/get-document-url`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
                          body: JSON.stringify({ token, documentId: doc.id, filePath: doc.file_path }),
                        });
                        const result = await response.json();
                        if (result.signedUrl) {
                          window.open(result.signedUrl, '_blank');
                        }
                      } catch (err) {
                        console.error('Failed to get download URL:', err);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-blue-600 text-xs hover:underline"
                  >
                    <Download className="w-3 h-3" />Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PortalDocuments;
