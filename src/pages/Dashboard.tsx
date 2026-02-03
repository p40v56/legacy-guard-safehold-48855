import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { Users, CreditCard, FileText, Shield, Timer, ArrowRight, Check } from 'lucide-react';
import { DashboardStats } from '@/types/common';
import { DashboardService } from '@/services/supabaseService';

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="page-header">
          <h1 className="text-3xl lg:text-4xl font-medium mb-2">
            {getTimeOfDay()}!
          </h1>
          <p>
            Welcome to your digital legacy dashboard
          </p>
        </div>

        {/* Status Card */}
        <div className="glass-strong rounded-3xl p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              stats.userSettings?.is_active 
                ? 'bg-success/20' 
                : 'bg-warning/20'
            }`}>
              <Shield className={`w-7 h-7 ${
                stats.userSettings?.is_active 
                  ? 'text-success' 
                  : 'text-warning'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-medium text-card-foreground">System Status</h2>
              <p className={`text-sm font-medium ${
                stats.userSettings?.is_active 
                  ? 'text-success' 
                  : 'text-warning'
              }`}>
                {stats.userSettings?.is_active ? 'Active & Protected' : 'Inactive'}
              </p>
            </div>
          </div>

          {stats.userSettings?.is_active && stats.userSettings?.next_check_in_due && (
            <div className="bg-muted rounded-2xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Next check-in due</p>
              <p className="text-lg font-medium text-card-foreground">
                {new Date(
                  stats.userSettings.deadline_mode === 'custom' && stats.userSettings.custom_deadline
                    ? stats.userSettings.custom_deadline
                    : stats.userSettings.next_check_in_due
                ).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Contacts', value: stats.contactsCount, icon: Users },
            { label: 'Accounts', value: stats.accountsCount, icon: CreditCard },
            { label: 'Documents', value: stats.documentsCount, icon: FileText },
            { label: 'Status', value: stats.userSettings?.is_active ? 'Active' : 'Off', icon: Shield },
          ].map((stat, index) => (
            <div 
              key={index}
              className="glass rounded-2xl p-5 text-center interactive-card"
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
                className="glass rounded-2xl p-5 flex items-center gap-4 group interactive-card"
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
        <div className="glass rounded-3xl p-6 lg:p-8">
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
