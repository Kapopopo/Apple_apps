# Button

Multi-variant button system with tactile physics

## Fonctionnalités

- 8 visual variants: Primary, Secondary, Outline, Ghost, Destructive, Success, Link, Gradient
- 4 size dimensions: Small (sm), Medium (md), Large (lg), and square Icon
- Spring tap micro-interaction (whileTap 0.97) via Framer Motion
- Accessible loading state with integrated monochrome spinner & aria-busy
- Left and right icon slots with automatic sizing and gap alignment
- Full width layout support (fullWidth)
- Strictly adheres to EasyUI monochrome dark palette and sky focus ring

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'success' \| 'link' \| 'gradient'` | `'primary'` | Visual presentation style |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Dimensions and typography scale |
| `isLoading` | `boolean` | `false` | Displays an animated spinner and disables user interaction |
| `loadingText` | `string` | `undefined` | Optional text displayed alongside the loading spinner |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon element placed before children |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon element placed after children |
| `fullWidth` | `boolean` | `false` | Stretches button to 100% width of parent container |
| `disabled` | `boolean` | `false` | Prevents interaction and applies 30% disabled opacity |

_Généré par Component Atlas depuis les métadonnées publiées par la source._