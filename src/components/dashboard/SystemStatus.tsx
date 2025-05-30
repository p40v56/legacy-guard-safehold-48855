
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface SystemStatusProps {
  isActive: boolean;
  lastCheckIn?: string;
  nextCheckInDue?: string;
}

const SystemStatus = ({ isActive, lastCheckIn, nextCheckInDue }: SystemStatusProps) => {
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
