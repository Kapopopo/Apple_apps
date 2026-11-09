# Rainbow Button

Vibrant chromatic rainbow border button with animated glowing under-reflection

## Fonctionnalités

- Continuous seamless multi-stop chromatic rainbow border animation
- Ambient blurred rainbow underglow shadow reflecting beneath the button surface
- Customizable chromatic color variables (color1 through color5) with vivid defaults
- Zero external library requirements: native CSS animation and self-contained Slot component for asChild support
- Variants: default and outline, with sizes: default, sm, lg, and icon
- Fully accessible: keyboard focus ring, aria attributes pass-through, and prefers-reduced-motion support

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'outline'` | `'default'` | Visual presentation style of the button surface |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button dimension scale and padding |
| `asChild` | `boolean` | `false` | Render as child component (e.g. Next.js Link or a tag) passing through props and styles |
| `glow` | `boolean` | `true` | Whether to show the ambient blurred rainbow glow drop-shadow beneath the button |
| `speed` | `number` | `3` | Rainbow animation cycle duration in seconds |
| `color1` | `string` | `'hsl(0 100% 63%)'` | First chromatic gradient stop (red/pink) |
| `color2` | `string` | `'hsl(270 100% 63%)'` | Second chromatic gradient stop (purple) |
| `color3` | `string` | `'hsl(210 100% 63%)'` | Third chromatic gradient stop (blue) |
| `color4` | `string` | `'hsl(195 100% 63%)'` | Fourth chromatic gradient stop (cyan) |
| `color5` | `string` | `'hsl(90 100% 63%)'` | Fifth chromatic gradient stop (green) |
| `className` | `string` | — | Additional CSS classes |

_Généré par Component Atlas depuis les métadonnées publiées par la source._