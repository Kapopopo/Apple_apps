# Glass Navbar

Refined glass navigation with spring physics

## Fonctionnalités

- Subtle glassmorphic blur backdrop (bg-[#050505]/85 backdrop-blur-md)
- Dual layout modes: Floating pill or full-width sticky bar
- Shared layout spring animations for hover spotlight & active indicators
- Responsive mobile menu drawer with smooth Framer Motion spring transition
- Customizable brand logo, navigation items, badges, and CTA action slot
- Full keyboard navigation, Escape key dismiss, and aria-expanded accessibility

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `brand` | `React.ReactNode` | `<EasyUILogo />` | Brand / Logo element or text component |
| `brandHref` | `string` | `'/'` | Root link destination for the brand logo |
| `items` | `NavItem[]` | `Default items array` | Array of navigation links with label, href, badge, icon |
| `cta` | `React.ReactNode` | `<GetStartedButton />` | Right-hand side action slot / CTA button |
| `activeId` | `string` | `undefined` | Explicit active item identifier or label |
| `variant` | `'floating' \| 'full-width'` | `'floating'` | Visual style layout structure |
| `sticky` | `boolean` | `true` | Pins the navigation bar to the top of the viewport |
| `glass` | `boolean` | `true` | Enables backdrop-blur glassmorphism background |
| `onItemSelect` | `(item: NavItem) => void` | `undefined` | Callback fired when any nav item is selected |

_Généré par Component Atlas depuis les métadonnées publiées par la source._