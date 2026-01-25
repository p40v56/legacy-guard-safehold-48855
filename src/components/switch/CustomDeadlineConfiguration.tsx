import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDeadlineDate, isValidDate } from '@/utils/dateUtils';

interface CustomDeadlineConfigurationProps {
  customDate: Date | undefined;
  customTime: string;
  customDeadline: string | null;
  gracePeriodHours: number;
  saving: boolean;
  onCustomDateChange: (date: Date | undefined) => void;
  onCustomTimeChange: (time: string) => void;
  onCustomDateTimeUpdate: () => void;
  onGracePeriodChange: (value: string) => void;
}

const GRACE_PERIOD_LIMITS = {
  min: 0,
  max: 168
} as const;

const CustomDeadlineConfiguration = ({
  customDate,
  customTime,
  customDeadline,
  gracePeriodHours,
  saving,
  onCustomDateChange,
  onCustomTimeChange,
  onCustomDateTimeUpdate,
  onGracePeriodChange
}: CustomDeadlineConfigurationProps) => {
  // Check if the selected datetime is in the future
  const isCustomDateTimeValid = () => {
    if (!customDate || !customTime) return false;
    
    const [hours, minutes] = customTime.split(':').map(Number);
    const selectedDateTime = new Date(customDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return selectedDateTime > new Date();
  };

  // Get start of today for calendar validation (allow today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-foreground">Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-input border-input hover:bg-muted",
                  !customDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDate ? customDate.toLocaleDateString() : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={onCustomDateChange}
                disabled={(date) => date < today}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Select Time</Label>
          <Input
            type="time"
            value={customTime}
            onChange={(e) => onCustomTimeChange(e.target.value)}
            className="bg-input border-input"
          />
          {customDate && customTime && !isCustomDateTimeValid() && (
            <p className="text-xs text-destructive">
              Please select a time in the future
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Grace Period (hours)</Label>
        <Input
          type="number"
          min={GRACE_PERIOD_LIMITS.min}
          max={GRACE_PERIOD_LIMITS.max}
          value={gracePeriodHours}
          onChange={(e) => onGracePeriodChange(e.target.value)}
          onKeyDown={(e) => {
            // Allow manual typing
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              return;
            }
          }}
          className="bg-input border-input max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Time buffer after deadline before alerts trigger (0 = immediate, max {GRACE_PERIOD_LIMITS.max} hours)
        </p>
      </div>

      <Button
        onClick={onCustomDateTimeUpdate}
        disabled={!isCustomDateTimeValid() || saving}
        className="bg-primary hover:bg-primary/90 disabled:opacity-50"
      >
        <CalendarIcon className="w-4 h-4 mr-2" />
        Set Custom Deadline
      </Button>

      {customDeadline && isValidDate(customDeadline) && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground text-sm">
            <strong>Current Custom Deadline:</strong><br />
            {formatDeadlineDate(customDeadline)}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomDeadlineConfiguration;
