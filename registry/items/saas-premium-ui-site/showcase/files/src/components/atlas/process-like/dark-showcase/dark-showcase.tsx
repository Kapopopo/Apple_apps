/**
 * Section « vitrine » sombre : barre d'onglets pleine largeur (cellules à filets, centrée sur 1320 px) posée sur un bloc
 * noir pur bord à bord, arrondi à 48 px en haut sur bureau et 28 px sur mobile (trame de points à droite, halo bleu).
 * Chaque onglet a son H2 blanc majuscules et un seul CTA ; le contenu change en swipe-in selon la direction :
 *  - automatiser : pastille « Nouveau », bouton blanc, puis console d'assistant, calendrier et téléphone ;
 *  - écrans : mur de mockups d'app sur deux rangées qui défilent lentement, fondu en bas ;
 *  - formats (défaut) : recherche à placeholder animé, sphère 3D de vignettes, deux contrôles segmentés, CTA lumineux ;
 *  - captures : filtres à compteurs, fiche d'app + galerie de fiches store, fondu vers le noir avec accroche deux tons.
 * Placeholders et textes génériques.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  CalendarClock,
  Check,
  Images,
  LayoutGrid,
  Lock,
  Orbit,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardIn, fadeUp, slide, stagger, swipeIn } from '@/components/atlas/process-like/lib/motion';
import { SegmentedTabs, type SegmentedTab } from '@/components/atlas/process-like/segmented-tabs/segmented-tabs';
import { DotGridBackground } from '@/components/atlas/process-like/dot-grid-background/dot-grid-background';
import { SectionHeading } from '@/components/atlas/process-like/section-heading/section-heading';
import { PhoneMockup } from '@/components/atlas/process-like/phone-mockup/phone-mockup';
import { PillBadge } from '@/components/atlas/process-like/pill-badge/pill-badge';
import { PrimaryButton } from '@/components/atlas/process-like/primary-button/primary-button';
import { AccentButton } from '@/components/atlas/process-like/accent-button/accent-button';
import { GlowButton } from '@/components/atlas/process-like/glow-button/glow-button';
import { SearchBar } from '@/components/atlas/process-like/search-bar/search-bar';
import { MediaSphere } from '@/components/atlas/process-like/media-sphere/media-sphere';
import { SHORT_VIDEO_COUNT, ShortVideoTile, shortVideoMeta } from '@/components/atlas/process-like/media-sphere/short-video-tile';
import { CalendarCard } from '@/components/atlas/process-like/calendar-card/calendar-card';

export type ShowcaseTab = 'automatiser' | 'ecrans' | 'formats' | 'captures';

const TABS: SegmentedTab[] = [
  { id: 'automatiser', label: 'Automatiser', icon: <CalendarClock /> },
  { id: 'ecrans', label: 'Écrans', icon: <LayoutGrid /> },
  { id: 'formats', label: 'Formats', icon: <Orbit /> },
  { id: 'captures', label: 'Captures', icon: <Images /> },
];

function useWide(query = '(min-width: 640px)') {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setWide(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return wide;
}

/**
 * Hauteur de l'onglet actif, suivie en continu : le plateau l'anime (même courbe que le swipe) au lieu de sauter
 * d'un coup quand les onglets — de hauteurs différentes — défilent seuls. L'onglet sortant (popLayout) est ignoré.
 */
function useActiveHeight() {
  const [height, setHeight] = useState<number>();
  const ro = useRef<ResizeObserver | null>(null);
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    ro.current?.disconnect();
    ro.current = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.current.observe(el);
  }, []);
  useEffect(() => () => ro.current?.disconnect(), []);
  return { height, measure };
}

function Heading({ children, icon, iconAt }: { children: string; icon?: ReactNode; iconAt?: number }) {
  return <SectionHeading tone="dark" title={children} icon={icon} iconAt={iconAt} className="mx-auto max-w-[760px]" />;
}

/* ---------- Automatiser ---------- */

const PROMPT = 'Planifie mes 3 publications de la semaine';
/** Publications que l'assistant planifie (case du calendrier : 0 = lundi 26 oct., 6 = dim. 1er nov. 2026). */
const POSTS = [
  { slot: 21, day: 'lun. 16', time: '21:00' },
  { slot: 23, day: 'mer. 18', time: '18:00' },
  { slot: 25, day: 'ven. 20', time: '12:30' },
];
/** Déjà au planning avant la conversation (mer. 4 et mar. 10). */
const PLANNED: Record<number, string> = { 9: '19:00', 15: '12:00' };

interface AgentState {
  typed: number;
  sent: boolean;
  /** Nombre d'appels d'outil affichés (le dernier tourne tant que `done` ne l'a pas rattrapé). */
  tools: number;
  done: number;
  reply: boolean;
}
const START: AgentState = { typed: 0, sent: false, tools: 0, done: 0, reply: false };
const FINAL: AgentState = { typed: 0, sent: true, tools: POSTS.length, done: POSTS.length, reply: true };

/**
 * Scénario en boucle (~6,5 s, calé sur l'autoplay de 7 s des onglets) : frappe du message, envoi, réflexion,
 * 3 appels d'outil, réponse ; pause puis on recommence. État final figé sous prefers-reduced-motion.
 */
function useAgentScript(): AgentState {
  const reduced = useReducedMotion();
  const [state, setState] = useState<AgentState>(reduced ? FINAL : START);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduced) {
      setState(FINAL);
      return;
    }
    const timers: number[] = [];
    const at = (ms: number, patch: Partial<AgentState>) => timers.push(window.setTimeout(() => setState((s) => ({ ...s, ...patch })), ms));
    setState(START);
    let t = 600;
    for (let i = 1; i <= PROMPT.length; i++) {
      // Rythme de frappe humain : un peu plus long après les espaces, léger irrégulier.
      t += 26 + (PROMPT[i - 2] === ' ' ? 45 : 0) + ((i * 7) % 5) * 5;
      at(t, { typed: i });
    }
    t += 380;
    at(t, { sent: true, typed: 0 });
    t += 900;
    POSTS.forEach((_, i) => {
      at(t, { tools: i + 1 });
      t += 520;
      at(t, { done: i + 1 });
      t += 120;
    });
    t += 250;
    at(t, { reply: true });
    t += 5200;
    timers.push(window.setTimeout(() => setRun((r) => r + 1), t));
    return () => timers.forEach(clearTimeout);
  }, [reduced, run]);
  return state;
}

/** Glyphe d'assistant : astérisque à branches arrondies (générique), qui tourne pendant le travail. */
function AgentGlyph({ busy = false, className }: { busy?: boolean; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('shrink-0 text-(--pl-agent-1)', className)}
      animate={busy ? { rotate: 360 } : { rotate: 0 }}
      transition={busy ? { duration: 2.4, ease: 'linear', repeat: Infinity } : { duration: 0.6 }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x="11" y={i % 2 ? 3.5 : 2} width="2" height={i % 2 ? 8.5 : 10} rx="1" fill="currentColor" transform={`rotate(${i * 36} 12 12)`} />
      ))}
    </motion.svg>
  );
}

const pop = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } };

function AgentConsole({ state }: { state: AgentState }) {
  const { typed, sent, tools, done, reply } = state;
  const thinking = sent && tools === 0;
  const busy = sent && !reply;
  const draft = PROMPT.slice(0, typed);
  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-[16px] border border-white/[0.08] bg-[#262624] p-3 text-left text-[#faf9f5] lg:min-h-0">
      <div className="mb-3 flex items-center gap-2 px-1 text-[13px]">
        <AgentGlyph className="size-4" />
        <span className="font-serif text-[15px] tracking-normal">Assistant</span>
        <span className="ml-auto rounded-[6px] px-1.5 py-0.5 text-[11px] text-[#a6a39b] ring-1 ring-white/10">Planification</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-1" aria-live="polite">
        <AnimatePresence initial={false}>
          {sent && (
            <motion.p
              key="user"
              {...pop}
              className="max-w-[88%] self-end rounded-[14px] bg-[#141413] px-3 py-2 text-[13px] leading-snug text-[#faf9f5]"
            >
              {PROMPT}
            </motion.p>
          )}
          {sent && (
            <motion.div key="agent" {...pop} className="flex flex-col gap-2">
              {thinking && (
                <span className="flex items-center gap-2 text-[12.5px]">
                  <AgentGlyph busy className="size-3.5" />
                  <span className="animate-pl-shimmer bg-[linear-gradient(90deg,#a6a39b_35%,#faf9f5_50%,#a6a39b_65%)] bg-[length:200%_100%] bg-clip-text text-transparent">
                    Réflexion…
                  </span>
                </span>
              )}
              {tools > 0 && (
                <ul className="space-y-1">
                  {POSTS.slice(0, tools).map((p, i) => (
                    <motion.li
                      key={p.slot}
                      {...pop}
                      className="flex items-center gap-2 rounded-[8px] border border-white/[0.06] bg-[#30302e] px-2 py-1.5 text-[11.5px] text-[#c2c0b6]"
                    >
                      <CalendarClock className="size-3.5 text-[#a6a39b]" aria-hidden />
                      <span className="flex-1 truncate">
                        Planifier <span className="text-[#faf9f5]">{p.day}</span> · <span className="font-pl-mono">{p.time}</span>
                      </span>
                      {i < done ? (
                        <Check className="size-3.5 text-pl-success-dot" aria-hidden />
                      ) : (
                        <span className="size-3 animate-spin rounded-full border-[1.5px] border-[#a6a39b]/40 border-t-[#faf9f5]" />
                      )}
                    </motion.li>
                  ))}
                </ul>
              )}
              {reply && (
                <motion.p
                  variants={stagger(0.035)}
                  initial="hidden"
                  animate="show"
                  className="font-serif text-[14px] leading-relaxed tracking-normal text-[#faf9f5]"
                >
                  {'C’est fait : 3 publications planifiées cette semaine, aux heures où votre audience est la plus active.'
                    .split(' ')
                    .map((w, i) => (
                      <motion.span key={i} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
                        {w}{' '}
                      </motion.span>
                    ))}
                </motion.p>
              )}
              {!busy && (
                <motion.span {...pop}>
                  <AgentGlyph className="size-4" />
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zone de saisie : le message s'écrit ici, puis part dans la conversation. */}
      <div className="mt-3 rounded-[14px] border border-white/10 bg-[#30302e] p-2.5 shadow-[0_6px_20px_-10px_rgb(0_0_0/0.6)]">
        <p className="min-h-[2.6em] px-1 text-[13px] leading-snug">
          {typed > 0 ? (
            <>
              {draft}
              <span className="ml-px inline-block h-[1.05em] w-px translate-y-[0.15em] animate-pl-caret bg-[#faf9f5]" />
            </>
          ) : (
            <span className="text-[#8f8d86]">Répondre à l’assistant…</span>
          )}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="grid size-7 place-items-center rounded-[8px] text-[#a6a39b] ring-1 ring-white/10">
            <Plus className="size-3.5" aria-hidden />
          </span>
          <span className="grid size-7 place-items-center rounded-[8px] text-[#a6a39b] ring-1 ring-white/10">
            <SlidersHorizontal className="size-3.5" aria-hidden />
          </span>
          <motion.span
            className="ml-auto grid size-7 place-items-center rounded-[8px] bg-(--pl-agent-1) text-white"
            animate={{ opacity: typed > 0 ? 1 : 0.45, scale: typed === PROMPT.length ? [1, 0.86, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowUp className="size-4" aria-hidden />
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function PostPhone() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[16px] border border-white/[0.08] bg-[#0f0f12] px-4 py-5">
      <PhoneMockup width={196} screen="dark" placeholder={1} />
      <div className="flex gap-7 text-center text-white">
        {['vues', 'j’aime', 'partages'].map((k) => (
          <span key={k} className="text-[11px] text-white/50">
            <span className="block font-pl-mono text-base font-semibold text-white">0</span>
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Vignette vidéo d'une case du calendrier : surgit quand l'assistant la planifie. Toujours au format 9:16, la plus
 * grande possible dans la case (équivalent d'un object-fit: contain, via les unités de conteneur).
 */
function CalendarThumb({ slot }: { slot: number }) {
  return (
    <span className="absolute inset-x-[3px] top-px bottom-[3px] grid place-items-center [container-type:size]">
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className="block aspect-[9/16] overflow-hidden rounded-[5px]"
        style={{ width: 'min(100cqw, 100cqh * 9 / 16)' }}
      >
        <ShortVideoTile index={slot} photo={(slot * 29) % SHORT_VIDEO_COUNT} />
      </motion.span>
    </span>
  );
}

function TabAutomate() {
  const agent = useAgentScript();
  const scheduled = POSTS.slice(0, agent.done);
  const slots = { ...PLANNED, ...Object.fromEntries(scheduled.map((p) => [p.slot, p.time])) };
  return (
    <div className="flex flex-col items-center gap-6">
      <PillBadge variant="solid" size="sm" italic>
        Nouveau
      </PillBadge>
      <Heading>Publiez automatiquement, sans y penser</Heading>
      <PrimaryButton variant="white" arrow={false} size="md" addon={<ArrowRight className="size-4" aria-hidden />}>
        Essayer maintenant
      </PrimaryButton>
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="mt-4 grid w-full max-w-[960px] gap-3 sm:gap-4 lg:grid-cols-[1.05fr_1.15fr_0.95fr]"
      >
        <motion.div variants={cardIn}>
          <AgentConsole state={agent} />
        </motion.div>
        <motion.div variants={cardIn}>
          <CalendarCard
            fill
            weeks={5}
            startDay={-5}
            slots={slots}
            highlight={scheduled.at(-1)?.slot ?? -1}
            renderSlot={(i) => <CalendarThumb slot={i} />}
            className="h-full"
          />
        </motion.div>
        <motion.div variants={cardIn} className="max-lg:hidden">
          <PostPhone />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- Écrans ---------- */

function PhoneRow({ reverse = false, offset = 0, width }: { reverse?: boolean; offset?: number; width: number }) {
  const phones = Array.from({ length: 8 }, (_, i) => (
    <PhoneMockup key={i} width={width} screen={i % 3 === 1 ? 'light' : 'dark'} placeholder={i + offset} />
  ));
  return (
    <div className="flex w-max gap-4" data-pl-loop style={{ animation: `pl-marquee 90s linear infinite${reverse ? ' reverse' : ''}` }}>
      {phones}
      {phones.map((p, i) => (
        <div key={`b${i}`} aria-hidden>
          {p}
        </div>
      ))}
    </div>
  );
}

/** Pastille « contenu réservé » posée au-dessus des accroches de fin d'onglet (Écrans, Captures). */
function LockedPill() {
  return (
    <span className="pl-chip-dark inline-flex h-10 items-center gap-2 rounded-pl-pill px-4 text-[15px] font-medium text-white">
      <Lock className="size-3.5 text-white/80" aria-hidden />
      La suite vous attend
    </span>
  );
}

function TabScreens() {
  const wide = useWide();
  const w = wide ? 200 : 150;
  return (
    <div className="flex flex-col items-center gap-10">
      <Heading>Transformez votre app en app premium</Heading>
      <div className="relative -mx-4 w-[calc(100%+2rem)] space-y-4 overflow-hidden [mask-composite:intersect] [mask-image:linear-gradient(180deg,#000_55%,transparent),linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] sm:-mx-12 sm:w-[calc(100%+6rem)]">
        <PhoneRow width={w} />
        <PhoneRow width={w} reverse offset={3} />
        {/* Rangée du bas « verrouillée » : flou progressif + assombrissement, la suite est réservée aux membres. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] backdrop-blur-[5px] [mask-image:linear-gradient(180deg,transparent,#000_45%)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(180deg,transparent,rgb(0_0_0/0.62)_30%,rgb(0_0_0/0.9)_68%,#000)]" />
      </div>
      {/* Accroche posée sur la rangée floutée. */}
      <div className="relative z-10 -mt-[200px] flex flex-col items-center text-center sm:-mt-[300px]">
        <LockedPill />
        <h3 className="mt-8 text-[38px] leading-[1.04] font-semibold tracking-[-0.045em] text-white sm:mt-10 sm:text-[64px]">
          +100 designs
          <br />à intégrer à{' '}
          <span className="bg-[linear-gradient(90deg,#b9dcff,var(--pl-accent-sky)_45%,#5aa9ff)] bg-clip-text text-transparent">vos apps</span>
        </h3>
        <GlowButton className="mt-8 sm:mt-10">Commencer gratuitement</GlowButton>
      </div>
    </div>
  );
}

/* ---------- Formats ---------- */

function TabFormats() {
  const wide = useWide();
  // Filtres de la sphère : format et réseau (« tous » = pas de filtre).
  const [format, setFormat] = useState('tous');
  const [network, setNetwork] = useState('tous');
  const match = useCallback(
    (_: number, photo: number) => {
      const m = shortVideoMeta(photo);
      return (
        (format === 'tous' || (format === 'videos' ? m.format === 'video' : m.format === 'carousel')) &&
        (network === 'tous' || m.network === (network === 'reseau-a' ? 'a' : 'b'))
      );
    },
    [format, network],
  );
  return (
    <div className="flex flex-col items-center">
      <Heading>Trouvez les formats qui marchent pour votre app</Heading>
      <SearchBar className="mt-6" />
      {/* Cadre qui rogne la sphère une fois zoomée, fondu en haut et en bas (elle passe « sous » la recherche). */}
      <div
        className="relative -mx-4 my-4 flex w-[calc(100%+2rem)] items-center justify-center overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_9%,#000_86%,transparent)] sm:mx-0 sm:my-6 sm:w-full"
        style={{ height: Math.round((wide ? 420 : 290) * 1.18) }}
      >
        <MediaSphere
          selectable
          zoom={wide ? 1.5 : 1.3}
          size={wide ? 420 : 290}
          bands={11}
          tileAspect={9 / 16}
          variety={SHORT_VIDEO_COUNT}
          match={match}
          renderTile={(i, photo) => <ShortVideoTile index={i} photo={photo} />}
        />
      </div>
      <div className="grid w-full max-w-[620px] gap-2">
        <SegmentedTabs
          variant="ios"
          value={format}
          onChange={(id) => setFormat(id)}
          tabs={[
            { id: 'tous', label: 'Les deux' },
            { id: 'carrousels', label: 'Carrousels' },
            { id: 'videos', label: 'Vidéos' },
          ]}
        />
        <SegmentedTabs
          variant="ios"
          value={network}
          onChange={(id) => setNetwork(id)}
          tabs={[
            { id: 'tous', label: 'Les deux' },
            { id: 'reseau-a', label: 'Réseau A' },
            { id: 'reseau-b', label: 'Réseau B' },
          ]}
        />
      </div>
      <GlowButton className="mt-6">Commencer gratuitement</GlowButton>
    </div>
  );
}

/* ---------- Captures ---------- */

const FILTERS = [
  ['Tout', 48],
  ['Productivité', 12],
  ['Santé', 9],
  ['Finances', 7],
  ['IA', 11],
  ['Photo', 9],
] as const;

/** Deux apps exemples : la 1re ligne est entièrement visible, la 2e passe sous l'accroche (« la suite »). */
const STORE_APPS = [
  {
    name: 'Application exemple',
    category: 'Productivité',
    rating: '4,7 · 12 k avis',
    icon: 'radial-gradient(circle at 50% 40%, #3a3d48, #121318)',
    tints: ['#b9c6e6', '#cbb8dd', '#a9cfd6', '#c7d3b8', '#d8c3b0'],
    cards: ['Gagnez 1 h par jour.', 'Bloquez les distractions.', 'Dormez mieux, plus vite.', 'Suivez vos progrès.', 'Un geste, c’est fait.'],
  },
  {
    name: 'Studio photo IA',
    category: 'Photo et vidéo',
    rating: '4,5 · 3 k avis',
    icon: 'radial-gradient(circle at 50% 40%, #2f4f8f, #0d1426)',
    tints: ['#9fb6e8', '#e2b7a6', '#b3a6e0', '#9fd0c2', '#e6cf9f'],
    cards: ['Vos photos, en mieux.', 'Retouche en 1 clic.', 'Fonds générés par IA.', 'Prêt à publier.', 'Exportez en 4K.'],
  },
];

function StoreCard({ title, index, tint, showTitle = true }: { title: string; index: number; tint: string; showTitle?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-[260px] w-[150px] shrink-0 snap-start flex-col items-center overflow-hidden rounded-[14px] px-2 sm:h-[300px] sm:w-[170px]',
        showTitle ? 'pt-3' : 'pt-5',
      )}
      style={{ background: `linear-gradient(180deg, ${tint}, #2b2f3a)` }}
    >
      {showTitle && <p className="mb-3 text-center text-[13px] leading-tight font-semibold text-[#14161d]">{title}</p>}
      <PhoneMockup width={118} screen="dark" placeholder={index} />
    </div>
  );
}

/**
 * Une ligne « fiche store » : infos de l'app à gauche (bureau) + ses captures. `titles={false}` pour une ligne
 * d'arrière-plan (sous une accroche) : sans les accroches des captures, qui se mêleraient au texte posé dessus.
 */
function StoreRow({
  app,
  offset = 0,
  scroll = false,
  titles = true,
}: {
  app: (typeof STORE_APPS)[number];
  offset?: number;
  scroll?: boolean;
  titles?: boolean;
}) {
  return (
    <div className={cn('flex gap-4', scroll ? 'snap-x overflow-x-auto [scrollbar-width:none]' : 'overflow-hidden')}>
      <div className="relative z-10 hidden w-[200px] shrink-0 flex-col gap-2 text-left text-white lg:flex">
        <span className="size-12 rounded-[12px] border border-white/15" style={{ background: app.icon }} />
        <p className="text-[15px] font-semibold">{app.name}</p>
        <span className="w-fit rounded-[6px] bg-white/10 px-2 py-0.5 text-[11px] text-white/80">{app.category}</span>
        <span className="flex items-center gap-1 text-[12px] text-white/50">
          <Star className="size-3 fill-white/50" aria-hidden /> {app.rating}
        </span>
        <AccentButton size="sm" className="mt-2 w-fit" iconRight={<ArrowRight />}>
          Ouvrir dans l’éditeur
        </AccentButton>
      </div>
      {app.cards.map((t, i) => (
        <StoreCard key={t} title={t} index={i + offset} tint={app.tints[i % app.tints.length]} showTitle={titles} />
      ))}
    </div>
  );
}

function TabCaptures() {
  const [filter, setFilter] = useState('Tout');
  return (
    <div className="flex flex-col items-center gap-6">
      <Heading icon={<Store />} iconAt={4}>
        Créez des captures store qui convertissent.
      </Heading>
      {/* pl-light : barre blanche dans un bloc .pl-dark, les rôles de texte reviennent au clair (libellés lisibles). */}
      <div className="pl-light flex max-w-full gap-1 overflow-x-auto rounded-[12px] bg-white p-1 [scrollbar-width:none]">
        {FILTERS.map(([label, count]) => (
          <button
            key={label}
            type="button"
            aria-pressed={filter === label}
            onClick={() => setFilter(label)}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[13px] transition-colors',
              filter === label ? 'bg-[#ececf1] font-semibold text-pl-ink' : 'text-pl-fg-2 hover:text-pl-ink',
            )}
          >
            {label}
            <span className="text-[11px] text-pl-fg-3">{count}</span>
          </button>
        ))}
      </div>
      <div className="relative w-full">
        {/* 1re ligne entièrement visible (défilable sur mobile pour voir les 5 captures). */}
        <StoreRow app={STORE_APPS[0]} scroll />
        {/* 2e ligne : à moitié cachée par l'accroche, floutée et assombrie vers le bas. */}
        {/* Fondu par masque (et non par un calque noir) : la ligne s'efface dans le vrai fond, trame de points
            comprise, sans bord visible ni flou boueux. */}
        <div
          aria-hidden
          className="pointer-events-none relative mt-6 h-[230px] overflow-hidden opacity-50 [mask-image:linear-gradient(180deg,#000,rgb(0_0_0/0.55)_40%,transparent_92%)] sm:h-[260px]"
        >
          <StoreRow app={STORE_APPS[1]} offset={5} titles={false} />
        </div>
        {/* Accroche : la pastille chevauche le bas de la 1re ligne, le texte recouvre la 2e. */}
        <div className="absolute inset-x-0 top-[236px] z-30 isolate flex flex-col items-center text-center sm:top-[276px]">
          {/* Halo sombre aux bords doux derrière le titre : lisibilité sur la 2e ligne, sans rectangle visible. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[52%] left-1/2 -z-10 h-[300px] w-[min(820px,110%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(0_0_0/0.8),rgb(0_0_0/0.45)_60%,transparent)]"
          />
          <LockedPill />
          <p className="mt-5 text-[30px] leading-[1.05] font-semibold tracking-[-0.035em] text-white sm:text-[46px]">
            +48 fiches store
            <br />
            <span className="pl-text-gradient">à adapter à votre app</span>
          </p>
          <GlowButton className="mt-6">Commencer gratuitement</GlowButton>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section ---------- */

export interface DarkShowcaseProps {
  defaultTab?: ShowcaseTab;
  /**
   * Temps d'affichage de chaque onglet avant le suivant (ms), 0 pour désactiver. Le trait de l'onglet actif sert de
   * barre de progression. Pause au survol de la barre d'onglets, au focus clavier et hors écran ; un clic relance la
   * durée sur l'onglet choisi. Survoler le contenu le met en pause ; y cliquer, taper ou défiler horizontalement
   * l'arrête définitivement. Désactivé sous prefers-reduced-motion.
   */
  autoplay?: number;
  className?: string;
}

export function DarkShowcase({ defaultTab = 'formats', autoplay = 7000, className }: DarkShowcaseProps) {
  const [tab, setTab] = useState<string>(defaultTab);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  /** L'utilisateur a agi dans un onglet : il garde la main, le défilement s'arrête définitivement. */
  const [stopped, setStopped] = useState(false);
  const stop = () => setStopped(true);
  const sectionRef = useRef<HTMLElement>(null);
  const stage = useActiveHeight();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !autoplay) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  const next = () => {
    const i = TABS.findIndex((t) => t.id === tab);
    setDir(1);
    setTab(TABS[(i + 1) % TABS.length].id);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="fonctionnalités"
        ref={sectionRef}
        className={cn('pl-root w-full bg-pl-page', className)}
        onFocus={(e) => setFocused(e.target.matches(':focus-visible'))}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
      >
        <div onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)} onPointerLeave={() => setHovered(false)}>
          <SegmentedTabs
            variant="bar"
            tabs={TABS}
            value={tab}
            panelId="pl-showcase"
            progress={(!stopped && autoplay) || undefined}
            progressPaused={!visible || hovered || focused}
            onProgressEnd={next}
            onChange={(id, d) => {
              setDir(d);
              setTab(id);
            }}
          />
        </div>
        <div
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onPointerDownCapture={stop}
          onKeyDownCapture={stop}
          onWheelCapture={(e) => e.deltaX !== 0 && stop()}
          className="pl-dark relative isolate overflow-hidden rounded-[28px] bg-pl-ink-dark sm:rounded-none sm:rounded-t-pl-xl">
          <DotGridBackground
            tone="dark"
            clearCenter={0}
            halo={false}
            spacing={12}
            className="-z-10 [mask-image:linear-gradient(90deg,transparent_45%,#000_90%)]"
          />
          <div
            aria-hidden
            className="absolute top-0 left-1/2 -z-10 h-64 w-2/3 -translate-x-1/2 rounded-full bg-pl-accent/15 blur-[100px]"
          />
          <div id={`pl-showcase-${tab}`} role="tabpanel" className="relative mx-auto max-w-[1344px] px-4 py-10 sm:px-12 sm:py-16">
            <motion.div className="relative" initial={false} animate={{ height: stage.height ?? 'auto' }} transition={slide}>
              <AnimatePresence custom={dir} mode="popLayout" initial={false}>
                <motion.div ref={stage.measure} key={tab} custom={dir} variants={swipeIn} initial="enter" animate="center" exit="exit">
                  {tab === 'automatiser' ? (
                    <TabAutomate />
                  ) : tab === 'ecrans' ? (
                    <TabScreens />
                  ) : tab === 'captures' ? (
                    <TabCaptures />
                  ) : (
                    <TabFormats />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default DarkShowcase;
