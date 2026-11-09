# Scroll Velocity Text

Direction-aware kinetic text that expands and contracts with scroll

## Fonctionnalités

- Direction-aware scroll physics: expands on downward scroll, winds back on upward scroll, and holds position on idle
- Zero per-frame React re-renders: progress is written directly to the DOM via requestAnimationFrame batching
- GPU-accelerated CSS transitions with cubic-bezier easing for buttery smooth kinetic tracking
- Screen-reader safe: rendered as an unbroken native text node rather than fragmented per-letter DOM spans
- Customizable expansion range, letter spacing bounds (em), scale multiplier, and fade threshold
- Flexible polymorphic tag rendering via the "as" prop (h1, h2, span, p, etc.) with custom transform-origin
- Supports both global window scroll and scoped scrollable container refs
- Built-in prefers-reduced-motion detection automatically locks text to resting state

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | The text string to render as a single accessible text node |
| `as` | `keyof JSX.IntrinsicElements` | `'span'` | HTML tag to render as (e.g. "h1", "h2", "span", "p", "div") |
| `expandDistance` | `number` | `500` | Net scroll distance in pixels needed to progress from resting size to fully expanded and faded out |
| `intensity` | `number` | `1` | Multiplier on how much each scrolled pixel contributes to expansion progress |
| `minLetterSpacing` | `number` | `0` | Letter-spacing in em units at rest (zero scroll progress) |
| `maxLetterSpacing` | `number` | `1` | Letter-spacing in em units at full scroll expansion |
| `maxScale` | `number` | `1.6` | Scale multiplier at full scroll expansion (1 = no scale change) |
| `fadeStart` | `number` | `0.4` | Progress fraction (0–1) at which the text begins fading out (>= 1 disables fading) |
| `smoothingMs` | `number` | `400` | Duration in milliseconds of the CSS easing transition between scroll updates |
| `transformOrigin` | `string` | `'center center'` | CSS transform origin for expansion and scaling (e.g. "left center" for left-aligned headlines) |
| `scrollContainerRef` | `RefObject<HTMLElement \| null>` | — | Optional ref to a custom scrollable container instead of the window viewport |
| `className` | `string` | — | Additional CSS classes for font size, weight, color, and positioning |

_Généré par Component Atlas depuis les métadonnées publiées par la source._