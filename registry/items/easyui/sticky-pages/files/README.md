# Sticky Pages

Static sticky full-page stacking scroll sections with clean physical shadows and natural release

## Fonctionnalités

- Pure static stacking: zero tilting, zero rotation, zero transform distortion
- Native browser scrolling: zero scroll hijacking or wheel locking, built on native CSS position: sticky
- Stacking depth: each page slides up directly over the previous one with elevated top shadows and rounded borders
- Natural release: once the final page finishes stacking, the container seamlessly transitions back into normal document flow
- Dual composition support: pass a structured pages data array or arbitrary <StickyPage> child components
- Configurable top offset, stack offset, page height, rounded corners, and drop shadows
- Full prefers-reduced-motion compliance maintaining standard clean sticky reading

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `pages` | `StickyPageItem[]` | — | Array of page data objects (title, subtitle, description, badge, content, bg) |
| `pageHeight` | `string` | `'100vh'` | CSS height of each sticky page (e.g. 100vh, 85vh, 600px) |
| `topOffset` | `number` | `0` | Distance from top of viewport in pixels when a page locks into sticky position |
| `stackOffset` | `number` | `0` | Progressive pixel offset between stacked cards (0 for clean cover, 24 for visible deck header tabs) |
| `rounded` | `boolean` | `true` | Whether pages have rounded top corners (rounded-t-3xl) as they stack over one another |
| `shadow` | `boolean` | `true` | Whether pages cast an elevated top drop shadow over the preceding page |
| `border` | `boolean` | `true` | Whether pages have a subtle top highlight border |
| `className` | `string` | — | Additional CSS classes for outer container |
| `children` | `ReactNode` | — | Optional <StickyPage> elements for JSX composition mode |

_Généré par Component Atlas depuis les métadonnées publiées par la source._