# Alert

Smooth height collapse on dismissal with tone styling

## Fonctionnalités

- Dismissing collapses height and fades out smoothly without sudden content jumps
- Supports 5 semantic tones: neutral, info, success, warning, and danger
- Automatic matching Lucide icons with custom icon or icon={false} override
- Action slot on the right for buttons, retry triggers, or secondary actions
- Proper accessibility: role="alert" for danger/warning and role="status" for neutral/info/success

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Color tone and severity semantic level |
| `icon` | `React.ReactNode \| false` | `undefined` | Custom icon element, or false to suppress icon |
| `dismissible` | `boolean` | `false` | Renders an interactive close button |
| `onDismiss` | `() => void` | `undefined` | Callback invoked after the exit collapse animation completes |
| `action` | `React.ReactNode` | `undefined` | Optional right-hand action element (e.g. action button) |
| `className` | `string` | `undefined` | Additional CSS classes for the alert container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._