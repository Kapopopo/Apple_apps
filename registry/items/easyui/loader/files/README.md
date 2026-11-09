# Loader

Calm, continuous feedback states with zero visual stress

## Fonctionnalités

- 4 refined motion variants: rotating arc, breathing dots, sliding line, and expanding concentric rings
- Configurable dimensions and stroke colors with seamless dark mode support
- Accessible role="status" and aria-busy telemetry without screen reader interruption
- Automatic reduced-motion adaptation for sensitive viewers

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `size` | `number` | `32` | Diameter or width scale in pixels |
| `variant` | `'arc' \| 'dots' \| 'line' \| 'rings'` | `'arc'` | Visual animation mode |
| `label` | `string` | `'Loading...'` | Accessible screen reader text label |
| `reduceMotion` | `boolean` | `false` | Disables high-velocity continuous spins |
| `color` | `string` | `'currentColor'` | CSS color string for indicator strokes |
| `className` | `string` | `undefined` | Additional CSS class names |

_Généré par Component Atlas depuis les métadonnées publiées par la source._