# FAQ

Expandable spring-physics accordion with search & category filtering

## Fonctionnalités

- Smooth height calculation and rotation via Framer Motion springGentle
- Single-open accordion or multi-open simultaneous expansion modes
- Controlled and uncontrolled state management (openIds / defaultOpen)
- Integrated search filter bar and optional category filter pills
- Two layout modes: Unified grouped card or separated individual cards
- Full keyboard accessibility (Space, Enter, Tab) and ARIA attributes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `FAQItem[]` | `[]` | Array of FAQ items with id, question, answer, category, badge, icon |
| `allowMultiple` | `boolean` | `false` | Allows multiple accordion items to remain open simultaneously |
| `defaultOpen` | `string[] \| string` | `undefined` | Default expanded item ID(s) on initial mount |
| `openIds` | `string[]` | `undefined` | Controlled list of currently expanded item IDs |
| `onOpenChange` | `(ids: string[]) => void` | `undefined` | Callback fired when open item selection changes |
| `iconStyle` | `'chevron' \| 'plus-minus' \| 'custom'` | `'chevron'` | Indicator icon style |
| `searchable` | `boolean` | `false` | Displays search filter bar above FAQ items |
| `showCategories` | `boolean` | `false` | Displays category filter pills above items |
| `variant` | `'unified' \| 'separated'` | `'unified'` | Visual presentation layout |

_Généré par Component Atlas depuis les métadonnées publiées par la source._