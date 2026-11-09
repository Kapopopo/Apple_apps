# Selection Basket

Floating bulk-action toolbar for multi-item batch operations and export flows

## Fonctionnalités

- Appears naturally with spring rise physics as soon as selected count > 0
- Responsive horizontal scrolling action container preventing mobile cutoff
- Integrated batch action buttons (Delete, Move, Export, Share)
- Dynamic select all / clear all selection toggle synchronization
- Accessible role="toolbar" keyboard navigation and focus rings

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `selectedCount` | `number` | `0` | Current number of selected items |
| `totalCount` | `number` | `undefined` | Total item universe count |
| `actions` | `SelectionActionItem[]` | `[...]` | List of bulk action definitions |
| `onClearSelection` | `() => void` | `undefined` | Callback fired when user clears selection |
| `onSelectAll` | `() => void` | `undefined` | Callback fired when user selects all |

_Généré par Component Atlas depuis les métadonnées publiées par la source._