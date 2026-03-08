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
import { User, Bell, Shield, Save, Mail, Phone, AlertTriangle, Clock, Users, FileText, Plus, Trash2, Lock, Download, Database, ChevronDown, Info, Check, ShieldCheck, LogOut, Monitor, Smartphone, Laptop, Globe, Trash } from 'lucide-react';
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

  // Auto-lock timeout
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);

  // Vault integrity check
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: number; failed: number; total: number } | null>(null);

  // Session management
  const [signingOutAll, setSigningOutAll] = useState(false);
  const { sessions: trackedSessions, loading: sessionsLoading, revokeSession } = useSessionTracker(user?.id);

  useEffect(() => {
    const stored = localStorage.getItem('vault_auto_lock_minutes');
    if (stored) setAutoLockMinutes(parseInt(stored));
  }, []);

  const handleAutoLockChange = (minutes: number) => {
    setAutoLockMinutes(minutes);
    localStorage.setItem('vault_auto_lock_minutes', minutes.toString());
    toast({ title: 'Auto-lock updated', description: `Vault will lock after ${minutes === 60 ? '1 hour' : minutes === 240 ? '4 hours' : `${minutes} minutes`} of inactivity.` });
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
          <TabsContent value="account" className="space-y-6 mt-6">
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
                    <p className="text-sm text-muted-foreground mt-1">Your data is preserved. Contact us to renew.</p>
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
                    const userEmail = user?.email || '';
                    return (
                      <div key={tier} className={`rounded-xl p-4 border ${isCurrent ? 'border-2 border-primary bg-primary/5 shadow-md' : 'border-border bg-muted/20'}`}>
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
                        {!isCurrent && tier !== 'free' && (
                          <a
                            href={`mailto:support@legacyvault.app?subject=${encodeURIComponent(`LegacyVault upgrade request — ${PLAN_LABELS[tier]} plan`)}&body=${encodeURIComponent(`I'd like to upgrade to the ${PLAN_LABELS[tier]} plan (${PLAN_PRICES[tier]}). My account email is: ${userEmail}`)}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Upgrade to {PLAN_LABELS[tier]} →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <ThemeSelector />
          </TabsContent>

          {/* ─── SECURITY TAB ─── */}
          <TabsContent value="security" className="space-y-4 mt-6">
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
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader><CardTitle className="text-foreground flex items-center"><Bell className="w-5 h-5 mr-2 text-primary" />Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">Email Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via email</p></div></div>
                  <Switch checked={notifications.email_notifications} onCheckedChange={checked => setNotifications({...notifications, email_notifications: checked})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">SMS Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via text message</p></div></div>
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center space-x-3"><Shield className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">Emergency Alerts</Label><p className="text-sm text-muted-foreground">Critical notifications for emergency situations</p></div></div>
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center"><Shield className="w-5 h-5 mr-2 text-primary" />Portal access alerts</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  You are automatically notified by email when a trusted contact accesses their portal (once per 24 hours per contact).
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-medium text-sm">Portal access notifications</p>
                    <p className="text-sm text-muted-foreground">Email sent when a contact opens their portal</p>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Always on</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PRIVACY TAB ─── */}
          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center"><Download className="w-5 h-5 mr-2 text-primary" />Export Your Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download a complete copy of all your data including contacts, documents, accounts, and financial assets. Data is decrypted locally before export.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportData} disabled={exporting} variant="default">
                    {exporting ? (<><LoadingSpinner size="sm" className="mr-2" />Exporting...</>) : (<><Download className="w-4 h-4 mr-2" />Download as JSON</>)}
                  </Button>
                  <Button onClick={handleExportReadable} disabled={exporting} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />Download as readable text
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center"><Clock className="w-5 h-5 mr-2 text-primary" />Recent account activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Last sign in</span>
                    <span className="text-sm text-foreground font-medium">{formatActivityDate(lastSignIn)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Password last changed</span>
                    <span className="text-sm text-foreground font-medium">{passwordChangedAt ? formatActivityDate(passwordChangedAt) : 'Never'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Account created</span>
                    <span className="text-sm text-foreground font-medium">{formatActivityDate(accountCreatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none rounded-2xl border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center"><Trash2 className="w-5 h-5 mr-2" />Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  {!showDeleteConfirm ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button onClick={() => setShowDeleteConfirm(true)} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-4 h-4 mr-2" />Delete my account
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-destructive font-medium">
                        This will permanently delete all your data. This cannot be undone.
                      </p>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:</p>
                        <Input
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          className="bg-background border-destructive/30 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Enter your password to confirm</Label>
                        <Input
                          type="password"
                          value={deletePassword}
                          onChange={e => setDeletePassword(e.target.value)}
                          placeholder="Your current password"
                          className="bg-background border-destructive/30 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeletePassword(''); }} className="rounded-xl">
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deletingAccount}
                          onClick={handleDeleteAccount}
                        >
                          {deletingAccount ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                          Delete permanently
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your encryption keys are derived from your password. Once deleted, your data cannot be recovered by anyone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
