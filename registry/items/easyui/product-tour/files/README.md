# Product Tour

Interactive walkthrough with spring spotlight cutout and responsive docking

## Fonctionnalités

- Spring-animated SVG mask spotlight that smoothly transitions between target elements
- Automatic scroll-into-view with scroll settlement detection before positioning
- Responsive viewport placement: floating tooltip on desktop, docked bottom sheet on mobile
- Complete keyboard controls (Left/Right arrows to navigate, Escape to dismiss, Tab trapping)
- Dynamic height animation with ResizeObserver as step copy changes
- Reduced motion support and full dark and light mode styling

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `steps` | `TourStep[]` | — | List of tour steps with target selector, title, body, and placement preference |
| `open` | `boolean` | — | Controls whether the spotlight tour overlay is open |
| `onClose` | `(reason: TourCloseReason) => void` | — | Callback triggered when tour completes, is skipped, or is dismissed |
| `onStepChange` | `(index: number) => void` | `undefined` | Optional callback invoked whenever the active step index changes |
| `startAt` | `number` | `0` | Zero-based initial step index when the tour opens |
| `closeOnOverlayClick` | `boolean` | `false` | Whether clicking the dim overlay dismisses the tour |

_Généré par Component Atlas depuis les métadonnées publiées par la source._