# Stacked Cards

Scroll-driven sticky stacking cards

## Fonctionnalités

- Naturally aligned column layout in the initial view
- Scroll-driven sticky stacking where cards stack one above another on scroll
- Non-blocking native window scrolling — continues to subsequent sections seamlessly
- Responsive two-column grid on desktop, single-column on mobile
- Dark and light mode compatible with high-contrast typography and borders
- Hardware accelerated motion transitions with subtle depth shadow
- Respects prefers-reduced-motion preferences

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `cards` | `StackedCard[]` | `defaultCards` | Array of card objects with title, description, image, and optional CTA link |
| `title` | `string` | `undefined` | Optional section heading title |
| `subtitle` | `string` | `undefined` | Optional section description subtitle |
| `className` | `string` | `undefined` | Optional custom Tailwind styling for the outer wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._