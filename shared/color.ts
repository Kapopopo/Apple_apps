/** Couleurs CSS des thèmes → sRGB pour React Native, qui ne lit ni oklch() ni les custom properties. */

import { mix } from '../web/lib/palette.js';

export { contrast, luminance, mix, readableOn, toHex } from '../web/lib/palette.js';

/** sRGB 0–1 + alpha. */
export type Rgba = [number, number, number, number];

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const NAMED: Record<string, Rgba> = { white: [1, 1, 1, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0] };
const NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)(%|deg)?$/;

function oklch(l: number, c: number, h: number): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad),
    b = c * Math.sin(rad);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291985538 * b) ** 3;
  const gamma = (x: number) => clamp(x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  return [
    gamma(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    gamma(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    gamma(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  ];
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + (((h % 360) + 360) % 360) / 30) % 12;
    return clamp(l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/** hex, rgb(), hsl(), oklch(), triplet HSL shadcn et var() résolu dans `vars` ; null pour toute autre syntaxe. */
export function parseColor(value: string, vars: Record<string, string> = {}, depth = 0): Rgba | null {
  if (depth > 8) return null;
  let v = value.trim().toLowerCase();
  for (let m = v.match(/var\((--[\w-]+)\)/); m; m = v.match(/var\((--[\w-]+)\)/)) {
    const target = vars[m[1]];
    if (target === undefined || ++depth > 8) return null;
    v = v.replace(m[0], target.trim().toLowerCase());
  }
  if (NAMED[v]) return NAMED[v];
  const hex = v.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const at = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
    return [at(0), at(2), at(4), full.length === 8 ? at(6) : 1];
  }
  const fn = v.match(/^([a-z]+)\((.*)\)$/);
  const name = fn?.[1] ?? (/^[\d.]+(deg)? [\d.]+% [\d.]+%( ?\/.*)?$/.test(v) ? 'hsl' : '');
  if (!['rgb', 'rgba', 'hsl', 'hsla', 'oklch'].includes(name)) return null;
  const parts = (fn?.[2] ?? v).split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4 || !parts.every((p) => NUMBER.test(p))) return null;
  const num = (p: string, percentOf: number) => (p.endsWith('%') ? (parseFloat(p) / 100) * percentOf : parseFloat(p));
  const [x, y, z] = parts;
  const alpha = parts[3] === undefined ? 1 : clamp(num(parts[3], 1));
  if (name === 'oklch') return [...oklch(num(x, 1), num(y, 0.4), parseFloat(z)), alpha];
  if (name.startsWith('hsl')) return [...hsl(parseFloat(x), parseFloat(y) / 100, parseFloat(z) / 100), alpha];
  return [clamp(num(x, 255) / 255), clamp(num(y, 255) / 255), clamp(num(z, 255) / 255), alpha];
}

/** Aplati une couleur translucide sur son fond. */
export const over = (c: Rgba, background: Rgba): Rgba => mix(background, c, c[3]);
