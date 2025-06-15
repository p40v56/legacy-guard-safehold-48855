import { Separator } from '@/components/ui/separator';
import { formatDateShort } from '@/utils/dateUtils';

type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type DeadlineMode = 'frequency' | 'custom';

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
      <Separator className="bg-slate-700" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-slate-700/30 rounded-lg">
          <div className="text-2xl font-bold text-emerald-400">
            {deadlineMode === 'custom' ? 'Custom' : getFrequencyLabel(checkInFrequency)}
          </div>
          <div className="text-slate-400 text-sm">Deadline Mode</div>
        </div>
        <div className="text-center p-4 bg-slate-700/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">
            {gracePeriodHours}h
          </div>
          <div className="text-slate-400 text-sm">Grace Period</div>
        </div>
        <div className="text-center p-4 bg-slate-700/30 rounded-lg">
          <div className="text-2xl font-bold text-amber-400">
            {formatLastCheckIn(lastCheckIn)}
          </div>
          <div className="text-slate-400 text-sm">Last Check-in</div>
        </div>
      </div>
    </>
  );
};

export default SwitchQuickStats;
