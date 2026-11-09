# Evil Eye

Pointer-driven hanging amulet with layered spring physics

## Fonctionnalités

- Pointer position drives a normalized MotionValue pipeline (no React renders per frame)
- Layered secondary motion — braided cord, metallic cap, and amulet disc each swing independently
- Painted SVG with radial gradients for the navy disc, sky-blue ring, and the signature pupil glint
- Configurable spring stiffness, damping, and max rotation for tuning the physical feel
- Geometry-aware normalization that adapts to the actual container size
- Respects prefers-reduced-motion with a clean static rest pose
- Graceful degradation when pointer events are unavailable

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `maxRotation` | `number` | `13` | Maximum rotation in degrees at full pointer offset |
| `stiffnessX` | `number` | `55` | Pointer X spring stiffness (higher = snappier follow) |
| `stiffnessY` | `number` | `45` | Pointer Y spring stiffness |
| `damping` | `number` | `9` | Spring damping (higher = less swing overshoot) |
| `caption` | `string` | `undefined` | Optional screen-reader caption for the amulet |
| `className` | `string` | `undefined` | Additional Tailwind classes merged into the container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._