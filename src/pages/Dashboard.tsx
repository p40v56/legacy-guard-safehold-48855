
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Shield, 
  Users, 
  Key, 
  FileText, 
  Settings,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Dashboard = () => {
  const [timeToNextCheckin, setTimeToNextCheckin] = useState({
    days: 5,
    hours: 14,
    minutes: 32
  });

  const [setupProgress, setSetupProgress] = useState(65);

  useEffect(() => {
    // Simulate countdown timer
    const timer = setInterval(() => {
      setTimeToNextCheckin(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const quickStats = [
    { label: 'Digital Accounts', value: '12', icon: Key, color: 'text-blue-400' },
    { label: 'Contacts', value: '8', icon: Users, color: 'text-emerald-400' },
    { label: 'Documents', value: '5', icon: FileText, color: 'text-purple-400' },
    { label: 'Messages', value: '3', icon: FileText, color: 'text-orange-400' },
  ];

  const recentActivity = [
    { action: 'Updated password for Gmail account', time: '2 hours ago', type: 'update' },
    { action: 'Added new contact: Sarah Johnson', time: '1 day ago', type: 'add' },
    { action: 'Completed weekly check-in', time: '2 days ago', type: 'checkin' },
    { action: 'Generated backup codes for Facebook', time: '3 days ago', type: 'security' },
  ];

  const setupTasks = [
    { task: 'Add emergency contacts', completed: true },
    { task: 'Configure check-in frequency', completed: true },
    { task: 'Add digital accounts', completed: true },
    { task: 'Set up 2FA backup codes', completed: false },
    { task: 'Create personal messages', completed: false },
    { task: 'Upload important documents', completed: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Monitor your digital legacy status</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-500">
            <Plus className="w-4 h-4 mr-2" />
            Quick Add Account
          </Button>
        </div>

        {/* Dead Man's Switch Status */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Next Check-in</CardTitle>
                  <CardDescription className="text-slate-300">
                    Your system is active and monitoring
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-400/30">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeToNextCheckin.days}</div>
                <div className="text-sm text-slate-400">Days</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeToNextCheckin.hours}</div>
                <div className="text-sm text-slate-400">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeToNextCheckin.minutes}</div>
                <div className="text-sm text-slate-400">Minutes</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                Complete Check-in Now
              </Button>
              <Button variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-700">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-slate-800/50 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Setup Progress */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Setup Progress
              </CardTitle>
              <CardDescription className="text-slate-300">
                Complete your digital legacy setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Overall Progress</span>
                    <span className="text-white font-semibold">{setupProgress}%</span>
                  </div>
                  <Progress value={setupProgress} className="h-2" />
                </div>
                <div className="space-y-3">
                  {setupTasks.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-slate-500 rounded-full" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-slate-300 line-through' : 'text-white'}`}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-slate-300">
                Your latest actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-3 border-b border-slate-700 last:border-b-0">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.action}</p>
                      <p className="text-slate-400 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alert */}
        <Card className="bg-orange-600/10 border-orange-600/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <div>
                <h3 className="text-white font-semibold">Security Recommendation</h3>
                <p className="text-orange-200 text-sm mt-1">
                  You have 3 accounts without 2FA backup codes. Consider adding them for better security.
                </p>
              </div>
              <Button variant="outline" className="border-orange-400/30 text-orange-400 hover:bg-orange-400/10 ml-auto">
                Review Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
