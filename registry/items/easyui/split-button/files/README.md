# Split Button

A primary action with a chevron trigger for related actions.

## Fonctionnalités

- Primary action and chevron trigger share a single rounded pill silhouette
- Chevron rotates with a snappy spring on open/close
- Menu flips above the trigger when there is not enough room below
- Supports primary and secondary visual variants
- Closes on outside click and on Escape

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Label for the primary (left) action |
| `onClick` | `() => void` | — | Called when the primary action is pressed |
| `options` | `SplitButtonOption[]` | — | Dropdown options revealed by the chevron trigger |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding and text size |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Visual style of both halves of the control |
| `disabled` | `boolean` | `false` | Disables the entire control |

_Généré par Component Atlas depuis les métadonnées publiées par la source._