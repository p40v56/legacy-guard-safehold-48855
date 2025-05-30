
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Timer,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface DashboardStats {
  totalContacts: number;
  totalAccounts: number;
  totalDocuments: number;
  nextCheckIn: string | null;
  isActive: boolean;
  lastCheckIn: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalAccounts: 0,
    totalDocuments: 0,
    nextCheckIn: null,
    isActive: true,
    lastCheckIn: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch contacts count
      const { count: contactsCount } = await supabase
        .from('emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch accounts count
      const { count: accountsCount } = await supabase
        .from('digital_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch documents count
      const { count: documentsCount } = await supabase
        .from('legacy_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch user settings
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('next_check_in_due, is_active, last_check_in')
        .eq('user_id', user?.id)
        .single();

      setStats({
        totalContacts: contactsCount || 0,
        totalAccounts: accountsCount || 0,
        totalDocuments: documentsCount || 0,
        nextCheckIn: userSettings?.next_check_in_due || null,
        isActive: userSettings?.is_active || false,
        lastCheckIn: userSettings?.last_check_in || null,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (!stats.isActive) {
      return <Badge className="bg-red-600/20 text-red-400">Inactive</Badge>;
    }
    
    if (stats.nextCheckIn) {
      const nextCheckIn = new Date(stats.nextCheckIn);
      const now = new Date();
      const isOverdue = nextCheckIn < now;
      
      if (isOverdue) {
        return <Badge className="bg-orange-600/20 text-orange-400">Check-in Overdue</Badge>;
      }
    }
    
    return <Badge className="bg-emerald-600/20 text-emerald-400">Active</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="w-8 h-8 bg-emerald-600/20 rounded-lg animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back to LegacyVault
          </h1>
          <p className="text-slate-400">
            Manage your digital legacy and ensure your loved ones are protected
          </p>
        </div>

        {/* Status Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                System Status
              </CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Last Check-in</p>
                <p className="text-white font-medium">{formatDate(stats.lastCheckIn)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Next Check-in Due</p>
                <p className="text-white font-medium">{formatDate(stats.nextCheckIn)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/switch">
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  <Timer className="w-4 h-4 mr-2" />
                  Manage Dead Man's Switch
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Emergency Contacts</CardTitle>
              <Users className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalContacts}</div>
              <p className="text-xs text-slate-400 mt-1">Trusted individuals</p>
              <Link to="/contacts" className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Contacts
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Digital Accounts</CardTitle>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalAccounts}</div>
              <p className="text-xs text-slate-400 mt-1">Secured accounts</p>
              <Link to="/accounts" className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Accounts
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Legacy Documents</CardTitle>
              <FileText className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalDocuments}</div>
              <p className="text-xs text-slate-400 mt-1">Important files</p>
              <Link to="/documents" className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/contacts">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </Link>
              <Link to="/accounts">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </Link>
              <Link to="/documents">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Update Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
