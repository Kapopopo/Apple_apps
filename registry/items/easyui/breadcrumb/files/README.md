# Breadcrumb

Gliding hover pill with animated trail expansion

## Fonctionnalités

- Hover pill smoothly glides between links using Framer Motion layoutId
- Long trails collapse the middle items into an ellipsis trigger button
- Clicking ellipsis animates hidden crumbs in while focus transfers to the first revealed crumb
- Supports chevron or slash separator styles and custom router link components (Next.js Link or <a>)
- Full accessibility with aria-label="Breadcrumb", aria-current="page", and keyboard navigation

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `items` | `BreadcrumbItem[]` | `undefined` | Array of breadcrumb items with label, href, and optional icon |
| `separator` | `'chevron' \| 'slash'` | `'chevron'` | Separator style between breadcrumb items |
| `maxItems` | `number` | `4` | Collapse the middle items when length exceeds this number |
| `as` | `React.ElementType` | `'a'` | Custom link component (e.g. Next.js Link) |
| `className` | `string` | `undefined` | Additional CSS classes for the nav container |

_Généré par Component Atlas depuis les métadonnées publiées par la source._