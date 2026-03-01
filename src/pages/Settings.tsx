import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useContacts } from '@/hooks/useContacts';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Bell, Shield, Save, Mail, Phone, AlertTriangle, Clock, Users, FileText, Plus, Trash2, Lock, Download, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ContactTypePermissions from '@/components/contacts/ContactTypePermissions';
import SecurityQuestionsManager from '@/components/contacts/SecurityQuestionsManager';
import { ContactTypePermissions as ContactTypePermissionsType } from '@/types/access-control';
import RichTextEditor from '@/components/ui/rich-text-editor';
import EmailTemplateEditor, { EmailTemplateData } from '@/components/settings/EmailTemplateEditor';
import { useSearchParams } from 'react-router-dom';
import { formatDateEUShort } from '@/utils/dateUtils';
import { decryptFields } from '@/lib/crypto';

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
  target_type: 'category' | 'contacts';
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

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rewrapVaultKey, vaultKey } = useEncryption();
  const { plan, planExpiresAt, isExpired, rawPlan } = usePlan();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'profile';
  const {
    profile, setProfile, notifications, setNotifications,
    activationRules, setActivationRules, typePermissions, setTypePermissions,
    loading, saving, saveProfile, saveNotifications, saveActivationRules,
    addActivationRule, updateActivationRule, deleteActivationRule,
    emailTemplate, setEmailTemplate, saveEmailTemplate,
  } = useSettings();

  const { contacts: emergencyContacts, loading: contactsLoading } = useContacts();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // GDPR state
  const [exporting, setExporting] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-own-account');
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText('');
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      // Verify old password by re-authenticating
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
      
      // Re-wrap the vault key with the new password
      if (user.id) {
        await rewrapVaultKey(newPassword, user.id);
      }
      
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

  const saveTypePermissions = async (updatedPermissions: ContactTypePermissionsType[]) => {
    try {
      setTypePermissions(updatedPermissions);
      toast({ title: "Success", description: "Default permissions updated successfully" });
    } catch (error) {
      console.error('Error updating type permissions:', error);
      toast({ title: "Error", description: "Failed to update default permissions", variant: "destructive" });
    }
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
          <TabsList className="grid w-full grid-cols-6 bg-muted/30 rounded-2xl p-1.5 mb-6 overflow-x-auto">
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
              <User className="w-4 h-4 mr-2" />Profile
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
              <Mail className="w-4 h-4 mr-2" />Email
            </TabsTrigger>
            <TabsTrigger value="activation" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
              <AlertTriangle className="w-4 h-4 mr-2" />Rules
            </TabsTrigger>
            <TabsTrigger value="permissions" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
              <Shield className="w-4 h-4 mr-2" />Permissions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
              <Bell className="w-4 h-4 mr-2" />Alerts
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
              <Database className="w-4 h-4 mr-2" />Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
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
                  <div><Label className="text-foreground">Email</Label><Input value={profile.email} disabled /><p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p></div>
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
                    plan === 'paid' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-success/20 text-success border-success/30'
                  }>
                    {isExpired ? 'Expired' : plan === 'paid' ? 'Paid Plan' : 'Free Plan'}
                  </Badge>
                </div>
                {isExpired && planExpiresAt && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <p className="text-sm text-destructive font-medium">Your paid plan expired on {formatDateEUShort(planExpiresAt)}.</p>
                    <p className="text-sm text-muted-foreground mt-1">Your data is preserved. Contact us to renew.</p>
                  </div>
                )}
                {plan === 'paid' && !isExpired && planExpiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-card-foreground font-medium">{formatDateEUShort(planExpiresAt)}</span>
                  </div>
                )}
                {plan === 'paid' ? (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Unlimited contacts with portal access</p>
                    <p>• Unlimited documents & digital accounts</p>
                    <p>• Multi-channel check-in (email, SMS)</p>
                    <p>• Custom deadlines & flexible grace periods</p>
                    <p>• Full email template customization</p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• 1 contact (message only, no portal)</p>
                      <p>• Switch fully functional</p>
                      <p>• Web check-in only</p>
                    </div>
                    <Separator />
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <h4 className="font-medium text-card-foreground mb-1">Paid Plan — £50/year</h4>
                      <p className="text-sm text-muted-foreground mb-3">Unlimited contacts, documents, accounts, portal access, multi-channel check-in, and more.</p>
                      <Button variant="default" className="rounded-full" disabled>
                        Upgrade to Paid Plan
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">Contact us at support@legacyvault.app to upgrade your account.</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center"><Lock className="w-5 h-5 mr-2 text-primary" />Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground">Current Password</Label>
                  <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                </div>
                <div>
                  <Label className="text-foreground">New Password</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                </div>
                <div>
                  <Label className="text-foreground">Confirm New Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} variant="default">
                  {changingPassword ? (<><LoadingSpinner size="sm" className="mr-2" />Changing...</>) : (<><Lock className="w-4 h-4 mr-2" />Change Password</>)}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-6">
            <EmailTemplateEditor template={emailTemplate} onChange={setEmailTemplate} onSave={saveEmailTemplate} saving={saving} userName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Your Name'} />
          </TabsContent>

          <TabsContent value="activation" className="space-y-6 mt-6">
            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <div className="flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-destructive" />Dead Man's Switch Activation Rules</div>
                  <Button onClick={addActivationRule} size="sm" variant="default"><Plus className="w-4 h-4 mr-2" />Add Rule</Button>
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-2">Configure what happens when your Dead Man's Switch is triggered. Rules are executed in order based on delay times.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {activationRules.map((rule, index) => (
                  <div key={rule.id} className="border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">Rule {index + 1}</Badge>
                        <Switch checked={rule.enabled} onCheckedChange={checked => updateActivationRule(rule.id, { enabled: checked })} />
                        <span className="text-foreground text-sm">{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Clock className="w-4 h-4" /><span className="text-sm">{rule.delay_hours === 0 ? 'Immediate' : `${rule.delay_hours}h delay`}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteActivationRule(rule.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-foreground">Target Type</Label>
                        <Select value={rule.target_type} onValueChange={value => updateActivationRule(rule.id, { target_type: value as 'category' | 'contacts', contact_category: value === 'category' ? 'immediate_family' : undefined, contact_ids: value === 'contacts' ? [] : undefined })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="category">Contact Category</SelectItem><SelectItem value="contacts">Specific Contacts</SelectItem></SelectContent>
                        </Select>
                      </div>
                      {rule.target_type === 'category' && (
                        <div>
                          <Label className="text-foreground">Contact Category</Label>
                          <Select value={rule.contact_category} onValueChange={value => updateActivationRule(rule.id, { contact_category: value as ContactCategory })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(contactTypeLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label className="text-foreground">Delay (hours)</Label>
                        <Input type="number" min="0" max="8760" value={rule.delay_hours} onChange={e => updateActivationRule(rule.id, { delay_hours: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>
                    {rule.target_type === 'contacts' && (
                      <div>
                        <Label className="text-foreground">Select Contacts</Label>
                        {emergencyContacts.length === 0 ? (
                          <p className="text-muted-foreground text-sm mt-2">No contacts available.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                            {emergencyContacts.map(contact => (
                              <div key={contact.id} className="flex items-center space-x-2">
                                <Checkbox id={`contact-${rule.id}-${contact.id}`} checked={(rule.contact_ids || []).includes(contact.id)} onCheckedChange={() => toggleContactSelection(rule.id, contact.id)} />
                                <label htmlFor={`contact-${rule.id}-${contact.id}`} className="text-sm text-foreground cursor-pointer flex-1">{contact.name} {contact.relationship && `(${contact.relationship})`}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <Label className="text-foreground">Custom Message</Label>
                      <RichTextEditor value={rule.custom_message} onChange={(value) => updateActivationRule(rule.id, { custom_message: value })} placeholder="Message to send to selected targets..." className="mt-1" />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-border">
                  <Button onClick={saveActivationRules} variant="destructive"><Save className="w-4 h-4 mr-2" />Save Activation Rules</Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-primary" /><span className="text-foreground font-medium">How Activation Works</span></div>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-6">
                    <li>When your check-in deadline is missed, activation begins</li>
                    <li>Rules execute based on their delay times (0 hours = immediate)</li>
                    <li>Each rule targets either a contact category or specific contacts</li>
                    <li>Contacts receive access according to their individual permissions</li>
                    <li>Custom messages are sent along with access notifications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6 mt-6">
            <ContactTypePermissions typePermissions={typePermissions} onUpdate={saveTypePermissions} />
            <SecurityQuestionsManager contacts={emergencyContacts} contactTypeLabels={contactTypeLabels} />
          </TabsContent>

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
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center"><Download className="w-5 h-5 mr-2 text-primary" />Export Your Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download a complete copy of all your data including contacts, documents, accounts, and financial assets. Data is decrypted locally before export.
                </p>
                <Button onClick={handleExportData} disabled={exporting} variant="default">
                  {exporting ? (<><LoadingSpinner size="sm" className="mr-2" />Exporting...</>) : (<><Download className="w-4 h-4 mr-2" />Download my data (JSON)</>)}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none rounded-2xl border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center"><Trash2 className="w-5 h-5 mr-2" />Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button onClick={() => setShowDeleteAccountDialog(true)} variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />Delete my account
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your encryption keys are derived from your password. Once deleted, your data cannot be recovered by anyone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <DialogContent className="bg-card border-border rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />Permanently delete your account
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will delete all your data including contacts, documents, financial information, and your vault. This cannot be undone.
            </p>
            <div className="space-y-2">
              <Label className="text-foreground">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDeleteAccountDialog(false); setDeleteConfirmText(''); }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccount}
              >
                {deletingAccount ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
