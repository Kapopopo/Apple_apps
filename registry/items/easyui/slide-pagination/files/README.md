# SlidePagination

Active indicator slides between pages

## Fonctionnalités

- Active background uses framer-motion shared layoutId for visible travel between pages
- Snappy spring (springSnappy) drives the indicator for a precise, physical feel
- Configurable siblingCount for windowed page ranges with ellipsis
- Optional previous / next controls; disabled at boundaries
- Light/dark theme aware — works in both palettes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `pageCount` | `number` | `undefined` | Total number of pages |
| `page` | `number` | `undefined` | Controlled current page |
| `defaultPage` | `number` | `1` | Initial current page (uncontrolled) |
| `siblingCount` | `number` | `1` | Visible pages around the current one |
| `onChange` | `(page: number) => void` | `undefined` | Page change callback |
| `showControls` | `boolean` | `true` | Show previous / next buttons |

_Généré par Component Atlas depuis les métadonnées publiées par la source._