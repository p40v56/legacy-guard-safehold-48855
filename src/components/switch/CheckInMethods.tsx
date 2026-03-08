import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mail, CheckCircle, ChevronDown } from 'lucide-react';

interface CheckInMethodsProps {
  smsCheckinEnabled: boolean;
  hasPhone: boolean;
  smsNotificationsEnabled: boolean;
  onSmsCheckinChange: (enabled: boolean) => void;
  isPaidPlan?: boolean;
}

const CheckInMethods = ({
  smsCheckinEnabled,
  hasPhone,
  smsNotificationsEnabled,
  onSmsCheckinChange,
  isPaidPlan = true,
}: CheckInMethodsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-muted/30 rounded-2xl p-6">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-medium text-card-foreground">Check-in Options</h3>
                <p className="text-sm text-muted-foreground">Alternative ways to check in</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <Label className="text-foreground">Check-in via email link</Label>
                  <p className="text-xs text-muted-foreground">
                    A check-in link is included in every grace period reminder email.
                    Click it to confirm you're alive without opening the app.
                  </p>
                </div>
              </div>
              <Badge className="bg-success/20 text-success border-success/30 text-xs">Active</Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              SMS and voice check-in methods are planned for a future release.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CheckInMethods;
