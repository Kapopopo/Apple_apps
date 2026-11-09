# Hamburger Menu

Architectural line morphing & symmetrical spring motion

## Fonctionnalités

- Symmetric line rotation and middle line dissolution with zero layout shift
- Customizable size, stroke thickness, and color tokens
- Keyboard accessible with Space and Enter triggers and Escape close support
- Integrated aria-expanded and dynamic aria-label status updates

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | — | Active open/closed toggle state |
| `onChange` | `(isOpen: boolean) => void` | — | Callback fired on user interaction |
| `size` | `number` | `24` | Width and height of the icon bounding box in pixels |
| `color` | `string` | `'currentColor'` | Color of the SVG/CSS line strokes |
| `label` | `string` | `'Menu'` | Accessible name announced to assistive tech |
| `disabled` | `boolean` | `false` | Disables button interactions |

_Généré par Component Atlas depuis les métadonnées publiées par la source._