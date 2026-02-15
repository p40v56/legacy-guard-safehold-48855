import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  message: string;
  className?: string;
}

const UpgradePrompt = ({ message, className = '' }: UpgradePromptProps) => {
  return (
    <div className={`bg-muted/30 border border-border rounded-2xl p-5 flex items-start gap-4 ${className}`}>
      <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Lock className="w-5 h-5 text-warning" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-2">{message}</p>
        <Link
          to="/settings?tab=profile"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Learn more about the Paid Plan →
        </Link>
      </div>
    </div>
  );
};

export default UpgradePrompt;
