# Intro Loader

Apple-style multilingual greeting welcome splash

## Fonctionnalités

- Rapid multilingual greeting cycling inspired by Apple OS welcome splash
- Fluid blur, scale, and opacity entry transitions calibrated with cubic-bezier curves
- Apple-style hairline progress indicator tracking sequence completion
- Keyboard and tactile skip mechanism (ESC key or dedicated discrete button)
- Full accessibility support with aria-live announcements and reduced-motion fallbacks
- Supports both full-screen initial overlay and inline documentation preview modes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `greetings` | `(string \| GreetingItem)[]` | `['Hello', 'Hola', 'Bonjour', ...]` | Array of localized greeting strings or objects with text and lang to cycle through |
| `fullScreen` | `boolean` | `true` | Whether to render as a fixed full-screen overlay or inline container |
| `intervalMs` | `number` | `240` | Milliseconds per greeting cycle |
| `showProgress` | `boolean` | `true` | Whether to display the Apple-style hairline progress bar |
| `showLangBadge` | `boolean` | `true` | Whether to display country language badges |
| `allowSkip` | `boolean` | `true` | Whether to enable ESC key and Skip button dismissals |
| `speedMultiplier` | `number` | `1` | Speed multiplier for the animation sequence |
| `onComplete` | `() => void` | `undefined` | Callback fired when welcome sequence completes |

_Généré par Component Atlas depuis les métadonnées publiées par la source._