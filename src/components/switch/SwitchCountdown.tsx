
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, Skull } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { formatDateEU } from '@/utils/dateUtils';
import { getUrgencyLevel, getUrgencyColors } from '@/utils/urgencyUtils';

interface SwitchCountdownProps {
  isActive: boolean;
  currentDeadline: string | null;
  deadlineMode: 'frequency' | 'custom';
  gracePeriodActive?: boolean;
  gracePeriodEnd?: string | null;
  switchTriggered?: boolean;
  gracePeriodHours?: number;
}

const SwitchCountdown = ({ 
  isActive, 
  currentDeadline, 
  deadlineMode,
  gracePeriodActive = false,
  gracePeriodEnd = null,
  switchTriggered = false,
  gracePeriodHours = 24,
}: SwitchCountdownProps) => {
  const countdown = useCountdown(isActive, currentDeadline, gracePeriodActive, gracePeriodEnd);
  const urgencyLevel = gracePeriodActive ? 'critical' : getUrgencyLevel(countdown);
  const colors = getUrgencyColors(urgencyLevel);

  // System was triggered - show final state
  if (switchTriggered) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-destructive/50 glass-strong transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/30 to-transparent" />
        
        <div className="relative p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-destructive/30">
              <Skull className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="text-center py-4">
            <div className="text-4xl font-display font-bold text-destructive mb-3">
              SYSTEM TRIGGERED
            </div>
            <p className="text-destructive/80 text-lg">
              Your emergency contacts have been notified
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isActive || (!currentDeadline && !gracePeriodActive)) {
    return null;
  }

  // Grace period mode
  if (gracePeriodActive && gracePeriodEnd) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border-2 border-warning glass-strong transition-all duration-500 animate-pulse-subtle ring-2 ring-destructive/50 ring-offset-2 ring-offset-background`}>
        <div className="absolute inset-0 bg-gradient-to-br from-warning/30 to-destructive/20" />
        
        {/* Warning pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)',
        }} />
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/30 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <span className="text-2xl font-display font-semibold text-warning">
                ⚠️ GRACE PERIOD ACTIVE
              </span>
            </div>
            <Badge variant="destructive" className="animate-pulse shadow-lg shadow-destructive/50">
              CHECK IN NOW
            </Badge>
          </div>

          <div className="bg-destructive/20 border border-destructive/30 rounded-xl p-4 mb-6">
            <p className="text-center text-destructive font-medium">
              You missed your check-in deadline! Check in before the grace period ends or your contacts will be notified.
            </p>
          </div>

          {!countdown.isOverdue ? (
            <div className="grid grid-cols-4 gap-6">
              {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, index) => (
                <div 
                  key={unit} 
                  className="text-center p-6 rounded-2xl bg-warning/10 border border-warning/30 hover:scale-110 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-5xl font-display font-bold text-warning mb-2 tabular-nums">
                    {countdown[unit].toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-warning/80 uppercase tracking-wider font-medium">
                    {unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 animate-bounce-in">
              <div className="text-6xl font-display font-bold text-destructive mb-3 animate-pulse">
                TRIGGERING...
              </div>
              <p className="text-destructive/80 text-xl">Your contacts are being notified</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-warning/30">
            <p className="text-warning/80 text-sm text-center font-medium">
              Grace Period Ends: {formatDateEU(gracePeriodEnd)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal countdown mode
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} glass-strong transition-all duration-500 hover:scale-[1.01] ${colors.pulse} ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}>
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
            <div className={`p-2 rounded-xl ${urgencyLevel === 'critical' ? 'bg-destructive/20 animate-pulse' : urgencyLevel === 'urgent' ? 'bg-warning/20' : 'bg-primary/20'} animate-pulse-subtle`}>
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
          <div className="mt-6 pt-4 border-t border-border/50 text-center space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              Deadline: {formatDateEU(currentDeadline)}
            </p>
            <p className="text-muted-foreground text-xs">
              Grace period: {gracePeriodHours === 0 ? 'No grace period — fires immediately' : `${gracePeriodHours}h`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchCountdown;
