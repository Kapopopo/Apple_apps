# DirectionalTooltip

Appears from its origin direction

## Fonctionnalités

- Entry motion originates from the chosen side (top/right/bottom/left)
- Snappy spring (springSnappy) settles the tooltip into place
- Alignment per side: start / center / end
- Configurable delay, offset, and optional arrow indicator
- Light/dark theme aware via CSS variables

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `content` | `React.ReactNode` | `undefined` | Tooltip body content |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Preferred side for the tooltip |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment along the chosen side |
| `delayDuration` | `number` | `150` | Delay before showing, in ms |
| `showArrow` | `boolean` | `true` | Show the arrow indicator |
| `offset` | `number` | `8` | Spacing from the trigger in px |
| `forceOpen` | `boolean` | `false` | Force the tooltip open (for previews) |

_Généré par Component Atlas depuis les métadonnées publiées par la source._