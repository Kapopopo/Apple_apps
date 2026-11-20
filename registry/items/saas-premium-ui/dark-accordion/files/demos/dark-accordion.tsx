import { DarkAccordion } from '@/components/dark-accordion';

const ITEMS = [
  {
    id: 'a',
    question: 'Comment fonctionne l’essai gratuit ?',
    answer: 'L’essai donne accès à toutes les fonctionnalités pendant une durée limitée. Aucune carte n’est demandée pour commencer.',
  },
  {
    id: 'b',
    question: 'Puis-je changer d’offre plus tard ?',
    answer: 'Oui, le changement prend effet immédiatement et le montant est ajusté au prorata.',
  },
  {
    id: 'c',
    question: 'Mes données sont-elles exportables ?',
    answer: 'Un export complet est disponible à tout moment depuis les réglages.',
  },
  { id: 'd', question: 'Comment contacter l’équipe ?', answer: 'Par le formulaire de contact ; réponse sous un jour ouvré.' },
];

export default function DarkAccordionDemo() {
  return (
    <div className="pl-root pl-dark w-full max-w-2xl rounded-pl-xl bg-pl-ink-dark p-4 sm:p-8">
      <DarkAccordion items={ITEMS} defaultOpen={['a']} />
    </div>
  );
}
