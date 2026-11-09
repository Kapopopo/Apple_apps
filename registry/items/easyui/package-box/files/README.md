# Package Box

Interactive 3D package box with flap folding and rising document motion

## Fonctionnalités

- Pure CSS 3D cardboard box geometry with authentic grain texture and lighting gradients
- Choreographed master timeline: seam tape cut, sequential flap folding, and smooth paper rise
- Responsive stage scaling that fluidly adapts to any container width via ResizeObserver
- Customizable packing slip with itemization, totals, shipping info, and tactile rubber stamp
- Configurable color tokens for cardboard, tape, paper, typography, and stamp accent
- Full accessibility support with aria-controls, Esc dismiss, and prefers-reduced-motion adaptation

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled open state of the package box |
| `defaultOpen` | `boolean` | `false` | Initial open state for uncontrolled usage |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback triggered when open state changes |
| `children` | `ReactNode` | `undefined` | Custom React elements to render inside the rising document paper |
| `slip` | `PackageSlip` | `DEFAULT_SLIP` | Structured metadata for the default shipping invoice / packing slip |
| `maxWidth` | `number` | `460` | Maximum width in px; the 3D scene scales down responsively |
| `colors` | `PackageBoxColors` | `undefined` | Color overrides for box cardboard, tape, paper, ink, and accent stamp |
| `label` | `ReactNode \| false` | `undefined` | Custom shipping label or false to hide |
| `symbols` | `ReactNode \| false` | `undefined` | Custom fragile/handling symbols or false to hide |
| `tape` | `boolean` | `true` | Whether packing tape across top and seam is rendered |
| `hint` | `boolean` | `true` | Whether to show the accessible toggle button below the box |
| `openLabel` | `string` | `'Click to open'` | Accessible label when closed |
| `closeLabel` | `string` | `'Close'` | Accessible label when open |
| `reserveSpace` | `boolean` | `false` | Whether to preserve full open height while closed to avoid layout shifts |
| `className` | `string` | `''` | Optional CSS class names for outer wrapper |
| `paperClassName` | `string` | `''` | Optional CSS class names for the document paper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._