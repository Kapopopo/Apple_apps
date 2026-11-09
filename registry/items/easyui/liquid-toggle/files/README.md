# Liquid Toggle

Morphing liquid blob toggle

## Fonctionnalités

- Internal blob shape continuously morphs between states
- Transient stretch pulse along the travel axis when toggling
- Spring-smoothed progress with mass/damping tuning
- Controlled and uncontrolled usage via value/defaultValue/onChange
- Respects prefers-reduced-motion (uses static state fallback)

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `value` | `boolean` | `undefined` | Controlled value |
| `defaultValue` | `boolean` | `false` | Initial value for uncontrolled mode |
| `onChange` | `(value: boolean) => void` | `undefined` | Toggle change callback |
| `disabled` | `boolean` | `false` | Disabled state |
| `offLabel` | `string` | `'Off'` | Screen reader label when off |
| `onLabel` | `string` | `'On'` | Screen reader label when on |
| `accentColor` | `string` | `'#FAFAFA'` | Blob color when on |
| `showLabels` | `boolean` | `true` | Show OFF/ON text inside the track |
| `width` | `number` | `56` | Track width in px |
| `height` | `number` | `32` | Track height in px |

_Généré par Component Atlas depuis les métadonnées publiées par la source._