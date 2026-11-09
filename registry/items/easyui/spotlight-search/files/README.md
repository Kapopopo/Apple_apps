# Spotlight Search

Global ⌘K search overlay with moving highlight spring physics

## Fonctionnalités

- Global keyboard listener for ⌘K / Ctrl+K and Escape dismissal
- Animated active highlight tracking item selection with layoutId spring physics
- Categorized search results with contextual icons and technical kbd badges
- Dimmed backdrop with subtle blur preserving focus on command box
- Full arrow key navigation and Enter selection execution

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | Controlled visibility state |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback fired when modal visibility toggles |
| `items` | `SpotlightSearchItem[]` | `[...]` | List of searchable actions and components |
| `placeholder` | `string` | `'Search components, actions...'` | Input placeholder text |
| `onSelect` | `(item: SpotlightSearchItem) => void` | `undefined` | Callback fired when item is chosen |

_Généré par Component Atlas depuis les métadonnées publiées par la source._