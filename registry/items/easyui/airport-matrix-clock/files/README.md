# Airport Matrix Clock

World time, one rolling matrix character at a time

## Fonctionnalités

- IANA timezone formatting handles local time and daylight-saving changes without a time service
- Three-city default with a five-city maximum, duplicate removal, and safe fallback for invalid input
- Built-in country and city selectors let viewers add or remove cities from the supported set
- Compact bitmap glyphs for city names and 12-hour or 24-hour time
- Only changed character cells roll; unchanged cells retain their rendered state
- Hovering a city or time rolls its characters through a brief staggered rebuild
- Dedicated dark matrix board surface with authentic high-contrast dot matrix typography

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `cities` | `AirportMatrixCityId[]` | `['los-angeles', 'london', 'tokyo']` | Initial or controlled city IDs; supports one to five cities. |
| `format` | `'12h' \| '24h'` | `'24h'` | Local time display format. |
| `showSeconds` | `boolean` | `false` | Include seconds in each displayed time. |
| `updateInterval` | `number` | `1000` | Shared clock refresh interval in milliseconds. |
| `showCountry` | `boolean` | `false` | Show the country name under each city. |
| `showControls` | `boolean` | `true when cities is omitted` | Show country and city selectors plus add and remove controls. |
| `onCitiesChange` | `(cities: AirportMatrixCityId[]) => void` | `undefined` | Receive city selection changes when using a controlled cities prop. |
| `className` | `string` | `''` | Additional classes for the board container. |

_Généré par Component Atlas depuis les métadonnées publiées par la source._