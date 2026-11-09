# Animated File Upload

Physical drag-and-drop file uploader with per-file progress morphing

## Fonctionnalités

- Subtle physical dropzone scaling and border reaction without exaggerated AI glow
- Automatic mime-type detection and contextual file icon attribution
- Multi-file queue management with independent Uploading → Processing → Complete stages
- Self-morphing progress bar into checkmark state with non-aggressive error recovery
- Customizable file constraints (maxSize, maxFiles, accept) with accessible screen reader labels

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `multiple` | `boolean` | `true` | Allow multiple files selection and upload |
| `accept` | `string \| string[]` | `undefined` | Accepted MIME types or file extensions (e.g. image/*, .pdf) |
| `maxSize` | `number` | `26214400 (25MB)` | Maximum file size in bytes |
| `maxFiles` | `number` | `10` | Maximum number of concurrent files in list |
| `dropTitle` | `string` | `'Drop files here'` | Primary drop target heading |
| `dropSubtitle` | `string` | `'or browse from your device'` | Secondary call-to-action text |
| `variant` | `'standard' \| 'compact'` | `'standard'` | Display density mode |
| `disabled` | `boolean` | `false` | Disables all interactions and file picking |
| `onFilesSelected` | `(files: File[]) => void` | `undefined` | Callback triggered when files are chosen |
| `onUploadComplete` | `(file: UploadFileItem) => void` | `undefined` | Callback fired on successful upload completion |
| `uploadHandler` | `(file, onProgress) => Promise<void>` | `undefined` | Custom async upload handler returning a promise |

_Généré par Component Atlas depuis les métadonnées publiées par la source._