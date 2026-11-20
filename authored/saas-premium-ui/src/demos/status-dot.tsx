import { StatusDot } from '@/components/status-dot';

export default function StatusDotDemo() {
  return (
    <div className="pl-root flex w-full max-w-xl flex-col gap-5 rounded-pl-xl p-6">
      <div className="flex flex-wrap gap-6">
        <StatusDot label="Opérationnel" />
        <StatusDot tone="accent" label="Synchronisation" />
        <StatusDot tone="warning" label="Dégradé" />
        <StatusDot tone="danger" pulse={false} label="Hors ligne" />
      </div>
      <div className="pl-dark flex items-center gap-3 rounded-pl-lg bg-pl-ink-dark p-5 text-white">
        <StatusDot size="sm" />
        <span className="text-sm text-white/70">Équipe disponible</span>
      </div>
    </div>
  );
}
