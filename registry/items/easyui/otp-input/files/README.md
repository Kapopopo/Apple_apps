# OTP Input

Auto-advancing digit boxes with pop feedback

## Fonctionnalités

- Auto-advances focus to the next box as each digit is entered
- Backspace clears the current digit or steps back into the previous box
- Full-code paste support, distributing pasted digits across all boxes
- Per-digit spring pop animation on entry for tactile feedback
- Works as a controlled or uncontrolled component

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `length` | `number` | `6` | Number of digit boxes to render |
| `value` | `string` | `undefined` | Controlled value; omit to let the component manage its own state |
| `onChange` | `(value: string) => void` | `undefined` | Called with the joined code whenever any digit changes |
| `onComplete` | `(value: string) => void` | `undefined` | Called once with the full code when every box is filled |
| `autoFocus` | `boolean` | `false` | Focuses the first box on mount |
| `disabled` | `boolean` | `false` | Disables all digit boxes |
| `className` | `string` | `undefined` | Classes applied to the wrapping group element |
| `boxClassName` | `string` | `undefined` | Classes applied to each individual digit box |

_Généré par Component Atlas depuis les métadonnées publiées par la source._