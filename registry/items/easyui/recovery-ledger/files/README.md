# Recovery Ledger

Version history timeline & state recovery ledger

## Fonctionnalités

- Chronological version ledger with vertical timeline rail and active head marker
- One-click state rollback action with loading animation feedback
- Expandable code diff viewer and snapshot metadata inspection drawer
- Full keyboard tab access and screen reader timestamp announcements

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `entries` | `LedgerEntry[]` | — | Array of version history records (id, timestamp, action, description, author, details, restorable) |
| `currentEntryId` | `string` | `undefined` | Active head snapshot identifier |
| `onRestore` | `(id: string) => Promise<void> \| void` | `undefined` | Callback fired on version revert action |
| `onSelect` | `(id: string) => void` | `undefined` | Callback when an entry is clicked |
| `variant` | `'timeline' \| 'compact'` | `'timeline'` | Display format |

_Généré par Component Atlas depuis les métadonnées publiées par la source._