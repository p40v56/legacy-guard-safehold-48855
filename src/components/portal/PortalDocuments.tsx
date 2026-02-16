import React from 'react';
import { FileText, Download } from 'lucide-react';

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
  if (documents.length === 0) return null;

  const grouped: Record<string, PortalDocument[]> = {};
  for (const doc of documents) {
    const t = doc.document_type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(doc);
  }

  return (
    <div id="documents" className="space-y-4">
      {Object.entries(grouped).map(([docType, docs]) => (
        <div key={docType} className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h4 className="text-white font-medium text-sm">{formatDocumentType(docType)}</h4>
            <span className="text-white/30 text-xs">({docs.length})</span>
          </div>

          {docs.map(doc => (
            <div key={doc.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
              <h5 className="text-white font-medium mb-1">{doc.title}</h5>
              {doc.description && (
                <p className="text-white/50 text-sm mb-3">{doc.description}</p>
              )}
              {doc.content && (
                <div className="bg-white/5 rounded-xl p-4 text-white/80 text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto mb-3">
                  {doc.content}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs">
                  {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {doc.file_path && (
                  <button className="inline-flex items-center gap-1.5 text-primary text-xs hover:underline">
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
