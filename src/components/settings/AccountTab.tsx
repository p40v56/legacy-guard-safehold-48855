import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Save, Sparkles, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES, PlanTier } from '@/hooks/usePlan';
import { formatDateEUShort } from '@/utils/dateUtils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AccountTabProps {
  user: SupabaseUser | null;
  profile: any;
  setProfile: (p: any) => void;
  saving: boolean;
  saveProfile: () => void | Promise<void>;
  plan: PlanTier;
  planExpiresAt: string | null;
  isExpired: boolean;
  isPaid: boolean;
  checkoutLoading: string | null;
  handleStripeCheckout: (tier: PlanTier) => void;
}

const AccountTab = ({
  user, profile, setProfile, saving, saveProfile,
  plan, planExpiresAt, isExpired, isPaid,
  checkoutLoading, handleStripeCheckout,
}: AccountTabProps) => {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center"><User className="w-5 h-5 mr-2 text-primary" />Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label className="text-foreground">First Name</Label><Input value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} placeholder="Enter your first name" /></div>
            <div><Label className="text-foreground">Last Name</Label><Input value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} placeholder="Enter your last name" /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Email</Label>
              <Input value={profile.email} disabled />
              <p className="text-xs text-muted-foreground mt-1">
                To change your email address, contact{' '}
                <a href="mailto:support@legacyvault.app" className="text-primary hover:underline">support@legacyvault.app</a>
              </p>
            </div>
            <div><Label className="text-foreground">Phone Number</Label><Input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+1 (555) 123-4567" /></div>
          </div>
          <Button onClick={saveProfile} disabled={saving} variant="default">
            {saving ? (<><LoadingSpinner size="sm" className="mr-2" />Saving...</>) : (<><Save className="w-4 h-4 mr-2" />Save Profile</>)}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader><CardTitle className="text-foreground">Account Status & Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Plan</span>
            <Badge className={
              isExpired ? 'bg-destructive/20 text-destructive border-destructive/30' :
              plan === 'family' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
              plan === 'essential' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-success/20 text-success border-success/30'
            }>
              {isExpired ? 'Expired' : PLAN_LABELS[plan]}
            </Badge>
          </div>
          {isExpired && planExpiresAt && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <p className="text-sm text-destructive font-medium">Your plan expired on {formatDateEUShort(planExpiresAt)}.</p>
              <p className="text-sm text-muted-foreground mt-1">Your data is preserved. Renew to restore full access.</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleStripeCheckout('essential')}
                  disabled={checkoutLoading === 'essential'}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === 'essential' ? 'Redirecting...' : 'Renew Essential (£49/year) →'}
                </button>
                <button
                  onClick={() => handleStripeCheckout('family')}
                  disabled={checkoutLoading === 'family'}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === 'family' ? 'Redirecting...' : 'Renew Family (£99/year) →'}
                </button>
              </div>
            </div>
          )}
          {isPaid && !isExpired && planExpiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span className="text-card-foreground font-medium">{formatDateEUShort(planExpiresAt)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {(['free', 'essential', 'family'] as PlanTier[]).map(tier => {
              const isCurrent = plan === tier;
              const lim = PLAN_LIMITS[tier];
              return (
                <div key={tier} className={`rounded-xl p-4 border transition-all duration-200 ${isCurrent ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/30 scale-[1.02]' : 'border-border bg-muted/20 opacity-80'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-card-foreground">{PLAN_LABELS[tier]}</h4>
                      {isCurrent && <Badge variant="secondary" className="text-[10px]">Current plan</Badge>}
                    </div>
                    <span className="text-sm font-semibold text-card-foreground">{PLAN_PRICES[tier]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>👥 {lim.maxContacts === Infinity ? 'Unlimited contacts' : `${lim.maxContacts} trusted ${lim.maxContacts === 1 ? 'contact' : 'contacts'}`}</p>
                    <p>📄 {lim.maxDocuments === Infinity ? 'Unlimited documents' : `${lim.maxDocuments} ${lim.maxDocuments === 1 ? 'document' : 'documents'}`}</p>
                    <p>💰 {lim.maxFinancialAssets === Infinity ? 'Unlimited financial assets' : `${lim.maxFinancialAssets} financial ${lim.maxFinancialAssets === 1 ? 'asset' : 'assets'}`}</p>
                    <p>🌐 {lim.maxAccounts === Infinity ? 'Unlimited digital accounts' : lim.maxAccounts === 0 ? 'No digital accounts' : `${lim.maxAccounts} digital ${lim.maxAccounts === 1 ? 'account' : 'accounts'}`}</p>
                    <p>💾 {lim.maxStorageMb === 0 ? 'No file storage' : lim.maxStorageMb >= 1024 ? `${lim.maxStorageMb / 1024} GB storage` : `${lim.maxStorageMb} MB storage`}</p>
                    <p>{lim.portalAccess ? '✓ Contact portals' : '✗ No contact portals'}</p>
                  </div>
                  {!isCurrent && (() => {
                    const planOrder = { free: 0, essential: 1, family: 2 };
                    const currentOrder = planOrder[plan] || 0;
                    const tierOrder = planOrder[tier] || 0;
                    const isUpgrade = tierOrder > currentOrder;
                    if (tier === 'free') return null;

                    const PLAN_PRICES_PENCE: Record<string, number> = { free: 0, essential: 4900, family: 9900 };
                    let proratedLabel = '';
                    if (isUpgrade && plan !== 'free' && planExpiresAt) {
                      const now = new Date();
                      const expiry = new Date(planExpiresAt);
                      const msRemaining = expiry.getTime() - now.getTime();
                      if (msRemaining > 0) {
                        const msInYear = 365.25 * 24 * 60 * 60 * 1000;
                        const fraction = Math.min(msRemaining / msInYear, 1);
                        const diff = PLAN_PRICES_PENCE[tier] - PLAN_PRICES_PENCE[plan];
                        const prorated = Math.max(Math.round(diff * fraction), 100);
                        proratedLabel = `£${(prorated / 100).toFixed(2)} prorated`;
                      }
                    }

                    const actionLabel = isUpgrade ? `Upgrade to ${PLAN_LABELS[tier]}` : `Switch to ${PLAN_LABELS[tier]}`;
                    return (
                      <div className="mt-4 space-y-1.5">
                        {proratedLabel && (
                          <p className="text-[11px] text-muted-foreground text-center">
                            Only <span className="text-foreground font-medium">{proratedLabel}</span> for the remaining period
                          </p>
                        )}
                        <Button
                          onClick={() => handleStripeCheckout(tier)}
                          disabled={checkoutLoading === tier}
                          variant={isUpgrade ? 'default' : 'outline'}
                          size="sm"
                          className={`w-full group/btn relative overflow-hidden ${
                            isUpgrade
                              ? 'bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300'
                              : ''
                          }`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {checkoutLoading === tier ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Redirecting...
                              </>
                            ) : (
                              <>
                                {isUpgrade && <Sparkles className="w-4 h-4 group-hover/btn:animate-wiggle" />}
                                {actionLabel}
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                              </>
                            )}
                          </span>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;
