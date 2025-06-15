
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface SwitchCountdownProps {
  isActive: boolean;
  currentDeadline: string | null;
  deadlineMode: 'frequency' | 'custom';
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

const SwitchCountdown = ({ isActive, currentDeadline, deadlineMode }: SwitchCountdownProps) => {
  const [countdown, setCountdown] = useState<CountdownState>({ 
    days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false 
  });

  useEffect(() => {
    if (!isActive || !currentDeadline) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(currentDeadline);
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
  }, [isActive, currentDeadline]);

  const getUrgencyLevel = () => {
    if (countdown.isOverdue) return 'critical';
    if (countdown.days === 0 && countdown.hours < 12) return 'urgent';
    if (countdown.days === 0) return 'warning';
    return 'normal';
  };

  const getUrgencyColors = () => {
    const urgencyLevel = getUrgencyLevel();
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

  if (!isActive || !currentDeadline) {
    return null;
  }

  const colors = getUrgencyColors();

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.pulse}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className={`w-5 h-5 ${colors.text}`} />
            <span className="text-lg font-semibold text-white">
              {countdown.isOverdue ? 'CHECK-IN OVERDUE' : 'Next Check-in'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-500 text-slate-300">
              {deadlineMode === 'custom' ? 'Custom Deadline' : 'Frequency Based'}
            </Badge>
            {getUrgencyLevel() === 'critical' && (
              <Badge variant="destructive" className="animate-pulse">
                CRITICAL
              </Badge>
            )}
            {getUrgencyLevel() === 'urgent' && (
              <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                URGENT
              </Badge>
            )}
          </div>
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
              ACTION REQUIRED
            </div>
            <p className="text-red-300">Your check-in deadline has passed</p>
          </div>
        )}

        {currentDeadline && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-slate-300 text-sm text-center">
              Deadline: {format(new Date(currentDeadline), 'PPP p')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchCountdown;
