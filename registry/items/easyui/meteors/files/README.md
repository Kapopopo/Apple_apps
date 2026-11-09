# Meteors

Luminous diagonal meteor trails streaming across cards and hero containers

## Fonctionnalités

- Super lightweight pure CSS keyframe hardware-accelerated animations
- Configurable trajectory angle (default 215° diagonal down-left)
- Customizable head color, tail gradient, tail length, and speed
- Randomized distribution and staggered delays preventing rhythmic clustering
- Drop-in compatible with cards, hero banners, and button containers
- Full prefers-reduced-motion support disabling animations automatically

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `number` | `number` | `20` | Total number of animated meteor streaks to generate |
| `color` | `string` | `'#94A3B8'` | Luminous head color and halo glow tint |
| `trailColor` | `string` | `'#64748B'` | Base color of the gradient fading tail |
| `tailLength` | `number` | `60` | Length in pixels of each meteor streak tail |
| `angle` | `number` | `215` | Flight trajectory angle in degrees (215° is down-left) |
| `minDelay` | `number` | `0.2` | Minimum animation delay in seconds |
| `maxDelay` | `number` | `1.2` | Maximum animation delay in seconds |
| `minDuration` | `number` | `2` | Minimum animation duration in seconds |
| `maxDuration` | `number` | `8` | Maximum animation duration in seconds |
| `className` | `string` | — | Additional CSS classes for container positioning |
| `children` | `ReactNode` | — | Optional content rendered above or inside the meteor container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._