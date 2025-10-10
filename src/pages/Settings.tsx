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
import { User, Bell, Shield, Save, Mail, Phone, AlertTriangle, Clock, Users, FileText, Plus, Trash2, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ContactTypePermissions from '@/components/contacts/ContactTypePermissions';
import { ContactTypePermissions as ContactTypePermissionsType } from '@/types/access-control';
import RichTextEditor from '@/components/ui/rich-text-editor';
import ThemeSelector from '@/components/settings/ThemeSelector';

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
            <LoadingSpinner size="lg" className="text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 border-border">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="activation" className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Activation Rules
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Default Permissions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Profile Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">First Name</Label>
                    <Input 
                      value={profile.first_name} 
                      onChange={e => setProfile({...profile, first_name: e.target.value})} 
                      placeholder="Enter your first name" 
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Last Name</Label>
                    <Input 
                      value={profile.last_name} 
                      onChange={e => setProfile({...profile, last_name: e.target.value})} 
                      placeholder="Enter your last name" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Email</Label>
                    <Input 
                      value={profile.email} 
                      disabled 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
                  </div>
                  <div>
                    <Label className="text-foreground">Phone Number</Label>
                    <Input 
                      value={profile.phone} 
                      onChange={e => setProfile({...profile, phone: e.target.value})} 
                      placeholder="+1 (555) 123-4567" 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Emergency Instructions</Label>
                  <RichTextEditor
                    value={profile.emergency_instructions || ''}
                    onChange={(value) => setProfile({...profile, emergency_instructions: value})}
                    placeholder="Special instructions for emergency contacts (medical conditions, preferences, etc.)"
                    className="mt-1"
                  />
                </div>

                <Button onClick={saveProfile} disabled={saving} variant="default">
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <Badge className="bg-success/20 text-success border-success/30">
                    Free Plan
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="text-foreground">Today</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="text-foreground">Just now</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-6">
            <ThemeSelector />
          </TabsContent>

          <TabsContent value="activation" className="space-y-6 mt-6">
            {/* Dead Man's Switch Activation Rules */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                    Dead Man's Switch Activation Rules
                  </div>
                  <Button onClick={addActivationRule} size="sm" variant="default">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-2">
                  Configure what happens when your Dead Man's Switch is triggered. Rules are executed in order based on delay times.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {activationRules.map((rule, index) => (
                  <div key={rule.id} className="border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">
                          Rule {index + 1}
                        </Badge>
                        <Switch 
                          checked={rule.enabled} 
                          onCheckedChange={checked => updateActivationRule(rule.id, { enabled: checked })} 
                        />
                        <span className="text-foreground text-sm">
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {rule.delay_hours === 0 ? 'Immediate' : `${rule.delay_hours}h delay`}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteActivationRule(rule.id)} 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-foreground">Target Type</Label>
                        <Select 
                          value={rule.target_type} 
                          onValueChange={value => updateActivationRule(rule.id, { 
                            target_type: value as 'category' | 'contacts',
                            contact_category: value === 'category' ? 'immediate_family' : undefined,
                            contact_ids: value === 'contacts' ? [] : undefined
                          })}
                        >
                          <SelectTrigger>
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
                          <Label className="text-foreground">Contact Category</Label>
                          <Select 
                            value={rule.contact_category} 
                            onValueChange={value => updateActivationRule(rule.id, { contact_category: value as ContactCategory })}
                          >
                            <SelectTrigger>
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
                        <Label className="text-foreground">Delay (hours)</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          max="8760" 
                          value={rule.delay_hours} 
                          onChange={e => updateActivationRule(rule.id, { delay_hours: parseInt(e.target.value) || 0 })} 
                        />
                      </div>
                    </div>

                    {rule.target_type === 'contacts' && (
                      <div>
                        <Label className="text-foreground">Select Contacts</Label>
                        {emergencyContacts.length === 0 ? (
                          <p className="text-muted-foreground text-sm mt-2">
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
                                  className="text-sm text-foreground cursor-pointer flex-1"
                                >
                                  {contact.name} {contact.relationship && `(${contact.relationship})`}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {(rule.contact_ids || []).length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">No contacts selected</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-foreground">Custom Message</Label>
                      <RichTextEditor
                        value={rule.custom_message}
                        onChange={(value) => updateActivationRule(rule.id, { custom_message: value })}
                        placeholder="Message to send to selected targets..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-border">
                  <Button onClick={saveActivationRules} variant="destructive">
                    <Save className="w-4 h-4 mr-2" />
                    Save Activation Rules
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">How Activation Works</span>
                  </div>
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
            <ContactTypePermissions 
              typePermissions={typePermissions}
              onUpdate={saveTypePermissions}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            {/* Notification Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-foreground">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email_notifications} 
                    onCheckedChange={checked => setNotifications({...notifications, email_notifications: checked})} 
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-foreground">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.sms_notifications} 
                    onCheckedChange={checked => setNotifications({...notifications, sms_notifications: checked})} 
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-foreground">Emergency Alerts</Label>
                      <p className="text-sm text-muted-foreground">Critical notifications for emergency situations</p>
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
