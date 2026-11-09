# Gravity Particle Burst

Pointer-driven gravity particle feedback

## Fonctionnalités

- Particles inherit a shared origin from the pointer location
- Canvas rendering keeps the effect performant without many DOM nodes
- Gravity and friction make particles arc and settle naturally

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `label` | `string` | `'Create particle burst'` | Default button label and accessible text |
| `particleCount` | `number` | `34` | Number of canvas particles emitted per burst |
| `children` | `ReactNode` | `undefined` | Custom button content |

_Généré par Component Atlas depuis les métadonnées publiées par la source._