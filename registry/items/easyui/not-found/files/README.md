# Not Found

Minimal spring-displaced 404 error experience with tactile proximity physics

## Fonctionnalités

- Pure floating spring-physics entities for each character with custom mass and damping
- Continuous pointer proximity repulsion without React state re-renders (zero-jank 60fps)
- Mobile-first tactile tap impulse feedback for touch screens
- Strictly adheres to EasyUI dark neutral palette and Sky-400 focus ring
- Full accessibility support with screen reader announcements and semantic heading hierarchy
- Seamless prefers-reduced-motion fallback disabling continuous movement

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `errorCode` | `string` | `'404'` | Main error code glyphs rendered as physical interactive objects |
| `badgeLabel` | `string` | `undefined` | Optional status tag displayed above the glyphs |
| `title` | `string` | `'This page took a wrong turn.'` | Primary heading title |
| `description` | `string` | `'The requested page doesn\'t exist or may have moved.'` | Descriptive secondary body copy |
| `actionLabel` | `string` | `'Go back home'` | Label for the primary recovery action button |
| `onAction` | `() => void` | `undefined` | Callback when primary action button is clicked |
| `secondaryActionLabel` | `string` | `undefined` | Optional label for the secondary action button |
| `onSecondaryAction` | `() => void` | `undefined` | Callback when secondary action button is clicked |
| `className` | `string` | `undefined` | Optional custom container CSS classes |

_Généré par Component Atlas depuis les métadonnées publiées par la source._