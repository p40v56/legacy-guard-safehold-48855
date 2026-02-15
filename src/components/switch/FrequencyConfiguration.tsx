import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckInFrequency } from '@/types/common';
import GracePeriodPresets from './GracePeriodPresets';

interface FrequencyConfigurationProps {
  frequency: CheckInFrequency;
  gracePeriodHours: number;
  onFrequencyChange: (value: CheckInFrequency) => void;
  onGracePeriodChange: (value: string) => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily' as const, label: 'Every Day' },
  { value: 'weekly' as const, label: 'Every Week' },
  { value: 'biweekly' as const, label: 'Every 2 Weeks' },
  { value: 'monthly' as const, label: 'Every Month' },
] as const;

import { Label } from '@/components/ui/label';

const FrequencyConfiguration = ({
  frequency,
  gracePeriodHours,
  onFrequencyChange,
  onGracePeriodChange
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

      <GracePeriodPresets
        gracePeriodHours={gracePeriodHours}
        onGracePeriodChange={onGracePeriodChange}
      />
    </div>
  );
};

export default FrequencyConfiguration;
