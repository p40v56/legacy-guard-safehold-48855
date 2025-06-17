
import { Label } from '@/components/ui/label';
import { Switch as ToggleSwitch } from '@/components/ui/switch';
import { DeadlineMode } from '@/types/common';

interface DeadlineModeSelectorProps {
  deadlineMode: DeadlineMode;
  onModeChange: (mode: DeadlineMode) => void;
}

const DeadlineModeSelector = ({ deadlineMode, onModeChange }: DeadlineModeSelectorProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-slate-200">Deadline Mode</Label>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            checked={deadlineMode === 'frequency'}
            onCheckedChange={(checked) => {
              if (checked) {
                onModeChange('frequency');
              }
            }}
          />
          <span className="text-slate-300">Frequency Based</span>
        </div>
        <div className="flex items-center space-x-2">
          <ToggleSwitch
            checked={deadlineMode === 'custom'}
            onCheckedChange={(checked) => {
              if (checked) {
                onModeChange('custom');
              }
            }}
          />
          <span className="text-slate-300">Custom Date & Time</span>
        </div>
      </div>
    </div>
  );
};

export default DeadlineModeSelector;
