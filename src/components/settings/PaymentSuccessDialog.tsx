import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, PartyPopper, Check } from 'lucide-react';
import { formatDateEUShort } from '@/utils/dateUtils';

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  upgradedPlan: string | null;
  upgradedExpiry: string | null;
}

const PaymentSuccessDialog = ({ open, onOpenChange, upgradedPlan, upgradedExpiry }: PaymentSuccessDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-card border-border max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 text-foreground text-xl">
          <div className="p-2.5 rounded-xl bg-primary/15">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          Welcome to {upgradedPlan}!
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 mt-2">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 mb-4">
            <PartyPopper className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">Payment Successful!</h3>
          <p className="text-muted-foreground text-sm">
            Thank you for upgrading to <strong className="text-foreground">{upgradedPlan}</strong>.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span className="text-card-foreground">Your plan is now active</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span className="text-card-foreground">All premium features unlocked</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span className="text-card-foreground">Increased storage & limits</span>
          </div>
          {upgradedExpiry && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-card-foreground">
                Valid until {formatDateEUShort(upgradedExpiry)}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          A confirmation email has been sent to your registered email address.
        </p>

        <Button
          className="w-full"
          onClick={() => {
            onOpenChange(false);
            window.location.reload();
          }}
        >
          Start Exploring
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default PaymentSuccessDialog;
