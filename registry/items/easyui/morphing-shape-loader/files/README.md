# Morphing Shape Loader

Continuously morphing SVG shape loader

## Fonctionnalités

- Continuous morph between matched-control-point shapes
- Configurable shape list, duration, hold time, and loop behavior
- Stroke and filled variants with optional gradient
- Subtle dashed backdrop ring for visual context
- Respects prefers-reduced-motion (renders a single static shape)

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `shapes` | `ShapeKind[]` | `['circle','square','triangle','circle']` | Ordered list of shapes to cycle through |
| `duration` | `number` | `1.6` | Morph duration per shape change in seconds |
| `holdDuration` | `number` | `0.4` | Hold duration at each shape in seconds |
| `loop` | `boolean` | `true` | Loop the shape sequence |
| `size` | `number` | `96` | Loader size in pixels (square) |
| `color` | `string` | `'#FAFAFA'` | Stroke or fill color |
| `filled` | `boolean` | `false` | Filled variant instead of stroke |

_Généré par Component Atlas depuis les métadonnées publiées par la source._