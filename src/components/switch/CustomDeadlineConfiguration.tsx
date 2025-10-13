
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
  saving: boolean;
  onCustomDateChange: (date: Date | undefined) => void;
  onCustomTimeChange: (time: string) => void;
  onCustomDateTimeUpdate: () => void;
}

const CustomDeadlineConfiguration = ({
  customDate,
  customTime,
  customDeadline,
  saving,
  onCustomDateChange,
  onCustomTimeChange,
  onCustomDateTimeUpdate
}: CustomDeadlineConfigurationProps) => {
  const isCustomDateValid = customDate && customDate > new Date();

  return (
    <div className="space-y-4">
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
                disabled={(date) => date < new Date()}
                initialFocus
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
        </div>
      </div>

      <Button
        onClick={onCustomDateTimeUpdate}
        disabled={!isCustomDateValid || saving}
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
