# LockInput

Focus state that "locks" into place

## Fonctionnalités

- Focus ring scales in from 0.94 to 1.0 with a snappy spring, producing a physical "lock" feel
- Inset border ring fades in alongside the outer focus halo for a layered lock effect
- Icon and label slots adjust contrast on focus to draw the eye inward
- Error state replaces accent with restrained rose and animates message in
- Light/dark theme aware via CSS variables — same code, both themes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `label` | `string` | `undefined` | Visible label rendered above the input |
| `description` | `string` | `undefined` | Helper text below the input |
| `error` | `string` | `undefined` | Error message; presence triggers danger styling |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon element placed before the input value |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon element placed after the input value |
| `disabled` | `boolean` | `false` | Prevents interaction and applies 30% disabled opacity |

_Généré par Component Atlas depuis les métadonnées publiées par la source._