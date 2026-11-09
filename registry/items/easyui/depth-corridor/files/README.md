# Depth Corridor

CSS 3D perspective tunnel with progressive depth blur

## Fonctionnalités

- True 3D perspective translation (translateZ) and multi-layered receding depth geometry
- Progressive depth-of-field focal blurring and subtle mouse tracking parallax
- Keyboard arrow navigation (Left/Right/Up/Down) with smooth spring transitions
- Tactile indicator pills and interactive layer selection

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `layers` | `DepthLayer[]` | — | Array of layer objects (id, title, subtitle, content, blurAmount) |
| `activeLayerIndex` | `number` | `0` | Controlled active foreground layer index |
| `onLayerChange` | `(index: number) => void` | `undefined` | Layer change event callback |
| `perspectiveDepth` | `number` | `1000` | CSS 3D perspective container depth in pixels |
| `enableParallax` | `boolean` | `true` | Enables mouse coordinate responsive 3D tilt |

_Généré par Component Atlas depuis les métadonnées publiées par la source._