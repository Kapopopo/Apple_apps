# Text Scramble Decoder

Controlled technical typography reveal

## Fonctionnalités

- Position-staged character resolution with a stable final state
- Mount, hover, and manual replay trigger modes
- Configurable glyph set and duration

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | Final readable text announced to assistive technology |
| `characters` | `string` | `A-Z, 0-9, symbols` | Characters used during the temporary scramble phase |
| `duration` | `number` | `900` | Decode duration in milliseconds |
| `trigger` | `'mount' \| 'hover' \| 'manual'` | `'mount'` | When the decode sequence should run |

_Généré par Component Atlas depuis les métadonnées publiées par la source._