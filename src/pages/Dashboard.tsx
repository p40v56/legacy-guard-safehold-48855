
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
  Shield 
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
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Welcome back! Here's an overview of your digital legacy system.
          </p>
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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
