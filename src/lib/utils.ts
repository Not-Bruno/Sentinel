import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict } from 'date-fns';
import { de } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUptime(date: number | Date): string {
  try {
    return formatDistanceToNowStrict(date, { addSuffix: false, locale: de });
  } catch (error) {
    return 'N/A';
  }
}
