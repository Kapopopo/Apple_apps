# Code Snippet Deck

Multi-language code runner snippet deck with live variable tuning

## Fonctionnalités

- Seamless multi-runtime tab switching (cURL, TypeScript, Python, Go, Rust)
- Dynamic parameter tuning drawer that updates generated code in real time
- Configurable line numbers and selective line highlighting
- macOS terminal-inspired window header with traffic dots and copy system
- Zero layout shift spring transition on tab changes

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `snippets` | `SnippetItem[]` | `[]` | Collection of language snippets and generator functions |
| `parameters` | `SnippetParameter[]` | `[]` | Configurable runtime variables (checkboxes, dropdowns, inputs) |
| `defaultLanguage` | `string` | `snippets[0]?.language` | Initially selected language key |
| `showLineNumbers` | `boolean` | `true` | Whether to display code line numbering |
| `showWindowBar` | `boolean` | `true` | Whether to render macOS window bar header |
| `className` | `string` | `undefined` | Custom CSS container classes |

_Généré par Component Atlas depuis les métadonnées publiées par la source._