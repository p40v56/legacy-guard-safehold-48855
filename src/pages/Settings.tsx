import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useContacts } from '@/hooks/useContacts';
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
import { User, Bell, Shield, Save, Mail, Phone, AlertTriangle, Clock, Users, FileText, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ContactTypePermissions from '@/components/contacts/ContactTypePermissions';
import SecurityQuestionsManager from '@/components/contacts/SecurityQuestionsManager';
import { ContactTypePermissions as ContactTypePermissionsType } from '@/types/access-control';
import RichTextEditor from '@/components/ui/rich-text-editor';
import EmailTemplateEditor, { EmailTemplateData } from '@/components/settings/EmailTemplateEditor';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  const {
    profile, setProfile, notifications, setNotifications,
    activationRules, setActivationRules, typePermissions, setTypePermissions,
    loading, saving, saveProfile, saveNotifications, saveActivationRules,
    addActivationRule, updateActivationRule, deleteActivationRule,
    emailTemplate, setEmailTemplate, saveEmailTemplate,
  } = useSettings();

  const { contacts: emergencyContacts, loading: contactsLoading } = useContacts();

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
          <TabsList className="grid w-full grid-cols-5 bg-muted/30 rounded-2xl p-1.5 mb-6">
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
                <div>
                  <Label className="text-foreground">Emergency Instructions</Label>
                  <RichTextEditor value={profile.emergency_instructions || ''} onChange={(value) => setProfile({...profile, emergency_instructions: value})} placeholder="Special instructions for emergency contacts" className="mt-1" />
                </div>
                <Button onClick={saveProfile} disabled={saving} variant="default">
                  {saving ? (<><LoadingSpinner size="sm" className="mr-2" />Saving...</>) : (<><Save className="w-4 h-4 mr-2" />Save Profile</>)}
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none rounded-2xl">
              <CardHeader><CardTitle className="text-foreground">Account Status & Plan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Current Plan</span><Badge className="bg-success/20 text-success border-success/30">Free Plan</Badge></div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">SMS Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via text message</p></div></div>
                  <Switch checked={notifications.sms_notifications} onCheckedChange={checked => setNotifications({...notifications, sms_notifications: checked})} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><Shield className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">Emergency Alerts</Label><p className="text-sm text-muted-foreground">Critical notifications for emergency situations</p></div></div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    <Switch checked={notifications.emergency_alerts} onCheckedChange={checked => setNotifications({...notifications, emergency_alerts: checked})} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
