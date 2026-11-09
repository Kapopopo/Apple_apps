# Notification Bell

Adaptive notification badge & animated alert drawer

## Fonctionnalités

- Subtle rotational bell shake when new unread notifications arrive
- Spring-animated counter badge with overflow truncation (99+)
- Floating backdrop-blur panel with individual mark-as-read and mark-all-read controls
- Click-outside dismissal and accessible keyboard escape handling

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `notifications` | `Notification[]` | — | Array of notification objects (id, message, timestamp, read) |
| `onMarkAsRead` | `(id: string) => void` | — | Handler fired when an individual notification is marked read |
| `onMarkAllAsRead` | `() => void` | `undefined` | Handler to clear all active badges |
| `isOpen` | `boolean` | `undefined` | Controlled open state of notification drawer |
| `onOpenChange` | `(isOpen: boolean) => void` | `undefined` | Callback on panel open/close |
| `showCount` | `boolean` | `true` | Displays numeric badge instead of minimal red dot |

_Généré par Component Atlas depuis les métadonnées publiées par la source._