# Avatar Stack

Overlapping avatar pile with spring-animated hover elevation and tooltips.

## Fonctionnalités

- Dynamic z-index elevation on hover so the hovered avatar is 100% visible and unclipped
- Spring-animated scale and lift transition powered by Framer Motion
- Floating name tooltip with spring entrance and exit
- Automatic initial extraction when images are unavailable or fail to load
- Truncation badge (+N) with customizable maximum visible avatars

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `avatars` | `AvatarStackItem[]` | `[]` | Array of avatar objects with id, src, alt, and fallback |
| `max` | `number` | `5` | Maximum visible avatars before showing the +N counter |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Dimension variant for each avatar circle |
| `overlap` | `'sm' \| 'md' \| 'lg'` | `'md'` | Negative margin overlap amount between adjacent avatars |
| `showCount` | `boolean` | `true` | Whether to show the +N counter badge for overflow items |
| `showTooltip` | `boolean` | `true` | Whether to show a floating tooltip label on hover |

_Généré par Component Atlas depuis les métadonnées publiées par la source._