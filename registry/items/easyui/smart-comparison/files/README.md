# Smart Comparison

Interactive tier comparison matrix with difference filtering

## Fonctionnalités

- Live "Differences Only" filter to instantly surface plan divergence
- Integrated feature keyword search with real-time row matching
- Collapsible category groups with spring height transitions
- Segmented mobile plan selector avoiding wide horizontal table scrolling
- Contextual info tooltips and custom value cell rendering

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `plans` | `ComparisonPlan[]` | `[]` | Array of plans/tiers containing pricing and metadata |
| `categories` | `ComparisonCategory[]` | `[]` | Grouped feature categories with plan-specific values |
| `defaultPlanId` | `string` | `featured plan or plans[0].id` | Initial plan selected on mobile viewports |
| `enableSearch` | `boolean` | `true` | Whether to show the instant feature search input |
| `enableDiffFilter` | `boolean` | `true` | Whether to render the "Differences Only" toggle button |
| `className` | `string` | `undefined` | Optional CSS class name for container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._