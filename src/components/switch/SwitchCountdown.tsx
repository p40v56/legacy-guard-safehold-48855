
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
    <div className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} glass-strong transition-all duration-500 hover:scale-[1.01] ${colors.pulse}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${
        urgencyLevel === 'critical' ? 'from-destructive/20 to-transparent' : 
        urgencyLevel === 'urgent' ? 'from-warning/20 to-transparent' : 
        'from-primary/10 to-transparent'
      } animate-gradient-x`} />
      
      {/* Floating orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-levitate" />
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${urgencyLevel === 'critical' ? 'bg-destructive/20' : urgencyLevel === 'urgent' ? 'bg-warning/20' : 'bg-primary/20'} animate-pulse-subtle`}>
              <Timer className={`w-6 h-6 ${colors.text}`} />
            </div>
            <span className="text-2xl font-display font-semibold">
              {countdown.isOverdue ? 'CHECK-IN OVERDUE' : 'Next Check-in'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/50 bg-card/50 backdrop-blur-sm">
              {deadlineMode === 'custom' ? 'Custom Deadline' : 'Frequency Based'}
            </Badge>
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
          <div className="grid grid-cols-4 gap-6">
            {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, index) => (
              <div 
                key={unit} 
                className={`text-center p-6 rounded-2xl glass hover:scale-110 transition-all duration-300 animate-bounce-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`text-5xl font-display font-bold ${colors.text} mb-2 tabular-nums`}>
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
            <div className="text-6xl font-display font-bold text-destructive mb-3 animate-pulse">
              ACTION REQUIRED
            </div>
            <p className="text-destructive/80 text-xl">Your check-in deadline has passed</p>
          </div>
        )}

        {currentDeadline && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-muted-foreground text-sm text-center font-medium">
              Deadline: {formatDeadlineDate(currentDeadline)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchCountdown;
