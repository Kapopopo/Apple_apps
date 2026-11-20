import { PrimaryButton } from '@/components/primary-button';

export default function PrimaryButtonDemo() {
  return (
    <div className="pl-root flex w-full max-w-2xl flex-col gap-6 rounded-pl-xl p-6">
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton>Commencer</PrimaryButton>
        <PrimaryButton variant="outline" arrow={false}>
          En savoir plus
        </PrimaryButton>
        <PrimaryButton size="sm">Essayer</PrimaryButton>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-pl-lg bg-pl-ink-dark p-5">
        <PrimaryButton
          variant="white"
          size="lg"
          addon={<span className="rounded-pl-pill bg-pl-accent px-2 py-0.5 text-xs font-semibold text-white">-20 %</span>}
        >
          Choisir cette offre
        </PrimaryButton>
      </div>
      <PrimaryButton fullWidth size="lg">
        Pleine largeur (mobile)
      </PrimaryButton>
    </div>
  );
}
