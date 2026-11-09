# SpringSelect

Menu follows the trigger with a tiny spring

## Fonctionnalités

- Dropdown panel springs from the trigger with a subtle scale: 0.98 -> 1 overshoot
- Chevron rotates to 192° (slightly past 180°) and settles back via snappy spring
- Keyboard navigation: ArrowUp/Down to move, Enter to select, Escape to close
- Hover and active item highlight via tracked activeIndex state
- Selected item checkmark that follows selection through the spring motion
- Light/dark theme aware via CSS variables — works in both palettes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `options` | `SpringSelectOption[]` | `[]` | Array of options with value, label, optional description, and disabled |
| `value` | `string` | `undefined` | Controlled value |
| `defaultValue` | `string` | `undefined` | Initial value (uncontrolled) |
| `placeholder` | `string` | `'Select…'` | Placeholder text when no value is selected |
| `onChange` | `(value: string) => void` | `undefined` | Called when a new value is selected |
| `label` | `string` | `undefined` | Visible label rendered above the trigger |
| `disabled` | `boolean` | `false` | Prevents interaction |
| `error` | `string` | `undefined` | Error message; presence triggers danger styling |

_Généré par Component Atlas depuis les métadonnées publiées par la source._