# Wallet Card

Dark wallet card with pointer-driven cyan shine

## Fonctionnalités

- Live balance figure with iOS-style toggle and primary action button
- Painted blue radial-gradient surface with diagonal specular sweep and outer glow
- Pointer-driven cyan shine — same MotionValue architecture as SpotlightCard
- Spring-tap response on the action button (0.97 scale)
- Full keyboard support and visible focus outline on the button
- Respects prefers-reduced-motion — shine is skipped, button tap is disabled
- Responsive aspect ratio; surface adapts without layout shift

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `balance` | `string` | `'$4,566.00'` | Headline balance figure rendered as the dominant type |
| `cardType` | `string` | `'Mastercard'` | Card brand label shown in the subtitle |
| `cardLastFour` | `string` | `'3040'` | Last four digits of the underlying card |
| `buttonLabel` | `string` | `'Use Wallet'` | Label for the primary action button |
| `onUseWallet` | `() => void` | `undefined` | Click handler for the action button |
| `disabled` | `boolean` | `false` | Disable the action button |
| `balanceLabel` | `string` | `'Total Balance'` | Small caption under the balance figure |
| `className` | `string` | `undefined` | Additional Tailwind classes merged into the card root |

_Généré par Component Atlas depuis les métadonnées publiées par la source._