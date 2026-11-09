# Torque Dial

Rotational control knob with physical spin momentum

## Fonctionnalités

- Natural angular momentum release with exponential friction deceleration decay
- Supports drag rotation, mouse wheel fine-tuning, keyboard arrow adjustments, and double-click centering
- Dynamic SVG radial progress ring with continuous value telemetry
- Full accessibility with role="slider", aria-valuenow, and keyboard stepping

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `value` | `number` | — | Current numeric value |
| `min` | `number` | `0` | Minimum dial threshold |
| `max` | `number` | `100` | Maximum dial threshold |
| `step` | `number` | `1` | Step resolution increment |
| `onChange` | `(val: number) => void` | — | Callback fired on rotation value updates |
| `momentum` | `boolean` | `true` | Enables velocity-based inertial spin after drag release |
| `size` | `number` | `120` | Diameter in pixels |
| `unit` | `string` | `''` | Optional unit suffix (e.g. "%", "dB", "°") |

_Généré par Component Atlas depuis les métadonnées publiées par la source._