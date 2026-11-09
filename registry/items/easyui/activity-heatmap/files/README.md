# Activity Heatmap

Responsive contribution calendar and weekday-by-hour activity grid

## Fonctionnalités

- Calendar mode renders one cell per day in a GitHub-style contribution grid
- Hours mode renders a 7 × 24 weekday-by-hour matrix with crosshair bands
- Automatically drops columns on narrow screens so cells never fall below the minimum size
- Quartile-based color levels adapt to the actual data distribution
- Month and weekday labels collapse intelligently as the container narrows
- Summary line reports total activity and the peak day or cell
- Tooltip follows the active cell with a spring-tracked position and live region updates
- Honors prefers-reduced-motion by removing the staggered cell entrance animation

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `mode` | `"calendar" \| "hours"` | `"calendar"` | One cell per day or a weekday-by-hour grid |
| `data` | `HeatDay[]` | — | Calendar data as { date: "YYYY-MM-DD" | Date, value: number } entries |
| `matrix` | `number[][]` | — | Hours-mode matrix with 7 rows (weekdays) and 24 columns (hours) |
| `rowLabels` | `string[]` | `["Mon", … , "Sun"]` | Row names used in hours mode |
| `weeks` | `number` | `53` | Maximum number of weeks to show in calendar mode |
| `endDate` | `string \| Date` | — | Last day displayed; defaults to the latest date in the data |
| `weekStart` | `0 \| 1` | `0` | First day of the week: 0 for Sunday, 1 for Monday |
| `color` | `string` | `"#34d399"` | Base color mixed into the activity levels |
| `unit` | `string` | `"contributions"` | Plural noun used in the summary and tooltip |
| `minCell` | `number` | `11` | Smallest cell size before calendar columns are dropped |
| `animated` | `boolean` | `true` | Enables the staggered cell entrance animation |
| `ariaLabel` | `string` | `auto-generated` | Accessible description for the heatmap image role |
| `className` | `string` | `""` | Additional CSS classes for the heatmap wrapper |

_Généré par Component Atlas depuis les métadonnées publiées par la source._