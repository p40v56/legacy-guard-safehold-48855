import React, { useState } from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';

interface PortalDocument {
  id: string;
  title: string;
  content: string | null;
  document_type: string;
  description: string | null;
  created_at: string;
  updated_at?: string | null;
  file_path?: string | null;
  file_data?: string | null;
  file_type?: string | null;
}

interface PortalDocumentsProps {
  documents: PortalDocument[];
}

const formatDocumentType = (type: string) =>
  type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const CONTENT_PREVIEW_LENGTH = 300;

const isHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);

const LEGAL_DISCLAIMERS: Record<string, string> = {
  will: 'A digital copy of a will is not legally enforceable. The original signed and witnessed document is required for probate. Contact the solicitor or check physical storage for the original.',
  power_of_attorney: 'A digital copy of a power of attorney is for reference only. The original registered document is required to act on behalf of the estate.',
  insurance: 'Contact the insurance provider directly with the original policy documents. They may require an original death certificate before processing a claim.',
  property: 'Property deeds and title documents must be obtained from HM Land Registry. This document is for reference only.',
};

const PortalDocuments: React.FC<PortalDocumentsProps> = ({ documents }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (documents.length === 0) return null;

  const grouped: Record<string, PortalDocument[]> = {};
  for (const doc of documents) {
    const t = doc.document_type || 'other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(doc);
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatDate = (doc: PortalDocument) => {
    const dateStr = doc.updated_at || doc.created_at;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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

          {docs.map(doc => {
            const isExpanded = expanded.has(doc.id);
            const isLong = doc.content && doc.content.length > CONTENT_PREVIEW_LENGTH;

            return (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h5 className="text-gray-900 font-medium mb-1">{doc.title}</h5>
                {doc.description && <p className="text-gray-500 text-sm mb-3">{doc.description}</p>}
                {LEGAL_DISCLAIMERS[doc.document_type] && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-amber-800 text-xs leading-relaxed">⚠️ {LEGAL_DISCLAIMERS[doc.document_type]}</p>
                  </div>
                )}
                {doc.content && (
                  <div className="mb-3">
                    {isHtml(doc.content) ? (
                      <>
                        {isLong && !isExpanded ? (
                          <>
                            <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                              {doc.content.replace(/<[^>]*>/g, '').slice(0, CONTENT_PREVIEW_LENGTH)}…
                            </div>
                            <button
                              onClick={() => toggleExpand(doc.id)}
                              className="text-blue-600 text-xs mt-2 hover:underline"
                            >
                              Read full document →
                            </button>
                          </>
                        ) : (
                          <>
                            <div
                              className="bg-gray-50 rounded-lg p-4 prose prose-sm max-w-none text-gray-700"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.content) }}
                            />
                            {isLong && (
                              <button
                                onClick={() => toggleExpand(doc.id)}
                                className="text-blue-600 text-xs mt-2 hover:underline"
                              >
                                ← Collapse
                              </button>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <pre className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {doc.content}
                      </pre>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">
                    Updated {formatDate(doc)}
                  </span>
                  {doc.file_data ? (
                    <button
                      onClick={() => {
                        try {
                          const binary = atob(doc.file_data!);
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
                        } catch (err) {
                          console.error('Failed to download document:', err);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-blue-600 text-xs hover:underline"
                    >
                      <Download className="w-3 h-3" />Download
                    </button>
                  ) : doc.file_path ? (
                    <span className="text-gray-400 text-xs italic">File unavailable in portal</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PortalDocuments;
