/**
 * Format d'un item du registre (registry/<kind>/<sourceId>/<slug>/meta.json).
 * Partagé par les importers, le serveur MCP et les tests.
 */
import * as z from 'zod';

/** `lib` : helpers (cn, hooks…) requis par d'autres items, masqués par défaut dans le builder. */
export const ITEM_TYPES = ['component', 'section', 'screen', 'theme', 'font', 'easing', 'lib'] as const;
export const FRAMEWORKS = ['react', 'react-native', 'agnostic'] as const;
export const FILE_ROLES = ['source', 'style', 'demo', 'doc', 'theme', 'data'] as const;

export const FileEntry = z.object({
  /** Chemin relatif dans `files/`, identique au chemin d'origine dans le repo source. */
  path: z.string().min(1),
  role: z.enum(FILE_ROLES),
  /** Emplacement conseillé dans le projet cible (champ `target` des registres shadcn). */
  target: z.string().optional(),
});
export type FileEntry = z.infer<typeof FileEntry>;

export const Preview = z.object({
  /** live : rendu par l'app previews ; atlas-demo : démo existante de web/demos ; none : pas de rendu web. */
  kind: z.enum(['live', 'atlas-demo', 'none']),
  /** Fichier rendu (export par défaut ou export nommé `exportName`). */
  entry: z.string().optional(),
  exportName: z.string().optional(),
  demo: z.string().optional(),
  reason: z.string().optional(),
});

export const FontStyle = z.object({ name: z.string(), weight: z.number(), italic: z.boolean() });
export const FontInfo = z.object({
  family: z.string(),
  slug: z.string(),
  category: z.string().optional(),
  styles: z.array(FontStyle),
  variable: z.boolean(),
  cssUrl: z.string().url(),
  publisher: z.string().optional(),
  designers: z.array(z.string()).default([]),
});

export const ThemeTokens = z.object({
  colors: z.object({ light: z.record(z.string(), z.string()), dark: z.record(z.string(), z.string()) }),
  typography: z.record(z.string(), z.string()).default({}),
  radius: z.record(z.string(), z.string()).default({}),
  easings: z.array(z.string()).default([]),
  /** Autres custom properties (ombres, espacements…). */
  other: z.record(z.string(), z.string()).default({}),
});

export const EasingToken = z.object({
  name: z.string(),
  css: z.string(),
  cubicBezier: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(),
});

export const Meta = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  name: z.string().min(1),
  type: z.enum(ITEM_TYPES),
  category: z.string(),
  tags: z.array(z.string()),
  description: z.string().default(''),
  framework: z.enum(FRAMEWORKS),
  /** Paquets npm à installer (hors react / react-dom). */
  dependencies: z.array(z.string()),
  /** Autres items du registre requis (résolus récursivement par get_component). */
  registryDependencies: z.array(z.string()).default([]),
  source: z.string(),
  sourceId: z.string(),
  sourceUrl: z.string().url(),
  sourcePath: z.string().optional(),
  sourceCommit: z.string().optional(),
  license: z.string(),
  /** open : licence de la liste blanche ; restricted : acceptée explicitement avec conditions (voir attribution). */
  licenseStatus: z.enum(['open', 'restricted']),
  licenseNotes: z.string().optional(),
  attribution: z.string().optional(),
  files: z.array(FileEntry),
  theme: z.string().optional(),
  preview: Preview.default({ kind: 'none' }),
  catalogId: z.string().optional(),
  font: FontInfo.optional(),
  tokens: ThemeTokens.optional(),
  easings: z.array(EasingToken).optional(),
  contentHash: z.string(),
  importedAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Meta = z.infer<typeof Meta>;
export type ItemType = (typeof ITEM_TYPES)[number];

export const SpecBlock = z.object({ id: z.string(), note: z.string().max(2000).default('') });
export const Spec = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  title: z.string().max(120).default(''),
  brief: z.string().max(5000).default(''),
  stack: z.string().max(300).default(''),
  style: z.string().max(1000).default(''),
  theme: z.string().nullable().default(null),
  fonts: z.array(z.string()).default([]),
  easings: z.array(z.string()).default([]),
  blocks: z.array(SpecBlock).default([]),
  preset: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Spec = z.infer<typeof Spec>;

/** Résumé stocké dans registry/index.json (sans contenu de fichier). */
export type IndexEntry = Omit<Meta, 'files' | 'tokens' | 'easings'> & { dir: string; fileCount: number };
