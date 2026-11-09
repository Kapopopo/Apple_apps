# Small Floating Dock

Hover proximity scale & tactile action pills

## Fonctionnalités

- Proximity-aware hover scale with elastic spring snap-back physics
- Supports 3 to 5 actions with numeric unread badges and contextual tooltips
- Configurable screen positioning (bottom-right, bottom-center, bottom-left)
- Optional hide-on-scroll behavior with smooth viewport transitions
- Full keyboard tab navigation and WCAG AA focus rings

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `DockItem[]` | `[]` | Array of 3 to 5 action items with icon, label, action, and badge |
| `position` | `'bottom-right' \| 'bottom-center' \| 'bottom-left'` | `'bottom-right'` | Screen placement |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button sizing scale |
| `hideOnScroll` | `boolean` | `false` | Auto-hides dock during downward scroll |
| `variant` | `'icon-only' \| 'icon-label'` | `'icon-only'` | Icon only with tooltips or labeled buttons |
| `activeId` | `string` | `undefined` | Selected active item ID |

_Généré par Component Atlas depuis les métadonnées publiées par la source._