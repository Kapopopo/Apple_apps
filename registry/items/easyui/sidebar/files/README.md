# Sidebar

Cursor-following hover pill & gliding active indicator

## Fonctionnalités

- Hover pill tracks the cursor; active pill glides between items with a shared layout spring
- Nested items with animated expand/collapse and active dot indicator
- Icon-only collapse mode with floating tooltips, toggled via ⌘B / Ctrl+B
- Mobile drawer under md with drag-to-dismiss and backdrop blur
- Header and footer slots adapt to the collapsed state via useSidebar()

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `sections` | `SidebarSection[]` | `undefined` | Navigation sections with items, optional titles, badges, and nested children |
| `activeId` | `string` | `undefined` | ID of the active item |
| `onActiveChange` | `(id: string) => void` | `undefined` | Called when an item or child is selected |
| `header` | `React.ReactNode` | `undefined` | Brand/header slot (use useSidebar() to adapt when collapsed) |
| `footer` | `React.ReactNode` | `undefined` | Footer slot above the collapse toggle |
| `collapsed` | `boolean` | `undefined` | Controlled collapsed (icon-only) state |
| `defaultCollapsed` | `boolean` | `false` | Initial collapsed state (uncontrolled) |
| `onCollapsedChange` | `(collapsed: boolean) => void` | `undefined` | Collapse state change callback |
| `mobileOpen` | `boolean` | `undefined` | Controlled mobile drawer open state |
| `onMobileOpenChange` | `(open: boolean) => void` | `undefined` | Mobile drawer open state callback |
| `className` | `string` | `undefined` | Additional class for the aside |

_Généré par Component Atlas depuis les métadonnées publiées par la source._