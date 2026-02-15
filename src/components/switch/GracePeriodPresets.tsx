import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface GracePeriodPresetsProps {
  gracePeriodHours: number;
  onGracePeriodChange: (value: string) => void;
}

const PRESETS = [
  { value: 1, label: '1h', description: 'Strict' },
  { value: 24, label: '24h', description: 'Moderate' },
  { value: 72, label: '72h', description: 'Relaxed' },
];

const GracePeriodPresets = ({ gracePeriodHours, onGracePeriodChange }: GracePeriodPresetsProps) => {
  const isPreset = PRESETS.some(p => p.value === gracePeriodHours);
  const [showCustom, setShowCustom] = useState(!isPreset);

  const handlePresetClick = (value: number) => {
    setShowCustom(false);
    onGracePeriodChange(String(value));
  };

  const handleCustomClick = () => {
    setShowCustom(true);
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground">Grace Period</Label>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              gracePeriodHours === preset.value && !showCustom
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted/30 text-card-foreground border-border hover:border-primary/50'
            }`}
          >
            {preset.label} — {preset.description}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustomClick}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            showCustom
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-muted/30 text-card-foreground border-border hover:border-primary/50'
          }`}
        >
          Custom
        </button>
      </div>
      {showCustom && (
        <Input
          type="number"
          min={0}
          max={168}
          value={gracePeriodHours}
          onChange={(e) => onGracePeriodChange(e.target.value)}
          className="bg-input border-input max-w-32 mt-2"
          placeholder="Hours"
        />
      )}
      <p className="text-xs text-muted-foreground">
        Time buffer after missed check-in before alerts trigger (0 = immediate)
      </p>
    </div>
  );
};

export default GracePeriodPresets;
