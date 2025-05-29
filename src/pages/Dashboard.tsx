
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Clock, 
  Users, 
  Key, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Digital Accounts",
      value: "12",
      description: "Accounts secured",
      icon: Key,
      color: "text-blue-400",
      bg: "bg-blue-400/20"
    },
    {
      title: "Emergency Contacts",
      value: "3",
      description: "Contacts configured",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-400/20"
    },
    {
      title: "Legacy Documents",
      value: "5",
      description: "Documents stored",
      icon: FileText,
      color: "text-purple-400",
      bg: "bg-purple-400/20"
    },
    {
      title: "System Status",
      value: "Active",
      description: "All systems operational",
      icon: Shield,
      color: "text-green-400",
      bg: "bg-green-400/20"
    }
  ];

  const quickActions = [
    {
      title: "Set Check-in Frequency",
      description: "Configure how often you need to check in",
      icon: Clock,
      href: "/switch",
      urgent: false
    },
    {
      title: "Add Digital Account",
      description: "Secure another digital account",
      icon: Key,
      href: "/accounts",
      urgent: false
    },
    {
      title: "Add Emergency Contact",
      description: "Configure who to notify in case of emergency",
      icon: Users,
      href: "/contacts",
      urgent: true
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.user_metadata?.first_name || 'User'}
            </h1>
            <p className="text-slate-400">
              Your digital legacy is secure and actively monitored
            </p>
          </div>
          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
            <CheckCircle className="w-4 h-4 mr-2" />
            System Active
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-slate-400 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alert Banner */}
        <Card className="bg-amber-900/20 border-amber-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Action Required
            </CardTitle>
            <CardDescription className="text-amber-200/70">
              Your next check-in is due in 5 days. Make sure to complete it to keep your system active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-amber-600 hover:bg-amber-500 text-white">
              Complete Check-in Now
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    {action.urgent && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-white group-hover:text-emerald-400 transition-colors">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 mb-4">
                    {action.description}
                  </CardDescription>
                  <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300 p-0 h-auto group-hover:translate-x-1 transition-transform">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Your latest actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm text-white">Account created successfully</p>
                  <p className="text-xs text-slate-400">Welcome to LegacyVault</p>
                </div>
                <span className="text-xs text-slate-400">Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
