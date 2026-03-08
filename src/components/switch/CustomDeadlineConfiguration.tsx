import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateEU, isValidDate } from '@/utils/dateUtils';
import GracePeriodPresets from './GracePeriodPresets';

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

const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const getTimeUntilDeadline = (deadlineString: string): string => {
  try {
    const deadline = new Date(deadlineString);
    const now = new Date();
    if (isNaN(deadline.getTime()) || deadline <= now) return 'Passed';
    const diffMs = deadline.getTime() - now.getTime();
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } catch {
    return 'Unknown';
  }
};

const formatDateOnly = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

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
  const isCustomDateTimeValid = () => {
    if (!customDate || !customTime) return false;
    const [hours, minutes] = customTime.split(':').map(Number);
    const selectedDateTime = new Date(customDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    return selectedDateTime > new Date();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canConfirm = isCustomDateTimeValid();

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
                {customDate ? `${customDate.getDate().toString().padStart(2,'0')}/${(customDate.getMonth()+1).toString().padStart(2,'0')}/${customDate.getFullYear()}` : "Pick a date"}
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

      <GracePeriodPresets
        gracePeriodHours={gracePeriodHours}
        onGracePeriodChange={onGracePeriodChange}
      />

      <div>
        <Button
          onClick={onCustomDateTimeUpdate}
          disabled={!canConfirm || saving}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          Confirm this deadline
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {!canConfirm && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Select a date and time above first
          </p>
        )}
      </div>

      {customDeadline && isValidDate(customDeadline) && (
        <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active deadline</p>
              <p className="text-base font-semibold text-card-foreground">
                {formatDateOnly(customDeadline)} at {formatTime(customDeadline)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Time remaining</p>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-base font-semibold text-card-foreground">
                  {getTimeUntilDeadline(customDeadline)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDeadlineConfiguration;
