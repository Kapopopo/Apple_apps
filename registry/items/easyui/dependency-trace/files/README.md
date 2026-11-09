# Dependency Trace

Interactive SVG node relationship & dependency tracer

## Fonctionnalités

- Interactive bezier curve paths with animated glow pulses on hover
- Automatic dimming of unrelated network branches and nodes
- Configurable node placement or radial auto-layout geometry
- Accessible region landmark with hover & click selection telemetry

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `nodes` | `TraceNode[]` | — | Array of graph nodes (id, label, type, x, y) |
| `connections` | `TraceConnection[]` | — | Array of directional or undirected link connections (from, to, label) |
| `onNodeSelect` | `(id: string) => void` | `undefined` | Node click event callback |
| `onNodeHover` | `(id: string \| null) => void` | `undefined` | Hover event callback |
| `nodeSize` | `number` | `36` | Node diameter in pixels |

_Généré par Component Atlas depuis les métadonnées publiées par la source._