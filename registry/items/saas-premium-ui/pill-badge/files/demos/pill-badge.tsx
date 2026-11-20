import { Lock, Sparkles } from 'lucide-react';
import { PillBadge } from '@/components/pill-badge';

export default function PillBadgeDemo() {
  return (
    <div className="pl-root flex w-full max-w-2xl flex-col gap-6 rounded-pl-xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <PillBadge>Comment ça marche</PillBadge>
        <PillBadge variant="accent" icon={<Sparkles />}>
          Nouveau
        </PillBadge>
        <PillBadge variant="solid" italic pop>
          Offre limitée
        </PillBadge>
        <PillBadge variant="neutral" dot="success" pulse>
          En ligne
        </PillBadge>
        <PillBadge variant="accent" size="sm">
          Étape 1 · Préparer
        </PillBadge>
      </div>
      <div className="pl-dark flex flex-wrap items-center gap-2 rounded-pl-lg bg-pl-ink-dark p-5">
        <PillBadge variant="dark">Questions fréquentes</PillBadge>
        <PillBadge variant="dark" icon={<Lock />}>
          Contenu réservé
        </PillBadge>
        <PillBadge variant="glass" dot="accent" pulse>
          En direct
        </PillBadge>
      </div>
    </div>
  );
}
