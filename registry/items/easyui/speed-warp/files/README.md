# Speed Warp

High-velocity 3D perspective starfield tunnel with canvas streaks.

## Fonctionnalités

- Real-time 3D perspective projection with focal length scaling
- Dynamic depth-alpha fading and velocity-driven streak lines
- Completely transparent canvas background for seamless layering over any dark UI or hero section
- Automatic canvas resizing via ResizeObserver to match parent container dimensions

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `speed` | `number` | `25` | Velocity multiplier of stars moving toward the camera |
| `starCount` | `number` | `600` | Total number of 3D stars rendered in the volume |
| `className` | `string` | `undefined` | Optional custom CSS class name for styling |
| `children` | `React.ReactNode` | — | Optional overlay content rendered above the starfield |

_Généré par Component Atlas depuis les métadonnées publiées par la source._