import { Download, Sparkles } from 'lucide-react';
import { AccentButton } from '@/components/accent-button';

export default function AccentButtonDemo() {
  return (
    <div className="pl-root flex w-full max-w-2xl flex-col gap-6 rounded-pl-xl p-6">
      <div className="flex flex-wrap items-center gap-3">
        <AccentButton icon={<Sparkles />}>Démarrer l’essai</AccentButton>
        <AccentButton tone="deep" icon={<Download />}>
          Installer
        </AccentButton>
        <AccentButton size="sm">Voir</AccentButton>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-pl-lg bg-pl-ink-dark p-6">
        <AccentButton size="lg">Débloquer l’accès</AccentButton>
      </div>
    </div>
  );
}
