import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch as ToggleSwitch } from '@/components/ui/switch';
import { Clock, Shield, AlertTriangle, CheckCircle, Calendar as CalendarIcon, Timer, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type DeadlineMode = 'frequency' | 'custom';

interface UserSettings {
  check_in_frequency: CheckInFrequency;
  grace_period_hours: number;
  is_active: boolean;
  last_check_in: string | null;
  next_check_in_due: string | null;
  deadline_mode: DeadlineMode;
  custom_deadline: string | null;
}

const Switch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState('12:00');
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  useEffect(() => {
    if (!settings?.is_active) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });
      return;
    }

    const getDeadline = () => {
      if (settings.deadline_mode === 'custom' && settings.custom_deadline) {
        return settings.custom_deadline;
      }
      return settings.next_check_in_due;
    };

    const deadline = getDeadline();
    if (!deadline) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(deadline);
      const timeDiff = dueDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isOverdue: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [settings?.is_active, settings?.next_check_in_due, settings?.custom_deadline, settings?.deadline_mode]);

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
      // Mock settings for demonstration
      const mockSettings: UserSettings = {
        check_in_frequency: 'weekly',
        grace_period_hours: 72,
        is_active: true,
        last_check_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        next_check_in_due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        deadline_mode: 'frequency',
        custom_deadline: null,
      };
      
      setSettings(mockSettings);
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

  const getFrequencyLabel = (frequency: CheckInFrequency) => {
    const labels = {
      daily: 'Every Day',
      weekly: 'Every Week',
      biweekly: 'Every 2 Weeks',
      monthly: 'Every Month'
    };
    return labels[frequency];
  };

  const getUrgencyLevel = () => {
    if (countdown.isOverdue) return 'critical';
    if (countdown.days === 0 && countdown.hours < 12) return 'urgent';
    if (countdown.days === 0) return 'warning';
    return 'normal';
  };

  const getUrgencyColors = () => {
    const urgencyLevel = getUrgencyLevel();
    switch (urgencyLevel) {
      case 'critical':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          pulse: 'animate-pulse',
        };
      case 'urgent':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          pulse: 'animate-pulse',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          pulse: '',
        };
      default:
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          pulse: '',
        };
    }
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

  const colors = getUrgencyColors();
  const currentDeadline = settings?.deadline_mode === 'custom' && settings?.custom_deadline 
    ? settings.custom_deadline 
    : settings?.next_check_in_due;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dead Man's Switch</h1>
            <p className="text-slate-400">
              Automated safety monitoring system
            </p>
          </div>
          {settings?.is_active ? (
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
              <Activity className="w-4 h-4 mr-2" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
              <Shield className="w-4 h-4 mr-2" />
              Inactive
            </Badge>
          )}
        </div>

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
            {settings?.is_active && currentDeadline && (
              <div className={`relative overflow-hidden rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.pulse}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Timer className={`w-5 h-5 ${colors.text}`} />
                      <span className="text-lg font-semibold text-white">
                        {countdown.isOverdue ? 'CHECK-IN OVERDUE' : 'Next Check-in'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-500 text-slate-300">
                        {settings?.deadline_mode === 'custom' ? 'Custom Deadline' : 'Frequency Based'}
                      </Badge>
                      {getUrgencyLevel() === 'critical' && (
                        <Badge variant="destructive" className="animate-pulse">
                          CRITICAL
                        </Badge>
                      )}
                      {getUrgencyLevel() === 'urgent' && (
                        <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                          URGENT
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!countdown.isOverdue ? (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                          {countdown.days.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Days</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                          {countdown.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                          {countdown.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                          {countdown.seconds.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Seconds</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-red-400 mb-2 animate-pulse">
                        ACTION REQUIRED
                      </div>
                      <p className="text-red-300">Your check-in deadline has passed</p>
                    </div>
                  )}

                  {currentDeadline && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <p className="text-slate-300 text-sm text-center">
                        Deadline: {format(new Date(currentDeadline), 'PPP p')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            <Separator className="bg-slate-700" />

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">
                  {settings?.deadline_mode === 'custom' ? 'Custom' : getFrequencyLabel(settings?.check_in_frequency || 'weekly')}
                </div>
                <div className="text-slate-400 text-sm">Deadline Mode</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {settings?.grace_period_hours || 72}h
                </div>
                <div className="text-slate-400 text-sm">Grace Period</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">
                  {settings?.last_check_in 
                    ? new Date(settings.last_check_in).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <div className="text-slate-400 text-sm">Last Check-in</div>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Configuration */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Configuration</h3>
              
              {/* Deadline Mode Selection */}
              <div className="space-y-4">
                <Label className="text-slate-200">Deadline Mode</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      checked={settings?.deadline_mode === 'frequency'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          switchToFrequencyMode();
                        }
                      }}
                    />
                    <span className="text-slate-300">Frequency Based</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      checked={settings?.deadline_mode === 'custom'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateSettings({ deadline_mode: 'custom' });
                        }
                      }}
                    />
                    <span className="text-slate-300">Custom Date & Time</span>
                  </div>
                </div>
              </div>

              {settings?.deadline_mode === 'frequency' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Check-in Frequency</Label>
                    <Select
                      value={settings?.check_in_frequency || 'weekly'}
                      onValueChange={(value: CheckInFrequency) => 
                        updateSettings({ check_in_frequency: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Every Day</SelectItem>
                        <SelectItem value="weekly">Every Week</SelectItem>
                        <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                        <SelectItem value="monthly">Every Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Grace Period (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={settings?.grace_period_hours || 72}
                      onChange={(e) => 
                        updateSettings({ grace_period_hours: parseInt(e.target.value) })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400">
                      Time buffer after missed check-in before alerts trigger
                    </p>
                  </div>
                </div>
              )}

              {settings?.deadline_mode === 'custom' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                              !customDate && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDate ? format(customDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customDate}
                            onSelect={setCustomDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Select Time</Label>
                      <Input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCustomDateTimeUpdate}
                    disabled={!customDate || saving}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Set Custom Deadline
                  </Button>

                  {settings?.custom_deadline && (
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <p className="text-slate-300 text-sm">
                        <strong>Current Custom Deadline:</strong><br />
                        {format(new Date(settings.custom_deadline), 'PPP p')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  onClick={() => updateSettings({ is_active: !settings?.is_active })}
                  variant={settings?.is_active ? "destructive" : "default"}
                  disabled={saving}
                  className={settings?.is_active 
                    ? "bg-red-600 hover:bg-red-500" 
                    : "bg-emerald-600 hover:bg-emerald-500"
                  }
                >
                  {settings?.is_active ? 'Deactivate System' : 'Activate System'}
                </Button>
                
                {saving && (
                  <p className="text-slate-400 text-sm">Saving changes...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-blue-400" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              Your Dead Man's Switch monitors your regular check-ins. You can choose between frequency-based 
              scheduling or set a specific deadline date and time.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Frequency Mode:</strong> Check-ins reset based on your chosen schedule (daily, weekly, etc.)</li>
              <li><strong>Custom Mode:</strong> Set a specific date and time for your deadline</li>
              <li>Grace period applies only to frequency-based schedules</li>
              <li>Perform manual check-ins anytime to update your status</li>
              <li>Emergency contacts are notified if deadlines are missed</li>
            </ul>
          </CardContent>
        </Card>
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
