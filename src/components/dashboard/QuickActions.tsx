
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  UserPlus, 
  Upload, 
  CreditCard,
  Settings,
  Bell 
} from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      title: 'Check In Now',
      description: 'Reset your dead man\'s switch',
      icon: Timer,
      href: '/switch',
      variant: 'default' as const,
    },
    {
      title: 'Add Contact',
      description: 'Add an emergency contact',
      icon: UserPlus,
      href: '/contacts',
      variant: 'outline' as const,
    },
    {
      title: 'Upload Document',
      description: 'Store important documents',
      icon: Upload,
      href: '/documents',
      variant: 'outline' as const,
    },
    {
      title: 'Add Account',
      description: 'Store digital account info',
      icon: CreditCard,
      href: '/accounts',
      variant: 'outline' as const,
    },
    {
      title: 'Configure Alerts',
      description: 'Set up notifications',
      icon: Bell,
      href: '/settings',
      variant: 'outline' as const,
    },
    {
      title: 'Settings',
      description: 'Manage your preferences',
      icon: Settings,
      href: '/settings',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className={`h-auto p-4 flex flex-col items-start space-y-2 ${
                  action.variant === 'default' 
                    ? 'bg-emerald-600 hover:bg-emerald-500' 
                    : 'bg-slate-600/50 hover:bg-slate-600 border-slate-500'
                }`}
                asChild
              >
                <Link to={action.href}>
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
