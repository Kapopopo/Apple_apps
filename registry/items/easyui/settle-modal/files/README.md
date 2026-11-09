# SettleModal

Content scales and settles, never fades

## Fonctionnalités

- Panel animates scale 0.94 -> 1.02 -> 1.0 with ease-soft curve for a tactile "settle"
- Inner content has its own layered scale-up (0.98 -> 1.0) for a nested feel
- Escape key dismisses; backdrop click closes by default (toggle via closeOnBackdrop)
- Scroll lock while open; restores previous overflow on close
- Three size presets (sm / md / lg) with optional title, description, and footer slots

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Whether the modal is open |
| `onClose` | `() => void` | `undefined` | Called when the modal should close |
| `title` | `React.ReactNode` | `undefined` | Optional title rendered at the top |
| `description` | `React.ReactNode` | `undefined` | Optional secondary description below the title |
| `children` | `React.ReactNode` | `undefined` | Main content area |
| `footer` | `React.ReactNode` | `undefined` | Footer area, typically action buttons |
| `hideCloseButton` | `boolean` | `false` | Hide the close (X) button |
| `closeOnBackdrop` | `boolean` | `true` | Click on backdrop closes the modal |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Maximum width preset |

_Généré par Component Atlas depuis les métadonnées publiées par la source._