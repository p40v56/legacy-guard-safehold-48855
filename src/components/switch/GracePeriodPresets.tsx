import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check } from 'lucide-react';

interface GracePeriodPresetsProps {
  gracePeriodHours: number;
  onGracePeriodChange: (value: string) => void;
}

const PRESET_VALUES = [0, 1, 6, 24, 48, 72, 168];

const PRESET_OPTIONS = [
  { value: '0', label: 'No grace period — trigger immediately' },
  { value: '1', label: '1 hour — strict' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours — recommended' },
  { value: '48', label: '48 hours' },
  { value: '72', label: '72 hours — relaxed' },
  { value: '168', label: '1 week' },
  { value: 'custom', label: 'Custom...' },
];

const GracePeriodPresets = ({ gracePeriodHours, onGracePeriodChange }: GracePeriodPresetsProps) => {
  const isPreset = PRESET_VALUES.includes(gracePeriodHours);
  const [selectValue, setSelectValue] = useState(isPreset ? String(gracePeriodHours) : 'custom');
  const [customValue, setCustomValue] = useState(isPreset ? '' : String(gracePeriodHours));
  const hasUnsavedCustom = selectValue === 'custom' && customValue !== '' && parseInt(customValue, 10) !== gracePeriodHours;

  useEffect(() => {
    const matched = PRESET_VALUES.includes(gracePeriodHours);
    if (matched) {
      setSelectValue(String(gracePeriodHours));
      setCustomValue('');
    } else {
      setSelectValue('custom');
      setCustomValue(String(gracePeriodHours));
    }
  }, [gracePeriodHours]);

  const handleSelectChange = (value: string) => {
    setSelectValue(value);
    if (value !== 'custom') {
      onGracePeriodChange(value);
    } else {
      setCustomValue(String(gracePeriodHours));
    }
  };

  const handleSaveCustom = () => {
    const hours = parseInt(customValue, 10);
    if (!isNaN(hours) && hours >= 0 && hours <= 720) {
      onGracePeriodChange(customValue);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-foreground font-medium">Grace Period</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Time between missed deadline and switch firing
        </p>
      </div>

      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="bg-input border-input max-w-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectValue === 'custom' && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min={0}
            max={720}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-28 bg-muted/30 border-border rounded-xl"
            placeholder="Hours"
          />
          <span className="text-xs text-muted-foreground">hours</span>
          <Button
            size="sm"
            onClick={handleSaveCustom}
            disabled={!hasUnsavedCustom || isNaN(parseInt(customValue)) || parseInt(customValue) < 0 || parseInt(customValue) > 720}
            className="rounded-xl px-4"
          >
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      )}

      {gracePeriodHours === 0 && selectValue === '0' && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mt-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            With no grace period, your switch will trigger the moment your deadline passes with no warning email.
          </p>
        </div>
      )}
    </div>
  );
};

export default GracePeriodPresets;
