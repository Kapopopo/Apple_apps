# Activity Feed

Real-time telemetry event stream with expandable audit payloads

## Fonctionnalités

- Real-time simulation toggle streaming live webhook/deploy events
- Framer Motion layout and AnimatePresence entry transitions
- Category filtering (Deploy, Security, API, System) with live count tags
- Integrated JSON payload inspector with syntax highlighting and copy
- One-click trace ID copying with animated validation feedback

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `events` | `ActivityEvent[]` | `[]` | Array of audit or telemetry activity events |
| `enableLiveSimulation` | `boolean` | `true` | Whether to show the interactive simulated live stream toggle |
| `enableFilters` | `boolean` | `true` | Whether to display category filter pill buttons |
| `enableSearch` | `boolean` | `true` | Whether to show the trace search input |
| `maxEntries` | `number` | `20` | Maximum items retained in stream before pruning |
| `onEventReplay` | `(event: ActivityEvent) => void` | `undefined` | Optional callback to replay a logged event |
| `className` | `string` | `undefined` | Optional custom CSS class |

_Généré par Component Atlas depuis les métadonnées publiées par la source._