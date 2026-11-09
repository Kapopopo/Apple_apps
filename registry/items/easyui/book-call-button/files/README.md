# Book Call Button

Expanding accent pill with phone hover state

## Fonctionnalités

- Three independently-timed motion layers: expanding capsule, label/arrow, and phone icon
- Capsule grows from "left center" so the expansion feels directional, not scale-from-middle
- Hover lift (1.01) and tap compression (0.975) on the pill itself, independent of the inner choreography
- Renders as <a> when href is provided so the same component works on a marketing page or a form action
- prefers-reduced-motion collapses every spring to an instant state change — no travel, no entrance
- Decorative SVGs are aria-hidden; the label is conveyed by aria-label on the interactive root
- Native <button> / <a> elements with focus-visible ring tied to the accent color

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `string` | `'Book a call'` | Label rendered to the right of the dotted arrow at rest |
| `onClick` | `() => void` | `undefined` | Click handler — ignored when href is also provided |
| `href` | `string` | `undefined` | When provided, the pill renders as an <a> with this href instead of a <button> |
| `className` | `string` | `undefined` | Additional Tailwind classes merged into the pill root |

_Généré par Component Atlas depuis les métadonnées publiées par la source._