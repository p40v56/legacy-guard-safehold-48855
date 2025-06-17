
import { useCountdown } from '@/hooks/useCountdown';

export type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'critical';

export const getUrgencyLevel = (countdown: ReturnType<typeof useCountdown>): UrgencyLevel => {
  if (countdown.isOverdue) return 'critical';
  if (countdown.days === 0 && countdown.hours < 12) return 'urgent';
  if (countdown.days === 0) return 'warning';
  return 'normal';
};

export const getUrgencyColors = (urgencyLevel: UrgencyLevel) => {
  const colorMap = {
    critical: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      pulse: 'animate-pulse',
    },
    urgent: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      pulse: 'animate-pulse',
    },
    warning: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      pulse: '',
    },
    normal: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      pulse: '',
    },
  };

  return colorMap[urgencyLevel];
};
