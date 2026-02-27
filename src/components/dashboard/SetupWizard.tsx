import { Link } from 'react-router-dom';
import { Check, ArrowRight, X, Users, Shield, AlertTriangle, Mail, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SetupWizardProps {
  contactsCount: number;
  isActive: boolean;
  rulesCount: number;
  testEmailSent: boolean;
  hasPortalLinks: boolean;
  onDismiss: () => void;
}

const SetupWizard = ({ contactsCount, isActive, rulesCount, testEmailSent, hasPortalLinks, onDismiss }: SetupWizardProps) => {
  const steps = [
    {
      title: 'Add a contact',
      href: '/contacts',
      icon: Users,
      completed: contactsCount >= 1,
    },
    {
      title: 'Configure the switch',
      href: '/switch',
      icon: Shield,
      completed: isActive,
    },
    {
      title: 'Define rules',
      href: '/settings?tab=activation',
      icon: AlertTriangle,
      completed: rulesCount >= 1,
    },
    {
      title: 'Send a test email',
      href: '/settings?tab=email',
      icon: Mail,
      completed: testEmailSent,
    },
    {
      title: 'Generate portal links',
      href: '/contacts',
      icon: Link2,
      completed: hasPortalLinks,
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const allCompleted = completedCount === steps.length;

  if (allCompleted) return null;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-card-foreground">Getting Started</h3>
          <p className="text-sm text-muted-foreground">{completedCount}/{steps.length} steps completed</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Progress value={(completedCount / steps.length) * 100} className="h-2 mb-6" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {steps.map((step) => (
          <Link
            key={step.title}
            to={step.href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              step.completed
                ? 'bg-success/10 border border-success/20'
                : 'bg-muted/30 border border-border hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              step.completed ? 'bg-success/20' : 'bg-primary/10'
            }`}>
              {step.completed ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <step.icon className="w-4 h-4 text-primary" />
              )}
            </div>
            <span className={`text-sm font-medium flex-1 ${
              step.completed ? 'text-success line-through' : 'text-card-foreground'
            }`}>
              {step.title}
            </span>
            {!step.completed && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SetupWizard;
