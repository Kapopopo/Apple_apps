# Payment Receipt Printer

Animated thermal receipt printer with smooth paper extrusion motion

## Fonctionnalités

- Authentic thermal paper extrusion animation emerging downward from printer slot
- Subtle chassis vibration physics during active printing phase
- Multiple receipt items support with automatic dynamic height calculation
- Customizable merchant brand, order number, payment method, taxes, barcode, and message
- Interactive Replay, Copy Order Number, and Print action controls
- Light, dark, and cream paper themes with serrated paper perforation cuts
- Full accessibility support with aria-live status and prefers-reduced-motion detection

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `status` | `'idle' \| 'printing' \| 'completed' \| 'success'` | `'idle'` | Current lifecycle state of payment and printing |
| `merchant` | `string` | `'EasyUI Store'` | Store or company name on receipt header |
| `merchantSubtext` | `string` | `'Official Component Registry'` | Location or subtitle below merchant name |
| `merchantLogo` | `ReactNode` | `undefined` | Custom logo icon rendered in receipt header |
| `orderNumber` | `string` | `'#4821'` | Unique order or invoice tracking reference |
| `date` | `string \| Date` | `Current date` | Transaction timestamp string or Date object |
| `items` | `ReceiptItem[]` | `[]` | List of purchased items with prices, quantities, and descriptions |
| `item` | `ReceiptItem` | `undefined` | Shorthand for single item receipt |
| `subtotal` | `string \| number` | `undefined` | Subtotal price before tax and discounts |
| `tax` | `string \| number` | `undefined` | Tax amount displayed on receipt |
| `discount` | `string \| number` | `undefined` | Discount or coupon amount deducted |
| `total` | `string \| number` | `'$200.00'` | Final total payment amount |
| `currency` | `string` | `'$'` | Currency symbol prepended to numeric prices |
| `paymentMethod` | `string` | `'Apple Pay •••• 4242'` | Payment method or card description |
| `message` | `string` | `'Thank you for your order!'` | Footer message printed at bottom of receipt |
| `autoPrint` | `boolean` | `true` | Whether to automatically begin printing extrusion on mount |
| `printDuration` | `number` | `2.4` | Extrusion animation duration in seconds |
| `showStatusCard` | `boolean` | `true` | Whether to display the top status card banner |
| `statusTitle` | `string` | `'Payment Complete'` | Heading for the top status banner |
| `statusSubtitle` | `string` | `'Receipt has been issued'` | Subtitle description for status banner |
| `showActions` | `boolean` | `true` | Whether to render Replay and Copy action buttons |
| `showBarcode` | `boolean` | `true` | Whether to render the thermal barcode block |
| `showCutEffect` | `boolean` | `true` | Whether to render jagged serrated paper edges |
| `paperTheme` | `'light' \| 'dark' \| 'cream'` | `'light'` | Receipt paper visual theme styling |
| `onPrintStart` | `() => void` | `undefined` | Callback fired when paper printing begins |
| `onPrintComplete` | `() => void` | `undefined` | Callback fired when paper printing finishes |
| `onReplay` | `() => void` | `undefined` | Callback fired when animation replay is triggered |
| `className` | `string` | `undefined` | Custom CSS classes for outer container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._