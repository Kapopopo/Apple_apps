import { useState } from 'react';
import { RollingNumber } from '@/components/rolling-number';
import { PrimaryButton } from '@/components/primary-button';

export default function RollingNumberDemo() {
  const [value, setValue] = useState(129);
  return (
    <div className="pl-root flex w-full max-w-xl flex-col items-center gap-6 rounded-pl-xl p-8">
      <RollingNumber value={value} suffix=" €" className="font-pl-mono text-6xl font-semibold tracking-[-0.04em]" />
      <RollingNumber value={12480} className="font-pl-mono text-3xl text-pl-fg-2" suffix=" utilisateurs" />
      <PrimaryButton size="sm" arrow={false} onClick={() => setValue(Math.round(40 + Math.random() * 300))}>
        Changer la valeur
      </PrimaryButton>
    </div>
  );
}
