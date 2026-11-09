# Morphing Button

Dimension-preserving state morphing button with fluid icon transitions

## Fonctionnalités

- Zero layout shift architecture preserving natural bounding dimensions across states
- Icon morphing with spring-based scale and translation transitions
- Multiple design presets (Primary, Secondary, Danger, and Ghost)
- Interactive spring tap physics (whileTap scale 0.97)
- Complete disabled and busy ARIA state compatibility

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `status` | `'idle' \| 'loading' \| 'success' \| 'error'` | `'idle'` | Current button lifecycle state |
| `idleText` | `string` | `'Save Changes'` | Label shown in default resting state |
| `loadingText` | `string` | `'Saving...'` | Label shown when operation is pending |
| `successText` | `string` | `'Saved'` | Label shown upon successful completion |
| `errorText` | `string` | `'Failed'` | Label shown when operation fails |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Visual surface styling preset |

_Généré par Component Atlas depuis les métadonnées publiées par la source._