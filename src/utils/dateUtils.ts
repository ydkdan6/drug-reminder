import { format, isValid, parse } from 'date-fns';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
};

export const formatTime = (time: string, period: string) => {
  return `${time} ${period}`;
};

export const parseTimeString = (timeString: string) => {
  // Format: "HH:MM AM/PM"
  const [time, period] = timeString.split(' ');
  return { time, period: period as 'AM' | 'PM' };
};

export const convertTo24Hour = (time: string, period: 'AM' | 'PM') => {
  const [hours, minutes] = time.split(':').map(Number);
  let hours24 = hours;
  
  if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hours24 = 0;
  }
  
  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const convertTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  let hours12 = hours % 12;
  hours12 = hours12 === 0 ? 12 : hours12;
  const period = hours >= 12 ? 'PM' : 'AM';
  
  return {
    time: `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    period,
  };
};

export const isDateInRange = (date: string, startDate: string, endDate: string) => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return checkDate >= start && checkDate <= end;
};