
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Bell, Shield, Save, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';

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

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    emergency_instructions: '',
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    emergency_alerts: true,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Mock profile data - in a real app this would come from your backend
      setProfile({
        id: user?.id || '',
        first_name: user?.user_metadata?.first_name || '',
        last_name: user?.user_metadata?.last_name || '',
        email: user?.email || '',
        phone: '',
        bio: '',
        emergency_instructions: '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Mock save - in a real app this would save to your backend
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and application preferences</p>
        </div>

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
                  onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label className="text-slate-200">Last Name</Label>
                <Input
                  value={profile.last_name}
                  onChange={(e) => setProfile({...profile, last_name: e.target.value})}
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
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-200">Bio</Label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <Label className="text-slate-200">Emergency Instructions</Label>
              <Textarea
                value={profile.emergency_instructions}
                onChange={(e) => setProfile({...profile, emergency_instructions: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                rows={4}
                placeholder="Special instructions for emergency contacts (medical conditions, preferences, etc.)"
              />
            </div>

            <Button 
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
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
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, email_notifications: checked})
                }
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
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, sms_notifications: checked})
                }
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
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, emergency_alerts: checked})
                  }
                />
              </div>
            </div>
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
      </div>
    </DashboardLayout>
  );
};

export default Settings;
