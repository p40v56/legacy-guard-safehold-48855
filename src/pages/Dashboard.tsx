
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import SystemStatus from '@/components/dashboard/SystemStatus';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Shield,
  Activity,
  Clock
} from 'lucide-react';

interface DashboardStats {
  contactsCount: number;
  accountsCount: number;
  documentsCount: number;
  userSettings: {
    is_active: boolean;
    last_check_in: string | null;
    next_check_in_due: string | null;
  } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    contactsCount: 0,
    accountsCount: 0,
    documentsCount: 0,
    userSettings: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const [contactsResult, accountsResult, documentsResult, settingsResult] = await Promise.all([
        supabase
          .from('emergency_contacts')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('digital_accounts')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('legacy_documents')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('user_settings')
          .select('is_active, last_check_in, next_check_in_due')
          .eq('user_id', user.id)
          .single(),
      ]);

      setStats({
        contactsCount: contactsResult.data?.length || 0,
        accountsCount: accountsResult.data?.length || 0,
        documentsCount: documentsResult.data?.length || 0,
        userSettings: settingsResult.data || null,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
          <StatsCard
            title="Emergency Contacts"
            value={stats.contactsCount}
            icon={Users}
            description="Trusted contacts configured"
          />
          <StatsCard
            title="Digital Accounts"
            value={stats.accountsCount}
            icon={CreditCard}
            description="Accounts being managed"
          />
          <StatsCard
            title="Legacy Documents"
            value={stats.documentsCount}
            icon={FileText}
            description="Documents stored"
          />
          <StatsCard
            title="System Status"
            value={stats.userSettings?.is_active ? "Active" : "Inactive"}
            icon={Shield}
            description="Dead man's switch status"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity placeholder for future enhancement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <p className="text-slate-400 text-center py-8">
              Activity tracking will be displayed here in future updates
            </p>
          </div>
          
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
