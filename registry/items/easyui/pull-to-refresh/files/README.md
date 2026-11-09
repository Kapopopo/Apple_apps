# Pull to Refresh

Elastic pull gesture with smooth interactive line charts and async lifecycle feedback

## Fonctionnalités

- Seamless Light and Dark mode theming with tuned contrast and crisp aesthetics
- Physical logarithmic spring resistance matching iOS and native touch physics
- Interactive pointer and touch chart scrubbing with realtime price and timestamp tracking
- Integrated financial statistics card with smooth bezier curve line chart, area fill, and endpoint glow
- Minimal key metrics summary row (24h High, 24h Low, Volume)
- Reactive time range switching (1H, 4H, 1D) with spring morph pill indicators
- Full async lifecycle support (idle, pulling, ready, refreshing, complete)
- Keyboard accessible refresh triggers (Press R or Enter) and screen reader support

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `onRefresh` | `() => Promise<void> \| void` | `undefined` | Async or sync callback executed when released beyond threshold |
| `threshold` | `number` | `68` | Downward travel distance in pixels required to trigger refresh |
| `maxPull` | `number` | `110` | Maximum drag distance limit |
| `resistance` | `number` | `0.45` | Elastic resistance multiplier |
| `refreshingHoldOffset` | `number` | `48` | Vertical offset to hold content at while refresh resolves |
| `disabled` | `boolean` | `false` | Disables gesture interaction |
| `showDefaultIndicator` | `boolean` | `true` | Show the built-in minimal circular progress indicator |
| `children` | `React.ReactNode` | `<FinancialStatsCard />` | Custom child content to be pulled |

_Généré par Component Atlas depuis les métadonnées publiées par la source._