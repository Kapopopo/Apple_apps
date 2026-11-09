# Pill Navigation

Minimal shared-pill navigation continuity with fluid submenus

## Fonctionnalités

- Single shared indicator preserves spatial continuity
- Interactive nested submenu with fluid spring entrance and layout morphing
- Dual-tier keyboard navigation for parent tabs and sub-items

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `PillNavigationItem[]` | `demo items` | Navigation items with optional submenu children |
| `defaultValue` | `string` | `first item id` | Initial selected item id |
| `defaultSubValue` | `string` | `undefined` | Initial selected submenu item id |
| `onChange` | `(id: string, subId?: string) => void` | `undefined` | Selection callback |

_Généré par Component Atlas depuis les métadonnées publiées par la source._