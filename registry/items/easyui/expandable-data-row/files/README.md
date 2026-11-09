# Expandable Data Row

Smooth unfolding table row with deep metadata and responsive mobile conversion

## Fonctionnalités

- Soft accordion expansion unfolding details directly beneath rows without modals
- Single or multi-row simultaneous expansion modes
- Full metadata breakdown with account metrics and historical activity timeline
- Adaptive layout engine transforming desktop table into touch cards on mobile devices
- Integrated quick actions with one-click email copying and callback hooks

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `DataRowItem[]` | `[...]` | Data records with user, status, revenue, and metadata |
| `allowMultiple` | `boolean` | `false` | Permit multiple expanded rows concurrently |
| `defaultExpandedIds` | `string[]` | `['usr_01']` | Initially expanded row identifiers |
| `isLoading` | `boolean` | `false` | Displays pulse skeleton loaders during data fetch |
| `onRowAction` | `(action: string, row: DataRowItem) => void` | `undefined` | Callback fired on row action buttons |

_Généré par Component Atlas depuis les métadonnées publiées par la source._