# Photo Box

Frosted paper box with fanning polaroids and tactile zoom inspection

## Fonctionnalités

- Translucent frosted glass cover with realistic backdrop-blur and warm gradient sheen
- Sliding paper box drawer physics with spring-tuned easing and offset lip reveal
- Tri-slot polaroid fanning layout that expands on hover, tap, or focus
- Click-to-zoom polaroid inspection view with high-res framing and title captions
- Accessible keyboard navigation (Tab through prints, Enter to expand, Esc to dismiss)
- Responsive auto-scaling stage with ResizeObserver keeping pixel-perfect geometry down to mobile screens

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `prints` | `PhotoPrint[]` | `DEFAULT_PRINTS` | Up to 3 photo prints to display inside the box slots (title, caption, src or art) |
| `title` | `string` | `'写真箱'` | Headline kanji or text displayed on the frosted cover |
| `subtitle` | `string` | `'Photo Box · 3 prints'` | Subtext printed beneath the headline title |
| `open` | `boolean` | `undefined` | Optional controlled open state for external hover or trigger controls |
| `className` | `string` | `''` | Optional CSS class overrides applied to the outer stage container |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback invoked whenever the box opens or closes |
| `onSelect` | `(id: string \| null) => void` | `undefined` | Callback invoked when an individual polaroid print is inspected or closed |

_Généré par Component Atlas depuis les métadonnées publiées par la source._