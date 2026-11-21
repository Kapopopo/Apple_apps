/**
 * Mouvement du thème process-like : courbes nommées, durées, variants d'entrée et presets d'interaction (Motion).
 * Mêmes valeurs que les custom properties --pl-ease-* / --pl-dur-* de tokens.css.
 *
 * Accessibilité : envelopper la page dans <MotionConfig reducedMotion="user"> (fait par les sections) ;
 * Motion coupe alors les translations et échelles, les fondus restent.
 */
import type { Transition, Variants } from 'motion/react';

export type Bezier = [number, number, number, number];

export const ease = {
  /** Apparitions, cartes, listes */
  outSoft: [0.2, 0.8, 0.2, 1] as Bezier,
  /** Accordéons, slides, gros éléments */
  outExpo: [0.22, 1, 0.36, 1] as Bezier,
  /** Sheets, drawers, indicateur d'onglets */
  ios: [0.32, 0.72, 0, 1] as Bezier,
  /** Hover, press, pop de badges */
  springSm: [0.2, 1.2, 0.4, 1] as Bezier,
  /** Retour de press des boutons */
  springMd: [0.2, 1.4, 0.4, 1] as Bezier,
  /** Entrée avec overshoot (titres, icônes) */
  springBack: [0.34, 1.56, 0.64, 1] as Bezier,
  /** Boucles d'échange */
  inOut: [0.65, 0, 0.35, 1] as Bezier,
  /** Grosses transitions de scène */
  slowSettle: [0.16, 1, 0.3, 1] as Bezier,
  /** Rebond court des petits contrôles */
  press: [0.3, 1.4, 0.5, 1] as Bezier,
  /** Boucles lentes */
  drift: [0.3, 0.5, 0.4, 1] as Bezier,
} as const;

/** Durées en secondes (Motion). */
export const duration = {
  press: 0.12,
  hover: 0.22,
  enter: 0.48,
  accordion: 0.5,
  tabs: 0.45,
  card: 0.8,
  settle: 1.3,
} as const;

/** Décalage entre éléments d'une liste (40–60 ms). */
export const STAGGER = 0.05;

/** Conteneur qui déclenche ses enfants en cascade : <motion.ul variants={stagger()} initial="hidden" whileInView="show">. */
export const stagger = (each: number = STAGGER, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren } },
});

/** fade-up : opacité + translateY(12px), 480 ms out-soft. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.enter, ease: ease.outSoft } },
};

/** card-in : translateY(14px) scale(.985), 800 ms out-soft. */
export const cardIn: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: duration.card, ease: ease.outSoft } },
};

/** sheet-in : modales et popups, translateY(24px) scale(.98), courbe iOS. */
export const sheetIn: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: ease.ios } },
  exit: { opacity: 0, y: 16, scale: 0.985, transition: { duration: 0.3, ease: ease.ios } },
};

/** pop-blur : titres et icônes, translateY(.45em) scale(.96) blur(8px) → net, spring-back. */
export const popBlur: Variants = {
  hidden: { opacity: 0, y: '0.45em', scale: 0.96, filter: 'blur(8px)' },
  show: { opacity: 1, y: '0em', scale: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: ease.springBack } },
};

/** blur-reveal : un mot ou une ligne qui se dévoile de gauche à droite. */
export const blurReveal: Variants = {
  hidden: { opacity: 0.001, clipPath: 'inset(0 100% 0 0)', filter: 'blur(4px)' },
  show: {
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: ease.outExpo },
  },
};

/** line-in : traits et lignes de tableau, un par un. */
export const lineIn: Variants = {
  hidden: { opacity: 0, scaleX: 0.6, originX: 0 },
  show: { opacity: 1, scaleX: 1, transition: { duration: 0.5, ease: ease.outSoft } },
};

/**
 * swipe-in : contenu d'onglet qui arrive de ±48 px selon la direction (1 = vers la droite, -1 = vers la gauche).
 * <AnimatePresence custom={dir} mode="popLayout"><motion.div custom={dir} variants={swipeIn} initial="enter" animate="center" exit="exit" />
 */
export const swipeIn: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48, filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: duration.tabs, ease: ease.ios } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -48,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: ease.ios },
  }),
};

/** Press : scale(.97) en 120 ms, retour en spring-md 340 ms. */
export const press = {
  whileTap: { scale: 0.97, transition: { duration: duration.press, ease: 'linear' } as Transition },
  transition: { duration: 0.34, ease: ease.springMd } as Transition,
};

/** Hover de carte : léger lift. */
export const lift = {
  whileHover: { y: -2, transition: { duration: 0.25, ease: ease.outSoft } as Transition },
};

/** Indicateur glissant (onglets, segmented control). */
export const slide: Transition = { duration: duration.tabs, ease: ease.ios };

/** Accordéon : hauteur via grid-template-rows (voir DarkAccordion). */
export const accordion: Transition = { duration: duration.accordion, ease: ease.outExpo };

/** Viewport par défaut des entrées au scroll. */
export const inView = { once: true, amount: 0.25 } as const;

/** Chaîne CSS d'une courbe : cssEase(ease.ios) → "cubic-bezier(0.32, 0.72, 0, 1)". */
export const cssEase = (b: Bezier) => `cubic-bezier(${b.join(', ')})`;
