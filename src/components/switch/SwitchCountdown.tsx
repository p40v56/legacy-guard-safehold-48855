
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, ShieldOff, ShieldAlert } from 'lucide-react';
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

  // System was triggered - clean modern state
  if (switchTriggered) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-sm transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-destructive/5" />
        
        <div className="relative p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <ShieldOff className="w-7 h-7 text-destructive" />
            </div>
          </div>

          <div className="text-center py-4">
            <div className="text-3xl font-display font-bold text-destructive mb-3 tracking-tight">
              Switch Activated
            </div>
            <p className="text-muted-foreground text-base">
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

  // Grace period mode - clean, urgent but not chaotic
  if (gracePeriodActive && gracePeriodEnd) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-warning/40 bg-warning/5 backdrop-blur-sm transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/10 via-transparent to-destructive/5" />
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/10 border border-warning/20">
                <ShieldAlert className="w-6 h-6 text-warning" />
              </div>
              <span className="text-xl font-display font-semibold text-warning">
                Grace Period Active
              </span>
            </div>
            <Badge variant="destructive" className="shadow-sm">
              Check in now
            </Badge>
          </div>

          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 mb-6">
            <p className="text-center text-muted-foreground text-sm">
              You missed your check-in deadline. Check in before the grace period ends or your contacts will be notified.
            </p>
          </div>

          {!countdown.isOverdue ? (
            <div className="grid grid-cols-4 gap-4">
              {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
                <div 
                  key={unit} 
                  className="text-center p-5 rounded-2xl bg-warning/5 border border-warning/20 transition-all duration-300 hover:bg-warning/10"
                >
                  <div className="text-4xl font-display font-bold text-warning mb-1.5 tabular-nums">
                    {countdown[unit].toString().padStart(2, '0')}
                  </div>
                  <div className="text-[11px] text-warning/70 uppercase tracking-wider font-medium">
                    {unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl font-display font-bold text-destructive mb-3">
                Triggering…
              </div>
              <p className="text-muted-foreground text-base">Your contacts are being notified</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-warning/20">
            <p className="text-muted-foreground text-sm text-center">
              Grace period ends: {formatDateEU(gracePeriodEnd)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal countdown mode
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-[1.005]`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${
        urgencyLevel === 'critical' ? 'from-destructive/10 to-transparent' : 
        urgencyLevel === 'urgent' ? 'from-warning/10 to-transparent' : 
        'from-primary/5 to-transparent'
      }`} />
      
      {/* Subtle ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              urgencyLevel === 'critical' ? 'bg-destructive/10 border-destructive/20' : 
              urgencyLevel === 'urgent' ? 'bg-warning/10 border-warning/20' : 
              'bg-primary/10 border-primary/20'
            }`}>
              <Timer className={`w-6 h-6 ${colors.text}`} />
            </div>
            <span className="text-xl font-display font-semibold">
              {countdown.isOverdue ? 'Check-in Overdue' : 'Next Check-in'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/50 bg-card/50 backdrop-blur-sm text-xs">
              {deadlineMode === 'custom' ? 'Custom Deadline' : 'Frequency Based'}
            </Badge>
            {urgencyLevel === 'critical' && (
              <Badge variant="destructive" className="shadow-sm">
                Critical
              </Badge>
            )}
            {urgencyLevel === 'urgent' && (
              <Badge className="bg-warning/10 text-warning border-warning/30">
                Urgent
              </Badge>
            )}
          </div>
        </div>

        {!countdown.isOverdue ? (
          <div className="grid grid-cols-4 gap-4">
            {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
              <div 
                key={unit} 
                className="text-center p-5 rounded-2xl bg-muted/30 border border-border/50 transition-all duration-300 hover:bg-muted/50"
              >
                <div className={`text-4xl font-display font-bold ${colors.text} mb-1.5 tabular-nums`}>
                  {countdown[unit].toString().padStart(2, '0')}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                  {unit}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl font-display font-bold text-destructive mb-3">
              Action Required
            </div>
            <p className="text-muted-foreground text-base">Your check-in deadline has passed</p>
          </div>
        )}

        {currentDeadline && (
          <div className="mt-6 pt-4 border-t border-border/50 text-center space-y-1">
            <p className="text-muted-foreground text-sm">
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
