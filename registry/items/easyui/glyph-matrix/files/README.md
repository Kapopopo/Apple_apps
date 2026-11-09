# Glyph Matrix

Canvas-driven Matrix digital rain background with glowing phosphor trails.

## Fonctionnalités

- GPU-friendly HTML5 Canvas implementation running at silky 60fps
- Phosphor decay trails rendered via progressive alpha blending
- Authentic Katakana, matrix operators, and hexadecimal character set
- Interactive pointer disturbance causing streams near the cursor to flare and accelerate
- Supports both bounded containers and full-page fixed background backdrops

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `fontSize` | `number` | `16` | Font size in pixels for the glyph grid |
| `color` | `string` | `'#00FF66'` | Primary rain stream color |
| `headColor` | `string` | `'#FFFFFF'` | Color of the leading head glyph in each column |
| `backgroundColor` | `string` | `'#050505'` | Background color used for trail fading |
| `speed` | `number` | `1` | Fall speed multiplier |
| `fadeRate` | `number` | `0.06` | Decay rate per frame for phosphor trails |
| `interactive` | `boolean` | `true` | Whether mouse proximity disturbs and accelerates glyph streams |
| `paused` | `boolean` | `false` | Pauses stream animation |
| `fullPage` | `boolean` | `false` | Fixes canvas to fill the entire viewport as a full-page background |
| `opacity` | `number` | `1` | Overall opacity of the matrix backdrop |
| `children` | `React.ReactNode` | — | Optional content layered over the matrix background |

_Généré par Component Atlas depuis les métadonnées publiées par la source._