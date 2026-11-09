# Morphing Icon

Smooth cross-fade rotation morphing between two icons or states.

## Fonctionnalités

- Coordinated rotation, scaling, and opacity cross-fade for fluid icon transformations
- Supports any icon component (Lucide, Radix, custom SVGs)
- Zero layout shift with absolute positioning within a fixed-size container
- Configurable duration and cubic-bezier easing curve

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `from` | `React.ReactNode` | `undefined` | Default icon element shown when inactive |
| `to` | `React.ReactNode` | `undefined` | Target icon element shown when active |
| `active` | `boolean` | `false` | Whether the target icon state is currently active |
| `duration` | `number` | `0.3` | Duration of the morph transition in seconds |
| `size` | `number` | `20` | Width and height of the icon container in pixels |
| `className` | `string` | `undefined` | Optional CSS class for styling the container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._