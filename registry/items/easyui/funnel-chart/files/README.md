# Funnel Chart

Conversion funnel with per-stage drop-off and a loss summary

## Fonctionnalités

- Proportional stage bars with rounded ends and a color ramp from first to last stage
- Curved bridges show the users lost between each pair of stages
- Drop-off chips sit between stages and highlight the hovered step
- Summary line reports overall conversion and the biggest single drop-off
- Floating tooltip shows users, percentage of the top stage, and the next loss
- Container-aware sizing keeps labels and values readable on mobile
- Keyboard navigation with ArrowUp, ArrowDown, and Escape
- Screen-reader table mirrors every stage value and percentage
- prefers-reduced-motion disables bridge and bar entrance animations

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `stages` | `FunnelStage[]` | — | Ordered stages with a label, value, and optional color |
| `formatValue` | `(n: number) => string` | `Intl.NumberFormat` | Formats stage values in the chart, tooltip, and data table |
| `showSummary` | `boolean` | `true` | Shows overall conversion and the biggest drop-off above the funnel |
| `animated` | `boolean` | `true` | Enables bridge, bar, and chip entrance animations |
| `ariaLabel` | `string` | `auto-generated` | Accessible chart description and data table caption |
| `className` | `string` | `""` | Additional CSS classes for the funnel wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._