import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mail, Phone, PhoneCall, Lock, MessageSquare, ChevronDown } from 'lucide-react';

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
            <div className="flex items-center justify-between opacity-60">
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CheckInMethods;
