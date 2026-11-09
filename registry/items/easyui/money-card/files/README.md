# Money Card

Interactive financial wallet card with quick-send contacts and animated transfer sheets

## Fonctionnalités

- Animated balance counter utilizing MotionValue and custom formatters for fluid number interpolation
- Interactive send and receive sheets with built-in keypad, contact selector, note input, and error handling
- Quick-send contact avatars straddling the card boundary with spring-press tactile response
- Animated transaction feed displaying directional amount badges and expandable activity list
- Settings drawer with toggleable balance masking and copyable personal payment link
- Container query architecture ensuring flawless responsiveness across all screen sizes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `user` | `{ name: string; avatar: string }` | `DEFAULT_USER` | User profile with display name and avatar icon |
| `balance` | `number` | `52002.5` | Headline account balance in major currency units |
| `contacts` | `Contact[]` | `DEFAULT_CONTACTS` | List of quick-send contacts with avatars and tints |
| `transactions` | `Transaction[]` | `DEFAULT_TRANSACTIONS` | List of recent transactions sorted newest first |
| `onSend` | `(req: TransferRequest) => Promise<void>` | `undefined` | Async handler called upon submitting a send transfer |
| `onRequest` | `(req: TransferRequest) => Promise<void>` | `undefined` | Async handler called upon submitting a request transfer |
| `onViewAll` | `() => void` | `undefined` | Optional callback overriding default activity list opening |
| `currency` | `string` | `'USD'` | ISO currency symbol used for formatted monetary values |
| `locale` | `string` | `'en-US'` | Locale string for number and date formatting |
| `paymentLink` | `string` | `'pay.example/ana'` | Personal payment link displayed on receive and settings sheets |
| `className` | `string` | `''` | Optional CSS class overrides for the outer container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._