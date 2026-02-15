import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Lock } from 'lucide-react';

interface CheckInMethodsProps {
  emailCheckinEnabled: boolean;
  smsCheckinEnabled: boolean;
  hasPhone: boolean;
  smsNotificationsEnabled: boolean;
  onEmailCheckinChange: (enabled: boolean) => void;
  onSmsCheckinChange: (enabled: boolean) => void;
  isPaidPlan?: boolean;
}

const CheckInMethods = ({
  emailCheckinEnabled,
  smsCheckinEnabled,
  hasPhone,
  smsNotificationsEnabled,
  onEmailCheckinChange,
  onSmsCheckinChange,
  isPaidPlan = true,
}: CheckInMethodsProps) => {
  const showSms = hasPhone && smsNotificationsEnabled;

  return (
    <div className="bg-muted/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-card-foreground">Check-in Methods</h3>
          <p className="text-sm text-muted-foreground">Alternative ways to check in without opening the app</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label className="text-foreground">Email check-in reminders</Label>
            <p className="text-xs text-muted-foreground">Receive a check-in link via email before your deadline</p>
          </div>
          {!isPaidPlan && <Badge variant="outline" className="text-xs ml-2"><Lock className="w-3 h-3 mr-1" />Paid</Badge>}
        </div>
        <Switch checked={emailCheckinEnabled} onCheckedChange={onEmailCheckinChange} disabled={!isPaidPlan} />
      </div>

      {showSms && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-foreground">SMS check-in</Label>
              <p className="text-xs text-muted-foreground">Receive a check-in link via SMS before your deadline</p>
            </div>
            {!isPaidPlan && <Badge variant="outline" className="text-xs ml-2"><Lock className="w-3 h-3 mr-1" />Paid</Badge>}
          </div>
          <Switch checked={smsCheckinEnabled} onCheckedChange={onSmsCheckinChange} disabled={!isPaidPlan} />
        </div>
      )}
    </div>
  );
};

export default CheckInMethods;
