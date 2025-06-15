
import { useState, useEffect } from 'react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

export const useCountdown = (isActive: boolean, targetDate: string | null) => {
  const [countdown, setCountdown] = useState<CountdownState>({ 
    days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false 
  });

  useEffect(() => {
    if (!isActive || !targetDate) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dueDate = new Date(targetDate);
      const timeDiff = dueDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isOverdue: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isActive, targetDate]);

  return countdown;
};
