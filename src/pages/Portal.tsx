import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, FileText, AlertTriangle, MessageSquare, Lock, KeyRound, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortalDocument {
  id: string;
  title: string;
  content: string | null;
  document_type: string;
  description: string | null;
  created_at: string;
  file_path?: string | null;
}

interface PortalData {
  contactName: string;
  userName: string;
  customMessage: string | null;
  emergencyInstructions: string | null;
  documents: PortalDocument[];
  permissions: any;
}

interface SecurityChallenge {
  requiresAuth: true;
  question: string;
  contactName: string;
  userName: string;
}

const formatDocumentType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const Portal = () => {
  const { token } = useParams<{ token: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [securityChallenge, setSecurityChallenge] = useState<SecurityChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (token) fetchPortalData();
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/contact-portal?action=verify&token=${token}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to load portal');
        return;
      }

      if (result.requiresAuth) {
        setSecurityChallenge(result);
      } else {
        setPortalData(result);
      }
    } catch (err) {
      console.error('Portal fetch error:', err);
      setError('Failed to load the document portal. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setVerifying(true);
    setAnswerError(null);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/contact-portal?action=verify-answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
          body: JSON.stringify({ token, answer: answer.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setAnswerError(result.error || 'Incorrect answer');
        return;
      }

      setSecurityChallenge(null);
      setPortalData(result);
    } catch (err) {
      setAnswerError('Failed to verify answer. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70">Loading secure portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Access Denied</h1>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  // Security question challenge
  if (securityChallenge) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Security Verification</h1>
            <p className="text-white/60 text-sm">
              Welcome, {securityChallenge.contactName}. Please answer the security question to access {securityChallenge.userName}'s portal.
            </p>
          </div>
          
          <form onSubmit={handleAnswerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80 font-medium">{securityChallenge.question}</Label>
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                autoFocus
              />
            </div>
            
            {answerError && (
              <div className="bg-destructive/20 border border-destructive/30 rounded-xl p-3">
                <p className="text-destructive text-sm">{answerError}</p>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={verifying || !answer.trim()}
              className="w-full bg-primary hover:bg-primary/90 rounded-xl"
            >
              {verifying ? 'Verifying...' : 'Verify & Access Portal'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!portalData) return null;

  // Group documents by type
  const documentsByType: Record<string, PortalDocument[]> = {};
  for (const doc of portalData.documents) {
    if (!documentsByType[doc.document_type]) {
      documentsByType[doc.document_type] = [];
    }
    documentsByType[doc.document_type].push(doc);
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Secure Document Portal</h1>
              <p className="text-white/60 text-sm">
                Shared by <span className="text-primary font-medium">{portalData.userName}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-lg font-medium text-white mb-2">
            Welcome, {portalData.contactName}
          </h2>
          <p className="text-white/70 text-sm">
            {portalData.userName} has designated you as a trusted contact. Below is the information they have authorized you to access.
          </p>
        </div>

        {/* Custom Message */}
        {portalData.customMessage && (
          <div className="bg-primary/10 backdrop-blur-xl rounded-2xl p-6 border border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-white">
                Personal Message from {portalData.userName}
              </h3>
            </div>
            <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
              {portalData.customMessage}
            </div>
          </div>
        )}

        {/* Emergency Instructions */}
        {portalData.emergencyInstructions && (
          <div className="bg-warning/10 backdrop-blur-xl rounded-2xl p-6 border border-warning/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-medium text-white">Emergency Instructions</h3>
            </div>
            <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
              {portalData.emergencyInstructions}
            </div>
          </div>
        )}

        {/* Documents by Category */}
        {Object.keys(documentsByType).length > 0 ? (
          Object.entries(documentsByType).map(([docType, docs]) => (
            <div key={docType} className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-medium text-white">
                  {formatDocumentType(docType)}
                </h3>
                <span className="text-white/40 text-sm">({docs.length})</span>
              </div>
              
              {docs.map((doc) => (
                <div 
                  key={doc.id} 
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-primary/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-2">{doc.title}</h4>
                  {doc.description && (
                    <p className="text-white/60 text-sm mb-4">{doc.description}</p>
                  )}
                  {doc.content && (
                    <div className="bg-white/5 rounded-xl p-4 text-white/80 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {doc.content}
                    </div>
                  )}
                  <p className="text-white/40 text-xs mt-3">
                    Created: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ))
        ) : (
          !portalData.customMessage && !portalData.emergencyInstructions && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
              <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Documents Available</h3>
              <p className="text-white/60 text-sm">
                No documents have been shared with you at this time.
              </p>
            </div>
          )
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-white/40 text-xs">
            This is a secure, private portal. The information shown here is confidential.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Portal;
