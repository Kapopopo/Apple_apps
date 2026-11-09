# Date Picker

Origin-aware popover with a spring landing

## Fonctionnalités

- Popover scales from the trigger edge with a spring and flips above when space is tight
- Single date + date range pickers share the same Calendar underneath
- Selection pill lands before the popover closes, then focus returns to the trigger
- Esc and outside-click close; controlled or uncontrolled value
- Supports all Calendar options: minDate, maxDate, isDateDisabled, weekStartsOn, locale

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `value` | `Date \| null \| DateRange` | `undefined` | Controlled selected value |
| `defaultValue` | `Date \| null \| DateRange` | `null` | Initial value (uncontrolled) |
| `onChange` | `(date: Date \| null) => void \| (range: DateRange) => void` | `undefined` | Selection change callback |
| `placeholder` | `string` | `'Pick a date' / 'Pick a range'` | Trigger placeholder text |
| `align` | `'start' \| 'end'` | `'start'` | Popover alignment relative to the trigger |
| `side` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Popover placement; 'auto' opens downward on mobile and flips on desktop when tight |
| `disabled` | `boolean` | `false` | Disables the trigger |
| `className` | `string` | `undefined` | Additional class for the wrapper (set width, e.g. w-80) |

_Généré par Component Atlas depuis les métadonnées publiées par la source._