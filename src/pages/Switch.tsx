import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SwitchCountdown from '@/components/switch/SwitchCountdown';
import SwitchConfiguration from '@/components/switch/SwitchConfiguration';
import CheckInMethods from '@/components/switch/CheckInMethods';
import { CheckInFrequency, UserSettings } from '@/types/common';
import { SettingsService, ProfileService, NotificationSettingsService } from '@/services/supabaseService';

const Switch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { plan } = usePlan();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState('12:00');
  const [hasPhone, setHasPhone] = useState(false);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);
  const [emailCheckinEnabled, setEmailCheckinEnabled] = useState(false);
  const [smsCheckinEnabled, setSmsCheckinEnabled] = useState(false);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const calculateNextCheckIn = (frequency: CheckInFrequency, fromDate: Date = new Date()) => {
    const nextDate = new Date(fromDate);
    switch (frequency) {
      case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'biweekly': nextDate.setDate(nextDate.getDate() + 14); break;
      case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
    }
    return nextDate.toISOString();
  };

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const [userSettings, profile, notifSettings] = await Promise.all([
        SettingsService.getUserSettings(user.id),
        ProfileService.getProfile(user.id),
        NotificationSettingsService.getNotificationSettings(user.id),
      ]);
      setSettings(userSettings);
      setHasPhone(!!profile.phone);
      setSmsNotificationsEnabled(notifSettings.sms_notifications);
      setEmailCheckinEnabled((userSettings as any)?.email_checkin_enabled ?? false);
      setSmsCheckinEnabled((userSettings as any)?.sms_checkin_enabled ?? false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return;
    setSaving(true);
    try {
      await SettingsService.updateSettings(user.id, updates);
      const freshSettings = await SettingsService.getUserSettings(user.id);
      setSettings(freshSettings);
      toast({ title: "Settings Updated", description: "Your Dead Man's Switch settings have been saved" });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckinMethodChange = async (field: string, value: boolean) => {
    if (!user) return;
    try {
      await SettingsService.updateSettings(user.id, { [field]: value } as any);
      if (field === 'email_checkin_enabled') setEmailCheckinEnabled(value);
      if (field === 'sms_checkin_enabled') setSmsCheckinEnabled(value);
    } catch (error) {
      console.error('Error updating check-in methods:', error);
    }
  };

  const handleCustomDateTimeUpdate = () => {
    if (!customDate) return;
    const [hours, minutes] = customTime.split(':').map(Number);
    const deadline = new Date(customDate);
    deadline.setHours(hours, minutes, 0, 0);
    if (deadline <= new Date()) {
      toast({ title: "Invalid Deadline", description: "Please select a future date and time", variant: "destructive" });
      return;
    }
    updateSettings({ deadline_mode: 'custom', custom_deadline: deadline.toISOString() });
  };

  const switchToFrequencyMode = () => {
    const now = new Date();
    updateSettings({
      deadline_mode: 'frequency',
      custom_deadline: null,
      next_check_in_due: calculateNextCheckIn(settings!.check_in_frequency, new Date(settings?.last_check_in || now))
    });
  };

  const performCheckIn = async () => {
    if (!user) return;
    if (!settings?.is_active) { setShowActivationDialog(true); return; }
    try {
      await SettingsService.checkIn(user.id);
      const freshSettings = await SettingsService.getUserSettings(user.id);
      setSettings(freshSettings);
      toast({
        title: "Check-in Successful! ✅",
        description: settings.deadline_mode === 'custom'
          ? "Your check-in has been recorded. Custom deadline remains unchanged."
          : "Your next check-in has been scheduled",
      });
    } catch (error) {
      console.error('Error performing check-in:', error);
      toast({ title: "Error", description: "Failed to perform check-in", variant: "destructive" });
    }
  };

  const handleActivateAndCheckIn = async () => {
    if (!user) return;
    try {
      await SettingsService.updateSettings(user.id, { is_active: true });
      await SettingsService.checkIn(user.id);
      const freshSettings = await SettingsService.getUserSettings(user.id);
      setSettings(freshSettings);
      setShowActivationDialog(false);
      toast({ title: "System Activated & Check-in Successful! ✅", description: "Your Dead Man's Switch is now active" });
    } catch (error) {
      console.error('Error activating and checking in:', error);
      toast({ title: "Error", description: "Failed to activate system and perform check-in", variant: "destructive" });
    }
  };

  if (loading) {
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

  const currentDeadline = settings?.deadline_mode === 'custom' && settings?.custom_deadline
    ? settings.custom_deadline
    : settings?.next_check_in_due;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Dead Man's Switch</h1>
          <p className="text-muted-foreground">
            {settings?.is_active ? 'Your system is active and protected' : 'Activate your safety system'}
          </p>
        </div>

        {/* Section 1: System Control */}
        <div className="bg-muted/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${settings?.is_active ? 'bg-success/20' : 'bg-warning/20'}`}>
              <Shield className={`w-7 h-7 ${settings?.is_active ? 'text-success' : 'text-warning'}`} />
            </div>
            <div>
              <h2 className="text-xl font-medium text-card-foreground">System Control</h2>
              <p className="text-sm text-muted-foreground">Monitor status and perform check-ins</p>
            </div>
          </div>

          <SwitchCountdown
            isActive={settings?.is_active || false}
            currentDeadline={currentDeadline}
            deadlineMode={settings?.deadline_mode || 'frequency'}
            gracePeriodActive={settings?.grace_period_active || false}
            gracePeriodEnd={settings?.grace_period_end}
            switchTriggered={settings?.switch_triggered || false}
          />

          <div className="flex justify-center">
            <Button
              onClick={performCheckIn}
              size="lg"
              className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/20"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Perform Check-in Now
            </Button>
          </div>
        </div>

        {/* Section 2: Configuration */}
        <div className="bg-muted/30 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-card-foreground">Configuration</h3>
              <p className="text-sm text-muted-foreground">Customize your switch settings</p>
            </div>
          </div>
          {settings && (
            <SwitchConfiguration
              settings={settings}
              customDate={customDate}
              customTime={customTime}
              saving={saving}
              onUpdateSettings={updateSettings}
              onSwitchToFrequencyMode={switchToFrequencyMode}
              onCustomDateTimeUpdate={handleCustomDateTimeUpdate}
              onCustomDateChange={setCustomDate}
              onCustomTimeChange={setCustomTime}
              isFree={plan === 'free'}
            />
          )}
        </div>

        {/* Section 3: Check-in Methods */}
        <CheckInMethods
          smsCheckinEnabled={smsCheckinEnabled}
          hasPhone={hasPhone}
          smsNotificationsEnabled={smsNotificationsEnabled}
          onSmsCheckinChange={(v) => plan === 'paid' ? handleCheckinMethodChange('sms_checkin_enabled', v) : null}
          isPaidPlan={plan === 'paid'}
        />
      </div>

      <AlertDialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <AlertDialogContent className="glass-strong border-none rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
              System Deactivated
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Your Dead Man's Switch is currently deactivated. Would you like to activate it now and proceed with the check-in?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateAndCheckIn} className="bg-primary hover:bg-primary/90 rounded-xl">
              Activate & Check-in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Switch;
