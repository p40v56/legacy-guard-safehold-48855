import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PlanTier, PLAN_LABELS, PLAN_PRICES } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradePromptProps {
  message: string;
  featureKey?: string;
  requiredPlan?: PlanTier;
  className?: string;
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  documents: 'Store and share documents with trusted contacts',
  accounts: 'Catalogue digital accounts with closure instructions',
  multipleContacts: 'Add multiple trusted contacts with individual permissions',
  portal: 'Contacts get a private decrypted portal when your switch fires',
  securityQuestions: 'Add security questions to protect portal access',
  customEmail: 'Customise email templates sent to your contacts',
  activationRules: 'Configure advanced activation rules for your switch',
  fileUploads: 'Upload files alongside your text documents',
};

const UpgradePrompt = ({ message, featureKey, requiredPlan = 'essential', className = '' }: UpgradePromptProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const planLabel = PLAN_LABELS[requiredPlan];
  const planPrice = PLAN_PRICES[requiredPlan];

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: requiredPlan },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not start checkout', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-muted/30 border border-border rounded-2xl p-5 flex items-start gap-4 ${className}`}>
      <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Lock className="w-5 h-5 text-warning" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-2">{message}</p>
        {featureKey && FEATURE_DESCRIPTIONS[featureKey] && (
          <p className="text-sm text-foreground/70 mb-2">
            <strong>What you get:</strong> {FEATURE_DESCRIPTIONS[featureKey]}
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-3">{planLabel} — {planPrice}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : `Upgrade to ${planLabel} →`}
          </button>
          <Link
            to="/settings?tab=account"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View plan details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
