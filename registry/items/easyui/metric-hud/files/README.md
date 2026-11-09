# Metric HUD

Interactive telemetry & sparkline HUD with live scrubbing

## Fonctionnalités

- Zero-dependency hardware-accelerated SVG sparkline rendering
- Interactive pointer crosshair scrubbing with dynamic coordinate inspection
- Spring-animated time-range switching (1h, 24h, 7d, 30d)
- Real-time delta trend badges (up / down / neutral) with status aura
- One-click metric value copying with validation feedback

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `metrics` | `MetricItem[]` | `[]` | Array of telemetry metric definitions with time-series data |
| `timeRanges` | `string[]` | `['1h', '24h', '7d', '30d']` | Available time window filters |
| `defaultTimeRange` | `string` | `'24h'` | Initial active time range |
| `className` | `string` | `undefined` | Custom CSS container styling |

_Généré par Component Atlas depuis les métadonnées publiées par la source._