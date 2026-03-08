import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [customValue, setCustomValue] = useState(String(gracePeriodHours));
  const hasUnsavedChanges = showCustom && customValue !== String(gracePeriodHours);

  useEffect(() => {
    setCustomValue(String(gracePeriodHours));
  }, [gracePeriodHours]);

  const handlePresetClick = (value: number) => {
    setShowCustom(false);
    onGracePeriodChange(String(value));
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    setCustomValue(String(gracePeriodHours));
  };

  const handleSaveCustom = () => {
    const hours = parseInt(customValue, 10);
    if (!isNaN(hours) && hours >= 0 && hours <= 168) {
      onGracePeriodChange(customValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-foreground font-medium text-sm">Grace Period</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">When the grace period expires, emails are sent to your contacts. You'll receive a warning email when it begins. Check in anytime to cancel.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
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
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min={0}
            max={168}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="bg-input border-input max-w-32"
            placeholder="Hours"
          />
          <span className="text-xs text-muted-foreground">hours</span>
          <Button
            size="sm"
            onClick={handleSaveCustom}
            disabled={!hasUnsavedChanges || isNaN(parseInt(customValue)) || parseInt(customValue) < 0 || parseInt(customValue) > 168}
            className="rounded-xl px-4"
          >
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default GracePeriodPresets;
