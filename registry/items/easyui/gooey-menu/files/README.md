# Gooey Menu

Liquid gooey spring dropdown menu with SVG filter physics

## Fonctionnalités

- Real-time SVG color-matrix metaball fusion filter creates organic liquid stretch and tear dynamics
- Choreographed staggered dropdown items with fast exit transitions
- Complete keyboard accessibility (Arrow keys, Enter, Space, Escape) and ARIA listbox semantics
- Click-outside listener and controlled/uncontrolled state support
- Respects prefers-reduced-motion: automatically disables intense blur filters

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `options` | `string[]` | `['Home', 'About', 'Projects', 'Contact', 'Book a call', 'Follow us']` | Array of option labels |
| `value` | `string` | `undefined` | Controlled active selected option |
| `defaultValue` | `string` | `options[0]` | Default selected option if uncontrolled |
| `open` | `boolean` | `undefined` | Controlled open dropdown state |
| `defaultOpen` | `boolean` | `false` | Initial open dropdown state if uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback fired when open state changes |
| `onSelect` | `(option: string, index: number) => void` | `undefined` | Callback fired on option selection |
| `width` | `number` | `306` | Pixel width of the menu pill and container |
| `className` | `string` | `undefined` | Custom CSS class overrides |

_Généré par Component Atlas depuis les métadonnées publiées par la source._