# Animated Tabs

Layout-spring sliding active pill indicator

## Fonctionnalités

- Shared layout active pill with spring easing
- Independent content animation cross-fade
- Badge count support for notifications

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `tabs` | `TabItem[]` | `[]` | Array of tabs with id, label, icon, content |
| `defaultTab` | `string` | `tabs[0].id` | Initial active tab ID |
| `onChange` | `(id: string) => void` | `undefined` | Tab change callback |

_Généré par Component Atlas depuis les métadonnées publiées par la source._