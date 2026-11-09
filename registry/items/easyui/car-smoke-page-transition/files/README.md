# Car Smoke Page Transition

Cinematic automotive page transition

## Fonctionnalités

- Hardware-accelerated Canvas particle drift smoke physics and realistic skid marks
- Choreographed multi-axis Ferrari drift movement, wheel spin, and speed lines
- Customizable travel direction (left-to-right or right-to-left), density, and scale
- Automatic theme awareness (light and dark mode overlay shading)
- Full accessibility support with automatic prefers-reduced-motion fallback

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `direction` | `'left-to-right' \| 'right-to-left'` | `'left-to-right'` | Direction of car travel |
| `carDuration` | `number` | `700` | Duration of car crossing animation in milliseconds |
| `carDelay` | `number` | `0` | Delay before car starts moving in milliseconds |
| `carSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the car (affects scale) |
| `smokeDensity` | `'off' \| 'low' \| 'medium' \| 'high'` | `'medium'` | Density of smoke particles emitted |
| `smokeLifetime` | `number` | `1200` | Lifetime of smoke particles in milliseconds |
| `showSpeedLines` | `boolean` | `true` | Whether to show speed lines effect behind the car |
| `pageTransitionDelay` | `number` | `550` | Delay before page transition overlay starts in milliseconds |
| `pageTransitionDuration` | `number` | `350` | Duration of page transition overlay fade in milliseconds |
| `resetDelay` | `number` | `300` | Delay before resetting to idle after transition completes in milliseconds |
| `onTransitionComplete` | `() => void` | `undefined` | Callback fired when transition completes (call navigate() here) |
| `children` | `ReactNode` | `undefined` | The trigger element (typically a Button) |
| `className` | `string` | `undefined` | Additional Tailwind classes merged into the root |

_Généré par Component Atlas depuis les métadonnées publiées par la source._