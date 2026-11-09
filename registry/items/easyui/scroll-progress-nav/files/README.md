# Scroll Progress Navigation

Floating progress navigation pill tracking scroll depth and active document headings

## Fonctionnalités

- Real-time document scroll progress bar integrated along the pill boundary
- Shared layout pill indicator smoothly moving between active headings
- Seamless transition from static page banner to compact floating island
- Smooth scroll anchoring with customizable offset threshold
- Mobile-optimized responsive compact menu preventing content obstruction

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `sections` | `NavSectionItem[]` | `[...]` | Navigation links with IDs, index numbers, and labels |
| `scrollThreshold` | `number` | `150` | Scroll distance in px before morphing into floating pill |
| `activeId` | `string` | `undefined` | Controlled active section ID override |
| `onSectionClick` | `(id: string) => void` | `undefined` | Callback fired when user selects a section |
| `position` | `'top-center' \| 'bottom-center' \| 'top-right'` | `'top-center'` | Screen anchor position |

_Généré par Component Atlas depuis les métadonnées publiées par la source._