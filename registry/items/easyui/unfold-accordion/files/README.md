# UnfoldAccordion

Content unfolds with chevron and spacing

## Fonctionnalités

- Chevron rotation, content height, and inner content slide are tuned to overlap
- Inner content uses a slightly faster ease so it "leads" the chevron by a hair
- Spring-based height expansion (springGentle) for a calm, continuous feel
- Single-open by default; allowMultiple for multi-open mode
- Light/dark theme aware — works in both palettes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `UnfoldAccordionItem[]` | `[]` | Array of accordion items |
| `allowMultiple` | `boolean` | `false` | Allow multiple items open at once |
| `defaultOpen` | `string[]` | `[]` | Ids of items open by default |

_Généré par Component Atlas depuis les métadonnées publiées par la source._