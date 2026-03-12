import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mail, Globe, ChevronDown, Link2, LogIn } from 'lucide-react';

interface CheckInMethodsProps {
  emailCheckinEnabled: boolean;
  onEmailCheckinChange: (enabled: boolean) => void;
  activityCheckinEnabled?: boolean;
  onActivityCheckinChange?: (enabled: boolean) => void;
  isPaidPlan?: boolean;
}

const CheckInMethods = ({
  emailCheckinEnabled,
  onEmailCheckinChange,
  activityCheckinEnabled = false,
  onActivityCheckinChange,
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
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-medium text-card-foreground">Check-in Options</h3>
                <p className="text-sm text-muted-foreground">How you can confirm you're safe</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-6 space-y-5">
            {/* Website check-in — always active */}
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-foreground font-medium">Check-in via website</Label>
                  <p className="text-xs text-muted-foreground">
                    Check in directly from the dashboard or Switch page.
                  </p>
                </div>
              </div>
              <Badge className="bg-success/20 text-success border-success/30 text-xs">Always active</Badge>
            </div>

            {/* Email check-in — toggleable */}
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-foreground font-medium">Check-in via email link <span className="font-normal text-muted-foreground">(+24h)</span></Label>
                  <p className="text-xs text-muted-foreground">
                    {emailCheckinEnabled
                      ? 'A one-click check-in link is included in reminder and grace period emails. Clicking it extends your deadline by 24 hours only — use the website for a full check-in.'
                      : 'Enable to include a one-click check-in link in reminder and grace period emails. Extends your deadline by 24 hours only.'}
                  </p>
                </div>
              </div>
              <Switch
                checked={emailCheckinEnabled}
                onCheckedChange={onEmailCheckinChange}
              />
            </div>

            {/* Activity-based check-in */}
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-foreground font-medium">Activity-based check-in</Label>
                  <p className="text-xs text-muted-foreground">
                    Any login to LegacyVault automatically counts as a check-in and resets your countdown. You still receive reminders before the deadline.
                  </p>
                </div>
              </div>
              <Switch
                checked={activityCheckinEnabled}
                onCheckedChange={(checked) => onActivityCheckinChange?.(checked)}
              />
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
