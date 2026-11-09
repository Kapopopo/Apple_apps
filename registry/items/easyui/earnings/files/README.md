# Earnings

Earnings summary card with count-up total, scrubable trend, and source breakdown

## Fonctionnalités

- Count-up headline total with a direction-aware delta pill against the previous period
- Hand-drawn monotone cubic trend line that resamples and morphs smoothly between periods
- Pointer, touch, and keyboard scrubbing with a spring-tracked crosshair and per-point labels
- Single split bar plus a row per income source, each with a share bar and optional change badge
- Hover, tap, or focus a source to promote it to the headline readout and dim the rest
- Segmented 7D / 30D / 12M switcher with layout-animated selection and an onPeriodChange callback
- Optional next-payout footer with a formatted amount
- Intl currency and locale formatting, light and dark themes, and prefers-reduced-motion support

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `periods` | `EarningsPeriod[]` | — | Period datasets, each with its trend, optional previous total, and income sources |
| `defaultPeriod` | `string` | `second period when 3+ exist` | ID of the period shown first |
| `onPeriodChange` | `(id: string) => void` | `undefined` | Called when the active period changes |
| `title` | `string` | `'Earnings'` | Card heading and default readout label |
| `currency` | `string` | `'USD'` | ISO currency code passed to Intl.NumberFormat |
| `locale` | `string` | `'en-US'` | Locale used for currency formatting |
| `payout` | `{ label?: string; date: string; amount?: number }` | `undefined` | Optional footer line for the next payout |
| `animated` | `boolean` | `true` | Counts numbers up and animates the chart on mount; reduced motion always wins |
| `className` | `string` | `''` | Additional CSS classes for the card root |
| `EarningsPeriod.id` | `string` | — | Unique period identifier used by the switcher |
| `EarningsPeriod.label` | `string` | — | Segmented-control label such as "30D" |
| `EarningsPeriod.comparison` | `string` | — | Caption under the delta, e.g. "vs previous 30 days" |
| `EarningsPeriod.total` | `number` | — | Headline total; defaults to the sum of the sources |
| `EarningsPeriod.previous` | `number` | — | Previous-period total used to compute the delta |
| `EarningsPeriod.trend` | `number[]` | — | Earnings per point, ordered oldest to newest |
| `EarningsPeriod.trendLabels` | `string[]` | — | Names for each trend point, shown while scrubbing |
| `EarningsPeriod.sources` | `EarningsSource[]` | — | Income sources with amount, optional change, color, and icon |
| `EarningsSource.id` | `string` | — | Unique source identifier |
| `EarningsSource.label` | `string` | — | Source name used in the list and readout |
| `EarningsSource.amount` | `number` | — | Amount earned from this source in the period |
| `EarningsSource.change` | `number` | — | Percent change versus the previous period |
| `EarningsSource.color` | `string` | — | Any CSS color; defaults to a palette entry |
| `EarningsSource.icon` | `ReactNode` | — | Optional icon; defaults to a colored initial |

_Généré par Component Atlas depuis les métadonnées publiées par la source._