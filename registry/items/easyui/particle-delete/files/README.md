# Particle Delete

Physics-driven pixel particle dissolution delete animation

## Fonctionnalités

- Authentic pixel capture inherits real component colors and typography
- Hardware-accelerated 60 FPS Canvas rendering with zero DOM overhead
- Configurable physics: duration, explosion force, drag, and dissolution spread
- Full accessibility support with automatic prefers-reduced-motion fallback
- Available as direct utility particleDelete(), hook useParticleDelete(), or <ParticleDeleteContainer /> wrapper

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `onDelete` | `() => void` | — | Callback invoked after the particle dissolution finishes to remove state |
| `options.duration` | `number` | `850` | Animation duration in milliseconds |
| `options.force` | `number` | `1.0` | Outward velocity multiplier for particle dispersion |
| `options.particleSize` | `number` | `1.5` | Visual diameter of individual particles in pixels |
| `options.dissolvePattern` | `'center-first' \| 'edges-first' \| 'uniform' \| 'random'` | `'center-first'` | Dissolution spread delay algorithm |
| `options.sampleStep` | `number` | `2 (desktop) / 3 (mobile)` | Pixel sampling step interval |

_Généré par Component Atlas depuis les métadonnées publiées par la source._