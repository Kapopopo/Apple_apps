# Cursor Follower

Spring-damped pointer follower with custom icon content

## Fonctionnalités

- Configurable spring dynamics (stiffness, damping, and mass)
- Dynamic velocity scaling when pointer is in motion
- Automatic viewport departure detection and graceful exit
- Reduced motion support with instant 1:1 hardware coordinate mapping
- Supports any custom React icon, text pill, or visual indicator

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` | `undefined` | Custom icon, text badge, or React element displayed inside the cursor follower. |
| `size` | `number` | `40` | Width and height of the cursor follower in pixels. |
| `offsetX` | `number` | `0` | Horizontal offset from the cursor coordinates. |
| `offsetY` | `number` | `0` | Vertical offset from the cursor coordinates. |
| `stiffness` | `number` | `450` | Spring stiffness controlling how rapidly the follower catches up to the cursor. |
| `damping` | `number` | `32` | Spring damping controlling the smoothness and friction of deceleration. |
| `mass` | `number` | `0.5` | Spring mass controlling inertia and physical weight. |
| `scaleOnMove` | `boolean` | `true` | Scales the cursor follower slightly while the pointer is in active motion. |
| `hideOnLeave` | `boolean` | `true` | Hides the cursor follower when the pointer leaves the browser window or viewport. |
| `className` | `string` | `undefined` | Optional custom Tailwind CSS utility classes. |

_Généré par Component Atlas depuis les métadonnées publiées par la source._