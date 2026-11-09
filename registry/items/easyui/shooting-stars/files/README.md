# Shooting Stars

Deep space canvas cosmos with glowing shooting stars, radiant twinkling starfield, and interactive stardust

## Fonctionnalités

- Zero external runtime dependencies: 100% native HTML5 Canvas 2D with sub-pixel DPR scaling
- Multi-depth twinkling starfield with radiant 4-point celestial cross-sparkles and soft halo blooms
- Cinematic meteors with radiant head bursts, tapered linear-gradient fading trails, and custom trajectory angles
- Stardust ember particles dynamically shed from traveling meteor tails for realistic atmospheric burns
- Subtle ambient cosmic nebula haze clouds rendering layered indigo, violet, and cyan deep-space depth
- Interactive mouse parallax tilt creating multi-plane 3D astronomical perspective
- Interactive click & tap summons custom meteors sweeping directly across the interaction point
- Full prefers-reduced-motion compliance freezing meteors and twinkle to a serene static night sky
- Stratified children wrapper supporting titles, hero copy, and buttons with intact pointer events

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Optional content rendered above the starry sky with full interactivity and clickability |
| `background` | `string` | `'#020617'` | Deep space background color (CSS color, hex, rgba, or gradient) |
| `starCount` | `number` | `120` | Total number of ambient background stars distributed across the sky |
| `starColors` | `string[]` | `['#FFFFFF', '#E0F2FE', '#C7D2FE', '#FEF08A']` | Palette of celestial tints applied to ambient background stars |
| `minStarSize` | `number` | `0.6` | Minimum radius in pixels of ambient stars |
| `maxStarSize` | `number` | `2.2` | Maximum radius in pixels of ambient stars |
| `twinkleSpeed` | `number` | `1` | Frequency speed multiplier for ambient star twinkle pulsation |
| `trailColor` | `string` | `'#38BDF8'` | Primary neon/atmospheric color of the shooting star trail |
| `headColor` | `string` | `'#FFFFFF'` | Luminous core burst color of the shooting star meteor head |
| `interval` | `number` | `2200` | Average delay in milliseconds between automatic shooting star spawns |
| `speed` | `[number, number] \| number` | `[12, 22]` | Speed range [min, max] or uniform velocity in pixels per frame |
| `trailLength` | `[number, number] \| number` | `[90, 180]` | Trail length range [min, max] or uniform length in pixels |
| `angle` | `number` | `42` | Trajectory flight angle in degrees clockwise from horizontal (45° is down-right) |
| `maxActiveShootingStars` | `number` | `2` | Maximum concurrent active meteors streaking across the sky at once |
| `showEmbers` | `boolean` | `true` | Whether shooting stars shed glowing stardust ember particles in their wake |
| `nebula` | `boolean` | `true` | Enables layered atmospheric cosmic nebula clouds in the deep background |
| `clickToSpawn` | `boolean` | `true` | Enables clicking or tapping to summon a shooting star sweeping past the cursor |
| `parallax` | `boolean` | `true` | Enables subtle mouse parallax perspective shifting background stars by depth |
| `className` | `string` | — | Additional CSS classes for container sizing, layout, and styling |

_Généré par Component Atlas depuis les métadonnées publiées par la source._