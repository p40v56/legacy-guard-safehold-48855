
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
          <Label className="text-slate-200">Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                  !customDate && "text-slate-400"
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
          <Label className="text-slate-200">Select Time</Label>
          <Input
            type="time"
            value={customTime}
            onChange={(e) => onCustomTimeChange(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
      </div>

      <Button
        onClick={onCustomDateTimeUpdate}
        disabled={!isCustomDateValid || saving}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
      >
        <CalendarIcon className="w-4 h-4 mr-2" />
        Set Custom Deadline
      </Button>

      {customDeadline && isValidDate(customDeadline) && (
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <p className="text-slate-300 text-sm">
            <strong>Current Custom Deadline:</strong><br />
            {formatDeadlineDate(customDeadline)}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomDeadlineConfiguration;
