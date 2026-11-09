# Stat Card

KPI tile with count-up, delta pill, and scrubable sparkline

## Fonctionnalités

- Count-up headline number on mount that follows the sparkline while scrubbing
- Delta pill computes change from a previous value or accepts an explicit percentage
- Direction-aware coloring with goodWhen="down" for churn, latency, and costs
- Hand-written SVG sparkline with a smooth monotone curve and gradient fill
- Pointer and touch scrubbing with a spring cursor and per-point labels
- Keyboard support with ArrowLeft, ArrowRight, and Escape
- StatGrid auto-fits tiles from a single mobile column to full-width rows
- Light and dark themes plus prefers-reduced-motion support

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Metric name shown above the headline number |
| `value` | `number` | — | Headline number; usually the latest point of trend |
| `trend` | `number[]` | — | Sparkline points ordered oldest to newest |
| `trendLabels` | `string[]` | — | Names for each trend point, shown while scrubbing |
| `previous` | `number` | — | Previous-period value used to compute the delta pill |
| `delta` | `number` | — | Explicit delta percentage, overriding the computed value |
| `goodWhen` | `"up" \| "down"` | `"up"` | Which direction counts as positive news |
| `period` | `string` | `"vs previous period"` | Caption under the number when not scrubbing |
| `format` | `(n: number) => string` | `Intl.NumberFormat` | Formats the headline, labels, and aria text |
| `color` | `string` | `CHART_COLORS[0]` | Sparkline stroke and gradient color |
| `animated` | `boolean` | `true` | Counts up on mount and animates the line (disabled for reduced motion) |
| `className` | `string` | `""` | Additional CSS classes for the card |
| `StatGrid.children` | `ReactNode` | — | StatCard tiles to arrange responsively |
| `StatGrid.className` | `string` | `""` | Additional CSS classes for the grid |

_Généré par Component Atlas depuis les métadonnées publiées par la source._