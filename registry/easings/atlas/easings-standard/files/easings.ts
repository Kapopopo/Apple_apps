/**
 * Easings standard — généré par Component Atlas (npm run import:easings).
 * Équations : Robert Penner, Easing Equations (BSD-3-Clause), forme normalisée x ∈ [0, 1].
 * `bezier` : tableau pour Motion / Framer Motion (`transition={{ ease: bezier.easeOutCubic }}`).
 * `css` : valeur pour `transition-timing-function` / `animation-timing-function`.
 */
const C1 = 1.70158;
const C2 = C1 * 1.525;
const C3 = C1 + 1;
const C4 = (2 * Math.PI) / 3;
const C5 = (2 * Math.PI) / 4.5;

function bounceOut(x: number): number {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

export const easeInSine = (x: number): number => 1 - Math.cos((x * Math.PI) / 2);
export const easeOutSine = (x: number): number => Math.sin((x * Math.PI) / 2);
export const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;
export const easeInQuad = (x: number): number => x * x;
export const easeOutQuad = (x: number): number => 1 - (1 - x) * (1 - x);
export const easeInOutQuad = (x: number): number => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
export const easeInCubic = (x: number): number => x * x * x;
export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
export const easeInOutCubic = (x: number): number => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeInQuart = (x: number): number => x * x * x * x;
export const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
export const easeInOutQuart = (x: number): number => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
export const easeInQuint = (x: number): number => x * x * x * x * x;
export const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);
export const easeInOutQuint = (x: number): number => x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
export const easeInExpo = (x: number): number => x === 0 ? 0 : Math.pow(2, 10 * x - 10);
export const easeOutExpo = (x: number): number => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
export const easeInOutExpo = (x: number): number => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
export const easeInCirc = (x: number): number => 1 - Math.sqrt(1 - Math.pow(x, 2));
export const easeOutCirc = (x: number): number => Math.sqrt(1 - Math.pow(x - 1, 2));
export const easeInOutCirc = (x: number): number => x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
export const easeInBack = (x: number): number => C3 * x * x * x - C1 * x * x;
export const easeOutBack = (x: number): number => 1 + C3 * Math.pow(x - 1, 3) + C1 * Math.pow(x - 1, 2);
export const easeInOutBack = (x: number): number => x < 0.5 ? (Math.pow(2 * x, 2) * ((C2 + 1) * 2 * x - C2)) / 2 : (Math.pow(2 * x - 2, 2) * ((C2 + 1) * (x * 2 - 2) + C2) + 2) / 2;
export const easeInElastic = (x: number): number => x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * C4);
export const easeOutElastic = (x: number): number => x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * C4) + 1;
export const easeInOutElastic = (x: number): number => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * C5)) / 2 : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * C5)) / 2 + 1;
export const easeInBounce = (x: number): number => 1 - easeOutBounce(1 - x);
export const easeOutBounce = (x: number): number => bounceOut(x);
export const easeInOutBounce = (x: number): number => x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2;

export const bezier = {
  easeInSine: [0.12, 0, 0.39, 0] as [number, number, number, number],
  easeOutSine: [0.61, 1, 0.88, 1] as [number, number, number, number],
  easeInOutSine: [0.37, 0, 0.63, 1] as [number, number, number, number],
  easeInQuad: [0.11, 0, 0.5, 0] as [number, number, number, number],
  easeOutQuad: [0.5, 1, 0.89, 1] as [number, number, number, number],
  easeInOutQuad: [0.45, 0, 0.55, 1] as [number, number, number, number],
  easeInCubic: [0.32, 0, 0.67, 0] as [number, number, number, number],
  easeOutCubic: [0.33, 1, 0.68, 1] as [number, number, number, number],
  easeInOutCubic: [0.65, 0, 0.35, 1] as [number, number, number, number],
  easeInQuart: [0.5, 0, 0.75, 0] as [number, number, number, number],
  easeOutQuart: [0.25, 1, 0.5, 1] as [number, number, number, number],
  easeInOutQuart: [0.76, 0, 0.24, 1] as [number, number, number, number],
  easeInQuint: [0.64, 0, 0.78, 0] as [number, number, number, number],
  easeOutQuint: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeInOutQuint: [0.83, 0, 0.17, 1] as [number, number, number, number],
  easeInExpo: [0.7, 0, 0.84, 0] as [number, number, number, number],
  easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOutExpo: [0.87, 0, 0.13, 1] as [number, number, number, number],
  easeInCirc: [0.55, 0, 1, 0.45] as [number, number, number, number],
  easeOutCirc: [0, 0.55, 0.45, 1] as [number, number, number, number],
  easeInOutCirc: [0.85, 0, 0.15, 1] as [number, number, number, number],
  easeInBack: [0.36, 0, 0.66, -0.56] as [number, number, number, number],
  easeOutBack: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  easeInOutBack: [0.68, -0.6, 0.32, 1.6] as [number, number, number, number],
} as const;

export const css = {
  easeInSine: 'cubic-bezier(0.12, 0, 0.39, 0)',
  easeOutSine: 'cubic-bezier(0.61, 1, 0.88, 1)',
  easeInOutSine: 'cubic-bezier(0.37, 0, 0.63, 1)',
  easeInQuad: 'cubic-bezier(0.11, 0, 0.5, 0)',
  easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
  easeInOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  easeInQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
  easeInQuint: 'cubic-bezier(0.64, 0, 0.78, 0)',
  easeOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeInOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  easeInExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
  easeInCirc: 'cubic-bezier(0.55, 0, 1, 0.45)',
  easeOutCirc: 'cubic-bezier(0, 0.55, 0.45, 1)',
  easeInOutCirc: 'cubic-bezier(0.85, 0, 0.15, 1)',
  easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutBack: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

export const easings = { easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce } as const;
export type EasingName = keyof typeof easings;
