# Glitch Text

Cybernetic glitch typography with 5 distinct kinetic animation modes

## Fonctionnalités

- 5 distinct visual glitch modes: 'rgb-split', 'slice', 'vhs', 'scramble', and 'pulse'
- Interactive trigger options: 'continuous' periodic looping, on 'hover', or interactive 'click' burst
- Dual chromatic color customization (color1/color2, with backward-compatible greenColor/purpleColor)
- Calibrated multi-tiered intensity scaling: 'low', 'medium', and 'high'
- Screen-reader safe: rendered as unbroken native text with aria-hidden on decorative duplicate slices
- Full prefers-reduced-motion compliance freezing all displacements into clean resting text
- Polymorphic rendering via the 'as' prop ('span', 'h1', 'h2', 'p', etc.) with full ref forwarding

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | The text string to animate with the cybernetic glitch effects |
| `variant` | `'rgb-split' \| 'slice' \| 'vhs' \| 'scramble' \| 'pulse'` | `'rgb-split'` | Visual animation mode: chromatic aberration, horizontal slicing, VHS jitter, matrix decode, or voltage pulse |
| `trigger` | `'continuous' \| 'hover' \| 'click'` | `'continuous'` | Interaction trigger mode governing when the glitch animation activates |
| `color1` | `string` | `'#00e571'` | Primary chromatic aberration color (alias: greenColor) |
| `color2` | `string` | `'#8b00ff'` | Secondary chromatic aberration color (alias: purpleColor) |
| `intensity` | `'low' \| 'medium' \| 'high'` | `'medium'` | Glitch magnitude scaling multiplier for displacement, skew, and jitter |
| `duration` | `number` | `0.5` | Duration in seconds of an active glitch burst cycle |
| `repeatDelay` | `number` | `2.5` | Rest interval in seconds between continuous glitch bursts |
| `as` | `keyof JSX.IntrinsicElements` | `'span'` | HTML tag to render as (e.g. 'h1', 'h2', 'span', 'p', 'div') |
| `className` | `string` | — | Additional CSS classes for font size, weight, color, and positioning |

_Généré par Component Atlas depuis les métadonnées publiées par la source._