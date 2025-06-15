
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useCountdown } from '@/hooks/useCountdown';

interface SwitchCountdownProps {
  isActive: boolean;
  currentDeadline: string | null;
  deadlineMode: 'frequency' | 'custom';
}

type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'critical';

const getUrgencyLevel = (countdown: ReturnType<typeof useCountdown>): UrgencyLevel => {
  if (countdown.isOverdue) return 'critical';
  if (countdown.days === 0 && countdown.hours < 12) return 'urgent';
  if (countdown.days === 0) return 'warning';
  return 'normal';
};

const getUrgencyColors = (urgencyLevel: UrgencyLevel) => {
  const colorMap = {
    critical: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      pulse: 'animate-pulse',
    },
    urgent: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      pulse: 'animate-pulse',
    },
    warning: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      pulse: '',
    },
    normal: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      pulse: '',
    },
  };

  return colorMap[urgencyLevel];
};

const formatDeadlineDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'PPP p');
  } catch (error) {
    console.error('Error formatting deadline date:', error);
    return 'Invalid date';
  }
};

const SwitchCountdown = ({ isActive, currentDeadline, deadlineMode }: SwitchCountdownProps) => {
  const countdown = useCountdown(isActive, currentDeadline);
  const urgencyLevel = getUrgencyLevel(countdown);
  const colors = getUrgencyColors(urgencyLevel);

  if (!isActive || !currentDeadline) {
    return null;
  }

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
              ACTION REQUIRED
            </div>
            <p className="text-red-300">Your check-in deadline has passed</p>
          </div>
        )}

        {currentDeadline && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-slate-300 text-sm text-center">
              Deadline: {formatDeadlineDate(currentDeadline)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchCountdown;
