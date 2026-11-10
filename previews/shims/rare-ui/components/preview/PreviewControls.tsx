/** Shim Atlas : sur rareui.com ces contrôles viennent du panneau de réglages du site. Ici, valeur par défaut. */
import type { ReactNode } from 'react';
export function PreviewControlsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function usePreviewControl(_name: string, fallback: string): [string, (value: string) => void] {
  return [fallback, () => {}];
}
