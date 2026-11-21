/**
 * Section « Comment ça marche » (clair) : pastille blanche gravée, H2 deux tons, 3 grandes cartes d'étape en verre
 * clair à halo bleu (empilées sur mobile, en colonnes dès 1024 px, quasi pleine largeur sur bureau) avec un visuel
 * haut de 290 px — téléphones sur fond bleu nuit, sphère de vignettes, calendrier sur fond bleu pâle —, puis un CTA
 * central pill noir (le seul de la section).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MotionConfig, motion, useInView, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/atlas/process-like/section-heading/section-heading';
import { StepCard } from '@/components/atlas/process-like/step-card/step-card';
import { PrimaryButton } from '@/components/atlas/process-like/primary-button/primary-button';
import { FinanceDemo, HabitsDemo, PhoneDemo, WorkoutDemo } from '@/components/atlas/process-like/steps/app-demos';
import { MediaSphere } from '@/components/atlas/process-like/media-sphere/media-sphere';
import { SHORT_VIDEO_COUNT, ShortVideoTile } from '@/components/atlas/process-like/media-sphere/short-video-tile';
import { CalendarCard } from '@/components/atlas/process-like/calendar-card/calendar-card';

export interface Step {
  name: string;
  title: string;
  description?: ReactNode;
  visual?: ReactNode;
}

export interface StepsProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  steps?: Step[];
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

/**
 * Plan quadrillé en perspective qui défile vers le spectateur (sol en bas, plafond en haut = le même retourné).
 * Cases de 44 px = le pas de l'animation `pl-grid-scroll` : la boucle est sans saut. Figé en mouvement réduit.
 */
function GridPlane({ side }: { side: 'floor' | 'ceiling' }) {
  const floor = side === 'floor';
  const fade = `linear-gradient(${floor ? 'to top' : 'to bottom'}, #000 25%, transparent)`;
  return (
    <div
      aria-hidden
      data-pl-loop
      className={cn('absolute inset-x-[-25%] h-1/2 opacity-70', floor ? 'bottom-0' : 'top-0')}
      style={{
        backgroundImage:
          'linear-gradient(rgb(130 168 255 / 0.45) 1px, transparent 1px), linear-gradient(90deg, rgb(130 168 255 / 0.45) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        // Même abscisse que la fin de l'animation (0 44px) : seul le défilement vertical bouge.
        backgroundPosition: '0 0',
        // Sol : les lignes descendent vers nous ; plafond : elles montent vers nous (même animation, à l'envers).
        animation: `pl-grid-scroll 2.4s linear infinite${floor ? '' : ' reverse'}`,
        transform: `perspective(300px) rotateX(${floor ? 55 : -55}deg)`,
        transformOrigin: floor ? 'bottom' : 'top',
        maskImage: fade,
        WebkitMaskImage: fade,
      }}
    />
  );
}

/** Trois écrans d'app de face sur fond bleu nuit, chacun jouant une démo animée en boucle ; couloir quadrillé qui défile. */
function PhonesVisual() {
  const w = useWide() ? 122 : 104;
  return (
    <div className="relative flex h-full items-center justify-center gap-3 overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#1d3a8a,#0a1638_60%,#060b1f)] sm:gap-4">
      <GridPlane side="ceiling" />
      <GridPlane side="floor" />
      {/* Lueur d'horizon derrière les téléphones. */}
      <div aria-hidden className="absolute inset-x-[18%] top-[48%] h-16 rounded-full bg-pl-accent/25 blur-3xl" />
      <PhoneDemo width={w}>
        <HabitsDemo />
      </PhoneDemo>
      <PhoneDemo width={w} glow>
        <FinanceDemo />
      </PhoneDemo>
      <PhoneDemo width={w}>
        <WorkoutDemo />
      </PhoneDemo>
    </div>
  );
}

/** Sphère de vignettes cadrée en gros plan : la sélection (rotation + zoom + 4 vidéos en avant) se rejoue en boucle. */
function SphereVisual() {
  const wide = useWide();
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-[#0d0e12]">
      <MediaSphere
        auto
        size={wide ? 380 : 320}
        zoom={1.4}
        speed={60}
        bands={11}
        tileAspect={9 / 16}
        variety={SHORT_VIDEO_COUNT}
        renderTile={(i, photo) => <ShortVideoTile index={i} photo={photo} />}
      />
    </div>
  );
}

/** Publications planifiées automatiquement, dans l'ordre d'apparition (case 0 = lundi 3). */
const AUTO_POSTS = [
  { slot: 1, time: '18:00' },
  { slot: 3, time: '12:30' },
  { slot: 6, time: '19:00' },
  { slot: 8, time: '21:00' },
  { slot: 11, time: '18:30' },
  { slot: 13, time: '12:00' },
  { slot: 15, time: '20:00' },
  { slot: 18, time: '19:30' },
];

/** Calendrier blanc sur fond bleu pâle : les publications s'ajoutent toutes seules, vignette pleine case, en boucle. */
function CalendarVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.3 });
  // 0 → 8 publications ajoutées une à une, 4 crans de tenue, puis on repart à zéro.
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced || !inView) return;
    const id = window.setInterval(() => setN((k) => (k >= AUTO_POSTS.length + 4 ? 0 : k + 1)), 650);
    return () => clearInterval(id);
  }, [reduced, inView]);
  const shown = AUTO_POSTS.slice(0, reduced ? AUTO_POSTS.length : Math.min(n, AUTO_POSTS.length));
  const last = shown.at(-1);
  return (
    <div ref={ref} className="flex h-full flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#e6ecff,#d4ddfb)] p-4">
      <CalendarCard
        compact
        coverSlots
        title="Planning"
        month="Novembre"
        startDay={3}
        slots={Object.fromEntries(shown.map((p) => [p.slot, p.time]))}
        highlight={last?.slot ?? -1}
        renderSlot={(i) => (
          <motion.span
            className="block h-full w-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          >
            <ShortVideoTile bare index={i} photo={(i * 37 + 11) % SHORT_VIDEO_COUNT} />
          </motion.span>
        )}
        className="max-w-[340px]"
      />
      {/* Confirmation qui « re-claque » à chaque nouvelle publication. */}
      <motion.span
        key={shown.length}
        initial={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className="flex items-center gap-2 rounded-pl-pill bg-white px-3.5 py-2 text-[13px] font-semibold text-pl-ink shadow-[0_6px_18px_-8px_rgb(20_24_40/0.35)]"
      >
        <span className="tabular-nums">{shown.length}</span> publication{shown.length > 1 ? 's' : ''} planifiée{shown.length > 1 ? 's' : ''}
        <span className="grid size-4 place-items-center rounded-full bg-pl-success-dot text-white">
          <Check className="size-3" strokeWidth={3.5} aria-hidden />
        </span>
      </motion.span>
    </div>
  );
}

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

const DEFAULT_STEPS: Step[] = [
  { name: 'Écrans', title: 'Rendez votre app premium et pensée pour convertir.', visual: <PhonesVisual /> },
  { name: 'Formats', title: 'Repérez les formats qui marchent pour votre app.', visual: <SphereVisual /> },
  { name: 'Planning', title: 'Publiez automatiquement, au bon moment.', visual: <CalendarVisual /> },
];

export function Steps({
  badge = 'Comment ça marche',
  title = 'Prêt à construire',
  subtitle = 'une app qui décolle ?',
  steps = DEFAULT_STEPS,
  ctaLabel = 'Commencer gratuitement',
  onCta,
  className,
}: StepsProps) {
  // Visuels agrandis (290 → 420 px sur bureau) pour laisser respirer téléphones, sphère et calendrier.
  const visualHeight = useWide() ? 420 : 360;
  return (
    <MotionConfig reducedMotion="user">
      <section id="comment-ça-marche" className={cn('pl-root w-full bg-pl-page px-3 py-[72px] sm:px-[17px] sm:py-32', className)}>
        <SectionHeading badge={badge} title={title} subtitle={subtitle} />
        <div className="mx-auto mt-10 grid max-w-[1406px] gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-3">
          {steps.map((s, i) => (
            <StepCard
              key={s.name}
              step={i + 1}
              stepName={s.name}
              title={s.title}
              description={s.description}
              visual={s.visual}
              visualHeight={visualHeight}
            />
          ))}
        </div>
        <div className="mt-10 flex justify-center sm:mt-14">
          <PrimaryButton size="lg" arrow={false} onClick={onCta}>
            {ctaLabel}
          </PrimaryButton>
        </div>
      </section>
    </MotionConfig>
  );
}

export default Steps;
