import { useState } from 'react';
import { PromoBar } from '@/components/promo-bar';

export default function PromoBarDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <div className="pl-root w-full max-w-4xl overflow-hidden rounded-pl-lg border border-pl-border">
      {visible ? (
        <PromoBar badge="Offre limitée" onDismiss={() => setVisible(false)}>
          Accès à vie à <span className="font-pl-mono">149 €</span>
        </PromoBar>
      ) : (
        <button type="button" className="h-9 w-full text-sm text-pl-fg-2" onClick={() => setVisible(true)}>
          Réafficher le bandeau
        </button>
      )}
      <div className="h-40 bg-pl-page" />
    </div>
  );
}
