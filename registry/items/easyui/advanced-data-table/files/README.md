# Advanced Data Table

Enterprise-grade data table with sorting, filtering, selection, and expandable rows

## Fonctionnalités

- Multi-state column sorting with clean directional indicator icons
- Global live search with instant filtering across all data fields
- Faceted filter chips with multi-selection and reset counters
- Indeterminate select-all checkbox, row selection, and animated bulk actions drawer
- Smooth Framer Motion expandable rows for nested data and telemetry inspection
- Configurable pagination with page size dropdown and first/last page jump buttons
- Dynamic column visibility toggle menu to hide or show columns on demand
- Polished skeleton loading and informative empty state with clear filters trigger

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `data` | `T[]` | `[]` | Array of data records to render in the table |
| `columns` | `ColumnDef<T>[]` | `[]` | Column configuration defining headers, accessors, sorting, filtering, and custom cell renderers |
| `title` | `string` | `undefined` | Optional table title displayed in the toolbar |
| `searchPlaceholder` | `string` | `'Search records...'` | Placeholder text for the global search input |
| `defaultPageSize` | `number` | `10` | Initial number of records to show per page |
| `renderSubComponent` | `(row: T) => ReactNode` | `undefined` | Render prop function for expandable row sub-details |
| `onBulkDelete` | `(selectedIds: string[]) => void` | `undefined` | Callback fired when user executes bulk deletion |
| `onBulkExport` | `(selectedIds: string[]) => void` | `undefined` | Callback fired when user clicks bulk export |
| `isLoading` | `boolean` | `false` | Renders animated skeleton placeholders when true |
| `error` | `string \| null` | `null` | Renders an error state banner when present |
| `className` | `string` | `undefined` | Custom Tailwind class names for styling overrides |

_Généré par Component Atlas depuis les métadonnées publiées par la source._