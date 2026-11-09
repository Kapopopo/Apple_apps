# Morphing Mega Menu

Stripe-style morphing navigation panel with spring physics and cursor tracking

## Fonctionnalités

- Single morphing surface that smoothly animates width, height, and x-position
- Spring-tracked arrow indicator following pointer movement along the navigation triggers
- ResizeObserver-driven dimension calculation for arbitrary nested menus
- Full keyboard accessibility including ArrowDown direct content traversal and Esc dismissal
- Graceful touch outside-press dismissal and reduced motion awareness

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `MegaMenuItem[]` | `DEFAULT_MEGA_MENU_ITEMS` | Array of menu items with optional custom content panels |
| `className` | `string` | `""` | Optional CSS class overrides for root wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._