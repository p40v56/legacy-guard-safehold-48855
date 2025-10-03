
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock, Calendar, Timer } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { formatDate } from '@/utils/dateUtils';
import { getUrgencyLevel, getUrgencyColors } from '@/utils/urgencyUtils';

interface SystemStatusProps {
  isActive: boolean;
  lastCheckIn?: string;
  nextCheckInDue?: string;
}

const getStatusInfo = (isActive: boolean, isOverdue: boolean) => {
  if (!isActive) {
    return {
      status: 'Inactive',
      color: 'bg-destructive',
      icon: AlertTriangle,
      variant: 'destructive' as const,
    };
  }

  if (isOverdue) {
    return {
      status: 'Check-in Overdue',
      color: 'bg-destructive',
      icon: AlertTriangle,
      variant: 'destructive' as const,
    };
  }

  return {
    status: 'Active & Monitoring',
    color: 'bg-success',
    icon: CheckCircle,
    variant: 'default' as const,
  };
};

const SystemStatus = ({ isActive, lastCheckIn, nextCheckInDue }: SystemStatusProps) => {
  const countdown = useCountdown(isActive, nextCheckInDue || null);
  const statusInfo = getStatusInfo(isActive, countdown.isOverdue);
  const urgencyLevel = getUrgencyLevel(countdown);
  const colors = getUrgencyColors(urgencyLevel);
  
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="glass-strong overflow-hidden border-border/50 animate-scale-in">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-gradient-xy opacity-50" />
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-2xl font-display">
          <div className="p-2 rounded-xl bg-primary/20 animate-pulse-subtle">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="gradient-text">Dead Man's Switch Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusInfo.color} animate-pulse shadow-lg ${statusInfo.color.includes('success') ? 'shadow-success/50' : 'shadow-destructive/50'}`} />
          <Badge variant={statusInfo.variant} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium">
            <StatusIcon className="w-4 h-4" />
            {statusInfo.status}
          </Badge>
        </div>
        
        {/* Main Countdown Display */}
        {isActive && nextCheckInDue && (
          <div className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} glass transition-all duration-500 hover:scale-[1.02]`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${urgencyLevel === 'critical' ? 'from-destructive/10 to-transparent' : urgencyLevel === 'urgent' ? 'from-warning/10 to-transparent' : 'from-primary/5 to-transparent'}`} />
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Timer className={`w-6 h-6 ${colors.text}`} />
                  <span className="text-xl font-display font-semibold">
                    {countdown.isOverdue ? 'CHECK-IN OVERDUE' : 'Next Check-in'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {urgencyLevel === 'critical' && (
                    <Badge variant="destructive" className="animate-pulse shadow-lg shadow-destructive/50">
                      CRITICAL
                    </Badge>
                  )}
                  {urgencyLevel === 'urgent' && (
                    <Badge className="bg-warning/20 text-warning border-warning/30 animate-pulse-subtle">
                      URGENT
                    </Badge>
                  )}
                </div>
              </div>

              {!countdown.isOverdue ? (
                <div className="grid grid-cols-4 gap-4">
                  {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, index) => (
                    <div 
                      key={unit} 
                      className={`text-center p-4 rounded-xl glass hover:scale-105 transition-transform duration-300 animate-fade-in-up`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`text-4xl font-display font-bold ${colors.text} mb-2 tabular-nums`}>
                        {countdown[unit].toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {unit}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 animate-bounce-in">
                  <div className="text-5xl font-display font-bold text-destructive mb-3 animate-pulse">
                    ACTION REQUIRED
                  </div>
                  <p className="text-destructive/80 text-lg">Your check-in deadline has passed</p>
                </div>
              )}

              {nextCheckInDue && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <p className="text-muted-foreground text-sm text-center font-medium">
                    Deadline: {formatDate(nextCheckInDue)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Additional Info */}
        <div className="grid gap-3">
          {lastCheckIn && (
            <div className="flex items-center gap-3 text-sm p-4 glass rounded-xl hover-lift">
              <div className="p-2 rounded-lg bg-success/20">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="font-medium">Last check-in</p>
                <p className="text-muted-foreground">{formatDate(lastCheckIn)}</p>
              </div>
            </div>
          )}
          
          {nextCheckInDue && (
            <div className="flex items-center gap-3 text-sm p-4 glass rounded-xl hover-lift">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Next check-in due</p>
                <p className="text-muted-foreground">{formatDate(nextCheckInDue)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;