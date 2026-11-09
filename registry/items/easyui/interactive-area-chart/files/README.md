# Interactive Area Chart

Zero-dependency interactive SVG area chart with range morphing and scrubbing

## Fonctionnalités

- Hand-crafted SVG path generation with zero charting library dependencies
- Interruptible dataset morphing transition between date ranges (7D, 30D, 1Y)
- Catmull-Rom spline interpolation for smooth curve rendering
- Fluid scrubbing with spring-tracked crosshair, dot, and floating tooltip
- Full keyboard scrubbing support using Left and Right arrow keys

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `data` | `AreaChartData` | `DEFAULT_AREA_CHART_DATA` | Dictionary of time-series datasets keyed by range labels (e.g. 7D, 30D, 1Y) |
| `defaultRange` | `string` | `"30D"` | Initial active range key |
| `title` | `string` | `"Revenue"` | Chart title displayed in header |
| `height` | `number` | `280` | Fixed pixel height of the chart SVG area |
| `className` | `string` | `""` | Additional CSS class names |

_Généré par Component Atlas depuis les métadonnées publiées par la source._