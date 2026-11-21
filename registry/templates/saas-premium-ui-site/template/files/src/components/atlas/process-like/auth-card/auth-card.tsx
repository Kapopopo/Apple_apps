/**
 * AuthCard : carte de connexion en deux variantes.
 *  - `modal` : carte blanche (rayon 28). En-tête de carreaux de verre en perspective (slot `header`) derrière un titre
 *    centré en majuscules sur 3 lignes (dernière en dégradé bleu, icône inline optionnelle), bouton fournisseur
 *    pill outline, séparateur texte, champ email gris gravé, bouton noir pill lumineux ↗, lien souligné, mentions 11 px.
 *  - `inline` : carte bordée de bleu pâle (2 px) sur dégradé blanc → bleu très clair, anneau et halo bleus ;
 *    texte d'explication centré, label au-dessus d'un champ pill blanc gravé, bouton noir, lien d'appoint.
 * Étape 2 (code par email) : 6 cases, collage accepté.
 */
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, swipeIn } from '@/components/atlas/process-like/lib/motion';
import { InlineIcon } from '@/components/atlas/process-like/section-heading/section-heading';

export interface AuthCardProps {
  variant?: 'modal' | 'inline';
  /** Titre en lignes (variante modal) ; la dernière passe en dégradé bleu. */
  titleLines?: string[];
  /** Icône inline insérée au début de la 2e ligne. */
  titleIcon?: ReactNode;
  /** Texte d'explication (variante inline). */
  subtitle?: ReactNode;
  /** Bouton fournisseur (OAuth) : libellé + icône ; null pour le masquer. */
  provider?: { label: string; icon?: ReactNode; onClick?: () => void } | null;
  separator?: string;
  emailLabel?: string;
  submitLabel?: string;
  onSubmitEmail?: (email: string) => void | boolean | Promise<void | boolean>;
  onSubmitCode?: (code: string) => void;
  /** Visuel derrière le titre (variante modal), ex. GlassTiles. */
  header?: ReactNode;
  footerLink?: { label: ReactNode; href: string } | null;
  legal?: ReactNode;
  className?: string;
}

function CodeInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, v: string) => {
    const chars = v.replace(/\D/g, '').split('');
    if (!chars.length) {
      setDigits((d) => d.map((x, k) => (k === i ? '' : x)));
      return;
    }
    const next = [...digits];
    chars.slice(0, 6 - i).forEach((c, k) => (next[i + k] = c));
    setDigits(next);
    refs.current[Math.min(5, i + chars.length)]?.focus();
    if (next.every(Boolean)) onComplete(next.join(''));
  };
  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chiffre ${i + 1}`}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => e.key === 'Backspace' && !d && refs.current[i - 1]?.focus()}
          className="h-14 w-full min-w-0 rounded-pl-md bg-pl-bg-soft-2/60 text-center font-pl-mono text-xl text-pl-fg shadow-pl-inset outline-none focus:shadow-pl-ring"
        />
      ))}
    </div>
  );
}

/** Icône neutre du bouton fournisseur (pas de logo de marque). */
function ProviderMark() {
  return (
    <span aria-hidden className="grid size-5 place-items-center rounded-full bg-pl-bg-soft-2 font-pl-mono text-[11px] font-bold text-pl-fg">
      G
    </span>
  );
}

const ctaClass =
  'flex h-[54px] w-full items-center justify-center gap-2 rounded-pl-pill bg-[linear-gradient(180deg,#2c2c31,#0b0b0f)] text-[17px] font-semibold text-white shadow-pl-glow-cta outline-none transition-[filter,transform] duration-150 hover:brightness-125 focus-visible:shadow-pl-ring active:scale-[0.98]';

export function AuthCard({
  variant = 'modal',
  titleLines = ['Prêt à construire', 'votre projet', 'dès aujourd’hui ?'],
  titleIcon,
  subtitle,
  provider = { label: 'Continuer avec Google' },
  separator = 'ou continuez avec votre email',
  emailLabel = 'Email',
  submitLabel = 'Continuer',
  onSubmitEmail,
  onSubmitCode,
  header,
  footerLink = { label: 'Déjà un compte ? Se connecter', href: '#' },
  legal = 'En continuant, vous acceptez les Conditions d’utilisation et la Politique de confidentialité.',
  className,
}: AuthCardProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const inline = variant === 'inline';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    const ok = await onSubmitEmail?.(email);
    if (ok !== false) setStep('code');
  };

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-pl-lg',
        inline
          ? 'max-w-[440px] border-2 border-[#d5e2ff] bg-[linear-gradient(180deg,#ffffff,#f1f5ff)] shadow-pl-glow-ring'
          : 'max-w-[400px] bg-pl-card shadow-[0_40px_90px_-30px_rgb(0_0_0/0.6)]',
        className,
      )}
    >
      {!inline && (
        <div className="relative">
          {header}
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className={cn(
              'pl-h2-dark relative px-6 text-center text-[26px] text-pl-ink-display',
              header ? 'absolute inset-x-0 bottom-6' : 'pt-8',
            )}
          >
            {titleLines.map((line, i) => (
              <span key={i} className={cn('block', i === titleLines.length - 1 && 'pl-text-gradient')}>
                {i === 1 && titleIcon && <InlineIcon>{titleIcon}</InlineIcon>}
                {line}
              </span>
            ))}
          </motion.h2>
        </div>
      )}
      <div className={cn('space-y-5', inline ? 'p-5 sm:p-7' : 'px-5 pt-7 pb-6 sm:px-6')}>
        <AnimatePresence mode="popLayout" initial={false} custom={1}>
          {step === 'email' ? (
            <motion.div key="email" custom={-1} variants={swipeIn} initial="enter" animate="center" exit="exit" className="space-y-5">
              {provider && (
                <button
                  type="button"
                  onClick={provider.onClick}
                  className="flex h-[54px] w-full items-center justify-center gap-3 rounded-pl-pill bg-white text-[17px] font-medium text-pl-fg shadow-[0_0_0_1px_#e4e4e8,var(--pl-shadow-pill)] transition-colors hover:bg-pl-bg focus-visible:shadow-pl-ring focus-visible:outline-none"
                >
                  {provider.icon ?? <ProviderMark />}
                  {provider.label}
                </button>
              )}
              {subtitle && <p className="text-center text-[15px] leading-relaxed text-pl-fg-2">{subtitle}</p>}
              {provider && !inline && (
                <div className="flex items-center gap-3 text-[14px] text-pl-fg-2">
                  <span className="h-px flex-1 bg-pl-border" />
                  {separator}
                  <span className="h-px flex-1 bg-pl-border" />
                </div>
              )}
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    className={cn('block text-[14px] font-medium text-pl-fg', !inline && 'sr-only')}
                    htmlFor={`pl-auth-email-${variant}`}
                  >
                    {emailLabel}
                  </label>
                  <input
                    id={`pl-auth-email-${variant}`}
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={inline ? 'vous@exemple.fr' : emailLabel}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      'h-[52px] w-full px-5 text-[17px] text-pl-fg outline-none placeholder:text-pl-fg-3 focus:shadow-pl-ring',
                      inline
                        ? 'rounded-pl-pill bg-white shadow-[0_0_0_1px_#d5e2ff,var(--pl-shadow-inset)]'
                        : 'rounded-pl-md bg-[#eceef3] shadow-pl-inset',
                    )}
                  />
                </div>
                <button type="submit" className={ctaClass}>
                  {submitLabel}
                  {!inline && <ArrowUpRight className="size-4" aria-hidden />}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="code" custom={1} variants={swipeIn} initial="enter" animate="center" exit="exit" className="space-y-4">
              <p className="text-center text-[15px] text-pl-fg-2">
                Code envoyé à <span className="font-medium text-pl-fg">{email}</span>
              </p>
              <CodeInput onComplete={(c) => onSubmitCode?.(c)} />
              <button
                type="button"
                onClick={() => setStep('email')}
                className="block w-full text-center text-sm text-pl-fg-2 underline underline-offset-4 hover:text-pl-fg"
              >
                Modifier l’adresse
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {footerLink && (
          <div className={cn(!inline && 'border-t border-pl-border pt-5')}>
            <a
              href={footerLink.href}
              className={cn(
                'block text-center text-[15px] text-pl-fg-2 hover:text-pl-fg',
                inline ? '[&_strong]:font-semibold [&_strong]:text-pl-fg' : 'font-medium underline decoration-pl-fg-3 underline-offset-4',
              )}
            >
              {footerLink.label}
            </a>
          </div>
        )}
        {legal && !inline && <p className="text-center text-[11px] leading-relaxed text-pl-fg-3">{legal}</p>}
      </div>
    </div>
  );
}

export default AuthCard;
