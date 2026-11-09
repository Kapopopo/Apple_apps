# Peek Card

Origin-anchored contextual preview card with edge-aware collision detection

## Fonctionnalités

- Origin-anchored emergence animation feeling connected to source elements
- Automatic edge collision detection preventing viewport bounding overflow
- Rich preset layout for transactions, user profiles, invoices, and metrics
- Mobile tap toggle and desktop hover/focus dual interaction model
- Integrated copy actions and status indicators with reduced-motion support

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `undefined` | Trigger target element wrapped by peek card |
| `data` | `PeekCardData` | `[...]` | Structured preview dataset |
| `delay` | `number` | `200` | Hover activation delay in milliseconds |
| `placement` | `'top' \| 'bottom' \| 'auto'` | `'auto'` | Preferred emergence direction |
| `isLoading` | `boolean` | `false` | Renders skeleton placeholder during async lookup |

_Généré par Component Atlas depuis les métadonnées publiées par la source._