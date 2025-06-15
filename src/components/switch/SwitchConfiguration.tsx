
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch as ToggleSwitch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type DeadlineMode = 'frequency' | 'custom';

interface UserSettings {
  check_in_frequency: CheckInFrequency;
  grace_period_hours: number;
  is_active: boolean;
  last_check_in: string | null;
  next_check_in_due: string | null;
  deadline_mode: DeadlineMode;
  custom_deadline: string | null;
}

interface SwitchConfigurationProps {
  settings: UserSettings;
  customDate: Date | undefined;
  customTime: string;
  saving: boolean;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  onSwitchToFrequencyMode: () => void;
  onCustomDateTimeUpdate: () => void;
  onCustomDateChange: (date: Date | undefined) => void;
  onCustomTimeChange: (time: string) => void;
}

const SwitchConfiguration = ({
  settings,
  customDate,
  customTime,
  saving,
  onUpdateSettings,
  onSwitchToFrequencyMode,
  onCustomDateTimeUpdate,
  onCustomDateChange,
  onCustomTimeChange,
}: SwitchConfigurationProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Configuration</h3>
      
      {/* Deadline Mode Selection */}
      <div className="space-y-4">
        <Label className="text-slate-200">Deadline Mode</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ToggleSwitch
              checked={settings.deadline_mode === 'frequency'}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSwitchToFrequencyMode();
                }
              }}
            />
            <span className="text-slate-300">Frequency Based</span>
          </div>
          <div className="flex items-center space-x-2">
            <ToggleSwitch
              checked={settings.deadline_mode === 'custom'}
              onCheckedChange={(checked) => {
                if (checked) {
                  onUpdateSettings({ deadline_mode: 'custom' });
                }
              }}
            />
            <span className="text-slate-300">Custom Date & Time</span>
          </div>
        </div>
      </div>

      {settings.deadline_mode === 'frequency' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-200">Check-in Frequency</Label>
            <Select
              value={settings.check_in_frequency}
              onValueChange={(value: CheckInFrequency) => 
                onUpdateSettings({ check_in_frequency: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                <SelectItem value="monthly">Every Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Grace Period (hours)</Label>
            <Input
              type="number"
              min="1"
              max="168"
              value={settings.grace_period_hours}
              onChange={(e) => 
                onUpdateSettings({ grace_period_hours: parseInt(e.target.value) })
              }
              className="bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-400">
              Time buffer after missed check-in before alerts trigger
            </p>
          </div>
        </div>
      )}

      {settings.deadline_mode === 'custom' && (
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
                    {customDate ? format(customDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={onCustomDateChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
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
            disabled={!customDate || saving}
            className="bg-blue-600 hover:bg-blue-500"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Set Custom Deadline
          </Button>

          {settings.custom_deadline && (
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <p className="text-slate-300 text-sm">
                <strong>Current Custom Deadline:</strong><br />
                {format(new Date(settings.custom_deadline), 'PPP p')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button
          onClick={() => onUpdateSettings({ is_active: !settings.is_active })}
          variant={settings.is_active ? "destructive" : "default"}
          disabled={saving}
          className={settings.is_active 
            ? "bg-red-600 hover:bg-red-500" 
            : "bg-emerald-600 hover:bg-emerald-500"
          }
        >
          {settings.is_active ? 'Deactivate System' : 'Activate System'}
        </Button>
        
        {saving && (
          <p className="text-slate-400 text-sm">Saving changes...</p>
        )}
      </div>
    </div>
  );
};

export default SwitchConfiguration;
