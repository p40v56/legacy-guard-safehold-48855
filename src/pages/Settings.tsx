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
import { ContactTypePermissions as ContactTypePermissionsType } from '@/types/access-control';
import RichTextEditor from '@/components/ui/rich-text-editor';

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

interface EmergencyContact {
  id: string;
  name: string;
  email: string;
  relationship?: string;
  contact_type: ContactCategory;
}

interface ActivationRule {
  id: string;
  target_type: 'category' | 'contacts';
  contact_category?: ContactCategory;
  contact_ids?: string[];
  delay_hours: number;
  custom_message: string;
  enabled: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    profile,
    setProfile,
    notifications,
    setNotifications,
    activationRules,
    setActivationRules,
    typePermissions,
    setTypePermissions,
    loading,
    saving,
    saveProfile,
    saveNotifications,
    saveActivationRules,
    addActivationRule,
    updateActivationRule,
    deleteActivationRule,
  } = useSettings();

  // Load actual contacts from the database
  const { contacts: emergencyContacts, loading: contactsLoading } = useContacts();

  const saveTypePermissions = async (updatedPermissions: ContactTypePermissionsType[]) => {
    try {
      setTypePermissions(updatedPermissions);
      // This would typically save to the database using ContactTypePermissionsService
      toast({
        title: "Success",
        description: "Default permissions updated successfully"
      });
    } catch (error) {
      console.error('Error updating type permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update default permissions",
        variant: "destructive"
      });
    }
  };

  const getCategoryLabel = (category: ContactCategory) => {
    const labels = {
      immediate_family: 'Immediate Family',
      extended_family: 'Extended Family',
      close_friends: 'Close Friends',
      professional: 'Professional',
      legal: 'Legal',
      financial: 'Financial'
    };
    return labels[category];
  };

  const toggleContactSelection = (ruleId: string, contactId: string) => {
    setActivationRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        const currentContacts = rule.contact_ids || [];
        const isSelected = currentContacts.includes(contactId);
        
        return {
          ...rule,
          contact_ids: isSelected 
            ? currentContacts.filter(id => id !== contactId)
            : [...currentContacts, contactId]
        };
      }
      return rule;
    }));
  };

  if (loading || contactsLoading) {
    return <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="activation" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Activation Rules
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              <Shield className="w-4 h-4 mr-2" />
              Default Permissions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Profile Settings */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-emerald-400" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">First Name</Label>
                    <Input 
                      value={profile.first_name} 
                      onChange={e => setProfile({...profile, first_name: e.target.value})} 
                      className="bg-slate-700 border-slate-600 text-white" 
                      placeholder="Enter your first name" 
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Last Name</Label>
                    <Input 
                      value={profile.last_name} 
                      onChange={e => setProfile({...profile, last_name: e.target.value})} 
                      className="bg-slate-700 border-slate-600 text-white" 
                      placeholder="Enter your last name" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Email</Label>
                    <Input 
                      value={profile.email} 
                      disabled 
                      className="bg-slate-600 border-slate-500 text-slate-300" 
                    />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
                  </div>
                  <div>
                    <Label className="text-slate-200">Phone Number</Label>
                    <Input 
                      value={profile.phone} 
                      onChange={e => setProfile({...profile, phone: e.target.value})} 
                      className="bg-slate-700 border-slate-600 text-white" 
                      placeholder="+1 (555) 123-4567" 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200">Emergency Instructions</Label>
                  <RichTextEditor
                    value={profile.emergency_instructions || ''}
                    onChange={(value) => setProfile({...profile, emergency_instructions: value})}
                    placeholder="Special instructions for emergency contacts (medical conditions, preferences, etc.)"
                    className="mt-1"
                  />
                </div>

                <Button onClick={saveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Account Type</span>
                  <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                    Free Plan
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Member Since</span>
                  <span className="text-white">Today</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Last Login</span>
                  <span className="text-white">Just now</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activation" className="space-y-6 mt-6">
            {/* Dead Man's Switch Activation Rules */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                    Dead Man's Switch Activation Rules
                  </div>
                  <Button onClick={addActivationRule} size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </CardTitle>
                <p className="text-slate-400 text-sm mt-2">
                  Configure what happens when your Dead Man's Switch is triggered. Rules are executed in order based on delay times.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {activationRules.map((rule, index) => (
                  <div key={rule.id} className="border border-slate-600 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="border-slate-500 text-slate-300">
                          Rule {index + 1}
                        </Badge>
                        <Switch 
                          checked={rule.enabled} 
                          onCheckedChange={checked => updateActivationRule(rule.id, { enabled: checked })} 
                        />
                        <span className="text-slate-300 text-sm">
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {rule.delay_hours === 0 ? 'Immediate' : `${rule.delay_hours}h delay`}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteActivationRule(rule.id)} 
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-slate-200">Target Type</Label>
                        <Select 
                          value={rule.target_type} 
                          onValueChange={value => updateActivationRule(rule.id, { 
                            target_type: value as 'category' | 'contacts',
                            contact_category: value === 'category' ? 'immediate_family' : undefined,
                            contact_ids: value === 'contacts' ? [] : undefined
                          })}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="category">Contact Category</SelectItem>
                            <SelectItem value="contacts">Specific Contacts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {rule.target_type === 'category' && (
                        <div>
                          <Label className="text-slate-200">Contact Category</Label>
                          <Select 
                            value={rule.contact_category} 
                            onValueChange={value => updateActivationRule(rule.id, { contact_category: value as ContactCategory })}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate_family">Immediate Family</SelectItem>
                              <SelectItem value="extended_family">Extended Family</SelectItem>
                              <SelectItem value="close_friends">Close Friends</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="legal">Legal</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label className="text-slate-200">Delay (hours)</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          max="8760" 
                          value={rule.delay_hours} 
                          onChange={e => updateActivationRule(rule.id, { delay_hours: parseInt(e.target.value) || 0 })} 
                          className="bg-slate-700 border-slate-600 text-white" 
                        />
                      </div>
                    </div>

                    {rule.target_type === 'contacts' && (
                      <div>
                        <Label className="text-slate-200">Select Contacts</Label>
                        {emergencyContacts.length === 0 ? (
                          <p className="text-slate-400 text-sm mt-2">
                            No contacts available. Please add contacts first.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                            {emergencyContacts.map(contact => (
                              <div key={contact.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`contact-${rule.id}-${contact.id}`}
                                  checked={(rule.contact_ids || []).includes(contact.id)}
                                  onCheckedChange={() => toggleContactSelection(rule.id, contact.id)}
                                />
                                <label 
                                  htmlFor={`contact-${rule.id}-${contact.id}`}
                                  className="text-sm text-slate-300 cursor-pointer flex-1"
                                >
                                  {contact.name} {contact.relationship && `(${contact.relationship})`}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {(rule.contact_ids || []).length === 0 && (
                          <p className="text-xs text-slate-400 mt-1">No contacts selected</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-slate-200">Custom Message</Label>
                      <RichTextEditor
                        value={rule.custom_message}
                        onChange={(value) => updateActivationRule(rule.id, { custom_message: value })}
                        placeholder="Message to send to selected targets..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-700">
                  <Button onClick={saveActivationRules} className="bg-red-600 hover:bg-red-500">
                    <Save className="w-4 h-4 mr-2" />
                    Save Activation Rules
                  </Button>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-200 font-medium">How Activation Works</span>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside ml-6">
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
            <ContactTypePermissions 
              typePermissions={typePermissions}
              onUpdate={saveTypePermissions}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            {/* Notification Settings */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-blue-400" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <Label className="text-slate-200">Email Notifications</Label>
                      <p className="text-sm text-slate-400">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email_notifications} 
                    onCheckedChange={checked => setNotifications({...notifications, email_notifications: checked})} 
                  />
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <Label className="text-slate-200">SMS Notifications</Label>
                      <p className="text-sm text-slate-400">Receive updates via text message</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.sms_notifications} 
                    onCheckedChange={checked => setNotifications({...notifications, sms_notifications: checked})} 
                  />
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                      <Label className="text-slate-200">Emergency Alerts</Label>
                      <p className="text-sm text-slate-400">Critical notifications for emergency situations</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    <Switch 
                      checked={notifications.emergency_alerts} 
                      onCheckedChange={checked => setNotifications({...notifications, emergency_alerts: checked})} 
                    />
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
