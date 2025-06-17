
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckInFrequency } from '@/types/common';

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

const GRACE_PERIOD_LIMITS = {
  min: 1,
  max: 168
} as const;

const FrequencyConfiguration = ({
  frequency,
  gracePeriodHours,
  onFrequencyChange,
  onGracePeriodChange
}: FrequencyConfigurationProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label className="text-slate-200">Check-in Frequency</Label>
        <Select value={frequency} onValueChange={onFrequencyChange}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-200">Grace Period (hours)</Label>
        <Input
          type="number"
          min={GRACE_PERIOD_LIMITS.min}
          max={GRACE_PERIOD_LIMITS.max}
          value={gracePeriodHours}
          onChange={(e) => onGracePeriodChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
        />
        <p className="text-xs text-slate-400">
          Time buffer after missed check-in before alerts trigger ({GRACE_PERIOD_LIMITS.min}-{GRACE_PERIOD_LIMITS.max} hours)
        </p>
      </div>
    </div>
  );
};

export default FrequencyConfiguration;
