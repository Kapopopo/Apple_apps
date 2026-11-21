/**
 * MediaSphere : sphère 3D de vignettes en CSS (transforms 3D, pilotées par motion pour l'intro) qui tourne lentement
 * sur elle-même, légèrement inclinée, avec ombrage sur les bords et reflet. Vignettes placeholder (dégradés variés) par
 * défaut, ou contenu libre via `renderTile` (image, vidéo…). Survol d'une vignette : elle sort de la sphère, grossit
 * et s'entoure d'un liseré lumineux (la rotation se met en pause). Intro optionnelle : rotation + zoom puis mise en
 * avant de vignettes. La rotation s'arrête sous prefers-reduced-motion.
 * Props : size (diamètre en px), bands (nombre de latitudes), density (vignettes à l'équateur), speed (secondes
 * par tour, 0 = fixe), tilt (inclinaison en degrés), renderTile, variety, tileAspect, intro, zoom, featureCount, className.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

export interface MediaSphereProps {
  size?: number;
  bands?: number;
  density?: number;
  speed?: number;
  tilt?: number;
  /** `variant` est fourni quand `variety` est défini : voir ci-dessous. */
  renderTile?: (index: number, variant: number) => ReactNode;
  /**
   * Nombre de visuels distincts à répartir (ex. nombre de photos). Chaque vignette reçoit un `variant` dans
   * [0, variety) choisi pour que les répétitions d'un même visuel soient le plus éloignées possible sur la sphère
   * (jamais côte à côte ni sur la même face quand c'est possible).
   */
  variety?: number;
  /** Rapport largeur/hauteur imposé aux vignettes (ex. 9/16 pour des vidéos verticales). Par défaut, vignettes ~carrées. */
  tileAspect?: number;
  /**
   * Clic sur une vignette : la sphère tourne en zoomant (×`zoom`), ralentit et s'arrête sur la vignette cliquée, puis
   * met `featureCount` vignettes en avant (la cliquée + d'autres autour : sorties de la sphère, agrandies, liseré
   * lumineux ; les autres s'assombrissent). Un nouveau clic sur la sphère la relâche (dézoom, rotation reprise).
   * Prévoir un parent qui rogne (overflow-hidden) : la sphère zoomée dépasse `size`. Sans animation en mouvement réduit.
   */
  selectable?: boolean;
  /**
   * Même animation que la sélection, mais toute seule et en boucle : quelques secondes de rotation, rotation + zoom
   * vers une vignette, mise en avant, retour. Uniquement quand la sphère est à l'écran ; désactivé en mouvement réduit.
   */
  auto?: boolean;
  /**
   * Filtre : les vignettes pour lesquelles il renvoie false s'assombrissent et ne sont ni cliquables ni choisies pour
   * la mise en avant. Le mémoïser (useCallback) : un changement relâche une sélection en cours.
   */
  match?: (index: number, variant: number) => boolean;
  zoom?: number;
  featureCount?: number;
  className?: string;
}

/** Agrandissement des vignettes mises en avant. */
const FEATURE_SCALE = 2;

/**
 * Choisit les vignettes à mettre en avant une fois la sphère arrêtée : la vignette cliquée (`chosen`, rang 0), puis
 * pour des points cibles autour (en rayons), la vignette visible la plus proche — en ne gardant que des points assez
 * écartés pour que les cartes agrandies ne se chevauchent pas. Positions calculées avec les matrices CSS
 * rotateX(tilt) · rotateY(spin) · rotateY(lon) · rotateX(lat) · translateZ(R).
 */
function pickFeatured(
  tiles: { lat: number; lon: number }[],
  spin: number,
  tilt: number,
  count: number,
  chosen: number,
  allowed: (i: number) => boolean = () => true,
) {
  const r = Math.PI / 180;
  const screen = tiles.map(({ lat, lon }) => {
    // rotateX(lat) sur (0, 0, 1)
    let x = 0;
    let y = -Math.sin(lat * r);
    let z = Math.cos(lat * r);
    // rotateY(lon + spin)
    const a = (lon + spin) * r;
    [x, z] = [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
    // rotateX(tilt)
    const b = tilt * r;
    [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
    return { x, y, z };
  });
  const out = new Map<number, Featured>([[chosen, { rank: 0, ...screen[chosen] }]]);
  // Cartes agrandies ≈ 0,27 R de large et 0,45 R de haut : deux centres doivent s'écarter au-delà de ça sur un axe.
  const apart = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) > 0.31 || Math.abs(a.y - b.y) > 0.46;
  // Zone où une carte reste entière dans le cadre (fondus haut et bas compris, cadre étroit sur mobile).
  const fits = (s: { x: number; y: number }) => s.y > -0.4 && s.y < 0.32 && Math.abs(s.x) < 0.72;
  // Composition en zigzag autour de la vignette cliquée (au centre).
  const candidates = [
    [-0.44, -0.2],
    [0.44, 0.24],
    [-0.46, 0.28],
    [0.46, -0.24],
    [-0.7, 0.04],
    [0.7, 0.04],
  ];
  for (const [tx, ty] of candidates) {
    if (out.size >= count) break;
    // Vignette visible la plus proche du point cible, parmi celles qui ne chevaucheraient aucune carte déjà retenue.
    let best = -1;
    let bestD = Infinity;
    screen.forEach((s, i) => {
      if (s.z < 0.5 || !fits(s) || out.has(i) || !allowed(i) || ![...out.values()].every((f) => apart(f, s))) return;
      const d = (s.x - tx) ** 2 + (s.y - ty) ** 2;
      if (d < bestD) [bestD, best] = [d, i];
    });
    if (best >= 0) out.set(best, { rank: out.size, ...screen[best] });
  }
  return out;
}

/** Vignette mise en avant : ordre d'apparition + position (sphère unité, avant perspective). */
interface Featured {
  rank: number;
  x: number;
  y: number;
  z: number;
}

/** Teintes des vignettes placeholder : majoritairement sombres et neutres, quelques touches claires et colorées. */
const HUES = [
  ['#2a2d36', '#15161b'],
  ['#3b3f4c', '#1d1f26'],
  ['#5b6274', '#2b2f3a'],
  ['#c9ccd6', '#8e93a3'],
  ['#e8e6e1', '#b9b4aa'],
  ['#3a4a7a', '#1b2240'],
  ['#7a5a48', '#3a2a22'],
  ['#4d6b5a', '#22322a'],
  ['#a08a7a', '#4a3d36'],
  ['#6b7a99', '#2b3247'],
  ['#9a6b5a', '#3d2a23'],
  ['#c8b89a', '#6e6350'],
];

/** Pseudo-aléatoire déterministe (même rendu à chaque montage, pas de saut d'hydratation). */
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function PlaceholderTile({ index }: { index: number }) {
  const r = rand(index + 1);
  const [a, b] = HUES[Math.floor(rand(index + 7) * HUES.length)];
  const light = r > 0.82;
  return (
    <span
      className="relative block h-full w-full overflow-hidden rounded-[3px]"
      style={{ background: `linear-gradient(${Math.round(r * 360)}deg, ${a}, ${b})` }}
    >
      <span
        className="absolute inset-x-[18%] bottom-[14%] h-[8%] rounded-full"
        style={{ background: light ? 'rgb(0 0 0 / 0.25)' : 'rgb(255 255 255 / 0.28)' }}
      />
      {r > 0.5 && (
        <span
          className="absolute top-[20%] left-1/2 size-[34%] -translate-x-1/2 rounded-full"
          style={{ background: light ? 'rgb(0 0 0 / 0.18)' : 'rgb(255 255 255 / 0.16)' }}
        />
      )}
    </span>
  );
}

/**
 * Attribue à chaque vignette un visuel parmi `variety`, en maximisant l'écart angulaire entre deux occurrences
 * du même visuel (glouton : on prend le visuel le moins utilisé, puis celui dont l'occurrence la plus proche est
 * la plus lointaine). Déterministe, ~N × variety opérations.
 */
const spreadCache = new Map<string, number[]>();
/** Même disposition (bandes, format) → même répartition : calculée une seule fois pour toutes les sphères. */
function spreadVariants(tiles: { lat: number; lon: number }[], variety: number) {
  const key = `${variety}|${tiles.map((t) => `${t.lat.toFixed(2)},${t.lon.toFixed(2)}`).join(';')}`;
  let out = spreadCache.get(key);
  if (!out) spreadCache.set(key, (out = computeSpread(tiles, variety)));
  return out;
}

function computeSpread(tiles: { lat: number; lon: number }[], variety: number) {
  const rad = Math.PI / 180;
  const pos = tiles.map(({ lat, lon }) => [Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad), Math.cos(lat * rad) * Math.cos(lon * rad)]);
  const placed: number[][] = Array.from({ length: variety }, () => []);
  // Ordre de parcours mélangé (déterministe) : évite que les premiers visuels se concentrent sur les premières bandes.
  const order = tiles.map((_, i) => i).sort((a, b) => rand(a + 101) - rand(b + 101));
  const out = new Array<number>(tiles.length);
  for (const i of order) {
    const p = pos[i];
    let best = 0;
    let bestUse = Infinity;
    let bestNear = Infinity;
    for (let v = 0; v < variety; v++) {
      const use = placed[v].length;
      if (use > bestUse) continue;
      // Plus grand cosinus = occurrence la plus proche.
      let near = -2;
      for (const j of placed[v]) {
        const q = pos[j];
        near = Math.max(near, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]);
      }
      if (use < bestUse || near < bestNear) {
        best = v;
        bestUse = use;
        bestNear = near;
      }
    }
    placed[best].push(i);
    out[i] = best;
  }

  // Affinage : on échange la vignette du doublon le plus serré avec celle qui l'écarte le plus, tant que ça progresse.
  const dot = (a: number, b: number) => pos[a][0] * pos[b][0] + pos[a][1] * pos[b][1] + pos[a][2] * pos[b][2];
  /** Cosinus de l'occurrence de `v` la plus proche de la position de `at`, sans compter la vignette `skip`. */
  const nearest = (v: number, at: number, skip: number) => {
    let m = -2;
    for (const j of placed[v]) if (j !== skip && j !== at) m = Math.max(m, dot(at, j));
    return m;
  };
  const frozen = new Set<number>();
  // ~600 échanges suffisent à atteindre ~100° d'écart minimal (≈ l'optimum pour 3-4 occurrences) en ~40 ms.
  for (let iter = 0; iter < 600; iter++) {
    let a = -1;
    let worst = -2;
    for (let i = 0; i < tiles.length; i++) {
      if (frozen.has(i)) continue;
      const w = nearest(out[i], i, i);
      if (w > worst) [worst, a] = [w, i];
    }
    if (a < 0) break;
    let bestB = -1;
    let bestScore = worst - 1e-6;
    for (let b = 0; b < tiles.length; b++) {
      const va = out[a];
      const vb = out[b];
      if (va === vb) continue;
      const score = Math.max(nearest(vb, a, b), nearest(va, b, a));
      if (score < bestScore) [bestScore, bestB] = [score, b];
    }
    if (bestB < 0) {
      frozen.add(a);
      continue;
    }
    const [va, vb] = [out[a], out[bestB]];
    placed[va][placed[va].indexOf(a)] = bestB;
    placed[vb][placed[vb].indexOf(bestB)] = a;
    out[a] = vb;
    out[bestB] = va;
    frozen.clear();
  }
  return out;
}

export function MediaSphere({ size = 420, bands = 17, density = 40, speed = 60, tilt = -10, renderTile, variety, tileAspect, selectable = false, auto = false, match, zoom = 1.5, featureCount = 4, className }: MediaSphereProps) {
  const radius = size / 2;
  const tiles = useMemo(() => {
    const out: { lat: number; lon: number; w: number; h: number }[] = [];
    const step = 150 / (bands - 1);
    const rowH = ((step * Math.PI) / 180) * radius * 0.86;
    for (let b = 0; b < bands; b++) {
      const lat = -75 + b * step;
      const circ = 2 * Math.PI * radius * Math.cos((lat * Math.PI) / 180);
      let count: number;
      let w: number;
      if (tileAspect) {
        // Largeur fixée par le format ; le nombre de vignettes par bande s'adapte (même écart de 18 % qu'avant).
        w = rowH * tileAspect;
        count = Math.max(4, Math.round(circ / (w / 0.82)));
      } else {
        count = Math.max(4, Math.round(density * Math.cos((lat * Math.PI) / 180)));
        w = (circ / count) * 0.82;
      }
      for (let i = 0; i < count; i++) out.push({ lat, lon: (360 / count) * i + (b % 2 ? 180 / count : 0), w, h: rowH });
    }
    return out;
  }, [bands, density, radius, tileAspect]);

  const variants = useMemo(() => (variety ? spreadVariants(tiles, variety) : null), [tiles, variety]);

  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  /* ---- Sélection : la sphère tourne en se rapprochant de la caméra (vrai zoom en perspective, effet « fish-eye »),
     ralentit, s'arrête sur la vignette cliquée, puis met `featureCount` vignettes en avant. ---- */
  const P = size * 3; // perspective
  const R = radius;
  const rest = (P * R) / Math.sqrt(P * P - R * R); // rayon projeté au repos
  // Rapprochement de la scène nécessaire pour que le rayon projeté soit multiplié par `zoom`.
  const dMax = selectable || auto ? P - Math.sqrt((P * P - R * R) / (zoom * zoom) + R * R) : 0;
  const rot = useMotionValue(0);
  const progress = useMotionValue(0);
  const spinT = useTransform(rot, (r) => `rotateY(${r}deg)`);
  const sceneT = useTransform(progress, (p) => `translateZ(${p * dMax}px) rotateX(${tilt}deg)`);
  /** Facteur d'agrandissement 2D de la silhouette, pour caler masque, ombrage et halo sur la sphère zoomée. */
  const flat = useTransform(progress, (p) => {
    const D = P - p * dMax;
    return (P * R) / Math.sqrt(D * D - R * R) / rest;
  });
  const maskSize = useTransform(flat, (f) => `${50 * f}% ${50 * f}%`);
  const [featured, setFeatured] = useState<Map<number, Featured> | null>(null);
  /** idle : rotation continue · zooming : animation de sélection · featured : sphère arrêtée, vignettes en avant. */
  const [phase, setPhase] = useState<'idle' | 'zooming' | 'featured'>('idle');
  const loop = useRef<ReturnType<typeof animate> | null>(null);
  const running = useRef<ReturnType<typeof animate>[]>([]);

  /** Rotation continue (un tour en `speed` s), repartant de l'angle courant : pas de saut après une sélection. */
  const startLoop = useCallback(() => {
    loop.current?.stop();
    if (reduced || speed <= 0) return;
    const from = rot.get();
    loop.current = animate(rot, [from, from + 360], { duration: speed, ease: 'linear', repeat: Infinity });
  }, [reduced, speed, rot]);

  useEffect(() => {
    startLoop();
    return () => {
      loop.current?.stop();
      running.current.forEach((a) => a.stop());
    };
  }, [startLoop]);

  // Pause au survol pour pouvoir viser (et cliquer) une vignette.
  useEffect(() => {
    if (phase !== 'idle') return;
    if (hovered) loop.current?.pause();
    else loop.current?.play();
  }, [hovered, phase]);

  const matches = (i: number) => !match || match(i, variants ? variants[i] : i);

  /** `force` : sélection lancée par la boucle automatique (même sans `selectable`). */
  const select = (i: number, force = false) => {
    if ((!selectable && !force) || phase !== 'idle' || !matches(i)) return;
    loop.current?.stop();
    // Angle d'arrêt : la vignette cliquée face à la caméra (lon + θ ≡ 0), après au moins un tour complet.
    const cur = rot.get();
    const target = -tiles[i].lon + 360 * Math.ceil((cur + 360 + tiles[i].lon) / 360);
    const finish = () => {
      setFeatured(pickFeatured(tiles, target, tilt, featureCount, i, (j) => matchRef.current(j)));
      setPhase('featured');
    };
    if (reduced) {
      rot.set(target);
      progress.set(1);
      finish();
      return;
    }
    setPhase('zooming');
    const spin = animate(rot, target, { duration: 3.2, ease: [0.3, 0.1, 0.12, 1] });
    const zoomIn = animate(progress, 1, { duration: 2.8, delay: 0.2, ease: [0.65, 0, 0.35, 1] });
    running.current = [spin, zoomIn];
    spin.then(finish);
  };

  const release = () => {
    if (phase !== 'featured') return;
    setFeatured(null);
    setPhase('idle');
    if (reduced) {
      progress.set(0);
      return;
    }
    running.current = [animate(progress, 0, { duration: 1, ease: [0.65, 0, 0.35, 1] })];
    startLoop();
  };

  // Le filtre peut changer pendant l'animation de sélection : on lit toujours sa dernière version.
  const matchRef = useRef(matches);
  matchRef.current = matches;
  const releaseRef = useRef(release);
  releaseRef.current = release;
  const selectRef = useRef(select);
  selectRef.current = select;

  /* Boucle automatique : rotation libre → sélection d'une vignette proche de l'équateur (une différente à chaque
     tour) → mise en avant → retour. En pause hors écran. */
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.3 });
  const cycle = useRef(0);
  useEffect(() => {
    if (!auto || reduced || !inView) return;
    let t = 0;
    if (phase === 'idle') {
      t = window.setTimeout(() => {
        const pool = tiles.map((tt, i) => [tt, i] as const).filter(([tt, i]) => Math.abs(tt.lat) < 20 && matchRef.current(i));
        if (!pool.length) return;
        cycle.current += 1;
        selectRef.current(pool[Math.floor(rand(cycle.current * 7.31 + 3) * pool.length)][1], true);
      }, 2600);
    } else if (phase === 'featured') {
      t = window.setTimeout(() => releaseRef.current(), 3800);
    }
    return () => clearTimeout(t);
  }, [auto, reduced, inView, phase, tiles]);

  // Changement de filtre : une sélection affichée ne correspond plus forcément, on relâche la sphère.
  const firstMatch = useRef(true);
  useEffect(() => {
    if (firstMatch.current) {
      firstMatch.current = false;
      return;
    }
    releaseRef.current();
  }, [match]);

  /* Silhouette adoucie : la perspective grossit légèrement la sphère au-delà de `size`, et les vignettes vues
     par la tranche formaient des éclats crénelés sur le pourtour. Le masque radial les fond proprement, quel que soit le fond.
     Le conteneur masqué fait 2× la sphère (inset -50 %) pour laisser de la place au zoom. */
  const silhouette = 'radial-gradient(closest-side, #000 88%, transparent 100%)';

  return (
    <div
      ref={rootRef}
      role={selectable ? 'group' : 'img'}
      aria-label="Sphère de vignettes"
      aria-description={selectable ? 'Cliquez une vignette pour lancer la sélection ; cliquez à nouveau pour revenir.' : undefined}
      className={cn('relative shrink-0', selectable && phase === 'featured' && 'cursor-zoom-out', className)}
      style={{ width: size, height: size }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={selectable ? release : undefined}
    >
      {/* Halo atténué pendant la mise en avant : il transparaît entre les vignettes et volerait la vedette. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ scale: flat }}
        animate={{ opacity: featured ? 0.35 : 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgb(47_91_255/0.25),transparent_65%)] blur-2xl" />
        {/* Lueur portée sous la sphère : l'ancre dans la scène. */}
        <div className="absolute -bottom-[7%] left-1/2 h-[10%] w-[62%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(47_91_255/0.35),transparent)] blur-md" />
      </motion.div>
      <motion.div
        className="absolute inset-[-50%]"
        style={{
          perspective: P,
          maskImage: silhouette,
          WebkitMaskImage: silhouette,
          maskSize,
          WebkitMaskSize: maskSize,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      >
        <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transform: sceneT }}>
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', transform: spinT }}
            onClick={(e) => {
              const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tile]');
              if (el) select(Number(el.dataset.tile));
            }}
          >
            {tiles.map((t, i) => {
              const base = `rotateY(${t.lon}deg) rotateX(${t.lat}deg) translateZ(${radius}px)`;
              // Vignette mise en avant : remplacée par sa carte 2D (plus bas), on la masque dans la sphère.
              const star = featured?.has(i) ?? false;
              const ok = matches(i);
              return (
                <div
                  key={i}
                  data-tile={i}
                  className={cn(
                    selectable && phase === 'idle' && ok && 'cursor-pointer',
                    // Pendant la rotation de sélection, pas de survol (sinon les vignettes grossissent en défilant sous le curseur).
                    // Hors filtre : ni survol ni clic.
                    (phase === 'zooming' || !ok) && 'pointer-events-none',
                    'group/tile absolute top-1/2 left-1/2 rounded-[3px] [transform:var(--pl-t)] transition-[transform,width,height,margin,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    /* Survol : la vignette grandit en vraie taille (width/height) plutôt qu'en scale(), sinon Chromium
                       la garde rastérisée petite et elle pixellise. Pas de `filter` non plus (rendu intermédiaire basse
                       résolution dans une scène 3D) : l'assombrissement passe par un voile. */
                    'h-(--pl-h) w-(--pl-w) [margin:calc(var(--pl-h)/-2)_0_0_calc(var(--pl-w)/-2)]',
                    'hover:h-[calc(var(--pl-h)*1.45)] hover:w-[calc(var(--pl-w)*1.45)] hover:[margin:calc(var(--pl-h)*1.45/-2)_0_0_calc(var(--pl-w)*1.45/-2)]',
                    'hover:[transform:var(--pl-t)_translateZ(var(--pl-z))] hover:shadow-[0_0_0_1.5px_#fff,0_0_18px_2px_rgb(47_91_255/0.75)] hover:duration-300',
                    star && 'invisible',
                  )}
                  style={
                    {
                      '--pl-w': `${t.w}px`,
                      '--pl-h': `${t.h}px`,
                      '--pl-z': `${Math.round(R * 0.1)}px`,
                      '--pl-t': base,
                      backfaceVisibility: 'hidden',
                      // Bords lissés des plans transformés en 3D (anticrénelage Chromium).
                      outline: '1px solid transparent',
                    } as CSSProperties
                  }
                >
                  {renderTile ? renderTile(i, variants ? variants[i] : i) : <PlaceholderTile index={i} />}
                  {/* Voile : assombrit les vignettes non retenues (mise en avant) ou hors filtre ; le survol l'efface
                      seulement pour les vignettes qui correspondent au filtre. */}
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-0 rounded-[3px] bg-[#05060a] transition-opacity duration-500',
                      !ok ? 'opacity-[0.78]' : featured ? 'opacity-60 group-hover/tile:opacity-0' : 'opacity-0',
                    )}
                  />
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.div>
      {/* Ombrage sphérique en rayons de la sphère (closest-side) : reflet en haut à gauche, liseré bleu de contre-jour,
          assombrissement progressif du limbe. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          scale: flat,
          background: [
            'radial-gradient(circle at 34% 28%, rgb(255 255 255 / 0.2), transparent 26%)',
            'radial-gradient(closest-side, transparent 82%, rgb(110 150 255 / 0.2) 94%, transparent 100%)',
            'radial-gradient(closest-side, transparent 55%, rgb(0 0 0 / 0.3) 78%, rgb(0 0 0 / 0.72) 100%)',
          ].join(', '),
        }}
      />
      {/* Vignettes mises en avant : cartes 2D posées exactement sur la projection de leur vignette (même centre, même
          taille), qui s'agrandissent et sortent de la sphère. En 2D, elles restent nettes à toute résolution. */}
      {featured &&
        [...featured].map(([i, f]) => {
          const t = tiles[i];
          const z = P / (P - (R * f.z + dMax)); // grossissement de la perspective à cet endroit
          const w = t.w * z * FEATURE_SCALE;
          const h = t.h * z * FEATURE_SCALE;
          return (
            <motion.div
              key={i}
              data-featured
              className="absolute overflow-hidden rounded-[6px] shadow-[0_0_0_2px_rgb(255_255_255/0.95),0_0_28px_6px_rgb(47_91_255/0.55),0_18px_40px_-12px_rgb(0_0_0/0.8)]"
              style={{ left: size / 2 + R * f.x * z - w / 2, top: size / 2 + R * f.y * z - h / 2, width: w, height: h }}
              initial={reduced ? false : { scale: 1 / FEATURE_SCALE }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: reduced ? 0 : f.rank * 0.16 }}
            >
              {renderTile ? renderTile(i, variants ? variants[i] : i) : <PlaceholderTile index={i} />}
            </motion.div>
          );
        })}
    </div>
  );
}

export default MediaSphere;
