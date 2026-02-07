import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { Users, CreditCard, FileText, Shield, Timer, ArrowRight, Check, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/types/common';
import { DashboardService, SettingsService } from '@/services/supabaseService';
import { useCountdown } from '@/hooks/useCountdown';
import { getUrgencyLevel, getUrgencyColors } from '@/utils/urgencyUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    contactsCount: 0,
    accountsCount: 0,
    documentsCount: 0,
    userSettings: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const settings = stats.userSettings;
  const currentDeadline = settings?.deadline_mode === 'custom' && settings?.custom_deadline
    ? settings.custom_deadline
    : settings?.next_check_in_due;

  const countdown = useCountdown(
    settings?.is_active || false,
    currentDeadline || null,
    settings?.grace_period_active,
    settings?.grace_period_end
  );
  const urgencyLevel = settings?.grace_period_active ? 'critical' : getUrgencyLevel(countdown);
  const colors = getUrgencyColors(urgencyLevel);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const dashboardStats = await DashboardService.getDashboardStats(user.id);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSystem = async () => {
    if (!user || !settings) return;
    setSaving(true);
    try {
      await SettingsService.updateSettings(user.id, { is_active: !settings.is_active });
      await fetchStats();
      toast({
        title: settings.is_active ? "System Deactivated" : "System Activated",
        description: settings.is_active 
          ? "Your Dead Man's Switch has been deactivated" 
          : "Your Dead Man's Switch is now active",
      });
    } catch (error) {
      console.error('Error toggling system:', error);
      toast({
        title: "Error",
        description: "Failed to update system status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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

  const quickActions = [
    { name: 'Switch', href: '/switch', icon: Timer, description: 'Configure your dead man\'s switch' },
    { name: 'Contacts', href: '/contacts', icon: Users, description: 'Manage trusted contacts' },
    { name: 'Accounts', href: '/accounts', icon: CreditCard, description: 'Digital account management' },
    { name: 'Documents', href: '/documents', icon: FileText, description: 'Store important documents' },
  ];

  // Determine system status display
  const getSystemStatusDisplay = () => {
    if (!settings?.is_active) {
      return { label: 'Inactive', color: 'text-warning', bgColor: 'bg-warning/20', iconColor: 'text-warning' };
    }
    if (settings.switch_triggered) {
      return { label: 'TRIGGERED', color: 'text-destructive', bgColor: 'bg-destructive/20', iconColor: 'text-destructive' };
    }
    if (settings.grace_period_active) {
      return { label: 'GRACE PERIOD', color: 'text-warning', bgColor: 'bg-warning/20', iconColor: 'text-warning' };
    }
    if (countdown.isOverdue) {
      return { label: 'CHECK-IN OVERDUE', color: 'text-destructive', bgColor: 'bg-destructive/20', iconColor: 'text-destructive' };
    }
    return { label: 'Active & Protected', color: 'text-success', bgColor: 'bg-success/20', iconColor: 'text-success' };
  };

  const statusDisplay = getSystemStatusDisplay();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">
            {getTimeOfDay()}!
          </h1>
          <p className="text-muted-foreground">
            Welcome to your digital legacy dashboard
          </p>
        </div>

        {/* System Status Card - Enhanced */}
        <div className="bg-muted/30 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statusDisplay.bgColor} ${
              (countdown.isOverdue || settings?.grace_period_active) ? 'animate-pulse' : ''
            }`}>
              {countdown.isOverdue || settings?.grace_period_active || settings?.switch_triggered ? (
                <AlertTriangle className={`w-7 h-7 ${statusDisplay.iconColor}`} />
              ) : (
                <Shield className={`w-7 h-7 ${statusDisplay.iconColor}`} />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-medium text-card-foreground">System Status</h2>
              <p className={`text-sm font-medium ${statusDisplay.color}`}>
                {statusDisplay.label}
              </p>
            </div>
            {/* Activate/Deactivate Button */}
            <Button
              onClick={handleToggleSystem}
              variant={settings?.is_active ? "destructive" : "default"}
              disabled={saving}
              className={`rounded-full px-6 ${
                settings?.is_active 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {saving ? 'Saving...' : settings?.is_active ? 'Deactivate System' : 'Activate System'}
            </Button>
          </div>

          {/* Warning Banner for overdue/grace period */}
          {settings?.is_active && (settings?.grace_period_active || countdown.isOverdue) && !settings?.switch_triggered && (
            <div className={`rounded-2xl p-4 mb-4 border ${
              settings.grace_period_active 
                ? 'bg-warning/10 border-warning/30' 
                : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${
                  settings.grace_period_active ? 'text-warning animate-pulse' : 'text-destructive animate-pulse'
                }`} />
                <div>
                  <p className={`font-semibold ${
                    settings.grace_period_active ? 'text-warning' : 'text-destructive'
                  }`}>
                    {settings.grace_period_active 
                      ? '⚠️ Grace Period Active — Check in immediately!'
                      : '🚨 Check-in Overdue — Action Required!'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {settings.grace_period_active 
                      ? 'Your check-in deadline has passed. Check in before the grace period ends or your contacts will be notified.'
                      : 'Your check-in deadline has passed. Please check in as soon as possible.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Triggered Banner */}
          {settings?.switch_triggered && (
            <div className="rounded-2xl p-4 mb-4 border bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">
                    🚨 System Triggered — Your emergency contacts have been notified
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Perform a check-in to reset the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown / Next check-in */}
          {settings?.is_active && currentDeadline && !settings?.switch_triggered && (
            <div className={`rounded-2xl p-4 border ${
              countdown.isOverdue || settings?.grace_period_active 
                ? `${colors.border} ${colors.bg}` 
                : 'bg-muted border-transparent'
            }`}>
              {!countdown.isOverdue && !settings?.grace_period_active ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">Next check-in due</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-card-foreground">
                      {new Date(currentDeadline).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className={`w-4 h-4 ${colors.text}`} />
                      <span className={colors.text}>
                        {countdown.days > 0 && `${countdown.days}d `}
                        {countdown.hours}h {countdown.minutes}m
                      </span>
                      {urgencyLevel !== 'normal' && (
                        <Badge className={`${colors.bg} ${colors.text} border-none text-xs`}>
                          {urgencyLevel.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              ) : settings?.grace_period_active && settings?.grace_period_end ? (
                <>
                  <p className="text-sm text-warning mb-1 font-medium">⚠️ Grace period ends in</p>
                  <div className="flex items-center gap-4">
                    {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
                      <div key={unit} className="text-center">
                        <span className="text-2xl font-bold text-warning tabular-nums">
                          {countdown[unit].toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs text-warning/70 block uppercase">{unit}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-destructive mb-1 font-medium">🚨 Overdue since</p>
                  <p className="text-lg font-medium text-destructive">
                    {new Date(currentDeadline).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Contacts', value: stats.contactsCount, icon: Users },
            { label: 'Accounts', value: stats.accountsCount, icon: CreditCard },
            { label: 'Documents', value: stats.documentsCount, icon: FileText },
            { label: 'Status', value: settings?.is_active ? 'Active' : 'Off', icon: Shield },
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-muted/30 rounded-2xl p-5 text-center hover:bg-muted/50 transition-all"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-2xl font-semibold text-card-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-card-foreground">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link 
                key={index}
                to={action.href}
                className="bg-muted/30 rounded-2xl p-5 flex items-center gap-4 group hover:bg-muted/50 transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                    {action.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Security Checklist */}
        <div className="bg-muted/30 rounded-2xl p-6">
          <h3 className="text-xl font-medium text-card-foreground mb-6">Security Checklist</h3>
          <div className="space-y-4">
            {[
              { label: 'Two-Factor Auth', enabled: true },
              { label: 'Data Encryption', enabled: true },
              { label: 'Backup Status', enabled: true },
              { label: 'Emergency Contacts', enabled: stats.contactsCount > 0 },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-card-foreground">{item.label}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.enabled ? 'bg-success/20' : 'bg-muted'
                }`}>
                  <Check className={`w-4 h-4 ${
                    item.enabled ? 'text-success' : 'text-muted-foreground'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
