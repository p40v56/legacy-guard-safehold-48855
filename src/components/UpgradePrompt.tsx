import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PlanTier, PLAN_LABELS, PLAN_PRICES } from '@/hooks/usePlan';

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
  const userEmail = user?.email || '';
  const planLabel = PLAN_LABELS[requiredPlan];
  const planPrice = PLAN_PRICES[requiredPlan];
  const mailtoLink = `mailto:support@legacyvault.app?subject=${encodeURIComponent(`LegacyVault upgrade request — ${planLabel} plan`)}&body=${encodeURIComponent(`I'd like to upgrade to the ${planLabel} plan (${planPrice}). My account email is: ${userEmail}`)}`;

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
          <a
            href={mailtoLink}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Upgrade to {planLabel} →
          </a>
          <Link
            to="/settings?tab=profile"
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
