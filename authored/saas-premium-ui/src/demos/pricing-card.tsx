import { PricingCard } from '@/components/pricing-card';

const FEATURES = [
  { label: 'Toutes les fonctionnalités de base' },
  { label: 'Synchronisation sur tous les appareils' },
  { label: 'Support par email' },
  { label: 'Accès anticipé aux nouveautés', included: false },
];

export default function PricingCardDemo() {
  return (
    <div className="pl-root grid w-full max-w-4xl gap-6 rounded-pl-xl p-4 pt-8 sm:grid-cols-2 sm:p-8">
      <PricingCard
        name="Mensuel"
        tag="−30 %"
        originalPrice="27€"
        discountLabel="−8€/mois"
        description="Sans engagement, résiliable à tout moment."
        price={19}
        period="/mois"
        features={FEATURES}
        ctaLabel="Commencer"
      />
      <PricingCard
        variant="accent"
        name="À vie"
        description="Un paiement, toutes les mises à jour."
        price={149}
        originalPrice="249€"
        tag="✦ Le plus choisi"
        period="une fois"
        installments={3}
        badge="Offre limitée"
        discountLabel="-40 %"
        features={FEATURES.map((f) => ({ ...f, included: true }))}
        ctaLabel="Choisir cette offre"
      />
    </div>
  );
}
