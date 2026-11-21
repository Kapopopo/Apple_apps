/**
 * Écrans de démo d'app animés en boucle, à glisser dans un PhoneMockup (comme une vidéo de démo) :
 *  - HabitsDemo (clair) : tâches du jour qui se cochent une à une sous un « doigt », anneau de progression ;
 *  - FinanceDemo (sombre) : solde qui défile, courbe qui se trace, opérations qui arrivent ;
 *  - WorkoutDemo (sombre) : chrono de séance, rythme cardiaque, égaliseur d'effort.
 * Dessinés sur une base de 186 px de large (comme les placeholders), réduits d'un bloc par `PhoneDemo`.
 * En pause hors écran ; état final figé sous prefers-reduced-motion.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { Check, Dumbbell, Heart, Moon, Pause, BookOpen, Droplets, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PhoneMockup } from '@/components/atlas/process-like/phone-mockup/phone-mockup';

/** Compteur qui avance d'un cran toutes les `ms` (0 → steps-1, puis recommence) tant que l'écran est visible. */
function useTicker(ms: number, steps: number, ref: React.RefObject<Element | null>) {
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2 });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced || !inView) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % steps), ms);
    return () => clearInterval(id);
  }, [reduced, inView, ms, steps]);
  return reduced ? steps - 1 : tick;
}

/** Téléphone de face dont l'écran est un composant de démo (base 186 px, mis à l'échelle). */
export function PhoneDemo({ width, children, glow }: { width: number; children: ReactNode; glow?: boolean }) {
  const height = Math.round(width * 2.07);
  const pad = Math.max(6, Math.round(width * 0.035));
  const scale = (width - 2 * pad) / 186;
  return (
    <PhoneMockup width={width} glow={glow} className="relative">
      <div style={{ width: 186, height: (height - 2 * pad) / scale, transform: `scale(${scale})`, transformOrigin: '0 0' }}>{children}</div>
    </PhoneMockup>
  );
}

/* ---------- Habitudes ---------- */

const HABITS = [
  { label: 'Sport 20 min', icon: Dumbbell, color: '#2f5bff' },
  { label: 'Lecture', icon: BookOpen, color: '#d97757' },
  { label: 'Eau 2 L', icon: Droplets, color: '#0ea5e9' },
  { label: 'Coucher 23 h', icon: Moon, color: '#8b5cf6' },
];

export function HabitsDemo() {
  const ref = useRef<HTMLDivElement>(null);
  // 0 : vide · 1-4 : tâches cochées une à une · 5-7 : tenue · puis on recommence.
  const tick = useTicker(800, 8, ref);
  const done = Math.min(tick, HABITS.length);
  const pct = done / HABITS.length;
  const C = 2 * Math.PI * 34;
  return (
    <div ref={ref} className="flex h-full flex-col bg-[#f6f7fb] px-3.5 pt-10 text-[#0d0f14]">
      <p className="text-[11px] font-medium text-[#8a8f9c]">Mardi 18 novembre</p>
      <p className="text-[19px] leading-tight font-bold tracking-[-0.03em]">Aujourd’hui</p>
      <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-white p-3 shadow-[0_4px_14px_-6px_rgb(20_24_40/0.18)]">
        <svg viewBox="0 0 80 80" className="size-[58px] shrink-0 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e9f0" strokeWidth="8" />
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#2f5bff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="whitespace-nowrap">
          <p className="text-[22px] leading-none font-bold tracking-[-0.04em] tabular-nums">{Math.round(pct * 100)} %</p>
          <p className="mt-1 text-[11px] text-[#8a8f9c]">
            {done}/{HABITS.length} habitudes
          </p>
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {HABITS.map((h, i) => {
          const ok = i < done;
          const tapping = i === done - 1 && tick <= HABITS.length;
          const Icon = h.icon;
          return (
            <div key={h.label} className="relative flex items-center gap-2 rounded-[14px] bg-white p-2 shadow-[0_2px_8px_-4px_rgb(20_24_40/0.15)]">
              <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={{ background: `${h.color}1f`, color: h.color }}>
                <Icon className="size-3.5" strokeWidth={2.4} />
              </span>
              <span className={`flex-1 truncate text-[12px] font-semibold transition-colors ${ok ? 'text-[#a0a5b1] line-through' : ''}`}>{h.label}</span>
              <motion.span
                className="grid size-6 shrink-0 place-items-center rounded-full border-2"
                animate={{ backgroundColor: ok ? '#22c55e' : '#ffffff', borderColor: ok ? '#22c55e' : '#d5d8e1', scale: tapping ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.35 }}
              >
                {ok && <Check className="size-3.5 text-white" strokeWidth={3.5} />}
              </motion.span>
              {/* Doigt qui tape la case. */}
              <AnimatePresence>
                {tapping && (
                  <motion.span
                    key={tick}
                    className="absolute top-1/2 right-1 size-9 -translate-y-1/2 rounded-full bg-[#0d0f14]/20"
                    initial={{ opacity: 0.9, scale: 0.4 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <div className="mt-auto mb-3.5 flex h-10 items-center justify-center rounded-full bg-[#0d0f14] text-[12px] font-semibold whitespace-nowrap text-white">
        + Nouvelle habitude
      </div>
    </div>
  );
}

/* ---------- Finances ---------- */

const TX = [
  { label: 'Salaire', amount: '+2 400 €', in: true },
  { label: 'Courses', amount: '−86 €', in: false },
  { label: 'Musique', amount: '−11 €', in: false },
];
const BALANCES = ['1 240,00', '1 412,50', '1 655,20', '2 060,80', '2 480,30', '2 480,30', '2 480,30'];

export function FinanceDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useTicker(900, 7, ref);
  return (
    <div ref={ref} className="flex h-full flex-col bg-[#0b0b10] px-3.5 pt-10 text-white">
      <p className="text-[11px] text-white/50">Solde total</p>
      <p className="text-[26px] leading-tight font-bold tracking-[-0.04em] tabular-nums">
        {BALANCES[tick]} <span className="text-[16px] text-white/60">€</span>
      </p>
      <span className="mt-1 w-fit rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">+12,4 % ce mois</span>
      <div className="mt-3 rounded-[16px] bg-white/[0.05] p-2">
        <svg viewBox="0 0 160 70" className="h-[70px] w-full overflow-visible">
          <defs>
            <linearGradient id="fin-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2f5bff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#2f5bff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Cran 0 : remise à zéro instantanée ; ensuite la courbe se trace puis l'aire apparaît. */}
          <motion.path
            d="M0 58 C18 54 24 40 40 44 S66 30 80 34 S104 14 120 20 S146 6 160 8 L160 70 L0 70Z"
            fill="url(#fin-fill)"
            initial={false}
            animate={{ opacity: tick === 0 ? 0 : 1 }}
            transition={tick === 0 ? { duration: 0 } : { duration: 1.4, delay: 0.8 }}
          />
          <motion.path
            d="M0 58 C18 54 24 40 40 44 S66 30 80 34 S104 14 120 20 S146 6 160 8"
            fill="none"
            stroke="#5b82ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: tick === 0 ? 0 : 1 }}
            transition={tick === 0 ? { duration: 0 } : { duration: 2.4, ease: 'easeInOut' }}
          />
        </svg>
        <div className="flex justify-between px-1 text-[9px] text-white/35">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
      </div>
      <p className="mt-3 mb-1.5 text-[11px] font-semibold text-white/70">Dernières opérations</p>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {TX.slice(0, Math.min(3, Math.max(1, tick))).map((t) => (
            <motion.div
              key={t.label}
              layout
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 rounded-[12px] bg-white/[0.06] p-2"
            >
              <span className={`grid size-7 place-items-center rounded-full ${t.in ? 'bg-[#22c55e]/20 text-[#4ade80]' : 'bg-white/10 text-white/70'}`}>
                {t.in ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
              </span>
              <span className="flex-1 truncate text-[12px] font-medium">{t.label}</span>
              <span className={`text-[12px] font-semibold whitespace-nowrap tabular-nums ${t.in ? 'text-[#4ade80]' : 'text-white/80'}`}>{t.amount}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-auto mb-3.5 flex justify-around rounded-full bg-white/[0.06] py-2.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="size-3 rounded-full" style={{ background: i === 1 ? '#5b82ff' : 'rgb(255 255 255 / 0.25)' }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Fitness ---------- */

export function WorkoutDemo() {
  const ref = useRef<HTMLDivElement>(null);
  // 1 cran = 1 s de séance ; boucle de 20 s.
  const tick = useTicker(1000, 20, ref);
  const total = 20;
  const left = total - tick;
  const C = 2 * Math.PI * 52;
  const bpm = [128, 134, 139, 142, 147, 151, 149, 152, 156, 158][tick % 10];
  return (
    <div ref={ref} className="flex h-full flex-col items-center bg-[radial-gradient(120%_70%_at_50%_0%,#3b1d12,#0b0b10_60%)] px-3.5 pt-10 text-white">
      <p className="self-start text-[11px] text-white/55">Séance HIIT · série 3/5</p>
      <p className="self-start text-[19px] leading-tight font-bold tracking-[-0.03em]">Burpees</p>
      <div className="relative mt-4 grid size-[132px] place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="9" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#ff7a45"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - left / total) }}
            transition={{ duration: tick === 0 ? 0.4 : 1, ease: 'linear' }}
          />
        </svg>
        <div className="text-center">
          <p className="text-[34px] leading-none font-bold tracking-[-0.04em] tabular-nums">0:{String(left).padStart(2, '0')}</p>
          <p className="mt-1 text-[10px] text-white/50">restantes</p>
        </div>
      </div>
      <div className="mt-4 flex w-full items-center gap-2 rounded-[14px] bg-white/[0.07] p-2.5">
        <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 0.15 }}>
          <Heart className="size-4 fill-[#ff4d6d] text-[#ff4d6d]" />
        </motion.span>
        <span className="text-[16px] font-bold tabular-nums">{bpm}</span>
        <span className="text-[10px] text-white/50">bpm</span>
        <div className="ml-auto flex h-6 items-end gap-[3px]">
          {Array.from({ length: 9 }, (_, i) => (
            <motion.span
              key={i}
              className="w-[4px] rounded-full bg-[#ff7a45]"
              animate={{ height: [6, 8 + ((i * 7 + tick * 5) % 16), 6] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08 }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 grid w-full grid-cols-2 gap-2 text-center">
        <div className="rounded-[12px] bg-white/[0.07] py-2">
          <p className="text-[15px] font-bold tabular-nums">{186 + tick * 3}</p>
          <p className="text-[9px] text-white/50">kcal</p>
        </div>
        <div className="rounded-[12px] bg-white/[0.07] py-2">
          <p className="text-[15px] font-bold tabular-nums">{12 + Math.floor(tick / 4)}</p>
          <p className="text-[9px] text-white/50">répétitions</p>
        </div>
      </div>
      <div className="mt-auto mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a45] py-3 text-[13px] font-semibold text-[#1a0d06]">
        <Pause className="size-4 fill-current" /> Pause
      </div>
    </div>
  );
}
