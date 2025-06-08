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
import { Clock, Shield, AlertTriangle, CheckCircle, Calendar, Timer, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface UserSettings {
  check_in_frequency: CheckInFrequency;
  grace_period_hours: number;
  is_active: boolean;
  last_check_in: string | null;
  next_check_in_due: string | null;
}

const Switch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!settings?.is_active || !settings?.next_check_in_due) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(settings.next_check_in_due!);
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
  }, [settings?.is_active, settings?.next_check_in_due]);

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
        updatedSettings.next_check_in_due = calculateNextCheckIn(
          updates.check_in_frequency || settings!.check_in_frequency,
          new Date(settings?.last_check_in || now)
        );
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

  const performCheckIn = async () => {
    try {
      const now = new Date();
      const newSettings = {
        ...settings!,
        last_check_in: now.toISOString(),
        next_check_in_due: calculateNextCheckIn(settings!.check_in_frequency, now)
      };

      setSettings(newSettings);

      toast({
        title: "Check-in Successful! ✅",
        description: "Your next check-in has been scheduled",
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
            {settings?.is_active && settings?.next_check_in_due && (
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
                  {settings ? getFrequencyLabel(settings.check_in_frequency) : 'Not set'}
                </div>
                <div className="text-slate-400 text-sm">Check-in Frequency</div>
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Configuration</h3>
              
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
              <Calendar className="w-5 h-5 mr-2 text-blue-400" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              Your Dead Man's Switch monitors your regular check-ins. If you fail to check in within 
              your configured frequency plus the grace period, emergency protocols will activate.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Configure your preferred check-in schedule and grace period</li>
              <li>Perform manual check-ins anytime to reset the countdown</li>
              <li>Real-time countdown shows exactly when your next check-in is due</li>
              <li>Emergency contacts are notified if deadlines are missed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Switch;
