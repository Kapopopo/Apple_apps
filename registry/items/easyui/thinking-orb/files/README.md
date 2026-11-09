# Thinking Orb

Minimalist monochrome particle vortex for AI interfaces

## Fonctionnalités

- Pure monochrome aesthetic (clean white/silver on dark, deep obsidian on light) with zero colors
- 9 unique cognitive states: working, searching, solving, listening, connecting, weaving, composing, breathing, and shaping
- GPU-accelerated Canvas rendering with 3D spherical trigonometry and perspective projection
- Adaptive particle density scaling automatically calibrated to size
- Full accessibility support with automatic prefers-reduced-motion fallback
- Minimalist optical core with subtle particle motion trailing and star sparkles

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `state` | `'working' \| 'searching' \| 'solving' \| 'listening' \| 'connecting' \| 'weaving' \| 'composing' \| 'breathing' \| 'shaping'` | `'working'` | Cognitive animation behavior preset and mathematical deformation pattern |
| `size` | `number` | `64` | Diameter of the canvas orb in pixels (e.g. 64 for avatar/assistant, 20 for inline text) |
| `speed` | `number` | `1` | Animation playback speed multiplier (1 = standard, 2 = 2x faster, 0.5 = slow) |
| `dark` | `boolean` | `true` | Dark mode tuning: true renders luminous white particles, false renders crisp dark graphite particles |
| `paused` | `boolean` | `false` | Freezes animation frame progression while preserving current particle positions |
| `className` | `string` | `undefined` | Optional CSS class string applied to the outer container |
| `style` | `CSSProperties` | `undefined` | Inline styles passed directly to the container span |
| `aria-label` | `string` | `'${state} orb'` | Accessible label for screen readers announcing the orb state |

_Généré par Component Atlas depuis les métadonnées publiées par la source._