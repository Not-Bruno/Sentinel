import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUptime(date: number | Date): string {
  try {
    return formatDistanceToNowStrict(date, { addSuffix: false });
  } catch (error) {
    return 'N/A';
  }
}
