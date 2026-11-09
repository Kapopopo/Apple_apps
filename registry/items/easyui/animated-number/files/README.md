# Animated Number Morph

Independent column digit rolling physics for metrics and financial dashboards

## Fonctionnalités

- Independent digit column spring animation preventing layout jitter
- Automatic thousand grouping (e.g. 12,450) and fixed decimal formatting
- Compact notation support for large values (1.2M, 45K)
- Configurable prefixes, suffixes, and spring stiffness parameters
- Full accessibility with aria-label text narration

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` | The numeric target value to morph towards |
| `decimals` | `number` | `0` | Number of decimal places to preserve |
| `prefix` | `string` | `''` | Text or currency prepended to number (e.g. "$") |
| `suffix` | `string` | `''` | Text or unit appended to number (e.g. "%", "ms") |
| `useGrouping` | `boolean` | `true` | Formats with comma separators |
| `compact` | `boolean` | `false` | Formats using compact abbreviations (K, M, B) |
| `stiffness` | `number` | `170` | Spring transition stiffness |
| `damping` | `number` | `22` | Spring transition damping |

_Généré par Component Atlas depuis les métadonnées publiées par la source._