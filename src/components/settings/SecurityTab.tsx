import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { decryptFields } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Lock, Shield, ShieldCheck, LogOut, Monitor, Smartphone, ChevronDown, Trash } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SecurityQuestionsManager from '@/components/contacts/SecurityQuestionsManager';
import UpgradePrompt from '@/components/UpgradePrompt';
import { EmergencyContact } from '@/types/access-control';
import { PlanLimits } from '@/hooks/usePlan';

const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
  if (password.length === 0) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-destructive', width: '20%' };
  if (score === 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (score === 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (score === 4) return { label: 'Strong', color: 'bg-primary', width: '80%' };
  return { label: 'Very Strong', color: 'bg-success', width: '100%' };
};

interface SecurityTabProps {
  user: User | null;
  vaultKey: CryptoKey | null;
  rewrapVaultKey: (newPassword: string, userId: string) => Promise<unknown>;
  limits: PlanLimits;
  emergencyContacts: EmergencyContact[];
  contactTypeLabels: Record<string, string>;
}

const SecurityTab = ({ user, vaultKey, rewrapVaultKey, limits, emergencyContacts, contactTypeLabels }: SecurityTabProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [autoLockMinutes, setAutoLockMinutes] = useState(15);

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: number; failed: number; total: number } | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaVerifyError, setMfaVerifyError] = useState<string | null>(null);
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const [signingOutAll, setSigningOutAll] = useState(false);
  const { sessions: trackedSessions, loading: sessionsLoading, revokeSession } = useSessionTracker(user?.id);

  useEffect(() => {
    const stored = localStorage.getItem('vault_auto_lock_minutes');
    if (stored) setAutoLockMinutes(parseInt(stored));
  }, []);

  useEffect(() => {
    const checkMfa = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactor = data?.totp?.find(f => f.status === 'verified');
      if (totpFactor) {
        setMfaEnabled(true);
        setMfaFactorId(totpFactor.id);
      }
    };
    if (user) checkMfa();
  }, [user]);

  const handleAutoLockChange = (minutes: number) => {
    setAutoLockMinutes(minutes);
    localStorage.setItem('vault_auto_lock_minutes', minutes.toString());
    toast({ title: 'Auto-lock updated', description: `Vault will lock after ${minutes === 60 ? '1 hour' : minutes === 240 ? '4 hours' : `${minutes} minutes`} of inactivity.` });
  };

  const handleEnableMfa = async () => {
    setMfaLoading(true);
    setMfaVerifyError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'LegacyVault Authenticator',
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaFactorId(data.id);
      setShowMfaSetup(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaFactorId || mfaVerifyCode.length !== 6) return;
    setMfaVerifying(true);
    setMfaVerifyError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaVerifyCode,
      });
      if (verifyError) {
        setMfaVerifyError('Incorrect code. Please try again.');
        return;
      }

      setMfaEnabled(true);
      setShowMfaSetup(false);
      setQrCode(null);
      setMfaSecret(null);
      setMfaVerifyCode('');
      toast({ title: '2FA enabled ✓', description: 'Two-factor authentication is now active on your account.' });
    } catch (error: any) {
      setMfaVerifyError(error.message || 'Verification failed');
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaFactorId) return;
    setMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) throw error;
      setMfaEnabled(false);
      setMfaFactorId(null);
      toast({ title: '2FA disabled', description: 'Two-factor authentication has been removed.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyVault = async () => {
    if (!vaultKey || !user) {
      toast({ title: 'Vault locked', description: 'Unlock your vault first.', variant: 'destructive' });
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const results = { ok: 0, failed: 0, total: 0 };
      const [docsRes, accountsRes, contactsRes, financialsRes] = await Promise.all([
        supabase.from('legacy_documents').select('id, title, title_iv').eq('user_id', user.id),
        supabase.from('accounts').select('id, account_name, account_name_iv').eq('user_id', user.id),
        supabase.from('contacts').select('id, name, name_iv').eq('user_id', user.id),
        supabase.from('financial_assets').select('id, name, name_iv').eq('user_id', user.id),
      ]);
      const allItems = [
        ...(docsRes.data || []).map(d => ({ id: d.id, value: d.title, iv: d.title_iv })),
        ...(accountsRes.data || []).map(a => ({ id: a.id, value: a.account_name, iv: a.account_name_iv })),
        ...(contactsRes.data || []).map(c => ({ id: c.id, value: c.name, iv: c.name_iv })),
        ...(financialsRes.data || []).map(f => ({ id: f.id, value: f.name, iv: f.name_iv })),
      ].filter(item => item.iv);
      results.total = allItems.length;
      for (const item of allItems) {
        try {
          await decryptFields({ value: item.value, value_iv: item.iv }, ['value'], vaultKey);
          results.ok++;
        } catch {
          results.failed++;
        }
      }
      setVerifyResult(results);
    } catch (error) {
      toast({ title: 'Verification failed', description: 'Could not complete vault check.', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({ title: 'Signed out everywhere', description: 'All active sessions have been terminated.' });
      navigate('/auth');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to sign out all sessions.', variant: 'destructive' });
    } finally {
      setSigningOutAll(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters. Your password is also your encryption key — use something strong.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      if (user.id) {
        await rewrapVaultKey(newPassword, user.id);
      }

      localStorage.setItem('password_last_changed_at', new Date().toISOString());
      toast({ title: "Success", description: "Password updated successfully" });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mfaEnabled ? 'bg-success/20' : 'bg-muted/50'}`}>
              <Smartphone className={`w-5 h-5 ${mfaEnabled ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium text-card-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {mfaEnabled
                  ? 'Enabled — your account is protected with an authenticator app'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>
          {mfaEnabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisableMfa}
              disabled={mfaLoading}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {mfaLoading ? 'Removing...' : 'Remove 2FA'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableMfa}
              disabled={mfaLoading || showMfaSetup}
              className="rounded-xl"
            >
              {mfaLoading ? 'Setting up...' : 'Enable 2FA'}
            </Button>
          )}
        </div>

        {showMfaSetup && qrCode && (
          <div className="p-5 bg-card rounded-2xl border border-primary/30 space-y-5">
            <div>
              <h4 className="font-medium text-card-foreground mb-1">Scan with your authenticator app</h4>
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy, or any TOTP app to scan this QR code.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl border border-border">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {mfaSecret && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</p>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                  <code className="text-xs font-mono text-card-foreground flex-1 break-all">
                    {mfaSecret}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(mfaSecret)}
                    className="text-primary hover:text-primary/80 text-xs shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-card-foreground font-medium">
                Enter the 6-digit code from your app to confirm setup:
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={mfaVerifyCode}
                onChange={e => {
                  setMfaVerifyCode(e.target.value.replace(/\D/g, ''));
                  setMfaVerifyError(null);
                }}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-[0.5em] h-14 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {mfaVerifyError && (
                <p className="text-sm text-destructive">{mfaVerifyError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleVerifyMfa}
                disabled={mfaVerifyCode.length !== 6 || mfaVerifying}
                className="bg-primary hover:bg-primary/90 rounded-xl flex-1"
              >
                {mfaVerifying ? 'Verifying...' : 'Activate 2FA'}
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  if (mfaFactorId) {
                    await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
                  }
                  setShowMfaSetup(false);
                  setQrCode(null);
                  setMfaSecret(null);
                  setMfaFactorId(null);
                  setMfaVerifyCode('');
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center"><Lock className="w-5 h-5 mr-2 text-primary" />Change Password</div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label className="text-foreground">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div>
                <Label className="text-foreground">New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                {newPassword.length > 0 && (() => {
                  const s = getPasswordStrength(newPassword);
                  return (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${s.color}`}
                          style={{ width: s.width }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  );
                })()}
              </div>
              <div>
                <Label className="text-foreground">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} variant="default">
                {changingPassword ? (<><LoadingSpinner size="sm" className="mr-2" />Changing...</>) : (<><Lock className="w-4 h-4 mr-2" />Change Password</>)}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center"><Shield className="w-5 h-5 mr-2 text-primary" />Vault Auto-Lock</div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <Select value={autoLockMinutes.toString()} onValueChange={(v) => handleAutoLockChange(parseInt(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes (default)</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                When your vault locks, encryption keys are cleared from memory. You will need to re-enter your password to access encrypted data.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center"><Shield className="w-5 h-5 mr-2 text-primary" />Portal Security Questions</div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2 text-left">
                Contacts must answer a security question before accessing their portal.
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {limits.securityQuestions ? (
                <SecurityQuestionsManager contacts={emergencyContacts} contactTypeLabels={contactTypeLabels} />
              ) : (
                <UpgradePrompt message="Security questions require the Essential plan or higher." featureKey="securityQuestions" />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-primary" />Vault Integrity</div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-muted-foreground">
                Verify that all your encrypted data can be successfully decrypted with your current password.
              </p>
              <Button onClick={handleVerifyVault} disabled={verifying} variant="outline" className="rounded-xl">
                {verifying ? (<><LoadingSpinner size="sm" className="mr-2" />Verifying...</>) : (<><ShieldCheck className="w-4 h-4 mr-2" />Verify vault integrity</>)}
              </Button>
              {verifyResult && (
                <div className={`rounded-xl p-4 border ${verifyResult.failed === 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  {verifyResult.failed === 0 ? (
                    <p className="text-sm text-success font-medium">✓ All {verifyResult.total} encrypted items verified successfully.</p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">⚠ {verifyResult.failed} of {verifyResult.total} items could not be decrypted. Your vault key may have changed. Try changing your password.</p>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center"><LogOut className="w-5 h-5 mr-2 text-primary" />Sessions</div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {sessionsLoading ? (
                <div className="flex justify-center py-4"><LoadingSpinner /></div>
              ) : trackedSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions tracked yet.</p>
              ) : (
                <div className="space-y-3">
                  {trackedSessions.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {s.is_mobile ? (
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Monitor className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {s.device_name || 'Unknown device'}
                          </span>
                          {s.is_current && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                              <span className="text-xs text-success font-medium">Current</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.is_current ? 'default' : 'secondary'} className="text-xs">
                            {s.is_current ? 'Active' : 'Tracked'}
                          </Badge>
                          {!s.is_current && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeSession(s.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                        <div>
                          <span className="text-muted-foreground">Browser: </span>
                          <span className="text-foreground">{s.browser || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">OS: </span>
                          <span className="text-foreground">{s.os || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last active: </span>
                          <span className="text-foreground">
                            {new Date(s.last_active_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">First seen: </span>
                          <span className="text-foreground">
                            {new Date(s.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <p className="text-sm text-muted-foreground">
                If you think your account has been compromised, sign out of all devices immediately.
              </p>
              <Button onClick={handleSignOutAll} disabled={signingOutAll} variant="destructive" className="rounded-xl">
                <LogOut className="w-4 h-4 mr-2" />
                {signingOutAll ? 'Signing out...' : 'Sign out of all devices'}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default SecurityTab;
