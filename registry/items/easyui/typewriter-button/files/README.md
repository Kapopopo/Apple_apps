# Typewriter Button

Character-by-character reveal with mechanical sound feedback

## Fonctionnalités

- Progressive character-by-character typewriter reveal with blinking cursor
- Synthesized mechanical click sound generated dynamically via Web Audio API (zero audio file assets)
- Configurable typing speed, sound volume, variants, and auto-start mode
- Full accessibility with complete aria-label announcement and keyboard triggers

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `string` | — | Label text to type out |
| `charDuration` | `number` | `75` | Milliseconds per character reveal |
| `soundEnabled` | `boolean` | `false` | Enables mechanical keystroke sound cues |
| `soundVolume` | `number` | `0.25` | Web Audio synthesizer output volume (0 to 1) |
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Styling appearance |
| `autoStart` | `boolean` | `false` | Begins typing immediately upon mounting |
| `onComplete` | `() => void` | `undefined` | Callback on typing completion |

_Généré par Component Atlas depuis les métadonnées publiées par la source._