# Chat

Production-ready conversation interface with history sidebar and composer

## Fonctionnalités

- Complete conversational layout with optional historical threads sidebar and responsive mobile drawer
- Rich message components supporting user, assistant, and system roles with timestamps and avatars
- Built-in file and image attachment upload system with chips, sizes, and removal actions
- Auto-expanding multiline composer with Enter-to-send and Shift+Enter for newline shortcuts
- Message delivery states: sending, sent, delivered, failed (with retry), and streaming
- Accessible action triggers for copying message content and managing conversation state

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `messages` | `ChatMessageItem[]` | `[]` | Array of chat message records including role, content, author, and attachments |
| `onSendMessage` | `(content: string, attachments?: ChatAttachment[]) => void` | `undefined` | Callback fired when the user submits a message via composer |
| `isGenerating` | `boolean` | `false` | Disables composer and shows loading status while the assistant is synthesizing an answer |
| `threads` | `ChatConversationThread[]` | `undefined` | Optional list of historical conversations displayed in the sidebar |
| `activeThreadId` | `string` | `undefined` | ID of the currently selected conversation thread |
| `onSelectThread` | `(threadId: string) => void` | `undefined` | Callback fired when a user selects a thread from the history sidebar |
| `onNewChat` | `() => void` | `undefined` | Callback fired when the user clicks the New Conversation button |
| `onClearChat` | `() => void` | `undefined` | Callback fired when the user clicks the clear chat history button |
| `className` | `string` | `undefined` | Custom Tailwind class names for styling overrides |

_Généré par Component Atlas depuis les métadonnées publiées par la source._