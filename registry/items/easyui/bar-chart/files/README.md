# Bar Chart

Animated grouped and stacked SVG bar chart with legend filtering

## Fonctionnalités

- Grouped and stacked layouts with interruptible, morphing bar transitions
- Zero charting library dependencies — every bar is generated with hand-written SVG paths
- Interactive legend that toggles series on and off while keeping at least one visible
- Floating tooltip tracks the hovered category and shows per-series values and totals
- Container-aware sizing with a ResizeObserver so the chart fits cards on mobile
- Screen-reader table and keyboard navigation with arrow keys, Home, End, and Escape
- Honors prefers-reduced-motion by disabling entrance and layout animations

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `data` | `BarDatum[]` | — | Categories to render; each row needs a label plus one numeric key per series |
| `series` | `BarSeries[]` | — | Series definitions with a data key, display label, and optional color |
| `variant` | `"grouped" \| "stacked"` | `"grouped"` | Places bars side by side or stacks them on top of each other |
| `height` | `number` | `260` | Height of the chart area in pixels |
| `formatValue` | `(n: number) => string` | `Intl.NumberFormat` | Formats values shown in tooltips and the accessible data table |
| `formatTick` | `(n: number) => string` | `compact Intl.NumberFormat` | Formats the y-axis tick labels |
| `showLegend` | `boolean` | `true` | Shows the interactive series legend when more than one series exists |
| `animated` | `boolean` | `true` | Enables entrance and bar morph animations (disabled for reduced motion) |
| `ariaLabel` | `string` | `auto-generated` | Accessible description for the chart image role |
| `className` | `string` | `""` | Additional CSS classes for the chart wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._