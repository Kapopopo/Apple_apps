# Dynamic Island

Continuous physical morphing island with spring layout physics

## Fonctionnalités

- Continuous physical morphing between collapsed, expanded, profile, and share states
- Spring-based layout-aware geometry and radius interpolation with no abrupt snapping
- Persistent spatial continuity for the avatar across collapsed and profile states
- Fully accessible keyboard navigation with Escape key dismissal and click-outside collapse
- Configurable social dock supporting predefined platform detection and custom links
- Light and dark mode compatibility adhering strictly to the EasyUI design token system
- Respects prefers-reduced-motion media query with instant fallback states

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `avatar` | `string` | `undefined` | URL of user avatar image |
| `avatarAlt` | `string` | `undefined` | Alt text for the avatar image |
| `name` | `string` | `'Suraj Maurya'` | Display name in expanded and profile views |
| `role` | `string` | `'Frontend Developer'` | Subtitle or profession title |
| `description` | `string` | `'Building thoughtful interfaces...'` | Bio or description text rendered in profile view |
| `greeting` | `string` | `'Hello, I am [name]'` | Custom message displayed in expanded state |
| `statusText` | `string` | `'Available for work'` | Optional availability chip displayed beside name |
| `metadata` | `DynamicIslandMetadataItem[]` | `undefined` | Key-value badges rendered in profile card |
| `socials` | `DynamicIslandSocials` | `5 default links` | Social links as an array of items or platform key-value object |
| `state` | `'collapsed' \| 'expanded' \| 'profile' \| 'share'` | `undefined` | Controlled state value |
| `defaultState` | `'collapsed' \| 'expanded' \| 'profile' \| 'share'` | `'collapsed'` | Initial uncontrolled state |
| `onStateChange` | `(state: DynamicIslandState) => void` | `undefined` | Callback invoked whenever state changes |
| `profileContent` | `ReactNode` | `undefined` | Custom ReactNode replacing default profile body |
| `shareContent` | `ReactNode` | `undefined` | Custom ReactNode replacing default share dock |
| `className` | `string` | `undefined` | Optional additional styling applied to the island container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._