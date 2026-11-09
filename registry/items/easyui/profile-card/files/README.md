# Profile Card

Dark social profile card with painted blue cover art

## Fonctionnalités

- Painted blue cover-art surface built from layered radial / linear gradients — no image assets required
- Spring-tap response on the primary action button (0.97 scale) via framer-motion
- Avatar and outbound link are keyboard-focusable with visible focus rings
- Outbound link uses rel="noreferrer noopener" for safe new-tab behaviour
- Responsive: cover height, padding, avatar size, and type scale all collapse cleanly under 600px
- Decorative artwork and icons are aria-hidden; the section semantics are conveyed by the visible name and labels
- Respects prefers-reduced-motion: spring tap is skipped entirely on the action button

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `name` | `string` | `'Suraj'` | Display name shown in the detail panel header |
| `username` | `string` | `'@surajmaurya_m'` | Handle rendered as the small caption under the name |
| `description` | `string` | `'Building EasyUI. Engineer.'` | Biographical text shown under the name |
| `followers` | `string` | `'200K'` | Pre-formatted follower count |
| `posts` | `string` | `'72'` | Pre-formatted post count |
| `website` | `string` | `'easyui.site'` | Website domain — link href is auto-prefixed with https:// |
| `actionLabel` | `string` | `'Follow'` | Label for the primary action button |
| `onAction` | `() => void` | `undefined` | Click handler for the primary action button |
| `className` | `string` | `undefined` | Additional Tailwind classes merged into the card root |

_Généré par Component Atlas depuis les métadonnées publiées par la source._