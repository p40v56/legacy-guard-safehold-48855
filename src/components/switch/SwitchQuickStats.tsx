
import { Separator } from '@/components/ui/separator';
import { formatDateShort } from '@/utils/dateUtils';
import { CheckInFrequency, DeadlineMode } from '@/types/switch';

interface SwitchQuickStatsProps {
  checkInFrequency: CheckInFrequency;
  deadlineMode: DeadlineMode;
  gracePeriodHours: number;
  lastCheckIn: string | null;
}

const getFrequencyLabel = (frequency: CheckInFrequency): string => {
  const labels = {
    daily: 'Every Day',
    weekly: 'Every Week',
    biweekly: 'Every 2 Weeks',
    monthly: 'Every Month'
  };
  return labels[frequency];
};

const formatLastCheckIn = (lastCheckIn: string | null): string => {
  if (!lastCheckIn) return 'Never';
  return formatDateShort(lastCheckIn);
};

const SwitchQuickStats = ({ 
  checkInFrequency, 
  deadlineMode, 
  gracePeriodHours, 
  lastCheckIn 
}: SwitchQuickStatsProps) => {
  return (
    <>
      <Separator className="bg-border/50" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-2xl">
          <div className="text-2xl font-bold text-primary">
            {deadlineMode === 'custom' ? 'Custom' : getFrequencyLabel(checkInFrequency)}
          </div>
          <div className="text-muted-foreground text-sm">Deadline Mode</div>
        </div>
        <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-2xl">
          <div className="text-2xl font-bold text-primary">
            {gracePeriodHours}h
          </div>
          <div className="text-muted-foreground text-sm">Grace Period</div>
        </div>
        <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-2xl">
          <div className="text-2xl font-bold text-primary">
            {formatLastCheckIn(lastCheckIn)}
          </div>
          <div className="text-muted-foreground text-sm">Last Check-in</div>
        </div>
      </div>
    </>
  );
};

export default SwitchQuickStats;
