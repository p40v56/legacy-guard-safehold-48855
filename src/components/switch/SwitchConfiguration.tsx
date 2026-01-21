
import { Button } from '@/components/ui/button';
import { UserSettings } from '@/types/common';
import DeadlineModeSelector from './DeadlineModeSelector';
import FrequencyConfiguration from './FrequencyConfiguration';
import CustomDeadlineConfiguration from './CustomDeadlineConfiguration';

interface SwitchConfigurationProps {
  settings: UserSettings;
  customDate: Date | undefined;
  customTime: string;
  saving: boolean;
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
    if (!isNaN(hours) && hours >= 1 && hours <= 168) {
      onUpdateSettings({ grace_period_hours: hours });
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
      <h3 className="text-lg font-semibold text-foreground">Configuration</h3>
      
      <DeadlineModeSelector
        deadlineMode={settings.deadline_mode}
        onModeChange={handleDeadlineModeChange}
      />

      {settings.deadline_mode === 'frequency' && (
        <FrequencyConfiguration
          frequency={settings.check_in_frequency}
          gracePeriodHours={settings.grace_period_hours}
          onFrequencyChange={handleFrequencyChange}
          onGracePeriodChange={handleGracePeriodChange}
        />
      )}

      {settings.deadline_mode === 'custom' && (
        <CustomDeadlineConfiguration
          customDate={customDate}
          customTime={customTime}
          customDeadline={settings.custom_deadline}
          saving={saving}
          onCustomDateChange={onCustomDateChange}
          onCustomTimeChange={onCustomTimeChange}
          onCustomDateTimeUpdate={onCustomDateTimeUpdate}
        />
      )}

      <div className="flex items-center justify-between pt-4">
        <Button
          onClick={() => onUpdateSettings({ is_active: !settings.is_active })}
          variant={settings.is_active ? "destructive" : "default"}
          disabled={saving}
          className={settings.is_active 
            ? "bg-destructive hover:bg-destructive/90" 
            : "bg-primary hover:bg-primary/90"
          }
        >
          {settings.is_active ? 'Deactivate System' : 'Activate System'}
        </Button>
        
        {saving && (
          <p className="text-muted-foreground text-sm">Saving changes...</p>
        )}
      </div>
    </div>
  );
};

export default SwitchConfiguration;
