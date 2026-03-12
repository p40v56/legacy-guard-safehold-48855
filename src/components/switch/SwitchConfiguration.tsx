import { UserSettings, CheckInFrequency } from '@/types/common';
import FrequencyConfiguration from './FrequencyConfiguration';
import CustomDeadlineConfiguration from './CustomDeadlineConfiguration';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';
import { formatDateEU } from '@/utils/dateUtils';


interface SwitchConfigurationProps {
  settings: UserSettings;
  customDate: Date | undefined;
  customTime: string;
  saving: boolean;
  isFree?: boolean;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  onSwitchToFrequencyMode: () => void;
  onCustomDateTimeUpdate: () => void;
  onCustomDateChange: (date: Date | undefined) => void;
  onCustomTimeChange: (time: string) => void;
}

const FREQUENCY_LABELS: Record<CheckInFrequency, string> = {
  daily: 'day',
  weekly: 'week',
  biweekly: '2 weeks',
  monthly: 'month',
};

const SwitchConfiguration = ({
  settings,
  customDate,
  customTime,
  saving,
  isFree,
  onUpdateSettings,
  onSwitchToFrequencyMode,
  onCustomDateTimeUpdate,
  onCustomDateChange,
  onCustomTimeChange,
}: SwitchConfigurationProps) => {
  const handleFrequencyChange = (value: string) => {
    onUpdateSettings({ check_in_frequency: value as any });
  };

  const handleGracePeriodChange = (value: string) => {
    const hours = parseInt(value, 10);
    if (!isNaN(hours) && hours >= 0 && hours <= 720) {
      onUpdateSettings({ grace_period_hours: hours });
    } else if (value === '' || value === '0') {
      onUpdateSettings({ grace_period_hours: 0 });
    }
  };

  const handleDeadlineModeChange = (mode: 'frequency' | 'custom') => {
    if (mode === 'frequency') {
      onSwitchToFrequencyMode();
    } else {
      onUpdateSettings({ deadline_mode: 'custom' });
    }
  };

  return (
    <div className="space-y-6">
      {isFree ? (
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-3 flex items-center gap-2">
          <span>📋</span>
          <span>Free plan: frequency-based check-ins with 24h grace period. Upgrade for custom deadlines and flexible grace periods.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-card-foreground font-medium">Deadline Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDeadlineModeChange('frequency')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.deadline_mode === 'frequency'
                  ? 'border-primary bg-primary/[0.08]'
                  : 'border-border bg-muted/20 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${settings.deadline_mode === 'frequency' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${settings.deadline_mode === 'frequency' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Frequency Based
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Recurring check-ins — I check in regularly to keep the switch off</p>
            </button>
            <button
              type="button"
              onClick={() => handleDeadlineModeChange('custom')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.deadline_mode === 'custom'
                  ? 'border-primary bg-primary/[0.08]'
                  : 'border-border bg-muted/20 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={`w-4 h-4 ${settings.deadline_mode === 'custom' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${settings.deadline_mode === 'custom' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Custom Deadline
                </span>
              </div>
              <p className="text-xs text-muted-foreground">One-time deadline — the switch fires on a specific date if I don't act</p>
            </button>
          </div>

          {settings.deadline_mode === 'custom' && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This is a one-time deadline. After it fires, the switch triggers and does not reset automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {(!isFree && settings.deadline_mode === 'frequency' || isFree) && (
        <FrequencyConfiguration
          frequency={settings.check_in_frequency}
          gracePeriodHours={settings.grace_period_hours}
          onFrequencyChange={handleFrequencyChange}
          onGracePeriodChange={handleGracePeriodChange}
          isFree={isFree}
        />
      )}

      {!isFree && settings.deadline_mode === 'custom' && (
        <CustomDeadlineConfiguration
          customDate={customDate}
          customTime={customTime}
          customDeadline={settings.custom_deadline}
          gracePeriodHours={settings.grace_period_hours}
          saving={saving}
          onCustomDateChange={onCustomDateChange}
          onCustomTimeChange={onCustomTimeChange}
          onCustomDateTimeUpdate={onCustomDateTimeUpdate}
          onGracePeriodChange={handleGracePeriodChange}
        />
      )}

      {saving && (
        <p className="text-muted-foreground text-sm">Saving changes...</p>
      )}


      {/* Configuration Summary */}
      <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Current configuration summary</p>

        <p className="text-sm text-card-foreground">
          📅{' '}
          {settings.deadline_mode === 'frequency' ? (
            <>
              Check-in required every {FREQUENCY_LABELS[settings.check_in_frequency]}
              {settings.next_check_in_due && (
                <span className="text-muted-foreground"> — next due {formatDateEU(settings.next_check_in_due)}</span>
              )}
            </>
          ) : (
            <>
              One-time deadline: {settings.custom_deadline ? formatDateEU(settings.custom_deadline) : <span className="text-muted-foreground italic">not set</span>}
            </>
          )}
        </p>

        <p className="text-sm text-card-foreground">
          ⏳ Grace period: {settings.grace_period_hours === 0
            ? <span className="text-destructive font-medium">No grace period — switch fires immediately on missed deadline</span>
            : `${settings.grace_period_hours} hours`
          }
        </p>


        <p className="text-xs text-muted-foreground mt-1">
          {settings.deadline_mode === 'frequency'
            ? (settings.grace_period_hours === 0
              ? 'If you miss your check-in, your switch fires immediately with no warning period.'
              : `If you miss your check-in, a ${settings.grace_period_hours}-hour grace period starts, then your contacts are notified.`)
            : (settings.grace_period_hours === 0
              ? 'If you do not check in before the deadline, your switch fires immediately with no warning period.'
              : `If you do not check in before the deadline, a ${settings.grace_period_hours}-hour grace period starts, then your contacts are notified.`)
          }
        </p>
      </div>
    </div>
  );
};

export default SwitchConfiguration;
