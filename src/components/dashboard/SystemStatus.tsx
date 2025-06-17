
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
      color: 'bg-red-500',
      icon: AlertTriangle,
      variant: 'destructive' as const,
    };
  }

  if (isOverdue) {
    return {
      status: 'Check-in Overdue',
      color: 'bg-red-500',
      icon: AlertTriangle,
      variant: 'destructive' as const,
    };
  }

  return {
    status: 'Active & Monitoring',
    color: 'bg-emerald-500',
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
    <Card className="bg-slate-700/50 border-slate-600 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="w-5 h-5" />
          Dead Man's Switch Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusInfo.color} animate-pulse`} />
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusInfo.status}
          </Badge>
        </div>
        
        {/* Main Countdown Display */}
        {isActive && nextCheckInDue && (
          <div className={`relative overflow-hidden rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.pulse}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Timer className={`w-5 h-5 ${colors.text}`} />
                  <span className="text-lg font-semibold text-white">
                    {countdown.isOverdue ? 'OVERDUE' : 'Next Check-in'}
                  </span>
                </div>
                {urgencyLevel === 'critical' && (
                  <Badge variant="destructive" className="animate-pulse">
                    CRITICAL
                  </Badge>
                )}
                {urgencyLevel === 'urgent' && (
                  <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                    URGENT
                  </Badge>
                )}
              </div>

              {!countdown.isOverdue ? (
                <div className="grid grid-cols-4 gap-4">
                  {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
                    <div key={unit} className="text-center">
                      <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                        {countdown[unit].toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-red-400 mb-2 animate-pulse">
                    CHECK-IN REQUIRED
                  </div>
                  <p className="text-red-300">Your check-in deadline has passed</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Additional Info */}
        <div className="space-y-3">
          {lastCheckIn && (
            <div className="flex items-center gap-2 text-sm text-slate-300 p-3 bg-slate-800/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Last check-in: {formatDate(lastCheckIn)}</span>
            </div>
          )}
          
          {nextCheckInDue && (
            <div className="flex items-center gap-2 text-sm text-slate-300 p-3 bg-slate-800/30 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Next check-in due: {formatDate(nextCheckInDue)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
