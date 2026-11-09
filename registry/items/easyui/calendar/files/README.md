# Calendar

Gliding selection pill & directional month slides

## Fonctionnalités

- Selected day is one pill that springs between dates; range mode glides start and end pills separately
- Live hover preview band while picking a range
- Months slide in the navigation direction; fixed height so nothing jumps between months
- Single + range modes, min/max dates, and custom isDateDisabled
- Full keyboard navigation: arrows, Home/End, PageUp/PageDown (Shift = year)
- No date library — pure Intl + Date helpers

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `mode` | `'single' \| 'range'` | `'single'` | Selection mode |
| `value` | `Date \| null \| DateRange` | `undefined` | Controlled selected date or range |
| `defaultValue` | `Date \| null \| DateRange` | `null` | Initial selection (uncontrolled) |
| `onChange` | `(date: Date \| null) => void \| (range: DateRange) => void` | `undefined` | Selection change callback |
| `defaultMonth` | `Date` | `undefined` | Month shown initially |
| `minDate` | `Date` | `undefined` | Earliest selectable date |
| `maxDate` | `Date` | `undefined` | Latest selectable date |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined` | Predicate to disable specific dates |
| `weekStartsOn` | `0 \| 1` | `0` | First day of the week (0 = Sunday, 1 = Monday) |
| `locale` | `string` | `undefined` | BCP 47 locale for formatting |
| `className` | `string` | `undefined` | Additional class for the root |

_Généré par Component Atlas depuis les métadonnées publiées par la source._