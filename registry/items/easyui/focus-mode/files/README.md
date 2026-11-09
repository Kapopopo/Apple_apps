# Focus Mode

Atmospheric UI isolation dimming background distractions without layout shifts

## Fonctionnalités

- Subtle background opacity dampening bringing selected components into focus
- Zero layout shift architecture keeping existing dashboard grid geometry intact
- Tactile spring scaling and border elevation on active focused target
- Keyboard Escape key listener and explicit exit controls
- Reduced motion support with instant opacity transitions

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `FocusModeItem[]` | `[...]` | List of dashboard cards or sections |
| `focusedId` | `string \| null` | `null` | Controlled focused card ID |
| `onFocusChange` | `(id: string \| null) => void` | `undefined` | Callback fired when focused element changes |
| `dimOpacity` | `number` | `0.2` | Opacity applied to unfocused background cards |

_Généré par Component Atlas depuis les métadonnées publiées par la source._