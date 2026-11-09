# iOS-style Search Bar

Spring expanding search pill & tactile clear button

## Fonctionnalités

- Smooth spring width expansion on input focus and auto-collapse on blur
- Conditional quick-clear button with spring scale entrance and exit
- Built-in keyboard hotkey indicator (⌘K) and Escape key blur support
- Semantic search input type with full WCAG AA accessibility

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Current search query string |
| `onChange` | `(value: string) => void` | — | Input change handler |
| `onSubmit` | `(value: string) => void` | `undefined` | Fired when Enter is pressed |
| `onClear` | `() => void` | `undefined` | Callback when clear button is clicked |
| `placeholder` | `string` | `'Search...'` | Placeholder label |
| `collapsedWidth` | `number \| string` | `'220px'` | Width before focus |
| `expandedWidth` | `number \| string` | `'340px'` | Width after focus |

_Généré par Component Atlas depuis les métadonnées publiées par la source._