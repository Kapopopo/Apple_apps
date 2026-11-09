# AI Agent Activity

Real-time AI agent tool call execution trace and reasoning timeline

## Fonctionnalités

- Real-time execution timeline supporting thinking, searching, reading, tool execution, API calls, and code running
- Interactive status indicators for pending, running (with active spinner), completed, error, and cancelled states
- Expandable inspector drawer displaying structured inputs, outputs, JSON payloads, and executed code snippets
- Step duration tracking and metadata telemetry badges for deep performance inspection
- One-click global Expand All and Collapse All control buttons in the header
- Smooth Framer Motion layout transitions tuned to physical spring tokens

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `activities` | `AgentActivityItemData[]` | `[]` | Array of activity steps representing the agent execution plan and execution trace |
| `isRunning` | `boolean` | `false` | Indicates whether the agent is currently executing steps in the background |
| `title` | `string` | `'Activity'` | Title displayed in the activity header |
| `agentName` | `string` | `undefined` | Optional agent or pipeline name displayed beside the title |
| `defaultExpandedIds` | `string[]` | `[]` | IDs of activity items that should start in an expanded state |
| `className` | `string` | `undefined` | Custom Tailwind class names for styling overrides |

_Généré par Component Atlas depuis les métadonnées publiées par la source._