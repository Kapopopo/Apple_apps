/**
 * Section hero (clair) : bandeau promo + header optionnels, H1 majuscules 900 serré avec icône animée au milieu
 * (échange en boucle : rotation + scale + fondu, couleur qui glisse orange → violet → bleu), sous-titre gris sur
 * 2 lignes, barre terminal noire (le seul CTA : bouton bleu « Installer ») ; trame halftone sur les côtés.
 * Textes génériques à remplacer par ceux du projet.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { Bot, Sparkles, Wand2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ease, fadeUp, popBlur, stagger } from '@/components/atlas/process-like/lib/motion';
import { DotGridBackground } from '@/components/atlas/process-like/dot-grid-background/dot-grid-background';
import { TerminalBar } from '@/components/atlas/process-like/terminal-bar/terminal-bar';
import { PromoBar } from '@/components/atlas/process-like/promo-bar/promo-bar';
import { Header } from '@/components/atlas/process-like/header/header';
import type { MenuLink } from '@/components/atlas/process-like/fullscreen-menu/fullscreen-menu';
import { PrimaryButton } from '@/components/atlas/process-like/primary-button/primary-button';

const SWAP_COLORS = ['#D97757', '#A7A1F5', '#3C47F3'];
const SWAP_ICONS = [Sparkles, Bot, Wand2, Zap];

/** Icône qui s'échange toutes les 2,4 s (AgentSwapIcon) ; figée sous prefers-reduced-motion. */
export function SwapIcon({ icons = SWAP_ICONS, interval = 2400 }: { icons?: typeof SWAP_ICONS; interval?: number }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % icons.length), interval);
    return () => clearInterval(id);
  }, [reduced, icons.length, interval]);
  const Icon = icons[i];
  return (
    <motion.span
      aria-hidden
      animate={{ color: SWAP_COLORS[i % SWAP_COLORS.length] }}
      transition={{ duration: 1.2, ease: ease.inOut }}
      className="relative mx-[0.08em] inline-grid size-[0.9em] translate-y-[0.1em] place-items-center align-baseline"
    >
      <span className="absolute inset-[-10%] rounded-full bg-current opacity-25 blur-[0.3em]" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.4, rotate: -90, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.4, rotate: 90, filter: 'blur(4px)' }}
          transition={{ duration: 0.6, ease: ease.springBack }}
          className="grid place-items-center"
        >
          <Icon className="size-[0.9em] drop-shadow-[0_0_0.12em_currentColor]" strokeWidth={2.2} />
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export interface HeroProps {
  /** Titre en deux parties autour de l'icône animée. */
  titleBefore?: string;
  titleAfter?: string;
  subtitle?: ReactNode;
  commands?: string[];
  ctaLabel?: string;
  onCta?: () => void;
  /** CTA « Commencer » du header et du menu mobile. */
  onStart?: () => void;
  /** Bandeau promo + header au-dessus du hero. */
  chrome?: boolean;
  promo?: ReactNode;
  links?: MenuLink[];
  className?: string;
}

const DEFAULT_LINKS = ['Fonctionnalités', 'Comment ça marche', 'Tarifs', 'Avis', 'Questions fréquentes'].map((label) => ({
  label,
  href: `#${label.toLowerCase().replace(/\s+/g, '-')}`,
}));

export function Hero({
  titleBefore = 'Votre travail',
  titleAfter = 'se fait tout seul',
  subtitle = (
    <>
      Un outil simple qui automatise vos tâches.
      <br /> Installé en une commande, mis à jour chaque jour.
    </>
  ),
  commands = ['npx create-app@latest mon-projet', 'npm install outil-exemple', 'outil init --template minimal'],
  ctaLabel = 'Installer',
  onCta,
  onStart,
  chrome = true,
  promo = (
    <>
      Accès à vie à <span className="font-pl-mono">149 €</span>
    </>
  ),
  links = DEFAULT_LINKS,
  className,
}: HeroProps) {
  return (
    <MotionConfig reducedMotion="user">
      {/* Bandeau promo + header fixés en haut de la fenêtre pendant tout le défilement. Rendus hors de la section
          (qui isole son empilement) pour passer au-dessus de toutes les sections suivantes. */}
      {chrome && (
        <>
          <PromoBar fixed badge="Offre limitée" className="z-[60]">
            {promo}
          </PromoBar>
          <Header
            links={links}
            top={36}
            onCta={onStart}
            menuCta={
              <PrimaryButton fullWidth onClick={onStart}>
                Commencer
              </PrimaryButton>
            }
          />
        </>
      )}
      <section id="accueil" className={cn('pl-root relative isolate w-full overflow-hidden bg-pl-page', className)}>
        {/* Trame : bandes sur les bords + anneau pointillé discret derrière le titre. */}
        <DotGridBackground
          clearCenter={0.5}
          halo={false}
          className="-z-10 [mask-image:linear-gradient(90deg,#000,transparent_18%,transparent_82%,#000)]"
        />
        <DotGridBackground
          clearCenter={0}
          halo={false}
          spacing={10}
          dotSize={1.3}
          className="-z-10 opacity-60 [mask-image:radial-gradient(circle_at_50%_42%,transparent_14rem,#000_15rem,#000_17rem,transparent_19rem)]"
        />
        <div aria-hidden className="absolute top-[38%] left-1/2 -z-10 h-56 w-[60%] -translate-x-1/2 rounded-full bg-white blur-[60px]" />

        <motion.div
          variants={stagger(0.08, 0.1)}
          initial="hidden"
          animate="show"
          className={cn(
            'mx-auto flex max-w-5xl flex-col items-center px-5 pb-14 text-center sm:pb-[72px]',
            chrome ? 'pt-[112px] sm:pt-[150px]' : 'pt-16 sm:pt-24',
          )}
        >
          <motion.h1 variants={popBlur} className="pl-display pl-engrave text-[27px] text-pl-ink-display sm:text-[46px] lg:text-[62px]">
            {titleBefore} <SwapIcon /> {titleAfter}
          </motion.h1>
          <motion.p variants={fadeUp} className="pl-lead mt-2 max-w-[420px] text-pl-fg-2 sm:mt-3">
            {subtitle}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 flex w-full justify-center sm:mt-7">
            <TerminalBar commands={commands} ctaLabel={ctaLabel} onCta={onCta} />
          </motion.div>
        </motion.div>
      </section>
    </MotionConfig>
  );
}

export default Hero;
