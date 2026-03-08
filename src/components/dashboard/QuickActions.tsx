
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  UserPlus, 
  Upload, 
  Monitor,
  Landmark,
  Settings,
  Bell,
  ArrowRight,
  Zap
} from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      title: 'Check In Now',
      description: 'Reset your dead man\'s switch timer',
      icon: Timer,
      href: '/switch',
      variant: 'primary' as const,
      gradient: 'from-success via-success to-emerald-600',
    },
    {
      title: 'Add Contact',
      description: 'Add a trusted emergency contact',
      icon: UserPlus,
      href: '/contacts',
      variant: 'secondary' as const,
      gradient: 'from-primary via-primary to-blue-600',
    },
    {
      title: 'Upload Document',
      description: 'Store important legacy documents',
      icon: Upload,
      href: '/documents',
      variant: 'secondary' as const,
      gradient: 'from-secondary via-secondary to-purple-600',
    },
    {
      title: 'Add Account',
      description: 'Store digital account information',
      icon: Monitor,
      href: '/accounts',
      variant: 'secondary' as const,
      gradient: 'from-accent via-accent to-cyan-600',
    },
    {
      title: 'Financial Assets',
      description: 'Banks, insurance, investments',
      icon: Landmark,
      href: '/financials',
      variant: 'secondary' as const,
      gradient: 'from-emerald-500 via-emerald-500 to-emerald-600',
    },
    {
      title: 'Configure Alerts',
      description: 'Set up notification preferences',
      icon: Bell,
      href: '/settings',
      variant: 'secondary' as const,
      gradient: 'from-warning via-warning to-orange-600',
    },
    {
      title: 'Settings',
      description: 'Manage account preferences',
      icon: Settings,
      href: '/settings',
      variant: 'secondary' as const,
      gradient: 'from-muted-foreground via-muted-foreground to-slate-600',
    },
  ];

  return (
    <Card className="glass overflow-hidden border-border/50">
      <div className="absolute inset-0 gradient-mesh opacity-5 animate-gradient-xy" />
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-2xl font-display flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 animate-pulse-subtle">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <span className="gradient-text">Quick Actions</span>
        </CardTitle>
        <p className="text-muted-foreground mt-2">Get things done quickly with these common tasks</p>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className={`group block animate-fade-in-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`h-full p-6 rounded-2xl transition-all duration-500 border glass-strong
                  ${action.variant === 'primary' 
                    ? 'border-success/30 hover:border-success/50' 
                    : 'border-border/30 hover:border-primary/50'
                  } 
                  hover-lift group-hover:shadow-2xl relative overflow-hidden`}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Floating decoration */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${action.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} relative overflow-hidden
                        ${action.variant === 'primary' ? 'shadow-lg shadow-success/30' : ''}`}
                      >
                        <Icon className="w-6 h-6 text-white relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-300 transform group-hover:translate-x-1" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-display font-semibold text-foreground group-hover:gradient-text transition-all duration-300">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
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