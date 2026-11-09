# Payment Status

Refined transaction status card with self-drawing checkmark and receipt actions

## Fonctionnalités

- 5 clear lifecycle states: Processing, Verifying, Success, Failed, and Refunded
- Self-drawing SVG stroke checkmark animation upon payment confirmation
- Staggered metadata reveal for amount, transaction hash, timestamp, and card info
- Unfolding itemized receipt accordion with instant text-file receipt download
- One-click transaction ID copying with instant checkmark feedback
- Non-aggressive error state with instant retry and payment method alternatives

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `status` | `'processing' \| 'verifying' \| 'success' \| 'failed' \| 'refunded'` | `'processing'` | Current lifecycle state of payment |
| `amount` | `string \| number` | `'$149.00'` | Transaction total amount formatted or numeric |
| `currency` | `string` | `'$'` | Currency symbol prepended to amount |
| `transactionId` | `string` | `'tx_9842a8d11c7f'` | Unique transaction identifier |
| `date` | `string \| Date` | `'Today at 3:42 PM'` | Date/time timestamp of payment |
| `paymentMethod` | `string` | `'Apple Pay'` | Payment gateway or card provider |
| `last4` | `string` | `'4242'` | Last 4 digits of card or account |
| `items` | `PaymentReceiptItem[]` | `[...]` | Itemized purchase items for detailed receipt view |
| `merchantName` | `string` | `'EasyUI Cloud'` | Merchant or brand organization name |
| `onRetry` | `() => void` | `undefined` | Callback fired when user clicks Try Again |
| `onChangePaymentMethod` | `() => void` | `undefined` | Callback fired when user changes card method |

_Généré par Component Atlas depuis les métadonnées publiées par la source._