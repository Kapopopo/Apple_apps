# PressButton

Compresses slightly on press, then settles

## Fonctionnalités

- Layered scaleX + scaleY squash for an organic compression on press
- Tunable pressStrength (0-1) to control how much the button compresses
- Snappy spring with a tiny overshoot so the button "settles" instead of snapping
- 4 visual variants: Primary, Secondary, Outline, Ghost — light/dark theme aware
- 4 size dimensions: Small (sm), Medium (md), Large (lg), and square Icon
- Full keyboard accessibility with focus-ring and disabled state

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Visual presentation style |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Dimensions and typography scale |
| `pressStrength` | `number` | `0.04` | Compression amount on press (0-1, clamped 0.01-0.06) |
| `fullWidth` | `boolean` | `false` | Stretches button to 100% width of parent container |
| `disabled` | `boolean` | `false` | Prevents interaction and applies 30% disabled opacity |

_Généré par Component Atlas depuis les métadonnées publiées par la source._