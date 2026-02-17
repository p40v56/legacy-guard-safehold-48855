import { UserSettings } from '@/types/common';
import FrequencyConfiguration from './FrequencyConfiguration';
import CustomDeadlineConfiguration from './CustomDeadlineConfiguration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Clock, Calendar } from 'lucide-react';

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
    if (!isNaN(hours) && hours >= 0 && hours <= 168) {
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
        /* Deadline Mode - Radio Cards */
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
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/20 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${settings.deadline_mode === 'frequency' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${settings.deadline_mode === 'frequency' ? 'text-primary' : 'text-card-foreground'}`}>
                  Frequency Based
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Recurring check-ins on a schedule</p>
            </button>
            <button
              type="button"
              onClick={() => handleDeadlineModeChange('custom')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.deadline_mode === 'custom'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/20 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={`w-4 h-4 ${settings.deadline_mode === 'custom' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${settings.deadline_mode === 'custom' ? 'text-primary' : 'text-card-foreground'}`}>
                  Custom Deadline
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Set a specific date and time</p>
            </button>
          </div>
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
    </div>
  );
};

export default SwitchConfiguration;
