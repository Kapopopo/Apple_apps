# Rocket Party Popper

Lift-off milestone celebration with colorful confetti blast

## Fonctionnalités

- Sleek matte black rocket capsule with thruster ember anticipation
- Smooth lift-off acceleration trailing thruster flame and smoke
- 360° Colorful party popper confetti explosion with physics gravity and flutter
- Apple-grade fluid spring reveal for celebratory milestone cards
- Built-in replay and reset support for repeatable celebratory interactions

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `title` | `string` | `'Mission Accomplished'` | Primary celebration headline |
| `description` | `string` | `'All checks passed and your release is ready to deploy.'` | Supporting celebration description |
| `metric` | `string` | `'100% Production Ready'` | Metadata badge shown on milestone card |
| `triggerLabel` | `string` | `'Launch celebration'` | Label for the launch button |
| `confettiCount` | `number` | `50` | Total confetti particles spawned on blast |
| `defaultLaunched` | `boolean` | `false` | Initial launched/revealed state |
| `onLaunch` | `() => void` | `undefined` | Callback fired on launch trigger |
| `onReset` | `() => void` | `undefined` | Callback fired on reset |

_Généré par Component Atlas depuis les métadonnées publiées par la source._