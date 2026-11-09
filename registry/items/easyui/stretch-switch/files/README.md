# StretchSwitch

Thumb stretches on press, then snaps

## Fonctionnalités

- Thumb scaleX -> 1.18 / scaleY -> 0.86 while pointer is held for a tactile stretch
- Snappy spring (springSnappy) drives the snap to the new x position on release
- Press state is captured via pointerdown / pointerup, so it works for keyboard activations too
- Controlled / uncontrolled state, with onChange callback
- Light/dark theme aware via CSS variables — works in both palettes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `checked` | `boolean` | `undefined` | Controlled checked state |
| `defaultChecked` | `boolean` | `false` | Initial checked state (uncontrolled) |
| `disabled` | `boolean` | `false` | Prevents interaction |
| `onChange` | `(checked: boolean) => void` | `undefined` | Called when the switch toggles |
| `label` | `React.ReactNode` | `undefined` | Label text on the left |
| `description` | `string` | `undefined` | Helper text below the label |

_Généré par Component Atlas depuis les métadonnées publiées par la source._