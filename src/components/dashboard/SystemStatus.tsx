
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock, Calendar, Timer } from 'lucide-react';

interface SystemStatusProps {
  isActive: boolean;
  lastCheckIn?: string;
  nextCheckInDue?: string;
}

const SystemStatus = ({ isActive, lastCheckIn, nextCheckInDue }: SystemStatusProps) => {
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  useEffect(() => {
    if (!isActive || !nextCheckInDue) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(nextCheckInDue);
      const timeDiff = dueDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isOverdue: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isActive, nextCheckInDue]);

  const getStatusInfo = () => {
    if (!isActive) {
      return {
        status: 'Inactive',
        color: 'bg-red-500',
        icon: AlertTriangle,
        variant: 'destructive' as const,
      };
    }

    if (countdown.isOverdue) {
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

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUrgencyLevel = () => {
    if (countdown.isOverdue) return 'critical';
    if (countdown.days === 0 && countdown.hours < 12) return 'urgent';
    if (countdown.days === 0) return 'warning';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  const getUrgencyColors = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          pulse: 'animate-pulse',
        };
      case 'urgent':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          pulse: 'animate-pulse',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          pulse: '',
        };
      default:
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          pulse: '',
        };
    }
  };

  const colors = getUrgencyColors();

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
                  <div className="text-center">
                    <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                      {countdown.days.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Days</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                      {countdown.hours.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                      {countdown.minutes.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold font-mono ${colors.text} mb-1`}>
                      {countdown.seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Seconds</div>
                  </div>
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
