# Sparkles Core

Zero-dependency GPU canvas particle sparkles with celestial stars, organic twinkle, and cursor reactions

## Fonctionnalités

- Zero external particle dependencies: 100% native HTML5 Canvas 2D with sub-pixel DPR scaling
- Full backward compatibility with Aceternity SparklesCore props signature
- Multiple particle shapes: circle, 4-pointed diamond star, celestial cross starlet, or mixed
- Multi-color palette distribution supporting chromatic nebulae and gradient sparkle fields
- Organic twinkle brightness pulsation with phase modulation and customizable twinkle speeds
- Directional drift flows: float organically in all directions, or drift top, bottom, left, or right
- Interactive cursor modes: repulsion, attraction, or proximity radiant enlargement
- Click & tap particle burst generation spawning dynamic kinetic firework sparks
- Wraps arbitrary children effortlessly with pointer event pass-through and depth stratification
- Full accessibility: aria-hidden canvas and prefers-reduced-motion compliance

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Optional unique HTML id attribute for the canvas element |
| `background` | `string` | `'transparent'` | Background color of the sparkle container (CSS color, hex, rgba, or gradient) |
| `className` | `string` | — | Additional CSS utility classes applied to the root container |
| `particleColor` | `string` | `'#FFFFFF'` | Primary color for single-tint particle sparkle fields |
| `particleColors` | `string[]` | — | Array of colors distributed across sparkles for chromatic or starry night effects |
| `minSize` | `number` | `0.6` | Minimum radius/size in pixels for spawned sparkles |
| `maxSize` | `number` | `2.4` | Maximum radius/size in pixels for spawned sparkles |
| `particleSize` | `number` | — | Uniform particle size override (locks both minSize and maxSize) |
| `speed` | `number` | `1` | Particle movement velocity multiplier |
| `particleDensity` | `number` | `120` | Particle density factor calculated relative to a 400x400 area |
| `particleCount` | `number` | — | Exact particle count override ignoring density calculations |
| `particleShape` | `'circle' \| 'star' \| 'cross' \| 'mixed'` | `'circle'` | Geometry shape of particles: circle, 4-point radiant star, cross starlet, or mixed |
| `direction` | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `'none'` | Directional flow drift; none provides organic cosmic floating |
| `twinkle` | `boolean` | `true` | Enables dynamic sinusoidal twinkle opacity pulsation |
| `twinkleSpeed` | `number` | `1` | Frequency speed multiplier for twinkle pulsation |
| `interactive` | `boolean` | `true` | Enables mouse pointer tracking and interaction reactions |
| `cursorMode` | `'repulse' \| 'attract' \| 'sparkle' \| 'none'` | `'repulse'` | Cursor reaction: repulse away, attract toward cursor, or sparkle illuminate |
| `cursorRadius` | `number` | `140` | Influence radius in pixels around the pointer |
| `clickPush` | `number` | `6` | Number of spark particles burst on click/tap |
| `opacity` | `number` | `1` | Global master opacity scalar for the sparkle canvas |
| `blur` | `number` | `0` | CSS blur filter radius in pixels for soft glowing bloom |
| `children` | `ReactNode` | — | Optional content rendered above the sparkles with full clickability and isolation |

_Généré par Component Atlas depuis les métadonnées publiées par la source._