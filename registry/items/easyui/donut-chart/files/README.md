# Donut Chart

Animated SVG donut and gauge chart with a live center value

## Fonctionnalités

- Full donut and semi-circle gauge variants from the same component
- Spring-animated arcs that grow in on mount and stretch on hover or focus
- Animated center number that counts up to the total and switches to the hovered slice
- Interactive legend toggles slices while keeping at least one visible
- Automatically holds the legend beside the ring on wide containers and below it on mobile
- Zero charting library dependencies with a fully responsive SVG
- Honors prefers-reduced-motion for arcs, center number, and readout transitions

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `data` | `DonutDatum[]` | — | Slices with a label, numeric value, and optional color |
| `variant` | `"donut" \| "semi"` | `"donut"` | Renders a full ring or a half-ring gauge |
| `size` | `number` | `240` | Largest diameter in pixels; the chart shrinks to fit narrow containers |
| `thickness` | `number` | `16` | Stroke width of the ring in pixels |
| `centerLabel` | `string` | `"Total"` | Caption shown above the total in the center |
| `formatValue` | `(n: number) => string` | `Intl.NumberFormat` | Formats center values, slice values, and tooltips |
| `showLegend` | `boolean` | `true` | Shows the interactive slice legend |
| `animated` | `boolean` | `true` | Enables intro and value animations (disabled for reduced motion) |
| `ariaLabel` | `string` | `auto-generated` | Accessible description for the chart image role |
| `className` | `string` | `""` | Additional CSS classes for the chart wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._