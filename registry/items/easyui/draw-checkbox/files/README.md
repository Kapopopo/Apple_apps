# DrawCheckbox

Checkmark draws itself, then settles

## Fonctionnalités

- Checkmark animates via stroke-dashoffset (path length 0 -> 1) with a snappy draw curve
- Box scales 0.9 -> 1.04 -> 1.0 for a tiny physical overshoot, then settles
- Indeterminate state draws a bar from left to right via scaleX origin
- Accent background swaps to var(--accent) when checked — theme aware
- Full controlled / uncontrolled state support, plus ref forwarding

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `label` | `React.ReactNode` | `undefined` | Label text displayed next to the box |
| `description` | `string` | `undefined` | Helper text below the label |
| `indeterminate` | `boolean` | `false` | When true, renders a horizontal bar instead of a checkmark |
| `checked` | `boolean` | `undefined` | Controlled checked state |
| `defaultChecked` | `boolean` | `false` | Initial checked state (uncontrolled) |
| `disabled` | `boolean` | `false` | Prevents interaction |

_Généré par Component Atlas depuis les métadonnées publiées par la source._