# Stack Unfold Panel

Progressive disclosure card stack with spring height animation

## Fonctionnalités

- Progressive vertical expansion with GPU-accelerated height calculation
- Automatic single-card accordion mode or multi-card unfolding
- Rotating chevron indicators with smooth 180-degree spring flip
- Full accessibility with aria-expanded, aria-controls, and keyboard triggers

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `cards` | `StackCard[]` | — | Array of card items (id, title, subtitle, content, badge) |
| `expandedIds` | `string[]` | `undefined` | Controlled array of opened card IDs |
| `onExpandedChange` | `(ids: string[]) => void` | `undefined` | Expansion event callback |
| `allowMultiple` | `boolean` | `false` | Allows simultaneous expansion of multiple cards |
| `variant` | `'default' \| 'minimal'` | `'default'` | Bordered card or minimal underline layout |

_Généré par Component Atlas depuis les métadonnées publiées par la source._