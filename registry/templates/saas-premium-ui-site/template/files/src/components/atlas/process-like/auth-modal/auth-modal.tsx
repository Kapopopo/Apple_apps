/**
 * Section « auth modal » (page /commencer) : modale centrée sur la landing floutée. En-tête en carreaux de verre
 * vus en perspective, titre majuscules sur 3 lignes (dernière en dégradé), bouton fournisseur, séparateur,
 * email, bouton noir ↗, lien, mentions. Fermeture : Échap, clic sur le fond ou ×. Entrée sheet-in.
 * `open` / `onOpenChange` pour la piloter ; `background` : contenu flouté derrière (placeholder de landing par défaut).
 * `contained` : position absolute (aperçu dans un cadre) au lieu de fixed.
 */
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sheetIn } from '@/components/atlas/process-like/lib/motion';
import { AuthCard, type AuthCardProps } from '@/components/atlas/process-like/auth-card/auth-card';

/** En-tête de carreaux de verre en perspective (version légère de GlassTileHeader). */
export function GlassTiles() {
  return (
    <div className="relative h-[230px] overflow-hidden bg-[linear-gradient(180deg,#e9eeff,#ffffff)]" style={{ perspective: 700 }}>
      <div aria-hidden className="absolute top-0 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-[#5b7cff]/30 blur-3xl" />
      <div
        className="absolute inset-x-[-12%] top-[-30%] grid grid-cols-7 gap-1.5"
        style={{ transform: 'rotateX(38deg)', transformOrigin: 'top' }}
      >
        {Array.from({ length: 35 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'aspect-square rounded-[10px] border border-white/90 shadow-[inset_0_1px_0_#fff,inset_0_-2px_6px_rgb(47_91_255/0.18),0_6px_14px_-8px_rgb(47_91_255/0.4)] backdrop-blur-sm',
              [9, 17, 24].includes(i) ? 'bg-[#cfdaff]/80' : 'bg-white/55',
            )}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-pl-card via-pl-card/85 to-transparent" />
    </div>
  );
}

function LandingPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center gap-6 bg-pl-page px-6 pt-24">
      <div className="h-12 w-3/4 max-w-xl rounded-pl-md bg-pl-ink/80" />
      <div className="h-12 w-1/2 max-w-md rounded-pl-md bg-pl-ink/80" />
      <div className="h-4 w-2/3 max-w-sm rounded-full bg-pl-bg-soft-2" />
      <div className="mt-4 h-14 w-full max-w-xl rounded-pl-pill bg-pl-ink" />
      <div className="mt-10 h-64 w-full max-w-5xl rounded-pl-xl bg-pl-ink-dark" />
    </div>
  );
}

export interface AuthModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  background?: ReactNode;
  card?: Partial<AuthCardProps>;
  contained?: boolean;
  className?: string;
}

export function AuthModal({ open = true, onOpenChange, background, card, contained = false, className }: AuthModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange?.(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn('pl-root relative w-full overflow-hidden', contained ? 'h-[860px]' : 'min-h-screen', className)}>
        <div aria-hidden className="absolute inset-0">
          {background ?? <LandingPlaceholder />}
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                'inset-0 z-50 grid place-items-center overflow-y-auto bg-[#08090b]/60 p-4 backdrop-blur-md',
                contained ? 'absolute' : 'fixed',
              )}
              onClick={(e) => e.target === e.currentTarget && onOpenChange?.(false)}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Connexion"
                variants={sheetIn}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative w-full max-w-[400px]"
              >
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => onOpenChange?.(false)}
                  className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white text-pl-ink shadow-[0_0_0_2px_#0b0b0f,0_4px_10px_rgb(0_0_0/0.15)] hover:bg-pl-bg"
                >
                  <X className="size-4" />
                </button>
                <AuthCard header={<GlassTiles />} titleIcon={<Sparkles />} {...card} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default AuthModal;
