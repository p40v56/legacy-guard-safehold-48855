import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckInFrequency } from '@/types/common';
import { Label } from '@/components/ui/label';
import GracePeriodPresets from './GracePeriodPresets';

interface FrequencyConfigurationProps {
  frequency: CheckInFrequency;
  gracePeriodHours: number;
  onFrequencyChange: (value: CheckInFrequency) => void;
  onGracePeriodChange: (value: string) => void;
  isFree?: boolean;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily' as const, label: 'Every Day' },
  { value: 'weekly' as const, label: 'Every Week' },
  { value: 'biweekly' as const, label: 'Every 2 Weeks' },
  { value: 'monthly' as const, label: 'Every Month' },
] as const;

const FrequencyConfiguration = ({
  frequency,
  gracePeriodHours,
  onFrequencyChange,
  onGracePeriodChange,
  isFree
}: FrequencyConfigurationProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground">Check-in Frequency</Label>
        <Select value={frequency} onValueChange={onFrequencyChange}>
          <SelectTrigger className="bg-input border-input max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFree ? (
        <div className="space-y-2">
          <Label className="text-foreground">Grace Period</Label>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground border border-primary shadow-sm">
              24h — Moderate
            </div>
            <span className="text-xs text-muted-foreground">Upgrade for custom grace periods</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Time buffer after missed check-in before alerts trigger
          </p>
        </div>
      ) : (
        <GracePeriodPresets
          gracePeriodHours={gracePeriodHours}
          onGracePeriodChange={onGracePeriodChange}
        />
      )}
    </div>
  );
};

export default FrequencyConfiguration;
