# Live Line Chart

Scrolling real-time line chart with pause, scrub, and live readout

## Fonctionnalités

- Subscribes to any push-based source such as a WebSocket, SSE stream, or interval
- Draws directly into the DOM at 60fps without React re-renders on every frame
- Auto-scaling y-range that eases smoothly as the visible window changes
- Hovering or touching pauses the stream and freezes the frame for inspection
- Crosshair tooltip shows the sampled value and how many seconds ago it arrived
- Large readout with a live delta and a pause/resume button
- Optional fixed y-domain, custom units, formatters, and colors
- Pauses rendering when off-screen or when the tab is hidden
- Container-aware sizing and prefers-reduced-motion support

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `source` | `(push) => void \| (() => void)` | — | Data feed subscription; call push(value) for each new reading and return a cleanup |
| `initial` | `number[]` | — | Known values, oldest to newest, spaced intervalMs apart and ending now |
| `intervalMs` | `number` | `1000` | Approximate arrival interval and the smoothing delay |
| `windowSeconds` | `number` | `60` | Seconds visible in the scrolling window |
| `height` | `number` | `220` | Chart height in pixels |
| `color` | `string` | `CHART_COLORS[0]` | Line stroke and area gradient color |
| `unit` | `string` | `""` | Unit shown beside the readout and tooltip values |
| `formatValue` | `(n: number) => string` | `Intl.NumberFormat` | Formats the current value, tooltip, and aria text |
| `domain` | `[number, number]` | — | Fixed y-range instead of auto-scaling to the visible window |
| `showReadout` | `boolean` | `true` | Shows the large current value, delta, and pause button |
| `ariaLabel` | `string` | `auto-generated` | Accessible description for the chart image role |
| `className` | `string` | `""` | Additional CSS classes for the chart wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._