import { useState, useEffect } from 'react';
import { useParams, Routes, Route, Navigate } from 'react-router-dom';
import { Shield, Lock, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PortalLayout from '@/components/portal/PortalLayout';
import PortalOverview from '@/components/portal/PortalOverview';
import PortalFinancials from '@/components/portal/PortalFinancials';
import PortalDocuments from '@/components/portal/PortalDocuments';
import PortalAccounts from '@/components/portal/PortalAccounts';
import { deriveKeyFromToken, decryptText } from '@/lib/crypto';
import { hexToBytes } from '@/lib/portalShares';

export interface PortalData {
  contactName: string;
  userName: string;
  userPlan: string;
  customMessage: string | null;
  emergencyInstructions: string | null;
  switchTriggeredAt: string | null;
  documents: any[];
  accounts: any[];
  financialAssets: any[];
  permissions: any;
}

interface SecurityChallenge {
  requiresAuth: true;
  question: string;
  contactName: string;
  userName: string;
}

/**
 * If the API returns an encrypted payload, derive the share key from the URL
 * token and decrypt to get the plaintext PortalData JSON.
 */
async function decryptPortalResponse(result: any, tokenHex: string): Promise<PortalData> {
  const tokenBytes = hexToBytes(tokenHex);
  const shareKey = await deriveKeyFromToken(tokenBytes);
  const plaintext = await decryptText(result.encryptedContent, result.contentIv, shareKey);
  return JSON.parse(plaintext);
}

const Portal = () => {
  const { token } = useParams<{ token: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [securityChallenge, setSecurityChallenge] = useState<SecurityChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
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
        { method: 'GET', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey } }
      );
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Failed to load portal'); return; }

      if (result.requiresAuth) {
        setSecurityChallenge(result);
      } else if (result.encrypted && token) {
        setDecrypting(true);
        try {
          const data = await decryptPortalResponse(result, token);
          setPortalData(data);
        } catch {
          setError('This access link is invalid or has expired.');
        } finally {
          setDecrypting(false);
        }
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
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey }, body: JSON.stringify({ token, answer: answer.trim() }) }
      );
      const result = await response.json();
      if (!response.ok) { setAnswerError(result.error || 'Incorrect answer'); return; }

      setSecurityChallenge(null);
      if (result.encrypted && token) {
        setDecrypting(true);
        try {
          const data = await decryptPortalResponse(result, token);
          setPortalData(data);
        } catch {
          setAnswerError('This access link is invalid or has expired.');
        } finally {
          setDecrypting(false);
        }
      } else {
        setPortalData(result);
      }
    } catch {
      setAnswerError('Failed to verify answer. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Decrypting state
  if (decrypting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-700 font-medium">Decrypting your documents…</p>
          <p className="text-gray-400 text-sm mt-1">Your data is being decrypted locally in your browser</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-500">Loading secure portal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Security challenge
  if (securityChallenge) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Security Verification</h1>
            <p className="text-gray-500 text-sm">
              Welcome, {securityChallenge.contactName}. Please answer the security question to access {securityChallenge.userName}'s portal.
            </p>
          </div>
          <form onSubmit={handleAnswerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">{securityChallenge.question}</Label>
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
            </div>
            {answerError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{answerError}</p>
              </div>
            )}
            <Button type="submit" disabled={verifying || !answer.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              {verifying ? 'Verifying...' : 'Verify & Access Portal'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!portalData) return null;

  return (
    <PortalLayout portalData={portalData} token={token || ''}>
      <Routes>
        <Route path="overview" element={<PortalOverview portalData={portalData} />} />
        {portalData.financialAssets.length > 0 && (
          <Route path="financials" element={<PortalFinancials financialAssets={portalData.financialAssets} />} />
        )}
        {portalData.documents.length > 0 && (
          <Route path="documents" element={<PortalDocuments documents={portalData.documents} />} />
        )}
        {portalData.accounts.length > 0 && (
          <Route path="accounts" element={<PortalAccounts accounts={portalData.accounts} />} />
        )}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </PortalLayout>
  );
};

export default Portal;
