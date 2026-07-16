import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useContacts } from '@/hooks/useContacts';
import { usePlan, PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES, PlanTier } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Bell, Shield, Save, Mail, Phone, AlertTriangle, Clock, Users, FileText, Plus, Trash2, Lock, Download, Database, ChevronDown, Info, Check, ShieldCheck, LogOut, Monitor, Smartphone, Laptop, Globe, Trash, PartyPopper, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ContactTypePermissions from '@/components/contacts/ContactTypePermissions';
import SecurityQuestionsManager from '@/components/contacts/SecurityQuestionsManager';
import { ContactTypePermissions as ContactTypePermissionsType } from '@/types/access-control';
import RichTextEditor from '@/components/ui/rich-text-editor';
import EmailTemplateEditor, { EmailTemplateData } from '@/components/settings/EmailTemplateEditor';
import NotificationTimeline from '@/components/settings/NotificationTimeline';
import UpgradePrompt from '@/components/UpgradePrompt';
import ThemeSelector from '@/components/settings/ThemeSelector';
import SecurityTab from '@/components/settings/SecurityTab';
import { useSearchParams } from 'react-router-dom';
import { formatDateEUShort } from '@/utils/dateUtils';
import { decryptFields } from '@/lib/crypto';
import { useSessionTracker } from '@/hooks/useSessionTracker';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  emergency_instructions?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  emergency_alerts: boolean;
}

type ContactCategory = 'immediate_family' | 'extended_family' | 'close_friends' | 'professional' | 'legal' | 'financial';

interface ActivationRule {
  id: string;
  target_type: 'all' | 'category' | 'contacts';
  contact_category?: ContactCategory;
  contact_ids?: string[];
  delay_hours: number;
  custom_message: string;
  enabled: boolean;
}

const contactTypeLabels: Record<ContactCategory, string> = {
  immediate_family: 'Immediate Family',
  extended_family: 'Extended Family',
  close_friends: 'Close Friends',
  professional: 'Professional',
  legal: 'Legal',
  financial: 'Financial',
};

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

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rewrapVaultKey, vaultKey } = useEncryption();
  const { plan, limits, planExpiresAt, isExpired, rawPlan, isPaid, isFree } = usePlan();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'account';
  const {
    profile, setProfile, notifications, setNotifications,
    activationRules, setActivationRules, typePermissions, setTypePermissions,
    loading, saving, saveProfile, saveNotifications, saveActivationRules,
    addActivationRule, updateActivationRule, deleteActivationRule,
    emailTemplate, setEmailTemplate, saveEmailTemplate, saveTypePermissions,
  } = useSettings();

  const { contacts: emergencyContacts, loading: contactsLoading } = useContacts();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Stripe checkout
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);
  const [upgradedExpiry, setUpgradedExpiry] = useState<string | null>(null);

  const handleStripeCheckout = async (tier: PlanTier) => {
    if (tier === 'free') return;
    setCheckoutLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: tier },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not start checkout', variant: 'destructive' });
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Handle payment success redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const paymentPlan = searchParams.get('plan');
    const checkoutPlan = searchParams.get('checkout');

    if (paymentStatus === 'success' && paymentPlan) {
      const sessionId = searchParams.get('session_id');
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { session_id: sessionId },
          });
          if (error) throw error;
          if (data?.paid) {
            setUpgradedPlan(PLAN_LABELS[data.plan as PlanTier] || data.plan);
            setUpgradedExpiry(data.expires_at);
            setShowPaymentSuccess(true);
            navigate('/settings?tab=account', { replace: true });
          }
        } catch (error: any) {
          toast({ title: 'Verification pending', description: 'Your payment is being processed. Please refresh in a moment.', variant: 'default' });
        }
      };
      verifyPayment();
    } else if (checkoutPlan && (checkoutPlan === 'essential' || checkoutPlan === 'family')) {
      // Auto-trigger checkout after signup/login with plan param
      handleStripeCheckout(checkoutPlan as PlanTier);
    }
  }, []);

  // Auto-lock timeout
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);

  // Vault integrity check
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: number; failed: number; total: number } | null>(null);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaVerifyError, setMfaVerifyError] = useState<string | null>(null);
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // Session management
  const [signingOutAll, setSigningOutAll] = useState(false);
  const { sessions: trackedSessions, loading: sessionsLoading, revokeSession } = useSessionTracker(user?.id);

  useEffect(() => {
    const stored = localStorage.getItem('vault_auto_lock_minutes');
    if (stored) setAutoLockMinutes(parseInt(stored));
  }, []);

  // Check MFA status on mount
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

  // Auto-delete state
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(null);

  // GDPR state
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Account activity
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setLastSignIn(data.user.last_sign_in_at || null);
        setAccountCreatedAt(data.user.created_at || null);
      }
    };
    fetchActivity();
  }, []);

  // Fetch activity check-in and auto-delete settings
  useEffect(() => {
    if (!user) return;
    const fetchSwitchSettings = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('auto_delete_days')
        .eq('user_id', user.id)
        .single();
      if (data) {
        if (data.auto_delete_days) {
          setAutoDeleteEnabled(true);
          setAutoDeleteDays(data.auto_delete_days);
        }
      }
    };
    fetchSwitchSettings();
  }, [user]);

  const handleAutoDeleteChange = async (days: number | null) => {
    if (!user) return;
    setAutoDeleteDays(days);
    await supabase
      .from('user_settings')
      .update({ auto_delete_days: days } as any)
      .eq('user_id', user.id);
    toast({
      title: days ? 'Auto-delete scheduled' : 'Auto-delete disabled',
      description: days
        ? `Your account will be deleted ${days} days after your switch fires.`
        : 'Your account will not be automatically deleted.',
    });
  };

  const passwordChangedAt = typeof window !== 'undefined' ? localStorage.getItem('password_last_changed_at') : null;

  const handleExportData = async () => {
    if (!user) return;
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Unlock your vault first to export your data.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const [contactsRes, docsRes, accountsRes, financialsRes, settingsRes, rulesRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('legacy_documents').select('*').eq('user_id', user.id),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('financial_assets').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('activation_rules').select('*').eq('user_id', user.id),
      ]);

      const stripIvFields = (obj: any) => {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
          if (key.endsWith('_iv') || key === 'encrypted_vault_key' || key === 'vault_key_iv' || key === 'salt') continue;
          cleaned[key] = obj[key];
        }
        return cleaned;
      };

      const decryptAll = async (rows: any[], fields: string[]) =>
        Promise.all((rows || []).map(async (r) => {
          const dec = await decryptFields(r, fields, vaultKey!);
          return stripIvFields({ ...r, ...dec });
        }));

      const contacts = await decryptAll(contactsRes.data || [], ['name', 'phone', 'relationship', 'notes', 'custom_message']);
      const documents = await decryptAll(docsRes.data || [], ['title', 'description', 'content']);
      const accounts = await decryptAll(accountsRes.data || [], ['account_name', 'username', 'credentials', 'website_url', 'notes', 'email', 'platform']);
      const financialAssets = await decryptAll(financialsRes.data || [], ['name', 'institution', 'reference_number', 'notes', 'contact_name', 'contact_phone', 'contact_email']);

      const exportData = {
        exportedAt: new Date().toISOString(),
        contacts,
        documents,
        accounts,
        financialAssets,
        settings: settingsRes.data || {},
        activationRules: rulesRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `legacyvault-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your data has been downloaded." });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportReadable = async () => {
    if (!user) return;
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Unlock your vault first to export your data.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const [contactsRes, docsRes, accountsRes, financialsRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('legacy_documents').select('*').eq('user_id', user.id),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('financial_assets').select('*').eq('user_id', user.id),
      ]);

      const decryptAll = async (rows: any[], fields: string[]) =>
        Promise.all((rows || []).map(async (r) => {
          try {
            const dec = await decryptFields(r, fields, vaultKey!);
            return { ...r, ...dec };
          } catch { return r; }
        }));

      const contacts = await decryptAll(contactsRes.data || [], ['name', 'phone', 'relationship', 'notes', 'custom_message']);
      const documents = await decryptAll(docsRes.data || [], ['title', 'description', 'content']);
      const accounts = await decryptAll(accountsRes.data || [], ['account_name', 'username', 'website_url', 'notes', 'email', 'platform']);
      const financialAssets = await decryptAll(financialsRes.data || [], ['name', 'institution', 'reference_number', 'notes', 'contact_name', 'contact_phone', 'contact_email']);

      const date = new Date().toLocaleDateString();
      let text = `=== LEGACYVAULT EXPORT ===\nExported: ${date}\n\n`;

      text += `--- CONTACTS ---\n`;
      contacts.forEach((c: any) => {
        text += `• ${c.name || 'Unnamed'} | ${c.email || ''} | ${c.phone || ''} | Type: ${c.contact_type || ''}\n`;
      });

      text += `\n--- DOCUMENTS ---\n`;
      documents.forEach((d: any) => {
        text += `\n${d.title || 'Untitled'}`;
        text += `\n  Type: ${d.document_type || 'unknown'}`;
        if (d.description) text += `\n  Description: ${d.description}`;
        text += `\n  Added: ${d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB') : 'unknown'}`;
        if (d.content) text += `\n  Content: ${d.content.substring(0, 200)}${d.content.length > 200 ? '...' : ''}`;
        text += '\n';
      });

      text += `\n--- DIGITAL ACCOUNTS ---\n`;
      accounts.forEach((a: any) => {
        text += `• ${a.account_name || 'Unnamed'} | Type: ${a.account_type || ''} | Email: ${a.email || ''} | Username: ${a.username || ''} | Closure: ${a.closure_action || ''}\n`;
      });

      text += `\n--- FINANCIAL ASSETS ---\n`;
      financialAssets.forEach((f: any) => {
        const ref = f.reference_number ? f.reference_number.replace(/./g, (c: string, i: number) => i < f.reference_number.length - 4 ? '•' : c) : '';
        text += `• ${f.name || 'Unnamed'} | Category: ${f.category || ''} | Institution: ${f.institution || ''} | Ref: ${ref} | Value: ${f.estimated_value ? `$${f.estimated_value.toLocaleString()}` : 'N/A'}\n`;
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `legacyvault-export-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your data has been downloaded as readable text." });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-own-account', {
        body: { password: deletePassword },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setDeletePassword('');
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

  const handleSaveTypePermissions = async (updatedPermissions: ContactTypePermissionsType[]) => {
    await saveTypePermissions(updatedPermissions);
  };

  const toggleContactSelection = (ruleId: string, contactId: string) => {
    setActivationRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        const currentContacts = rule.contact_ids || [];
        const isSelected = currentContacts.includes(contactId);
        return { ...rule, contact_ids: isSelected ? currentContacts.filter(id => id !== contactId) : [...currentContacts, contactId] };
      }
      return rule;
    }));
  };

  const formatActivityDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading || contactsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full bg-muted/30 rounded-2xl p-1.5 mb-6">
              <TabsTrigger value="account" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <User className="w-4 h-4 mr-1.5" />Account
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <Lock className="w-4 h-4 mr-1.5" />Security
              </TabsTrigger>
              <TabsTrigger value="emails" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <Mail className="w-4 h-4 mr-1.5" />Switch Emails
              </TabsTrigger>
              <TabsTrigger value="activation" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <Bell className="w-4 h-4 mr-1.5" />Who Gets Notified
              </TabsTrigger>
              <TabsTrigger value="access" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <Shield className="w-4 h-4 mr-1.5" />Access Control
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <Bell className="w-4 h-4 mr-1.5" />Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all px-3 py-2">
                <Database className="w-4 h-4 mr-1.5" />Privacy
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── ACCOUNT TAB ─── */}
          <TabsContent value="account">
            <AccountTab
              user={user}
              profile={profile}
              setProfile={setProfile}
              saving={saving}
              saveProfile={saveProfile}
              plan={plan}
              planExpiresAt={planExpiresAt}
              isExpired={isExpired}
              isPaid={isPaid}
              checkoutLoading={checkoutLoading}
              handleStripeCheckout={handleStripeCheckout}
            />
          </TabsContent>

          {/* ─── SECURITY TAB ─── */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <SecurityTab
              user={user}
              vaultKey={vaultKey}
              rewrapVaultKey={rewrapVaultKey}
              limits={limits}
              emergencyContacts={emergencyContacts}
              contactTypeLabels={contactTypeLabels}
            />
          </TabsContent>

          {/* ─── SWITCH EMAILS TAB ─── */}
          <TabsContent value="emails" className="space-y-6 mt-6">
            {limits.customEmail ? (
              <EmailTemplateEditor template={emailTemplate} onChange={setEmailTemplate} onSave={saveEmailTemplate} saving={saving} userName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Your Name'} />
            ) : (
              <UpgradePrompt message="Custom email templates require the Essential plan or higher." featureKey="customEmail" />
            )}
          </TabsContent>

          {/* ─── NOTIFICATION TIMELINE TAB ─── */}
          <TabsContent value="activation" className="space-y-6 mt-6">
            {limits.activationRules ? (
            <NotificationTimeline
              activationRules={activationRules}
              emergencyContacts={emergencyContacts}
              contactTypeLabels={contactTypeLabels}
              addActivationRule={addActivationRule}
              updateActivationRule={updateActivationRule}
              deleteActivationRule={deleteActivationRule}
              toggleContactSelection={toggleContactSelection}
              saveActivationRules={saveActivationRules}
            />
            ) : (
              <UpgradePrompt message="Activation rules require the Essential plan or higher." featureKey="activationRules" />
            )}
          </TabsContent>

          {/* ─── ACCESS CONTROL TAB ─── */}
          <TabsContent value="access" className="space-y-6 mt-6">
            <ContactTypePermissions typePermissions={typePermissions} onUpdate={handleSaveTypePermissions} />
          </TabsContent>

          {/* ─── NOTIFICATIONS TAB ─── */}
          <TabsContent value="notifications">
            <NotificationsTab notifications={notifications} setNotifications={setNotifications} />
          </TabsContent>

          {/* ─── PRIVACY TAB ─── */}
          <TabsContent value="privacy">
            <PrivacyTab
              vaultKey={vaultKey}
              autoDeleteEnabled={autoDeleteEnabled}
              autoDeleteDays={autoDeleteDays}
              setAutoDeleteEnabled={setAutoDeleteEnabled}
              handleAutoDeleteChange={handleAutoDeleteChange}
              exporting={exporting}
              handleExportData={handleExportData}
              handleExportReadable={handleExportReadable}
              lastSignIn={lastSignIn}
              accountCreatedAt={accountCreatedAt}
              passwordChangedAt={passwordChangedAt}
              formatActivityDate={formatActivityDate}
              showDeleteConfirm={showDeleteConfirm}
              setShowDeleteConfirm={setShowDeleteConfirm}
              deleteConfirmText={deleteConfirmText}
              setDeleteConfirmText={setDeleteConfirmText}
              deletePassword={deletePassword}
              setDeletePassword={setDeletePassword}
              deletingAccount={deletingAccount}
              handleDeleteAccount={handleDeleteAccount}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Success Dialog */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
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
                setShowPaymentSuccess(false);
                window.location.reload();
              }}
            >
              Start Exploring
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
