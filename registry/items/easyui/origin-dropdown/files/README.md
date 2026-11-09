# OriginDropdown

Origin-aware expansion

## Fonctionnalités

- Menu expansion originates from one of four sides (top/right/bottom/left)
- Snappy spring (springSnappy) with origin-based transform-origin per side
- Optional items array with icon, description, and destructive variants
- Chevron rotates 180° on open; Escape and outside-click close
- Light/dark theme aware via CSS variables

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `trigger` | `React.ReactNode` | `undefined` | Custom trigger content |
| `items` | `OriginDropdownItem[]` | `undefined` | Menu items (alternative to children) |
| `children` | `React.ReactNode` | `undefined` | Custom menu content |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Side the menu opens from |
| `open` | `boolean` | `undefined` | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Open state change callback |

_Généré par Component Atlas depuis les métadonnées publiées par la source._