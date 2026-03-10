import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, CheckCircle, Settings, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SwitchCountdown from '@/components/switch/SwitchCountdown';
import SwitchConfiguration from '@/components/switch/SwitchConfiguration';
import CheckInMethods from '@/components/switch/CheckInMethods';
import CheckInHistory from '@/components/switch/CheckInHistory';
import { CheckInFrequency, UserSettings } from '@/types/common';
import { SettingsService, ProfileService, NotificationSettingsService } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';

const Switch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { plan } = usePlan();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState('12:00');
  const [hasPhone, setHasPhone] = useState(false);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);
  const [emailCheckinEnabled, setEmailCheckinEnabled] = useState(false);
  const [smsCheckinEnabled, setSmsCheckinEnabled] = useState(false);
  const [activityCheckinEnabled, setActivityCheckinEnabled] = useState(false);


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
    try {
      const wasInactive = !settings?.is_active;

      // Guard: if custom deadline is stale, don't activate
      if (wasInactive && settings?.deadline_mode === 'custom') {
        const currentDl = settings?.next_check_in_due || settings?.custom_deadline;
        const deadlineIsStale = !currentDl || new Date(currentDl) <= new Date();
        if (deadlineIsStale) {
          toast({ title: 'Deadline has passed', description: 'Please set a new custom deadline before activating.', variant: 'destructive' });
          return;
        }
      }

      if (wasInactive) {
        await SettingsService.updateSettings(user.id, { is_active: true });
      }
      await SettingsService.checkIn(user.id);
      const freshSettings = await SettingsService.getUserSettings(user.id);
      setSettings(freshSettings);
      if (wasInactive) {
        toast({
          title: 'System activated ✅',
          description: 'Your Dead Man\'s Switch is now active. Your countdown has started.',
        });
      } else {
        toast({
          title: 'Check-in successful ✅',
          description: settings?.deadline_mode === 'custom'
            ? 'Check-in recorded. Custom deadline unchanged.'
            : 'Your countdown has been reset.',
        });
      }
    } catch (error) {
      console.error('Error performing check-in:', error);
      toast({ title: 'Error', description: 'Failed to perform check-in', variant: 'destructive' });
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    try {
      await SettingsService.updateSettings(user.id, {
        is_active: false,
        grace_period_active: false,
        grace_period_end: null,
        switch_triggered: false,
        switch_triggered_at: null,
      });
      const freshSettings = await SettingsService.getUserSettings(user.id);
      setSettings(freshSettings);
      toast({
        title: 'System deactivated',
        description: 'Your Dead Man\'s Switch is now off. Check in to reactivate.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to deactivate', variant: 'destructive' });
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
            gracePeriodHours={settings?.grace_period_hours ?? 24}
          />

          <div className="flex flex-col items-center gap-1">
            {settings?.is_active ? (
              <Button
                onClick={performCheckIn}
                size="lg"
                className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/20"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Check in now
              </Button>
            ) : (
              <div className="text-center space-y-3">
                <Button
                  onClick={performCheckIn}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/20"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Activate & check in
                </Button>
                <p className="text-muted-foreground text-sm">
                  Your first check-in will activate the switch and start your countdown.
                </p>
                {settings && (
                  <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
                    <p>
                      <button type="button" onClick={() => setConfigOpen(true)} className="text-primary hover:underline font-medium">
                        Current configuration
                      </button>
                      {': '}
                      {settings.deadline_mode === 'custom'
                        ? `Custom deadline${settings.custom_deadline ? ` (${new Date(settings.custom_deadline).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(settings.custom_deadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})` : ''}`
                        : `${settings.check_in_frequency === 'daily' ? 'Daily' : settings.check_in_frequency === 'weekly' ? 'Weekly' : settings.check_in_frequency === 'biweekly' ? 'Biweekly' : 'Monthly'}`}
                    </p>
                    <p>
                      Grace period: {settings.grace_period_hours === 0 ? 'none — triggers immediately' : `${settings.grace_period_hours}h`}
                    </p>
                  </div>
                )}
              </div>
            )}
            {settings?.is_active && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeactivate}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full px-5"
                >
                  Deactivate system
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Configuration */}
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <div className="bg-muted/30 rounded-2xl p-6">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-card-foreground">Configuration</h3>
                    <p className="text-sm text-muted-foreground">Customize your switch settings</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${configOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-6">
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
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 3: Check-in Methods */}
        <CheckInMethods
          emailCheckinEnabled={emailCheckinEnabled}
          onEmailCheckinChange={(v) => handleCheckinMethodChange('email_checkin_enabled', v)}
          isPaidPlan={plan !== 'free'}
        />

        {/* Section 4: Check-in History */}
        <CheckInHistory />
      </div>
    </DashboardLayout>
  );
};

export default Switch;