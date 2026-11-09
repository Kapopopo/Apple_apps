# Morphing Dialog

Seamless shared layoutId card to modal transition

## Fonctionnalités

- Framer Motion layoutId continuous surface expansion
- Esc key dismissal and backdrop click support
- Body scroll lock handling during active state

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `title` | `string` | `Required` | Dialog header title |
| `subtitle` | `string` | `undefined` | Secondary header description |
| `trigger` | `(open: () => void) => ReactNode` | `Required` | Render trigger button or card |

_Généré par Component Atlas depuis les métadonnées publiées par la source._