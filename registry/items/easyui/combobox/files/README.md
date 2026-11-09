# Combobox

Gliding highlight & type-to-match underline

## Fonctionnalités

- Single measured highlight glides to the active row and survives scrolling
- Fuzzy-free substring search across labels, descriptions, and keywords with match underline
- Descriptions, icons, and disabled options supported
- Arrow/Home/End/Enter/Esc keys wired; opens upward when there is no room below
- ARIA combobox/listbox with aria-activedescendant wired end to end

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `options` | `ComboboxOption[]` | `undefined` | Options with value, label, description, icon, keywords, disabled |
| `value` | `string \| null` | `undefined` | Controlled selected value |
| `defaultValue` | `string \| null` | `null` | Initial value (uncontrolled) |
| `onValueChange` | `(value: string \| null) => void` | `undefined` | Selection change callback |
| `placeholder` | `string` | `'Select…'` | Trigger placeholder |
| `searchPlaceholder` | `string` | `'Search…'` | Search input placeholder |
| `emptyText` | `string` | `'No results.'` | Empty state message |
| `align` | `'start' \| 'end'` | `'start'` | Popover alignment |
| `disabled` | `boolean` | `false` | Disables the trigger |
| `className` | `string` | `undefined` | Additional class for the wrapper (set width, e.g. w-72) |
| `aria-label` | `string` | `placeholder` | Accessible name for the combobox |

_Généré par Component Atlas depuis les métadonnées publiées par la source._