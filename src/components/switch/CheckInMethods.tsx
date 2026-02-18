import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, PhoneCall, Lock, MessageSquare } from 'lucide-react';

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
  return (
    <div className="bg-muted/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-card-foreground">Check-in Options</h3>
          <p className="text-sm text-muted-foreground">Alternative ways to check in without opening the app</p>
        </div>
      </div>

      {/* 1. Email check-in reminders — paid only */}
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

      {/* 2. Check-in via email — paid only, available */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label className="text-foreground">Check-in via email</Label>
            <p className="text-xs text-muted-foreground">Reply to an email to confirm your check-in</p>
          </div>
          {!isPaidPlan && <Badge variant="outline" className="text-xs ml-2"><Lock className="w-3 h-3 mr-1" />Paid</Badge>}
        </div>
        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
      </div>

      {/* 3. Check-in via a call — paid only, coming soon */}
      <div className="flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <PhoneCall className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label className="text-foreground">Check-in via a call</Label>
            <p className="text-xs text-muted-foreground">Call a number to confirm your check-in</p>
          </div>
          {!isPaidPlan && <Badge variant="outline" className="text-xs ml-2"><Lock className="w-3 h-3 mr-1" />Paid</Badge>}
        </div>
        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
      </div>

      {/* 4. Check-in via SMS — paid only, coming soon */}
      <div className="flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label className="text-foreground">Check-in via SMS</Label>
            <p className="text-xs text-muted-foreground">Send an SMS to confirm your check-in</p>
          </div>
          {!isPaidPlan && <Badge variant="outline" className="text-xs ml-2"><Lock className="w-3 h-3 mr-1" />Paid</Badge>}
        </div>
        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
      </div>
    </div>
  );
};

export default CheckInMethods;
