# Batch Gesture Tray

Spring floating tray with multi-select batch actions

## Fonctionnalités

- Spring slide-up bottom tray appearing automatically when 1 or more items are selected
- Integrated selection counter badge with Select-All / Deselect-All triggers
- Async action loading indicators preventing double-submission
- Dismissal via close button, escape key, or outside tap

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `BatchItem[]` | — | Array of selectable list items (id, title, subtitle) |
| `actions` | `BatchAction[]` | — | Array of batch action buttons (id, label, icon, action, color) |
| `selectedIds` | `string[]` | `undefined` | Controlled array of selected item IDs |
| `onSelectionChange` | `(ids: string[]) => void` | `undefined` | Selection state callback |
| `onActionComplete` | `(actionId: string) => void` | `undefined` | Callback fired on action finish |

_Généré par Component Atlas depuis les métadonnées publiées par la source._