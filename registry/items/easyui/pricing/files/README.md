# Pricing

Minimal two-tier pricing that belongs in EasyUI

## Fonctionnalités

- Two side-by-side pricing cards (Free + Pro) that collapse to a single column on mobile
- Strictly uses EasyUI design tokens — no hardcoded theme colors, automatic light / dark adaptation
- Typography and hierarchy communicate the tier difference; no badges, countdowns, or "best value" stamps
- Pro card receives a subtle surface elevation in light mode and a brighter surface in dark mode
- Pro CTA uses an animated gradient base that drifts on hover (3.6s ease-in-out, background-position slide) plus a one-pass shimmer beam (1.6s) and a subtle scale lift (1.015) — same EasyUI gradient vocabulary as the existing Button.tsx "gradient" variant
- Free CTA mirrors the secondary/outline button tone for clear hierarchy
- Subtle border-color hover, spring enter animation, and focus-visible ring
- Respects prefers-reduced-motion by disabling non-essential motion

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `freeTier` | `PricingTier` | `EasyUI defaults` | Configuration object for the Free tier — { name, tagline, price, cadence, features, ctaLabel, onCtaClick }. Optional: the component ships with sensible EasyUI defaults. |
| `proTier` | `PricingTier` | `EasyUI defaults` | Configuration object for the Pro tier — same shape as freeTier. Optional: defaults to the EasyUI Pro tier ($29, one-time payment). |
| `reverse` | `boolean` | `false` | Swaps the order so Pro is rendered on the left |
| `eyebrow` | `string` | `undefined` | Optional uppercase label rendered above the heading |
| `heading` | `string` | `undefined` | Optional headline rendered above the cards |
| `subheading` | `string` | `undefined` | Optional supporting copy rendered beneath the heading |
| `className` | `string` | `undefined` | Optional Tailwind classes appended to the outer section |

_Généré par Component Atlas depuis les métadonnées publiées par la source._