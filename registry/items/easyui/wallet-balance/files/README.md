# Wallet Balance

Interactive payment cards tucked into a leather pouch with eye-toggle balance obscuring

## Fonctionnalités

- Interactive eye-toggle button to reveal or mask balances with blur-crossfade and popLayout transitions
- Staggered spring animations for fanning out and tucking cards into the pouch
- Responsive stage scaling with ResizeObserver for crisp rendering on any viewport width
- Customizable accounts array with brand marks, individual balances, and background themes
- Full accessibility support with aria-pressed, live screen reader announcements, and prefers-reduced-motion

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `accounts` | `WalletAccount[]` | `DEFAULT_ACCOUNTS` | Array of up to 3 accounts displaying logo, balance, and custom colors |
| `visible` | `boolean` | `undefined` | Controlled visibility state for balances and cards |
| `defaultVisible` | `boolean` | `true` | Uncontrolled initial visibility state |
| `onVisibleChange` | `(visible: boolean) => void` | `undefined` | Callback fired when balance visibility is toggled |
| `currency` | `string` | `'USD'` | ISO currency symbol used for formatted card amounts |
| `locale` | `string` | `'en-US'` | Locale string for number formatting |
| `totalLabel` | `string` | `'Total Balance'` | Caption label displayed below the total balance figure |
| `className` | `string` | `''` | Optional CSS class overrides for the outer container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._