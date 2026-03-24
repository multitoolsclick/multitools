import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function naturalSort<T>(array: T[], keyExtractor: (item: T) => string): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyExtractor(a);
    const bVal = keyExtractor(b);
    return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
  });
}
