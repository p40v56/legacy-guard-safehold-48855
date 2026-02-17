import { CheckInFrequency } from '@/types/common';

/**
 * Format date in European format: DD/MM/YYYY, HH:mm
 */
export const formatDateEU = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date in European format: DD/MM/YYYY (date only)
 */
export const formatDateEUShort = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'Invalid date';
  }
};

export const formatDate = (dateString: string): string => {
  return formatDateEU(dateString);
};

export const formatDateShort = (dateString: string): string => {
  return formatDateEUShort(dateString);
};

export const formatDeadlineDate = (dateString: string): string => {
  return formatDateEU(dateString);
};

export const isValidDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

export const calculateNextCheckIn = (frequency: CheckInFrequency, fromDate: Date = new Date()): string => {
  const nextDate = new Date(fromDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate.toISOString();
};
