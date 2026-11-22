/*
 * Palette saisie en hexa → tokens shadcn clair et sombre, lisibles. Partagé par le builder, les palettes de
 * mobile-base et les tests ; shared/color.ts réexporte les calculs.
 */

/** @typedef {[number, number, number, number]} Rgba sRGB 0–1 + alpha */
/** @typedef {Partial<Record<'background' | 'foreground' | 'primary' | 'secondary' | 'accent', string>>} Fields */

/** @param {Rgba} c */
export const toHex = (c) =>
  `#${c
    .slice(0, 3)
    .map((n) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

/**
 * `amount` de b dans a, opaque.
 * @param {Rgba} a
 * @param {Rgba} b
 * @param {number} amount
 * @returns {Rgba}
 */
export const mix = (a, b, amount) => [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount, 1];

/** @param {Rgba} c */
export function luminance(c) {
  const linear = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(c[0]) + 0.7152 * linear(c[1]) + 0.0722 * linear(c[2]);
}

/**
 * @param {Rgba} a
 * @param {Rgba} b
 * @returns {number}
 */
export function contrast(a, b) {
  const [low, high] = [luminance(a), luminance(b)].sort((p, q) => p - q);
  return (high + 0.05) / (low + 0.05);
}

/** @type {Rgba} */
const WHITE = [1, 1, 1, 1];
/** @type {Rgba} */
const BLACK = [0, 0, 0, 1];

/**
 * Noir ou blanc, le plus lisible sur `background`.
 * @param {Rgba} background
 * @returns {Rgba}
 */
export const readableOn = (background) => (contrast(background, WHITE) >= contrast(background, BLACK) ? WHITE : BLACK);

const TEXT = 4.5; // WCAG AA, texte courant
const GRAPHIC = 3; // WCAG AA, icônes et contours

const ROLES = ['background', 'foreground', 'primary', 'secondary', 'accent'];
export const ROLE_LABELS = { background: 'Fond', foreground: 'Texte', primary: 'Principale', secondary: 'Secondaire', accent: 'Accent' };

/**
 * `abc`, `#abc`, `AABBCC`, `#aabbcc` → `#aabbcc`.
 * @param {unknown} value
 * @returns {string | null}
 */
export function hexOf(value) {
  const hex = String(value ?? '')
    .trim()
    .match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
    .toLowerCase();
  if (!hex) return null;
  return `#${hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex}`;
}

/**
 * Codes d'un texte collé (liste, CSS, adresse Coolors). S'il y a des #, eux seuls comptent : « facade » est aussi de l'hexa.
 * @param {string} text
 * @returns {string[]}
 */
export function hexList(text) {
  const marked = text.match(/#([0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z])/gi);
  return (marked ?? text.match(/(?<![0-9a-z])[0-9a-f]{6}(?![0-9a-z])/gi) ?? []).map((code) => hexOf(code) ?? '');
}

/** @returns {Rgba} */
function rgb(value) {
  const hex = hexOf(value) ?? '#000000';
  const at = (i) => parseInt(hex.slice(i, i + 2), 16) / 255;
  return [at(1), at(3), at(5), 1];
}
/** La couleur telle qu'elle sera écrite : le contraste se juge après arrondi. */
const written = (color) => rgb(toHex(color));
const isDark = (color) => contrast(color, WHITE) > TEXT;

/**
 * Tokens d'un mode. Sans secondaire ni accent, ils sont déduits.
 * @param {Fields} fields
 * @returns {Record<string, string>}
 */
export function schemeOf(fields) {
  const bg = rgb(fields.background),
    fg = rgb(fields.foreground),
    primary = rgb(fields.primary);
  const readable = (color) => contrast(fg, written(color)) >= TEXT;
  const surface = (color) => (readable(color) ? color : bg);
  const textOn = (color) => (readable(color) ? fg : readableOn(color));

  const card = surface(mix(bg, WHITE, isDark(bg) ? 0.06 : 0.6)),
    muted = surface(mix(bg, fg, 0.06)),
    secondary = fields.secondary ? rgb(fields.secondary) : surface(mix(bg, fg, 0.1)),
    accent = fields.accent ? rgb(fields.accent) : surface(mix(bg, primary, 0.14));

  // Le texte atténué se renforce jusqu'à rester lisible partout où le texte l'est.
  const under = [bg, card, muted, accent].filter(readable);
  let soft = mix(fg, bg, 0.14);
  for (let amount = 0.12; amount >= 0 && under.some((s) => contrast(written(soft), written(s)) < TEXT); amount -= 0.02)
    soft = mix(fg, bg, amount);
  if (under.some((s) => contrast(written(soft), written(s)) < TEXT)) soft = fg;

  const colors = {
    background: bg,
    foreground: fg,
    card,
    'card-foreground': fg,
    popover: card,
    'popover-foreground': fg,
    primary,
    'primary-foreground': readableOn(primary),
    secondary,
    'secondary-foreground': textOn(secondary),
    muted,
    'muted-foreground': soft,
    accent,
    'accent-foreground': textOn(accent),
    destructive: rgb(isDark(bg) ? '#ff8a7a' : '#b01e1e'),
    border: mix(bg, fg, 0.18),
    input: mix(bg, fg, 0.18),
    ring: primary,
  };
  return Object.fromEntries(Object.entries(colors).map(([name, c]) => [`--${name}`, toHex(c)]));
}

const chroma = (color) => Math.max(...color.slice(0, 3)) - Math.min(...color.slice(0, 3));

/**
 * Rôle de chaque couleur, dans n'importe quel ordre : fond = la plus claire et neutre, texte = la plus contrastée
 * et sobre, principale = la plus vive et visible, puis secondaire et accent. Fond et texte absents sont calculés.
 * @param {unknown[]} codes
 * @returns {Fields | null}
 */
export function paletteRoles(codes) {
  const rest = [...new Set(codes.map(hexOf).filter((hex) => hex !== null))];
  if (!rest.length) return null;
  /** La couleur de `list` au meilleur score (la première en cas d'égalité), retirée du reste. */
  const pick = (list, score) => {
    if (!list.length) return undefined;
    const best = list.reduce((a, b) => (score(rgb(b)) > score(rgb(a)) ? b : a));
    rest.splice(rest.indexOf(best), 1);
    return best;
  };
  const tint = rgb(rest.reduce((a, b) => (chroma(rgb(b)) > chroma(rgb(a)) ? b : a)));
  const background =
    pick(
      rest.filter((hex) => luminance(rgb(hex)) >= 0.7 && chroma(rgb(hex)) <= 0.25),
      luminance,
    ) ?? toHex(mix(WHITE, tint, 0.05));
  const under = rgb(background);
  const foreground =
    pick(
      rest.filter((hex) => contrast(rgb(hex), under) >= TEXT && chroma(rgb(hex)) <= 0.35),
      (c) => contrast(c, under),
    ) ?? toHex(mix(rgb('#111111'), tint, 0.1));
  // Une principale visible sur le fond passe avant une plus vive mais pâle.
  const primary = pick(rest, (c) => (contrast(c, under) >= GRAPHIC ? 2 : 0) + chroma(c)) ?? foreground;
  const roles = { background, foreground, primary, secondary: pick(rest, chroma), accent: pick(rest, chroma) };
  return Object.fromEntries(Object.entries(roles).filter(([, hex]) => hex));
}

/**
 * Le mode sombre, déduit du clair. `dark` : couleurs imposées.
 * @param {Fields} light
 * @param {Fields} dark
 * @returns {Fields}
 */
function darkFields(light, dark) {
  const brand = rgb(light.primary);
  const background = dark.background ?? toHex(mix(rgb('#111111'), brand, 0.08));
  const foreground = dark.foreground ?? toHex(mix(WHITE, brand, 0.08));
  let primary = brand;
  for (let amount = 0.05; amount <= 1 && contrast(written(primary), rgb(background)) < TEXT; amount += 0.05)
    primary = mix(brand, WHITE, amount);
  const auto = { background, foreground, primary: toHex(primary) };
  for (const key of ['secondary', 'accent']) {
    if (!light[key]) continue;
    let tint = rgb(background);
    for (const amount of [0.3, 0.22, 0.14, 0.07]) {
      const next = mix(rgb(background), rgb(light[key]), amount);
      if (contrast(written(next), rgb(foreground)) < TEXT) continue;
      tint = next;
      break;
    }
    auto[key] = toHex(tint);
  }
  return { ...auto, ...dark };
}

/**
 * Tokens clair et sombre d'une liste de codes. En sombre, fond et texte s'inversent quand le texte est assez foncé
 * pour servir de fond. null sans aucun code valide.
 * @param {unknown[]} codes
 * @returns {{ light: Record<string, string>, dark: Record<string, string> } | null}
 */
export function paletteColors(codes) {
  const roles = paletteRoles(codes);
  if (!roles) return null;
  /** @type {Fields} */
  const dark = { foreground: roles.background };
  if (contrast(rgb(roles.foreground), WHITE) >= 12) dark.background = roles.foreground;
  return { light: schemeOf(roles), dark: schemeOf(darkFields(roles, dark)) };
}

/**
 * Codes refusés, ou aucune couleur (index -1) : bloquant.
 * @param {unknown[]} codes
 * @returns {{ index: number, message: string }[]}
 */
export function paletteErrors(codes) {
  const out = [];
  codes.forEach((code, index) => {
    const value = String(code ?? '').trim();
    if (value && !hexOf(value)) out.push({ index, message: `Couleur ${index + 1} : « ${value} » n’est pas un code hexa, comme #2a9d8f.` });
  });
  if (!out.length && !codes.some(hexOf)) out.push({ index: -1, message: 'Ajoutez au moins une couleur.' });
  return out;
}

/**
 * Lisibilité : signalée, jamais bloquante, ce sont les couleurs de l'utilisateur.
 * @param {{ light: Record<string, string>, dark: Record<string, string> }} colors
 * @returns {string[]}
 */
export function paletteWarnings(colors) {
  const out = [];
  for (const [name, tokens] of [
    ['clair', colors.light],
    ['sombre', colors.dark],
  ]) {
    const ratio = (a, b) => contrast(rgb(tokens[`--${a}`]), rgb(tokens[`--${b}`]));
    for (const [a, b, min, problem] of /** @type {const} */ ([
      ['foreground', 'background', TEXT, 'texte peu lisible sur le fond'],
      ['primary', 'background', GRAPHIC, 'principale peu visible sur le fond'],
      ['foreground', 'accent', TEXT, 'texte peu lisible sur l’accent'],
    ])) {
      // Texte illisible sur le fond : c'est lui le problème, pas l'accent qui en est déduit.
      if (b === 'accent' && ratio('foreground', 'background') < TEXT) continue;
      const got = ratio(a, b);
      // Arrondi vers le bas : 4,49 ne doit pas s'afficher « 4,5 pour 4,5 ».
      const shown = (Math.floor(got * 10) / 10).toFixed(1).replace('.', ',');
      if (got < min) out.push(`En ${name}, ${problem} : contraste ${shown}, il faut ${String(min).replace('.', ',')}.`);
    }
  }
  return out;
}

/**
 * Retrouve les codes saisis d'une palette enregistrée : la plus petite sélection de ses couleurs qui redonne
 * exactement le thème (les couleurs calculées n'ont pas été saisies). null si le thème a été réglé token par token :
 * le rouvrir ici écraserait ces réglages.
 * @param {{ light: Record<string, string>, dark: Record<string, string> }} colors
 * @returns {string[] | null}
 */
export function paletteList(colors) {
  const given = [...new Set(ROLES.map((key) => hexOf(colors.light?.[`--${key}`])).filter((hex) => hex !== null))];
  const same = (a, b = {}) => Object.keys({ ...a, ...b }).every((token) => a[token] === b[token]);
  for (let size = 1; size <= given.length; size++)
    for (let mask = 1; mask < 1 << given.length; mask++) {
      const list = given.filter((_, i) => mask & (1 << i));
      if (list.length !== size) continue;
      const again = paletteColors(list);
      if (again && same(again.light, colors.light) && same(again.dark, colors.dark)) return list;
    }
  return null;
}
