# VelocityToast

Enters with velocity, settles naturally

## Fonctionnalités

- Entry animation starts further out (y: 22px) for higher perceived velocity, then springs to rest
- Progress indicator uses a slight ease-in (pow 1.05) so the final 10% feels decisive
- Hover pauses progress without visual jump; resume picks up from the remaining time
- 6 position presets, 5 variant tones, optional custom icon
- Light/dark theme aware — works in both palettes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Whether the toast is visible |
| `onDismiss` | `() => void` | `undefined` | Called when toast is dismissed (auto or manual) |
| `title` | `string` | `undefined` | Toast title |
| `description` | `string` | `undefined` | Secondary description |
| `duration` | `number` | `4000` | Auto-dismiss duration in ms |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Visual tone |
| `position` | `VelocityToastPosition` | `'bottom-center'` | Screen placement |
| `showProgress` | `boolean` | `true` | Show countdown progress bar |

_Généré par Component Atlas depuis les métadonnées publiées par la source._