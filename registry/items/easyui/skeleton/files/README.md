# Skeleton

Subtle shimmer sweep and smooth content reveal

## Fonctionnalités

- Quiet shimmer blocks with smooth gradient light sweep animation
- SkeletonReveal transitions seamlessly to live content using fade, subtle rise, and un-blur
- Convenient SkeletonText preset with natural staggered line length distribution
- SkeletonAvatar preset for profile pictures and user thumbnails
- Clean reduced-motion fallback that disables continuous sweeping

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `className` | `string` | `undefined` | CSS classes to size and position the skeleton block |
| `lines` | `number` | `3` | Number of lines for the SkeletonText component |
| `size` | `number` | `40` | Pixel size for the circular SkeletonAvatar component |
| `loading` | `boolean` | `undefined` | Active loading state for the SkeletonReveal wrapper |
| `skeleton` | `React.ReactNode` | `undefined` | Placeholder element rendered while loading is true |

_Généré par Component Atlas depuis les métadonnées publiées par la source._