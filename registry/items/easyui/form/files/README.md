# Form

Composable, accessible form primitives and controls

## Fonctionnalités

- Modular layout primitives: Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage
- Comprehensive controls: Input, Textarea, Select, Checkbox, RadioGroup, Switch
- Spring-animated validation errors and password visibility toggle
- Tactile check, radio dot, and toggle switch spring physics
- Accessible ARIA semantics, required asterisks, and keyboard navigation
- Strict monochrome dark styling matching EasyUI surface elevation tokens

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `onSubmit` | `(e: FormEvent) => void` | `undefined` | Form submission handler |
| `error` | `string \| boolean` | `undefined` | Validation error text or boolean trigger |
| `showPasswordToggle` | `boolean` | `false` | Enables eye icon toggle for password inputs |
| `required` | `boolean` | `false` | Displays red asterisk and enforces requirement |
| `leftIcon` | `React.ReactNode` | `undefined` | Leading icon inside input fields |
| `rightIcon` | `React.ReactNode` | `undefined` | Trailing icon inside input fields |

_Généré par Component Atlas depuis les métadonnées publiées par la source._