
import { useState, useEffect } from 'react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  totalMilliseconds: number;
}

export interface CountdownOptions {
  isActive: boolean;
  targetDate: string | null;
  gracePeriodActive?: boolean;
  gracePeriodEnd?: string | null;
}

export const useCountdown = (
  isActive: boolean, 
  targetDate: string | null,
  gracePeriodActive?: boolean,
  gracePeriodEnd?: string | null
) => {
  const [countdown, setCountdown] = useState<CountdownState>({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    isOverdue: false,
    totalMilliseconds: 0,
  });

  // Determine which date to count down to
  const effectiveTargetDate = gracePeriodActive && gracePeriodEnd ? gracePeriodEnd : targetDate;

  useEffect(() => {
    if (!isActive || !effectiveTargetDate) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false, totalMilliseconds: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(effectiveTargetDate);
      
      // Validate the date
      if (isNaN(dueDate.getTime())) {
        console.error('Invalid date provided to useCountdown:', effectiveTargetDate);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false, totalMilliseconds: 0 });
        return;
      }

      const timeDiff = dueDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true, totalMilliseconds: 0 });
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isOverdue: false, totalMilliseconds: timeDiff });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isActive, effectiveTargetDate]);

  return countdown;
};
