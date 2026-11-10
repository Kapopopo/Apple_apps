/** Shim Atlas : helper `cn` de shadcn, importé par beaucoup de sources sans être fourni dans l'item. */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
