# Stepper

Animated connector line, gliding focus ring, and step panels

## Fonctionnalités

- Connector line fills smoothly as you advance through steps
- A single active indicator ring glides between steps using Framer Motion layoutId
- Completed step checkmark animates its stroke path on completion
- Direction-aware StepPanels: slides left/right depending on forward or backward navigation
- Horizontal and vertical layouts, clickable completed steps, and responsive mobile labels

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `steps` | `Step[]` | `undefined` | List of steps with title and optional description |
| `current` | `number` | `0` | Zero-based index of the active step |
| `onStepChange` | `(index: number) => void` | `undefined` | Callback enabling jump-back clicks on completed steps |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction of the stepper line |
| `className` | `string` | `undefined` | Additional CSS classes for the stepper container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._