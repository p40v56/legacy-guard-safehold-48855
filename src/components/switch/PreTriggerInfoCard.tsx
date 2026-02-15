import { AlertTriangle } from 'lucide-react';

const PreTriggerInfoCard = () => {
  return (
    <div className="rounded-2xl border-2 border-warning/30 bg-warning/5 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
        <h3 className="font-medium text-card-foreground">What happens when the grace period expires?</h3>
      </div>
      <ul className="text-sm text-muted-foreground space-y-2 ml-8">
        <li>📧 Emails are sent to your contacts according to your activation rules.</li>
        <li>⚠️ You'll receive a warning email when the grace period begins.</li>
        <li>✅ You can cancel at any time by performing a check-in.</li>
      </ul>
    </div>
  );
};

export default PreTriggerInfoCard;
