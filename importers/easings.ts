/**
 * Tokens d'easing standard : cubic-bezier (CSS, Motion) + fonctions JS.
 * Les fonctions suivent les équations de Robert Penner (BSD-3-Clause) ;
 * Elastic et Bounce n'ont pas d'équivalent cubic-bezier (fonction JS uniquement).
 */
import { Collector } from './lib/collector.js';

type Bezier = [number, number, number, number];
const CURVES: [string, Bezier | null, string][] = [
  ['easeInSine', [0.12, 0, 0.39, 0], '1 - Math.cos((x * Math.PI) / 2)'],
  ['easeOutSine', [0.61, 1, 0.88, 1], 'Math.sin((x * Math.PI) / 2)'],
  ['easeInOutSine', [0.37, 0, 0.63, 1], '-(Math.cos(Math.PI * x) - 1) / 2'],
  ['easeInQuad', [0.11, 0, 0.5, 0], 'x * x'],
  ['easeOutQuad', [0.5, 1, 0.89, 1], '1 - (1 - x) * (1 - x)'],
  ['easeInOutQuad', [0.45, 0, 0.55, 1], 'x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2'],
  ['easeInCubic', [0.32, 0, 0.67, 0], 'x * x * x'],
  ['easeOutCubic', [0.33, 1, 0.68, 1], '1 - Math.pow(1 - x, 3)'],
  ['easeInOutCubic', [0.65, 0, 0.35, 1], 'x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2'],
  ['easeInQuart', [0.5, 0, 0.75, 0], 'x * x * x * x'],
  ['easeOutQuart', [0.25, 1, 0.5, 1], '1 - Math.pow(1 - x, 4)'],
  ['easeInOutQuart', [0.76, 0, 0.24, 1], 'x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2'],
  ['easeInQuint', [0.64, 0, 0.78, 0], 'x * x * x * x * x'],
  ['easeOutQuint', [0.22, 1, 0.36, 1], '1 - Math.pow(1 - x, 5)'],
  ['easeInOutQuint', [0.83, 0, 0.17, 1], 'x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2'],
  ['easeInExpo', [0.7, 0, 0.84, 0], 'x === 0 ? 0 : Math.pow(2, 10 * x - 10)'],
  ['easeOutExpo', [0.16, 1, 0.3, 1], 'x === 1 ? 1 : 1 - Math.pow(2, -10 * x)'],
  ['easeInOutExpo', [0.87, 0, 0.13, 1], 'x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2'],
  ['easeInCirc', [0.55, 0, 1, 0.45], '1 - Math.sqrt(1 - Math.pow(x, 2))'],
  ['easeOutCirc', [0, 0.55, 0.45, 1], 'Math.sqrt(1 - Math.pow(x - 1, 2))'],
  ['easeInOutCirc', [0.85, 0, 0.15, 1], 'x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2'],
  ['easeInBack', [0.36, 0, 0.66, -0.56], 'C3 * x * x * x - C1 * x * x'],
  ['easeOutBack', [0.34, 1.56, 0.64, 1], '1 + C3 * Math.pow(x - 1, 3) + C1 * Math.pow(x - 1, 2)'],
  ['easeInOutBack', [0.68, -0.6, 0.32, 1.6], 'x < 0.5 ? (Math.pow(2 * x, 2) * ((C2 + 1) * 2 * x - C2)) / 2 : (Math.pow(2 * x - 2, 2) * ((C2 + 1) * (x * 2 - 2) + C2) + 2) / 2'],
  ['easeInElastic', null, 'x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * C4)'],
  ['easeOutElastic', null, 'x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * C4) + 1'],
  ['easeInOutElastic', null, 'x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * C5)) / 2 : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * C5)) / 2 + 1'],
  ['easeInBounce', null, '1 - easeOutBounce(1 - x)'],
  ['easeOutBounce', null, 'bounceOut(x)'],
  ['easeInOutBounce', null, 'x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2'],
];

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const bezierCss = (b: Bezier) => `cubic-bezier(${b.join(', ')})`;

export function easingTokens() {
  return CURVES.map(([name, bezier]) => ({ name, cubicBezier: bezier, css: bezier ? bezierCss(bezier) : `/* ${name} : pas d'équivalent cubic-bezier, utiliser la fonction JS */` }));
}

export function generateTs(): string {
  return [
    '/**',
    ' * Easings standard — généré par Component Atlas (npm run import:easings).',
    ' * Équations : Robert Penner, Easing Equations (BSD-3-Clause), forme normalisée x ∈ [0, 1].',
    ' * `bezier` : tableau pour Motion / Framer Motion (`transition={{ ease: bezier.easeOutCubic }}`).',
    ' * `css` : valeur pour `transition-timing-function` / `animation-timing-function`.',
    ' */',
    'const C1 = 1.70158;', 'const C2 = C1 * 1.525;', 'const C3 = C1 + 1;', 'const C4 = (2 * Math.PI) / 3;', 'const C5 = (2 * Math.PI) / 4.5;',
    '',
    'function bounceOut(x: number): number {',
    '  const n1 = 7.5625, d1 = 2.75;',
    '  if (x < 1 / d1) return n1 * x * x;',
    '  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;',
    '  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;',
    '  return n1 * (x -= 2.625 / d1) * x + 0.984375;',
    '}',
    '',
    ...CURVES.map(([name, , body]) => `export const ${name} = (x: number): number => ${body};`),
    '',
    'export const bezier = {',
    ...CURVES.filter(([, b]) => b).map(([name, b]) => `  ${name}: [${b!.join(', ')}] as [number, number, number, number],`),
    '} as const;',
    '',
    'export const css = {',
    ...CURVES.filter(([, b]) => b).map(([name, b]) => `  ${name}: '${bezierCss(b!)}',`),
    '} as const;',
    '',
    `export const easings = { ${CURVES.map(([n]) => n).join(', ')} } as const;`,
    'export type EasingName = keyof typeof easings;',
    '',
  ].join('\n');
}

export function generateCss(): string {
  return [
    '/* Easings standard — custom properties générées par Component Atlas. Usage : transition: transform 300ms var(--ease-out-cubic); */',
    ':root {',
    ...CURVES.filter(([, b]) => b).map(([name, b]) => `  --${kebab(name)}: ${bezierCss(b!)};`),
    '}',
    '',
  ].join('\n');
}

export function importEasings() {
  const collector = new Collector('easings', 'atlas');
  collector.write({
    id: 'atlas/easings-standard', name: 'Easings standard', type: 'easing', category: 'Easings',
    tags: ['bezier', 'css', 'motion', 'tokens'],
    description: `${CURVES.length} courbes (Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce) en cubic-bezier CSS, tableaux Motion et fonctions JS.`,
    framework: 'agnostic', dependencies: [], registryDependencies: [],
    source: 'Component Atlas', sourceId: 'atlas', sourceUrl: 'https://robertpenner.com/easing/',
    license: 'BSD-3-Clause', licenseStatus: 'open',
    licenseNotes: 'Fonctions dérivées des Easing Equations de Robert Penner (BSD-3-Clause). Valeurs cubic-bezier standard (approximations usuelles des mêmes courbes).',
    attribution: 'Easing Equations © 2001 Robert Penner (BSD-3-Clause).',
    files: [{ path: 'easings.ts', role: 'source' }, { path: 'easings.css', role: 'style' }],
    easings: easingTokens(),
    preview: { kind: 'none', reason: 'Courbes tracées par le builder' },
  }, new Map([['easings.ts', generateTs()], ['easings.css', generateCss()]]));
  return [collector.finish(['atlas'])];
}
