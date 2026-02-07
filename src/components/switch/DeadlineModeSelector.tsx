
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeadlineMode } from '@/types/common';
import { Clock, Calendar } from 'lucide-react';

interface DeadlineModeSelectorProps {
  deadlineMode: DeadlineMode;
  onModeChange: (mode: DeadlineMode) => void;
}

const DeadlineModeSelector = ({ deadlineMode, onModeChange }: DeadlineModeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-card-foreground font-medium">Deadline Mode</Label>
      <Select value={deadlineMode} onValueChange={(value: DeadlineMode) => onModeChange(value)}>
        <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all">
          <SelectValue placeholder="Select deadline mode" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border rounded-xl">
          <SelectItem value="frequency" className="rounded-lg py-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <span className="font-medium">Frequency Based</span>
                <span className="text-muted-foreground text-xs ml-2">— Recurring check-ins</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="custom" className="rounded-lg py-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <span className="font-medium">Custom Date & Time</span>
                <span className="text-muted-foreground text-xs ml-2">— One-time deadline</span>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DeadlineModeSelector;
