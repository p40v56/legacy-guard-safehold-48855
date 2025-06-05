
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  UserPlus, 
  Upload, 
  CreditCard,
  Settings,
  Bell,
  ArrowRight
} from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      title: 'Check In Now',
      description: 'Reset your dead man\'s switch timer',
      icon: Timer,
      href: '/switch',
      variant: 'primary' as const,
      gradient: 'from-emerald-600 to-emerald-500',
    },
    {
      title: 'Add Contact',
      description: 'Add a trusted emergency contact',
      icon: UserPlus,
      href: '/contacts',
      variant: 'secondary' as const,
      gradient: 'from-blue-600 to-blue-500',
    },
    {
      title: 'Upload Document',
      description: 'Store important legacy documents',
      icon: Upload,
      href: '/documents',
      variant: 'secondary' as const,
      gradient: 'from-purple-600 to-purple-500',
    },
    {
      title: 'Add Account',
      description: 'Store digital account information',
      icon: CreditCard,
      href: '/accounts',
      variant: 'secondary' as const,
      gradient: 'from-indigo-600 to-indigo-500',
    },
    {
      title: 'Configure Alerts',
      description: 'Set up notification preferences',
      icon: Bell,
      href: '/settings',
      variant: 'secondary' as const,
      gradient: 'from-orange-600 to-orange-500',
    },
    {
      title: 'Settings',
      description: 'Manage account preferences',
      icon: Settings,
      href: '/settings',
      variant: 'secondary' as const,
      gradient: 'from-slate-600 to-slate-500',
    },
  ];

  return (
    <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Timer className="w-5 h-5 text-emerald-400" />
          </div>
          Quick Actions
        </CardTitle>
        <p className="text-slate-400">Get things done quickly with these common tasks</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="group block"
              >
                <div className={`h-full p-6 rounded-xl transition-all duration-300 border ${
                  action.variant === 'primary' 
                    ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 hover:from-emerald-500/30 hover:to-emerald-600/30 shadow-lg shadow-emerald-500/10' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50'
                } group-hover:scale-105 group-hover:shadow-xl`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${
                      action.variant === 'primary'
                        ? 'bg-emerald-500/20'
                        : `bg-gradient-to-br ${action.gradient} opacity-80`
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        action.variant === 'primary' ? 'text-emerald-400' : 'text-white'
                      }`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white group-hover:text-white transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
