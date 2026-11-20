/** Helper cn (non publié : le registre le remplace par le lib/utils.ts commun du bundle). */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
