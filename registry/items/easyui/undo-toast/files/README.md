# Undo Toast

Refined undo notification with real-time countdown progress and reversal animation

## Fonctionnalités

- Real-time smooth countdown progress bar illustrating time window remaining
- Intelligent pause-on-hover physics so users never miss undo deadlines
- Visual state morphing upon clicking Undo before gentle dismissal
- Configurable multi-corner positioning (top, bottom, center, corners)
- Multiple semantically tinted variants: Default, Success, Warning, Error, and Info

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `true` | Visibility state of the undo toast |
| `title` | `string` | `'Project archived'` | Primary notification message title |
| `description` | `string` | `'Changes will be permanent in a few seconds'` | Optional descriptive subtitle |
| `undoLabel` | `string` | `'Undo'` | Label for undo action trigger |
| `restoredMessage` | `string` | `'Restored successfully'` | Title displayed when action has been reversed |
| `duration` | `number` | `5000` | Duration in milliseconds before auto-dismissal |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Semantic visual tone |
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-center'` | Screen placement |
| `onUndo` | `() => void` | `undefined` | Callback fired when user clicks Undo |
| `onDismiss` | `() => void` | `undefined` | Callback fired when toast closes or expires |
| `showProgress` | `boolean` | `true` | Whether to show the countdown bar |

_Généré par Component Atlas depuis les métadonnées publiées par la source._