/**
 * PricingCard : carte de prix en deux couches — un cadre noir (#0C0D11, rayon 30, marge 8 px) et, dedans,
 * un panneau `dark` (dégradé graphite) ou `accent` (dégradé bleu, offre vedette, étiquette flottante inclinée).
 * Le panneau porte le nom (gros titre + pastille), le prix barré suivi du gros prix en RollingNumber,
 * l'encart « payer en N fois » (Toggle : le prix affiché devient la mensualité) et le bouton blanc avec
 * pastille de réduction ; la liste de features à pastilles rondes est posée sur le cadre, sous le panneau.
 * Seule la carte vedette a le droit au bleu en aplat (règle du thème).
 */
import { useState, type MouseEventHandler, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardIn, inView } from '@/components/atlas/process-like/lib/motion';
import { RollingNumber } from '@/components/atlas/process-like/rolling-number/rolling-number';
import { Toggle } from '@/components/atlas/process-like/toggle/toggle';
import { PrimaryButton } from '@/components/atlas/process-like/primary-button/primary-button';

export interface PricingFeature {
  label: ReactNode;
  included?: boolean;
}

export interface PricingCardProps {
  variant?: 'dark' | 'accent';
  name: string;
  /** Pastille à côté du nom (ex. « −34 % », « Le plus choisi »). */
  tag?: string;
  description?: string;
  price: number;
  originalPrice?: string;
  currency?: string;
  period?: string;
  /** Paiement fractionné : nombre d'échéances (0 = sans). */
  installments?: number;
  installmentsLabel?: string;
  features: PricingFeature[];
  ctaLabel: string;
  onCta?: MouseEventHandler<HTMLElement>;
  /** Pastille intégrée au bouton (ex. « −40 % »). */
  discountLabel?: string;
  /** Étiquette flottante inclinée (variante accent). */
  badge?: string;
  className?: string;
}

export function PricingCard({
  variant = 'dark',
  name,
  tag,
  description,
  price,
  originalPrice,
  currency = '€',
  period = '/mois',
  installments = 0,
  installmentsLabel,
  features,
  ctaLabel,
  onCta,
  discountLabel,
  badge,
  className,
}: PricingCardProps) {
  const [split, setSplit] = useState(false);
  const accent = variant === 'accent';
  const shown = split && installments > 1 ? Math.ceil((price / installments) * 100) / 100 : price;
  const decimals = shown % 1 ? 2 : 0;

  return (
    <motion.article
      variants={cardIn}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className={cn(
        'relative w-full rounded-[30px] bg-pl-ink-card p-2 pb-6 text-white md:row-span-2 md:grid md:grid-rows-subgrid md:gap-0',
        // Glow coloré sous chaque carte : bleu pour la vedette, gris bleuté pour la graphite.
        accent
          ? 'order-first shadow-[0_18px_40px_-14px_rgb(0_0_0/0.35),0_40px_100px_-18px_rgb(47_91_255/0.85)] md:order-none'
          : 'shadow-[0_18px_40px_-14px_rgb(0_0_0/0.45),0_40px_100px_-18px_rgb(96_102_128/0.8)]',
        className,
      )}
    >
      {accent && badge && (
        <span className="absolute -top-4 right-5 z-10 rotate-[6deg] rounded-[12px] bg-white px-3.5 py-2 text-[15px] font-bold text-pl-accent-deep shadow-[0_0_0_1px_rgb(47_91_255/0.15),0_10px_24px_-10px_rgb(47_91_255/0.6)]">
          {badge}
        </span>
      )}

      <div
        className={cn(
          'relative flex flex-col gap-5 overflow-hidden rounded-[24px] p-5 sm:p-7',
          accent
            ? 'bg-[linear-gradient(160deg,#7ea2ff_0%,#3f6bff_35%,#2347ff_70%,#1c3cf0_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_20px_50px_-20px_rgb(47_91_255/0.8)]'
            : 'bg-[linear-gradient(180deg,#4a4a52_0%,#2b2b31_45%,#1d1d22_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
        )}
      >
        {accent && (
          <span aria-hidden className="pointer-events-none absolute -top-1/3 -left-1/4 size-[80%] rounded-full bg-white/25 blur-3xl" />
        )}

        <header className="relative space-y-1.5">
          <h3 className="flex flex-wrap items-center gap-3 text-[34px] leading-none font-semibold tracking-[-0.045em] sm:text-[46px]">
            {name}
            {tag && (
              <span
                className={cn(
                  'rounded-pl-pill px-2.5 py-1 text-[13px] font-semibold tracking-normal',
                  accent ? 'bg-white/20 text-white' : 'bg-white/15 text-white/90',
                )}
              >
                {tag}
              </span>
            )}
          </h3>
          {description && <p className="text-[15.5px] text-white/75">{description}</p>}
        </header>

        <p className="relative flex flex-wrap items-baseline gap-x-2.5">
          {originalPrice && (
            <span className="text-[30px] font-medium tracking-[-0.03em] text-white/45 line-through sm:text-[32px]">{originalPrice}</span>
          )}
          <span className="flex items-baseline text-[48px] font-semibold tracking-[-0.045em] sm:text-[56px]">
            <RollingNumber value={shown} format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }} />
            {currency}
          </span>
          <span className="text-[17px] text-white/70">{split && installments > 1 ? `× ${installments}` : period}</span>
        </p>

        {installments > 1 && (
          <div className="relative flex items-center justify-between gap-3 rounded-[16px] bg-white/12 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold">{installmentsLabel ?? `Payer en ${installments} fois sans frais`}</span>
              <span className="block font-pl-mono text-xs text-white/70">
                {installments} × {Math.ceil(price / installments)}
                {currency}
              </span>
            </span>
            <Toggle tone="dark" size="sm" checked={split} onCheckedChange={setSplit} />
          </div>
        )}

        <PrimaryButton
          variant="white"
          size="lg"
          fullWidth
          arrow={false}
          onClick={onCta}
          className="relative mt-auto h-[58px] rounded-[16px] text-[18px]"
          addon={
            discountLabel ? (
              <span
                className={cn(
                  'rounded-pl-pill px-2.5 py-1 text-[13px] font-bold whitespace-nowrap text-white',
                  accent ? 'bg-pl-accent-deep shadow-[0_0_12px_rgb(47_91_255/0.5)]' : 'bg-pl-ink',
                )}
              >
                {discountLabel}
              </span>
            ) : undefined
          }
        >
          {ctaLabel}
        </PrimaryButton>
      </div>

      <ul className="space-y-3.5 self-start px-5 pt-6 sm:px-7">
        {features.map((f, i) => {
          const ok = f.included !== false;
          return (
            <li
              key={i}
              className={cn('flex items-start gap-3 text-[15px] leading-snug font-medium tracking-[-0.01em]', !ok && 'opacity-40')}
            >
              <span
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                  accent && ok ? 'bg-pl-accent text-white shadow-[0_0_10px_rgb(47_91_255/0.6)]' : 'bg-white/12 text-white/80',
                )}
              >
                {ok ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
              </span>
              <span className="text-white/85">{f.label}</span>
            </li>
          );
        })}
      </ul>
    </motion.article>
  );
}

export default PricingCard;
