import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalMessage from '@/components/portal/PortalMessage';
import PortalUrgentActions from '@/components/portal/PortalUrgentActions';
import PortalFinancials from '@/components/portal/PortalFinancials';
import PortalDocuments from '@/components/portal/PortalDocuments';
import PortalAccounts from '@/components/portal/PortalAccounts';
import PortalNavigation from '@/components/portal/PortalNavigation';

interface PortalData {
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

const Portal = () => {
  const { token } = useParams<{ token: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [securityChallenge, setSecurityChallenge] = useState<SecurityChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

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
      if (result.requiresAuth) { setSecurityChallenge(result); } else { setPortalData(result); }
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
      setPortalData(result);
    } catch {
      setAnswerError('Failed to verify answer. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Build sections for navigation
  const sections = useMemo(() => {
    if (!portalData) return [];
    const s: { id: string; label: string }[] = [{ id: 'overview', label: 'Overview' }];
    if (portalData.financialAssets.length > 0) s.push({ id: 'financials', label: 'Financials' });
    if (portalData.documents.length > 0) s.push({ id: 'documents', label: 'Documents' });
    if (portalData.accounts.length > 0) s.push({ id: 'accounts', label: 'Accounts' });
    return s;
  }, [portalData]);

  const isFreePortal = portalData?.userPlan === 'free';

  // Loading state
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

  // Error state
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

  // Security challenge
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
            <Button type="submit" disabled={verifying || !answer.trim()} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
              {verifying ? 'Verifying...' : 'Verify & Access Portal'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!portalData) return null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Top bar */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Secure Portal</h1>
              <p className="text-white/50 text-xs">
                Shared by <span className="text-primary font-medium">{portalData.userName}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden">
        <PortalNavigation sections={sections} activeSection={activeSection} onNavigate={handleNavigate} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
        {/* Desktop sidebar nav */}
        <PortalNavigation sections={sections} activeSection={activeSection} onNavigate={handleNavigate} />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Section: Overview */}
          <div id="overview" className="space-y-6">
            <PortalHeader
              contactName={portalData.contactName}
              userName={portalData.userName}
              switchTriggeredAt={portalData.switchTriggeredAt}
              emergencyInstructions={portalData.emergencyInstructions}
            />

            {portalData.customMessage && (
              <PortalMessage userName={portalData.userName} customMessage={portalData.customMessage} />
            )}

            {/* Free plan limited notice */}
            {isFreePortal && portalData.financialAssets.length === 0 && portalData.documents.length === 0 && portalData.accounts.length === 0 && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-white/60 text-sm">
                  {portalData.userName} shared a message with you. For more detailed information, their account plan does not include extended portal access.
                </p>
              </div>
            )}

            {/* Urgent actions */}
            {portalData.financialAssets.length > 0 && (
              <PortalUrgentActions financialAssets={portalData.financialAssets} />
            )}
          </div>

          {/* Section: Financials */}
          {portalData.financialAssets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                💰 Financial Assets
              </h2>
              <PortalFinancials financialAssets={portalData.financialAssets} />
            </div>
          )}

          {/* Section: Documents */}
          {portalData.documents.length > 0 && (
            <div className="space-y-3">
              <h2 id="documents-heading" className="text-lg font-semibold text-white flex items-center gap-2">
                📄 Documents
              </h2>
              <PortalDocuments documents={portalData.documents} />
            </div>
          )}

          {/* Section: Digital Accounts */}
          {portalData.accounts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                🔐 Digital Accounts
              </h2>
              <PortalAccounts accounts={portalData.accounts} />
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-8 space-y-2">
            <p className="text-white/40 text-xs">
              This is a secure, private portal. The information shown here is confidential.
            </p>
            <p className="text-white/30 text-xs">
              If you need help or have questions, contact LegacyVault support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portal;
