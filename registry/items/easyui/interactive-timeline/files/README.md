# Interactive Timeline

Milestone & pipeline tracker with spring progress physics

## Fonctionnalités

- Animated continuous progress line with spring physics
- Interactive status nodes (completed, in-progress, pending, failed) with breathing aura
- Collapsible details with metrics grid and commit metadata
- One-click commit hash copying with feedback state
- Accessible semantic list and keyboard navigation structure

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `TimelineItem[]` | `[]` | Array of timeline step items |
| `defaultSelectedId` | `string` | `items[0]?.id` | ID of the item initially expanded |
| `collapsible` | `boolean` | `true` | Whether cards can be expanded/collapsed on click |
| `onItemSelect` | `(item: TimelineItem) => void` | `undefined` | Callback invoked when a timeline node or card is selected |
| `className` | `string` | `undefined` | Optional CSS classes for outer container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._