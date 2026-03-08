import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEncryption } from '@/contexts/EncryptionContext';
import { decryptFields } from '@/lib/crypto';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SetupWizard from '@/components/dashboard/SetupWizard';
import { useToast } from '@/hooks/use-toast';
import { Users, Monitor, FileText, Shield, Timer, ArrowRight, Check, AlertTriangle, CheckCircle, ChevronDown, Landmark, History } from 'lucide-react';
import SecurityBadge from '@/components/dashboard/SecurityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/types/common';
import { DashboardService, SettingsService, ProfileService, ActivationRulesService } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { useCountdown } from '@/hooks/useCountdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDateEU } from '@/utils/dateUtils';

const Dashboard = () => {
  const { user } = useAuth();
  
  const { vaultKey } = useEncryption();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    contactsCount: 0,
    accountsCount: 0,
    documentsCount: 0,
    userSettings: null
  });
  const [loading, setLoading] = useState(true);
  const [wizardDismissed, setWizardDismissed] = useState(true);
  const [rulesCount, setRulesCount] = useState(0);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [hasPortalLinks, setHasPortalLinks] = useState(false);
  const [firstName, setFirstName] = useState('');

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

  const getAlertBadge = () => {
    if (!settings?.is_active) return null;
    if (settings.switch_triggered) return { label: 'TRIGGERED', color: 'bg-destructive/20 text-destructive' };
    if (settings.grace_period_active) return { label: 'WARNING', color: 'bg-destructive/20 text-destructive' };
    if (countdown.isOverdue) return { label: 'OVERDUE', color: 'bg-destructive/20 text-destructive' };

    if (currentDeadline && settings.last_check_in) {
      const totalCycle = new Date(currentDeadline).getTime() - new Date(settings.last_check_in).getTime();
      const remaining = new Date(currentDeadline).getTime() - Date.now();
      if (totalCycle > 0) {
        const pct = remaining / totalCycle;
        if (pct > 0.5) return { label: 'OK', color: 'bg-success/20 text-success' };
        if (pct > 0.25) return { label: 'Check-in soon', color: 'bg-warning/20 text-warning' };
        return { label: 'Urgent', color: 'bg-orange-500/20 text-orange-500' };
      }
    }
    return { label: 'OK', color: 'bg-success/20 text-success' };
  };

  const alertBadge = getAlertBadge();

  useEffect(() => {
    if (user) fetchStats();
  }, [user, vaultKey]);

  useEffect(() => {
    const handleFocus = () => { if (user) fetchStats(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [dashboardStats, profile, rules, sharesRes] = await Promise.all([
        DashboardService.getDashboardStats(user.id),
        ProfileService.getProfile(user.id),
        ActivationRulesService.getActivationRules(user.id),
        supabase.from('contact_shares').select('id').eq('user_id', user.id).limit(1),
      ]);
      setStats(dashboardStats);
      setWizardDismissed(profile.setup_wizard_dismissed ?? false);
      setTestEmailSent(!!profile.last_test_email_sent_at);
      setHasPortalLinks((sharesRes.data?.length ?? 0) > 0);
      let firstName = profile.first_name || '';
      if (vaultKey && firstName) {
        try {
          const decrypted = await decryptFields(profile as any, ['first_name'], vaultKey);
          firstName = decrypted.first_name || firstName;
        } catch { /* use raw */ }
      }
      setFirstName(firstName);
      setRulesCount(rules.length);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleDismissWizard = async () => {
    if (!user) return;
    setWizardDismissed(true);
    try {
      await ProfileService.updateProfile(user.id, { setup_wizard_dismissed: true });
    } catch (error) {
      console.error('Error dismissing wizard:', error);
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
      await fetchStats();
      toast({
        title: 'System deactivated',
        description: 'Your Dead Man\'s Switch is now off. Check in to reactivate.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to deactivate', variant: 'destructive' });
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

  const getSystemStatusDisplay = () => {
    if (!settings?.is_active) return { label: 'Inactive', color: 'text-warning', bgColor: 'bg-warning/20', iconColor: 'text-warning' };
    if (settings.switch_triggered) return { label: 'TRIGGERED', color: 'text-destructive', bgColor: 'bg-destructive/20', iconColor: 'text-destructive' };
    if (settings.grace_period_active) return { label: 'GRACE PERIOD', color: 'text-warning', bgColor: 'bg-warning/20', iconColor: 'text-warning' };
    if (countdown.isOverdue) return { label: 'CHECK-IN OVERDUE', color: 'text-destructive', bgColor: 'bg-destructive/20', iconColor: 'text-destructive' };
    return { label: 'Active & Protected', color: 'text-success', bgColor: 'bg-success/20', iconColor: 'text-success' };
  };

  const statusDisplay = getSystemStatusDisplay();

  const quickActions = [
    {
      name: 'Switch',
      href: '/switch',
      icon: Timer,
      contextInfo: settings?.is_active
        ? `Next check-in in ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h ${countdown.minutes}m`
        : 'System inactive',
      actionLabel: !settings?.is_active
        ? 'Check in to activate'
        : countdown.isOverdue || settings?.grace_period_active
          ? '⚠️ Check in urgently'
          : 'Check in now',
    },
    {
      name: 'Contacts',
      href: '/contacts',
      icon: Users,
      contextInfo: `${stats.contactsCount} contact${stats.contactsCount !== 1 ? 's' : ''}`,
      actionLabel: stats.contactsCount < 3 ? 'Add a contact' : 'Manage',
    },
    {
      name: 'Digital Accounts',
      href: '/accounts',
      icon: Monitor,
      contextInfo: `${stats.accountsCount} account${stats.accountsCount !== 1 ? 's' : ''}`,
      actionLabel: stats.accountsCount === 0 ? 'Add an account' : 'Manage',
    },
    {
      name: 'Financial Assets',
      href: '/financials',
      icon: Landmark,
      contextInfo: 'Estate & legacy assets',
      actionLabel: 'Manage',
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      contextInfo: `${stats.documentsCount} document${stats.documentsCount !== 1 ? 's' : ''}`,
      actionLabel: stats.documentsCount === 0 ? 'Add a document' : 'Manage',
    },
  ];

  const autoLockMinutes = parseInt(localStorage.getItem('vault_auto_lock_minutes') || '15');
  const autoLockLabel = autoLockMinutes >= 60 ? `${autoLockMinutes / 60} hour${autoLockMinutes > 60 ? 's' : ''}` : `${autoLockMinutes} minutes`;

  const securityItems = [
    { label: 'Vault Auto-Lock', enabled: true, explanation: `Your vault automatically locks after ${autoLockLabel} of inactivity, clearing encryption keys from memory.` },
    { label: 'Data Encryption', enabled: true, explanation: 'All data is encrypted client-side with AES-256-GCM before reaching our servers. We operate on a zero-knowledge basis.' },
    { label: 'EU Data Storage', enabled: true, explanation: 'Your encrypted data is stored on Supabase infrastructure in the EU region, replicated across multiple availability zones.' },
    { label: 'Emergency Contacts', enabled: stats.contactsCount > 0, explanation: `You have configured ${stats.contactsCount} trusted contact${stats.contactsCount !== 1 ? 's' : ''}.` },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground">
                {getTimeOfDay()}{firstName ? `, ${firstName}` : ''}!
              </h1>
              {alertBadge && (
                <Badge className={`${alertBadge.color} border-none text-xs font-medium`}>
                  {alertBadge.label}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Welcome to your dashboard</p>
          </div>
          <SecurityBadge />
        </div>

        {/* Setup Wizard */}
        {!wizardDismissed && (
          <SetupWizard
            contactsCount={stats.contactsCount}
            isActive={settings?.is_active || false}
            rulesCount={rulesCount}
            testEmailSent={testEmailSent}
            hasPortalLinks={hasPortalLinks}
            onDismiss={handleDismissWizard}
          />
        )}

        {/* System Status Card */}
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
              <p className={`text-sm font-medium ${statusDisplay.color}`}>{statusDisplay.label}</p>
            </div>
            {!settings?.is_active ? (
              <Link to="/switch">
                <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-5">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check in to activate
                </Button>
              </Link>
            ) : (countdown.isOverdue || settings?.grace_period_active) && !settings?.switch_triggered ? (
              <div className="flex items-center gap-2">
                <Link to="/switch">
                  <Button size="sm" variant="destructive" className="rounded-full px-5 animate-pulse">
                    Check in now
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeactivate}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full px-4"
                >
                  Deactivate
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full px-4"
              >
                Deactivate
              </Button>
            )}
          </div>

          {/* Warning Banners */}
          {settings?.is_active && (settings?.grace_period_active || countdown.isOverdue) && !settings?.switch_triggered && (
            <div className={`rounded-2xl p-4 mb-4 border ${
              settings.grace_period_active ? 'bg-warning/10 border-warning/30' : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${settings.grace_period_active ? 'text-warning animate-pulse' : 'text-destructive animate-pulse'}`} />
                <div>
                  <p className={`font-semibold ${settings.grace_period_active ? 'text-warning' : 'text-destructive'}`}>
                    {settings.grace_period_active ? '⚠️ Grace Period Active — Check in immediately!' : '🚨 Check-in Overdue — Action Required!'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {settings.grace_period_active
                      ? 'Your check-in deadline has passed. Check in before the grace period ends or your contacts will be notified.'
                      : 'Your check-in deadline has passed. Please check in as soon as possible.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {settings?.switch_triggered && (
            <div className="rounded-2xl p-4 mb-4 border bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">🚨 System Triggered — Your emergency contacts have been notified</p>
                  <p className="text-sm text-muted-foreground">Perform a check-in to reset the system.</p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown - swapped layout: time left on left, date on right */}
          {settings?.is_active && currentDeadline && !settings?.switch_triggered && (
            <div className={`rounded-2xl p-4 border ${
              countdown.isOverdue || settings?.grace_period_active ? 'bg-destructive/5 border-destructive/30' : 'bg-muted border-transparent'
            }`}>
              {!countdown.isOverdue && !settings?.grace_period_active ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">Next check-in due</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-primary" />
                      <span className="text-lg font-medium text-primary">
                        {countdown.days > 0 && `${countdown.days}d `}{countdown.hours}h {countdown.minutes}m
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDateEU(currentDeadline)}</p>
                  </div>
                </>
              ) : settings?.grace_period_active && settings?.grace_period_end ? (
                <>
                  <p className="text-sm text-warning mb-1 font-medium">⚠️ Grace period ends in</p>
                  <div className="flex items-center gap-4">
                    {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
                      <div key={unit} className="text-center">
                        <span className="text-2xl font-bold text-warning tabular-nums">{countdown[unit].toString().padStart(2, '0')}</span>
                        <span className="text-xs text-warning/70 block uppercase">{unit}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-destructive mb-1 font-medium">🚨 Overdue since</p>
                  <p className="text-lg font-medium text-destructive">{formatDateEU(currentDeadline)}</p>
                </>
              )}
            </div>
          )}

          {/* Check-in history link */}
          <div className="mt-3 flex justify-end">
            <Link
              to="/switch#history"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              View check-in history
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-card-foreground">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="bg-muted/30 rounded-2xl p-5 flex items-center gap-4 group hover:bg-muted/50 transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground group-hover:text-primary transition-colors">{action.name}</h4>
                  <p className="text-sm text-muted-foreground">{action.contextInfo}</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full whitespace-nowrap">
                  {action.actionLabel}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Security Checklist */}
        <div className="bg-muted/30 rounded-2xl p-6">
          <h3 className="text-xl font-medium text-card-foreground mb-6">Security Checklist</h3>
          <div className="space-y-2">
            {securityItems.map((item, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.enabled ? 'bg-success/20' : 'bg-muted'}`}>
                        <Check className={`w-4 h-4 ${item.enabled ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-card-foreground font-medium">{item.label}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-muted-foreground pl-14 pb-3">{item.explanation}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
