# Circular Orbit

Continuous circular orbit gallery with depth-aware tiles

## Fonctionnalités

- Single shared rotation MotionValue drives every tile — no React state per frame
- True circular orbit: x and y use the same radius so tiles trace a perfect circle
- Depth field derived from cos(angle): scale, opacity, blur, and z-index stay internally consistent
- Smooth ease-in / ease-out on hover-pause instead of a hard stop
- Configurable speed, radius, items, and pause-on-hover behaviour
- Respects prefers-reduced-motion: animation loop short-circuits to a static rest pose
- Light and dark surface variants

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `OrbitItem[]` | `14 Unsplash tiles` | Tiles to place around the orbit |
| `title` | `string` | `'Push'` | Centered headline rendered above the orbit |
| `speed` | `number` | `0.00022` | Radians per millisecond. Smaller = slower |
| `radius` | `number` | `270` | Pixel radius of the orbit on the desktop layout |
| `pauseOnHover` | `boolean` | `true` | Smoothly stop the orbit when the pointer enters the gallery |
| `className` | `string` | `undefined` | Additional Tailwind classes merged into the section root |

_Généré par Component Atlas depuis les métadonnées publiées par la source._