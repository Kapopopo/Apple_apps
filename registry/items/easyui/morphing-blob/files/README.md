# Morphing Blob

Fluid spring-physics blob with cursor interaction

## Fonctionnalités

- Spring-physics anchor points with Catmull-Rom smoothing for a fluid, organic shape
- Smooth cursor-follow interaction with configurable strength and responsiveness
- Imperative per-frame path updates for smooth animation without unnecessary React re-renders
- Independently configurable SVG width and height
- Customizable point count, radius, variance, speed, stiffness, and damping
- Configurable gradient start and end colors
- Automatically respects the prefers-reduced-motion accessibility preference
- Pointer-events disabled by default so the decorative blob never blocks foreground interactions

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `width` | `number` | `400` | Width of the SVG viewport in pixels |
| `height` | `number` | `400` | Height of the SVG viewport in pixels |
| `points` | `number` | `8` | Number of anchor points used to construct the blob shape |
| `baseRadius` | `number` | `120` | Resting radius of the blob in pixels |
| `variance` | `number` | `28` | Maximum radius variation applied to each anchor point during morphing |
| `speed` | `number` | `0.7` | Controls how frequently new random morph targets are generated |
| `stiffness` | `number` | `45` | Spring stiffness controlling how strongly anchor points move toward their targets |
| `damping` | `number` | `9` | Spring damping controlling the resistance and smoothness of the blob motion |
| `cursorFollow` | `boolean` | `true` | Enables or disables cursor-follow interaction |
| `cursorStrength` | `number` | `0.35` | Controls how strongly the blob moves toward the cursor position |
| `cursorSmoothness` | `number` | `0.08` | Controls how smoothly the blob catches up to the cursor; lower values create more fluid trailing motion |
| `colors` | `[string, string]` | `['#7C3AED', '#06B6D4']` | Two colors used for the blob gradient, from start to end |
| `className` | `string` | `undefined` | Additional CSS classes for positioning, sizing, opacity, layering, and other styling |

_Généré par Component Atlas depuis les métadonnées publiées par la source._