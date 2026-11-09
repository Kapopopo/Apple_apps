# Density Lens

Cursor-tracking magnification & detail inspection lens

## Fonctionnalités

- Subtle spring lag cursor tracking for realistic tactile lens momentum
- Automatic coordinate interpolation with 2x magnification or custom overlay renderers
- Configurable lens geometry (circle, oval, rounded square), border glow, and zoom scale
- Zero layout shifts and smooth GPU-accelerated backdrop blur

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Underlying background content being inspected |
| `renderLensContent` | `(pos: { x: number, y: number, scale: number }) => ReactNode` | `undefined` | Custom overlay rendered inside lens |
| `lensSize` | `number` | `150` | Diameter/width of lens in pixels |
| `lensShape` | `'circle' \| 'oval' \| 'square'` | `'circle'` | Geometric shape of lens |
| `zoomScale` | `number` | `2` | Magnification factor |
| `showBorder` | `boolean` | `true` | Renders border and glass glow around perimeter |

_Généré par Component Atlas depuis les métadonnées publiées par la source._