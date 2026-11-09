# Badge

Rolling number animation & live status pulse

## Fonctionnalités

- Numbers and text roll up with spring physics when updated
- Optional live status dot with pulsing radar ping effect
- Interactive removable chip support with animated onRemove trigger
- 3 styles (soft, solid, outline) × 4 tones (neutral, success, warning, danger)
- Motion-ready component accepting initial, animate, and layout animations directly

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `variant` | `'soft' \| 'solid' \| 'outline'` | `'soft'` | Visual style of the badge |
| `tone` | `'neutral' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Color tone of the badge |
| `dot` | `boolean` | `false` | Displays a leading status indicator dot |
| `pulse` | `boolean` | `false` | Adds a soft animated pulse ring to the status dot |
| `onRemove` | `() => void` | `undefined` | Callback enabling dismissible chip mode with an × icon |
| `children` | `React.ReactNode` | `undefined` | Badge contents (strings & numbers auto-roll on change) |

_Généré par Component Atlas depuis les métadonnées publiées par la source._