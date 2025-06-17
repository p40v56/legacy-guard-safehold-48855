
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { formatDeadlineDate } from '@/utils/dateUtils';
import { getUrgencyLevel, getUrgencyColors } from '@/utils/urgencyUtils';

interface SwitchCountdownProps {
  isActive: boolean;
  currentDeadline: string | null;
  deadlineMode: 'frequency' | 'custom';
}

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
