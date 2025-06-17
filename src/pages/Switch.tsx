import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SwitchCountdown from '@/components/switch/SwitchCountdown';
import SwitchHeader from '@/components/switch/SwitchHeader';
import SwitchQuickStats from '@/components/switch/SwitchQuickStats';
import SwitchConfiguration from '@/components/switch/SwitchConfiguration';
import SwitchInfoCard from '@/components/switch/SwitchInfoCard';
import { CheckInFrequency, UserSettings } from '@/types/common';
import { MockDataService } from '@/services/mockDataService';

const Switch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState('12:00');

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const calculateNextCheckIn = (frequency: CheckInFrequency, fromDate: Date = new Date()) => {
    const nextDate = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    
    return nextDate.toISOString();
  };

  const fetchSettings = async () => {
    try {
      const userSettings = await MockDataService.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true);
    try {
      const updatedSettings = { ...settings!, ...updates };
      
      // If activating the system or changing frequency, calculate new next check-in
      if (updates.is_active === true || updates.check_in_frequency) {
        const now = new Date();
        if (updatedSettings.deadline_mode === 'frequency') {
          updatedSettings.next_check_in_due = calculateNextCheckIn(
            updates.check_in_frequency || settings!.check_in_frequency,
            new Date(settings?.last_check_in || now)
          );
        }
      }
      
      setSettings(updatedSettings);
      toast({
        title: "Settings Updated",
        description: "Your Dead Man's Switch settings have been saved",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomDateTimeUpdate = () => {
    if (!customDate) return;

    const [hours, minutes] = customTime.split(':').map(Number);
    const deadline = new Date(customDate);
    deadline.setHours(hours, minutes, 0, 0);

    // Check if the deadline is in the past
    if (deadline <= new Date()) {
      toast({
        title: "Invalid Deadline",
        description: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    updateSettings({
      deadline_mode: 'custom',
      custom_deadline: deadline.toISOString(),
    });
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
    // Check if system is deactivated
    if (!settings?.is_active) {
      setShowActivationDialog(true);
      return;
    }

    try {
      const now = new Date();
      const newSettings = {
        ...settings!,
        last_check_in: now.toISOString(),
      };

      // Update deadline based on current mode
      if (settings.deadline_mode === 'frequency') {
        newSettings.next_check_in_due = calculateNextCheckIn(settings!.check_in_frequency, now);
      }
      // For custom mode, keep the custom deadline as is until user changes it

      setSettings(newSettings);

      toast({
        title: "Check-in Successful! ✅",
        description: settings.deadline_mode === 'custom' 
          ? "Your check-in has been recorded. Custom deadline remains unchanged."
          : "Your next check-in has been scheduled",
      });
    } catch (error) {
      console.error('Error performing check-in:', error);
      toast({
        title: "Error",
        description: "Failed to perform check-in",
        variant: "destructive",
      });
    }
  };

  const handleActivateAndCheckIn = async () => {
    // First activate the system
    await updateSettings({ is_active: true });
    
    // Then perform the check-in
    const now = new Date();
    const newSettings = {
      ...settings!,
      is_active: true,
      last_check_in: now.toISOString(),
    };

    if (settings?.deadline_mode === 'frequency') {
      newSettings.next_check_in_due = calculateNextCheckIn(settings!.check_in_frequency, now);
    }

    setSettings(newSettings);
    setShowActivationDialog(false);

    toast({
      title: "System Activated & Check-in Successful! ✅",
      description: "Your Dead Man's Switch is now active and your check-in has been recorded",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-400">Loading settings...</p>
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
        {/* Header */}
        <SwitchHeader isActive={settings?.is_active || false} />

        {/* Main Control Panel */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-400" />
              System Control
            </CardTitle>
            <CardDescription className="text-slate-400">
              Monitor status and configure your safety settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Live Countdown Display */}
            <SwitchCountdown
              isActive={settings?.is_active || false}
              currentDeadline={currentDeadline}
              deadlineMode={settings?.deadline_mode || 'frequency'}
            />

            {/* Check-in Button */}
            <div className="flex justify-center">
              <Button 
                onClick={performCheckIn}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 text-lg font-semibold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Perform Check-in Now
              </Button>
            </div>

            {/* Quick Stats */}
            {settings && (
              <SwitchQuickStats
                checkInFrequency={settings.check_in_frequency}
                deadlineMode={settings.deadline_mode}
                gracePeriodHours={settings.grace_period_hours}
                lastCheckIn={settings.last_check_in}
              />
            )}

            <Separator className="bg-slate-700" />

            {/* Configuration */}
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
              />
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <SwitchInfoCard />
      </div>

      {/* Activation Dialog */}
      <AlertDialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
              System Deactivated
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Your Dead Man's Switch is currently deactivated. To perform a check-in, you need to activate the system first. 
              Would you like to activate it now and proceed with the check-in?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivateAndCheckIn}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Activate & Check-in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Switch;
