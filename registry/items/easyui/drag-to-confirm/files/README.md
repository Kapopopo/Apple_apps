# Drag to Confirm

Spring-resistant slider for confirming destructive or critical operations

## Fonctionnalités

- Clean minimalist pill geometry with seamless light and dark mode theme compatibility
- Dynamic progressive track fill that physically tracks the handle as you drag
- Physical gesture drag handle with calibrated spring snapback upon incomplete drags
- Supports Delete, Archive, Confirm, Submit, and Unlock action profiles with custom sizes (sm, md, lg)
- Automatic post-confirmation reset timer with customizable delay or controlled state support
- Full keyboard accessibility (Space, Enter, ArrowRight to trigger) and mobile haptic vibration feedback

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `label` | `string` | `'Slide to confirm'` | Action instruction text rendered along track |
| `confirmedLabel` | `string` | `'Confirmed ✓'` | Text shown when slider locks into completion |
| `actionType` | `'delete' \| 'archive' \| 'confirm' \| 'submit' \| 'unlock' \| 'continue'` | `'confirm'` | Action preset style and icon archetype |
| `variant` | `'default' \| 'danger' \| 'warning' \| 'info' \| 'success'` | `undefined` | Visual tone variant override |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Slider dimension profile (sm: 40px, md: 48px, lg: 54px) |
| `icon` | `React.ReactNode` | `undefined` | Custom idle state icon rendered inside thumb |
| `confirmedIcon` | `React.ReactNode` | `undefined` | Custom confirmed state icon rendered inside thumb |
| `isConfirmed` | `boolean` | `undefined` | Controlled confirmation state |
| `onConfirm` | `() => void` | `undefined` | Callback triggered upon successful confirmation completion |
| `onReset` | `() => void` | `undefined` | Callback triggered upon slider reset |
| `autoResetDelay` | `number` | `2500` | Milliseconds before resetting back to start (0 to disable) |
| `haptic` | `boolean` | `true` | Triggers subtle vibration feedback upon confirmation |
| `disabled` | `boolean` | `false` | Disables slider gesture and interaction |

_Généré par Component Atlas depuis les métadonnées publiées par la source._