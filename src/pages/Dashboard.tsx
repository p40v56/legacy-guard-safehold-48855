
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import SystemStatus from '@/components/dashboard/SystemStatus';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Users, CreditCard, FileText, Shield, Activity, Clock } from 'lucide-react';

type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface UserSettings {
  check_in_frequency: CheckInFrequency;
  grace_period_hours: number;
  is_active: boolean;
  last_check_in: string | null;
  next_check_in_due: string | null;
}

interface DashboardStats {
  contactsCount: number;
  accountsCount: number;
  documentsCount: number;
  userSettings: UserSettings | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    contactsCount: 3,
    accountsCount: 8,
    documentsCount: 5,
    userSettings: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      // Mock settings for demonstration - same as Switch page
      const mockSettings: UserSettings = {
        check_in_frequency: 'weekly',
        grace_period_hours: 72,
        is_active: true,
        last_check_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        next_check_in_due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      };
      
      setStats(prev => ({
        ...prev,
        userSettings: mockSettings
      }));
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
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
          <div className="relative p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 backdrop-blur-sm">
                <Activity className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  {getTimeOfDay()}!
                </h1>
                <p className="text-lg text-slate-300">
                  Welcome back to your digital legacy dashboard
                </p>
              </div>
            </div>
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              Here's an overview of your digital legacy system. Monitor your dead man's switch, 
              manage your accounts, and ensure your important information is secure and accessible 
              to your trusted contacts.
            </p>
          </div>
        </div>

        {/* System Status */}
        <SystemStatus 
          isActive={stats.userSettings?.is_active || false} 
          lastCheckIn={stats.userSettings?.last_check_in || undefined} 
          nextCheckInDue={stats.userSettings?.next_check_in_due || undefined} 
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Emergency Contacts" value={stats.contactsCount} icon={Users} description="Trusted contacts configured" />
          <StatsCard title="Digital Accounts" value={stats.accountsCount} icon={CreditCard} description="Accounts being managed" />
          <StatsCard title="Legacy Documents" value={stats.documentsCount} icon={FileText} description="Documents stored" />
          <StatsCard title="System Status" value={stats.userSettings?.is_active ? "Active" : "Inactive"} icon={Shield} description="Dead man's switch status" />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity placeholder for future enhancement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Security Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Two-Factor Auth</span>
                <span className="text-emerald-400 text-sm">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Data Encryption</span>
                <span className="text-emerald-400 text-sm">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Backup Status</span>
                <span className="text-emerald-400 text-sm">Current</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
