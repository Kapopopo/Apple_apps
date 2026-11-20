import { LockedOverlay } from '@/components/locked-overlay';

export default function LockedOverlayDemo() {
  return (
    <div className="pl-root w-full max-w-3xl overflow-hidden rounded-pl-xl bg-pl-ink-dark">
      <LockedOverlay
        title="Accédez à toute la bibliothèque"
        description="Débloquez l’ensemble des modèles et des mises à jour."
        ctaLabel="Débloquer l’accès"
      >
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="pl-placeholder-dark aspect-[4/5] rounded-pl-md border border-white/5" />
          ))}
        </div>
      </LockedOverlay>
    </div>
  );
}
