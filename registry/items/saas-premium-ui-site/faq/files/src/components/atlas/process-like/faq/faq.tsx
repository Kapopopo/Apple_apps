/**
 * Section FAQ (fond noir pur, bord à bord) : en-tête aligné à gauche — pastille sombre, H2 deux tons (blanc + gris),
 * accroche dont la première phrase est en gras — et bouton « Nous contacter » en relief avec point vert pulsant
 * et chevron (le CTA de la section, à droite sur bureau). Accordéon d'items en relief dans un cadre à double liseré.
 */
import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/atlas/process-like/section-heading/section-heading';
import { DarkAccordion, type AccordionItem } from '@/components/atlas/process-like/dark-accordion/dark-accordion';
import { StatusDot } from '@/components/atlas/process-like/status-dot/status-dot';

export interface FaqProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: ReactNode;
  items?: AccordionItem[];
  contactLabel?: ReactNode;
  contactHref?: string;
  className?: string;
}

const DEFAULT_ITEMS: AccordionItem[] = [
  {
    id: 'essai',
    question: 'Comment fonctionne l’essai ?',
    answer: 'Toutes les fonctionnalités sont disponibles pendant l’essai, sans carte bancaire.',
  },
  { id: 'offre', question: 'Puis-je changer d’offre ?', answer: 'Oui, à tout moment. Le changement est immédiat et ajusté au prorata.' },
  {
    id: 'appareils',
    question: 'Sur quels appareils l’outil fonctionne-t-il ?',
    answer: 'Sur ordinateur, tablette et mobile ; vos données sont synchronisées.',
  },
  {
    id: 'donnees',
    question: 'Où sont stockées mes données ?',
    answer: 'Elles sont chiffrées et exportables à tout moment depuis les réglages.',
  },
  { id: 'remboursement', question: 'Puis-je être remboursé ?', answer: 'Oui, sous 14 jours, sans justification.' },
];

export function Faq({
  badge = 'FAQ',
  title = 'Vos questions',
  subtitle = 'Nos réponses',
  description = (
    <>
      <strong className="font-semibold text-white">Une question sans réponse ?</strong> Écrivez-nous, on répond en général dans la journée.
    </>
  ),
  items = DEFAULT_ITEMS,
  contactLabel = 'Nous contacter',
  contactHref = '#contact',
  className,
}: FaqProps) {
  return (
    <MotionConfig reducedMotion="user">
      <section id="questions-fréquentes" className={cn('pl-root pl-dark relative isolate w-full bg-pl-ink-dark', className)}>
        {/* Dégradé de raccord avec la photo du footer : noir → bleu nuit du haut de l'image (#000308), sans couture. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px -z-10 h-40 bg-[linear-gradient(180deg,transparent,#000308_92%)]" />
        {/* Filets latéraux fondus vers le bas (ils ne s'arrêtent plus net sur la photo). */}
        <div className="mx-auto max-w-[848px] border-white/[0.07] px-4 py-14 [mask-image:linear-gradient(180deg,#000_calc(100%-90px),transparent)] sm:border-x sm:px-4 sm:py-24">
          <SectionHeading tone="light" align="left" badge={badge} title={title} subtitle={subtitle} badgeTone="dark" />
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[15px] leading-relaxed text-white/55">{description}</p>
            <a
              href={contactHref}
              className="pl-chip-dark inline-flex h-12 shrink-0 items-center gap-3 self-start rounded-pl-pill px-5 text-[17px] font-medium text-white transition-[filter] hover:brightness-125 sm:self-auto"
            >
              <StatusDot size="sm" />
              {contactLabel}
              <ChevronRight className="size-4 text-white/70" aria-hidden />
            </a>
          </div>
          <div className="mt-8 rounded-[24px] p-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),0_0_0_6px_rgb(255_255_255/0.02)] sm:p-3">
            <DarkAccordion items={items} defaultOpen={[items[0]?.id]} />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default Faq;
