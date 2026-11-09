# Sheet

Drag-to-dismiss sheet with spring physics

## Fonctionnalités

- Four sides: right, left, top, bottom with directional drag-to-dismiss
- Touch: swipe left/right sheets anywhere; top/bottom sheets use the grab handle
- Springs back when released early; rubber-band elastic resistance
- Portal rendering, focus trap + focus return, Esc, scroll lock without layout shift
- ARIA dialog wired to SheetTitle/SheetDescription; backdrop click closes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled open state (on Sheet) |
| `defaultOpen` | `boolean` | `false` | Initial open state (uncontrolled) |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Open state change callback |
| `side` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | Side the sheet slides in from (on SheetContent) |
| `showClose` | `boolean` | `true` | Show the built-in close button |
| `className` | `string` | `undefined` | Additional class for the panel |

_Généré par Component Atlas depuis les métadonnées publiées par la source._