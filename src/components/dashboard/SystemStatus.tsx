
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface SystemStatusProps {
  isActive: boolean;
  lastCheckIn?: string;
  nextCheckInDue?: string;
}

const SystemStatus = ({ isActive, lastCheckIn, nextCheckInDue }: SystemStatusProps) => {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!isActive || !nextCheckInDue) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(nextCheckInDue);
      const timeDiff = dueDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setCountdown('OVERDUE');
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
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

    if (nextCheckInDue) {
      const now = new Date();
      const dueDate = new Date(nextCheckInDue);
      const isOverdue = now > dueDate;
      
      if (isOverdue) {
        return {
          status: 'Check-in Overdue',
          color: 'bg-red-500',
          icon: AlertTriangle,
          variant: 'destructive' as const,
        };
      }
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

  const getCountdownColor = () => {
    if (countdown === 'OVERDUE') return 'text-red-400';
    if (countdown.includes('h') && !countdown.includes('d')) {
      const hours = parseInt(countdown.split('h')[0]);
      if (hours < 24) return 'text-amber-400';
    }
    if (!countdown.includes('h') && !countdown.includes('d')) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="w-5 h-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusInfo.color} animate-pulse`} />
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusInfo.status}
          </Badge>
        </div>
        
        {/* Live Countdown */}
        {isActive && nextCheckInDue && countdown && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Next check-in in:</span>
              </div>
              <div className={`font-mono text-lg font-bold ${getCountdownColor()}`}>
                {countdown}
              </div>
            </div>
          </div>
        )}
        
        {lastCheckIn && (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="w-4 h-4" />
            <span>Last check-in: {formatDate(lastCheckIn)}</span>
          </div>
        )}
        
        {nextCheckInDue && (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="w-4 h-4" />
            <span>Next check-in due: {formatDate(nextCheckInDue)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
