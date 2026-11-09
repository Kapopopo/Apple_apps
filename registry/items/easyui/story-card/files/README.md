# Story Cards

Responsive interactive story cards carousel

## Fonctionnalités

- Infinite loop carousel with continuous smooth transitions
- Responsive horizontal story card layout
- Large featured card with compact preview cards
- Mouse wheel and trackpad horizontal/vertical scroll support
- Touch swipe and drag gesture navigation
- Smooth spring-powered layout animations
- Previous and next navigation controls
- Clickable story previews for quick navigation
- Optional autoplay with configurable interval and hover pause
- Keyboard navigation with arrow keys
- Hardware accelerated animations
- Respects reduced-motion preferences
- Customizable appearance with standard Tailwind utility classes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `cards` | `StoryCard[]` | `undefined` | Array of story cards containing title, image, description, and optional link information |
| `initialIndex` | `number` | `0` | Index of the story displayed initially |
| `loop` | `boolean` | `true` | Enables endless circular scrolling through the cards |
| `enableWheelScroll` | `boolean` | `true` | Allows trackpad or mouse wheel gestures to scroll through cards |
| `autoPlay` | `boolean` | `false` | Automatically advances through the story cards |
| `autoPlayInterval` | `number` | `5000` | Time in milliseconds between automatic story transitions |
| `showNavigation` | `boolean` | `true` | Controls whether previous and next navigation buttons are displayed |
| `title` | `string` | `"What's happening"` | Custom title heading for the story cards section |
| `subtitle` | `string` | `"Discover the latest stories."` | Custom subtitle for the story cards section |
| `className` | `string` | `undefined` | Optional custom Tailwind styling for the component wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._