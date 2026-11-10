/**
 * Format d'un item du registre (registry/<kind>/<sourceId>/<slug>/meta.json) et d'une spec.
 * Partagé par les importers, le serveur web, le serveur MCP et les tests.
 */
import * as z from 'zod';

/**
 * `lib` : helpers (cn, hooks…) requis par d'autres items ; `sound` : sons d'interface (Web Audio) ;
 * `template` : application ou site complet (toutes ses pages), point de départ d'un projet.
 */
export const ITEM_TYPES = ['component', 'section', 'screen', 'theme', 'font', 'easing', 'sound', 'lib', 'template'] as const;
export const BLOCK_TYPES = ['component', 'section', 'screen', 'lib'] as const;
export const FRAMEWORKS = ['react', 'react-native', 'agnostic'] as const;
/** `asset` : fichier binaire d'un template (image, police), stocké tel quel. */
export const FILE_ROLES = ['source', 'style', 'demo', 'doc', 'theme', 'data', 'asset'] as const;

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
export type ThemeTokens = z.infer<typeof ThemeTokens>;

export const EasingToken = z.object({
  name: z.string(),
  /** Valeur CSS : cubic-bezier(), linear() (ressorts) ou durée. */
  css: z.string(),
  cubicBezier: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(),
  kind: z.enum(['bezier', 'spring', 'duration']).default('bezier'),
  /** Ressort Motion : transition={{ type: 'spring', stiffness, damping, mass }}. */
  spring: z.object({ stiffness: z.number(), damping: z.number(), mass: z.number() }).optional(),
  durationMs: z.number().optional(),
  /** Quand l'utiliser (ressorts, durées). */
  usage: z.string().max(200).optional(),
});
export type EasingToken = z.infer<typeof EasingToken>;

/** Sons d'interface : `react-bits` = une recette jouée par le moteur React Bits ; `bencho` = `play(nom)` de sounds.ts. */
export const SoundInfo = z.object({ engine: z.enum(['react-bits', 'bencho']), names: z.array(z.string()).min(1) });

/** Template complet : nature du site, pages capturées sur la démo officielle, commandes et variables d'environnement. */
export const TemplateInfo = z.object({
  kind: z.string(),
  stack: z.string(),
  demo: z.union([z.string().url(), z.literal('')]),
  pages: z.array(z.object({ path: z.string(), title: z.string() })),
  install: z.string(),
  dev: z.string(),
  /** Variables à renseigner (.env.example), sans valeur. */
  env: z.array(z.string()).default([]),
  /** Fichiers binaires non repris (trop lourds) : à récupérer dans le dépôt d'origine si besoin. */
  skipped: z.array(z.string()).default([]),
});
export type TemplateInfo = z.infer<typeof TemplateInfo>;

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
  /** Lien vers l'origine ; vide pour les créations personnelles (thèmes perso). */
  sourceUrl: z.union([z.string().url(), z.literal('')]),
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
  sound: SoundInfo.optional(),
  template: TemplateInfo.optional(),
  contentHash: z.string(),
  importedAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Meta = z.infer<typeof Meta>;
export type ItemType = (typeof ITEM_TYPES)[number];

const ITEM_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/;
export const SpecBlock = z.object({
  id: z.string().regex(ITEM_ID),
  note: z.string().max(2000).default(''),
  /** Page du site où placer le bloc (multi-pages) ; vide = page unique. */
  page: z.string().max(60).optional(),
});
export const SPEC_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const Spec = z.object({
  name: z.string().regex(SPEC_NAME),
  title: z.string().max(120).default(''),
  brief: z.string().max(5000).default(''),
  stack: z.string().max(300).default(''),
  style: z.string().max(1000).default(''),
  theme: z.string().regex(ITEM_ID).nullable().default(null),
  /** Template complet servant de base au projet (facultatif). */
  template: z.string().regex(ITEM_ID).nullable().default(null),
  fonts: z.array(z.string().regex(ITEM_ID)).max(20).default([]),
  easings: z.array(z.string().regex(ITEM_ID)).max(20).default([]),
  sounds: z.array(z.string().regex(ITEM_ID)).max(40).default([]),
  blocks: z.array(SpecBlock).max(200).default([]),
  preset: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Spec = z.infer<typeof Spec>;
/** Entrée envoyée par le builder ou le MCP : aucun champ inconnu accepté. */
export const SpecInput = Spec.omit({ createdAt: true, updatedAt: true })
  .extend({ blocks: z.array(SpecBlock.strict()).max(200).default([]) })
  .strict();

/** Valeurs de licence communes à une source, stockées une fois dans l'index. */
export interface SourceInfo {
  name: string;
  license: string;
  licenseStatus: 'open' | 'restricted';
  licenseNotes?: string;
  attribution?: string;
}

/**
 * Résumé stocké dans registry/index.json (sans contenu de fichier).
 * `licenseNotes` / `attribution` ne sont présents que s'ils diffèrent de ceux de la source (voir hydrate()).
 * `group` rapproche les équivalents entre sources ; `isNew` marque ce qui est arrivé après le premier import d'une source.
 */
export type IndexEntry = Omit<Meta, 'files' | 'tokens' | 'easings'> & { dir: string; fileCount: number; group?: string; isNew?: boolean };

export interface RegistryIndex {
  generatedAt: string;
  count: number;
  sources: Record<string, SourceInfo>;
  items: IndexEntry[];
}
