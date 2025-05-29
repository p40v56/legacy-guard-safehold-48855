
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
import { Clock, Shield, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSettings(data);
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
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
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
      const { error } = await supabase
        .from('check_ins')
        .insert({
          user_id: user?.id,
          check_in_time: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Check-in Successful",
        description: "Your next check-in has been scheduled",
      });

      fetchSettings(); // Refresh to get updated next check-in time
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

  const getNextCheckInStatus = () => {
    if (!settings?.next_check_in_due) return null;
    
    const nextCheckIn = new Date(settings.next_check_in_due);
    const now = new Date();
    const hoursUntil = (nextCheckIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 0) {
      return { status: 'overdue', color: 'text-red-400', bg: 'bg-red-400/20' };
    } else if (hoursUntil < 24) {
      return { status: 'due-soon', color: 'text-amber-400', bg: 'bg-amber-400/20' };
    } else {
      return { status: 'on-track', color: 'text-emerald-400', bg: 'bg-emerald-400/20' };
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

  const checkInStatus = getNextCheckInStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dead Man's Switch</h1>
            <p className="text-slate-400">
              Configure your check-in frequency and monitor system status
            </p>
          </div>
          {settings?.is_active ? (
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
              <CheckCircle className="w-4 h-4 mr-2" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Current Status */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Check-in Frequency</Label>
                <p className="text-white font-medium">
                  {settings ? getFrequencyLabel(settings.check_in_frequency) : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-slate-400">Grace Period</Label>
                <p className="text-white font-medium">
                  {settings?.grace_period_hours || 72} hours
                </p>
              </div>
              <div>
                <Label className="text-slate-400">Last Check-in</Label>
                <p className="text-white font-medium">
                  {settings?.last_check_in 
                    ? new Date(settings.last_check_in).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
              <div>
                <Label className="text-slate-400">Next Check-in Due</Label>
                <div className="flex items-center space-x-2">
                  {checkInStatus && (
                    <div className={`w-2 h-2 rounded-full ${checkInStatus.bg.replace('/20', '')}`} />
                  )}
                  <p className={`font-medium ${checkInStatus?.color || 'text-white'}`}>
                    {settings?.next_check_in_due 
                      ? new Date(settings.next_check_in_due).toLocaleDateString()
                      : 'Not scheduled'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-700">
              <Button 
                onClick={performCheckIn}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Perform Check-in Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              Adjust your Dead Man's Switch settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  How long to wait after a missed check-in before triggering alerts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
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
                <p className="text-slate-400 text-sm">Saving...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information */}
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
              your configured frequency plus the grace period, the system will begin emergency protocols.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Set your preferred check-in frequency (daily, weekly, bi-weekly, or monthly)</li>
              <li>Configure a grace period for additional time before alerts are triggered</li>
              <li>Perform manual check-ins anytime to reset the timer</li>
              <li>Emergency contacts will be notified if you miss your check-in deadline</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Switch;
