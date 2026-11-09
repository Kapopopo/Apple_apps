# Dot Shader

Interactive GPU dot matrix background with cursor proximity shader dynamics

## Fonctionnalités

- Hardware-accelerated WebGL point primitive vertex & fragment shader with Canvas 2D fallback
- Interactive cursor proximity illumination transitioning smoothly to accent color
- Magnetic/gravitational radial repulsion with smooth exponential damping
- Dynamic scale expansion creating a 3D lens bulge around the cursor
- Ambient wave undulation breathing subtle life into the background when idle
- Zero CPU overhead during rendering via GPU vertex shader positioning
- Supports wrapping arbitrary children without interfering with pointer interactions
- Full prefers-reduced-motion compliance freezing displacement and waves

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Optional content rendered above the interactive dot shader canvas with full clickability |
| `dotColor` | `string` | `'rgba(255, 255, 255, 0.15)'` | Idle color of the background matrix dots (hex, rgb, or rgba) |
| `accentColor` | `string` | `'#00F0FF'` | Luminous highlight color of dots illuminated by cursor proximity |
| `dotSize` | `number` | `1.5` | Base radius in pixels of each individual dot |
| `spacing` | `number` | `22` | Distance in pixels between adjacent dots in the grid |
| `cursorRadius` | `number` | `180` | Radius in pixels of cursor influence and repulsion |
| `distortionStrength` | `number` | `0.35` | Force multiplier of magnetic repulsion away from the cursor (0 to 1) |
| `maxScale` | `number` | `2.2` | Maximum scale multiplier of dots at peak cursor proximity |
| `waveIntensity` | `number` | `0.25` | Amplitude of ambient idle sinusoidal wave motion |
| `speed` | `number` | `1` | Speed multiplier for the ambient background waves |
| `interactive` | `boolean` | `true` | Whether dots react to cursor movements with repulsion and illumination |
| `overlay` | `boolean` | `true` | Enables a soft radial vignette gradient to seamlessly blend container edges |
| `className` | `string` | — | Additional CSS classes for container sizing and layout |

_Généré par Component Atlas depuis les métadonnées publiées par la source._