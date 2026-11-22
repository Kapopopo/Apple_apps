/**
 * Format d'un item du registre (registry/<kind>/<sourceId>/<slug>/meta.json) et d'une spec.
 * Partagé par les importers, le serveur web, le serveur MCP et les tests.
 */
import * as z from 'zod';
import {
  ILLUSTRATIONS,
  LIMITS,
  mobileDefaults,
  ONBOARDING_LAYOUTS,
  PAYWALL_LAYOUTS,
  SPACINGS,
  TARGETS,
  TRIAL_PLANS,
} from '../web/lib/mobile.js';

/**
 * `lib` : helpers (cn, hooks…) requis par d'autres items ; `sound` : sons d'interface (Web Audio) ;
 * `template` : application ou site complet (toutes ses pages), point de départ d'un projet.
 */
export const ITEM_TYPES = ['component', 'section', 'screen', 'theme', 'font', 'easing', 'sound', 'lib', 'template'] as const;
export const BLOCK_TYPES = ['component', 'section', 'screen', 'lib'] as const;
export const FRAMEWORKS = ['react', 'react-native', 'agnostic'] as const;
/** `asset` : fichier binaire d'un template (image, police), stocké tel quel. */
export const FILE_ROLES = ['source', 'style', 'demo', 'doc', 'theme', 'data', 'asset'] as const;

/** Cibles : d'un projet (`target` d'une spec) et d'un item (`platforms`). */
export const PLATFORMS = TARGETS;
export type Platform = (typeof PLATFORMS)[number];

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

/**
 * Section ou écran extrait d'un template complet : le fichier qui la rend, ses imports locaux et la
 * feuille de styles globale du template ; capturée sur la page indiquée de la démo officielle.
 */
export const FromTemplate = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/template$/),
  /** Page de la démo où la section a été capturée (chemin ou URL complète). */
  page: z.string(),
  /** Images du dossier public/ du template référencées par le code (non incluses dans l'item). */
  publicAssets: z.array(z.string()).default([]),
});
export type FromTemplate = z.infer<typeof FromTemplate>;

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
  fromTemplate: FromTemplate.optional(),
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

const mobile = mobileDefaults();
/** Ces URLs finissent dans l'app : https seulement. */
const HTTPS_URL = z.union([z.literal(''), z.url({ protocol: /^https$/ })]);
/** Réglages de l'app mobile : injectés par scaffold dans src/config/ du template mobile-base. */
export const Mobile = z
  .object({
    appName: z.string().max(30).default(''),
    slug: z.union([z.literal(''), z.string().regex(SPEC_NAME)]).default(''),
    /** Identifiant iOS et package Android : segments alphanumériques, sans tiret. */
    bundleId: z
      .union([
        z.literal(''),
        z
          .string()
          .max(155)
          .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/),
      ])
      .default(''),
    supportEmail: z.union([z.literal(''), z.email()]).default(''),
    termsUrl: HTTPS_URL.default(''),
    privacyUrl: HTTPS_URL.default(''),
    iosAppId: z
      .string()
      .regex(/^\d{0,15}$/)
      .default(''),
    revenueCat: z
      .object({
        entitlement: z.string().trim().min(1).max(100).default(mobile.revenueCat.entitlement),
        offering: z.string().max(100).default('').describe('Vide = offering courante'),
        useDashboardPaywall: z.boolean().default(false).describe('Un paywall est configuré dans le dashboard RevenueCat'),
      })
      .strict()
      .prefault({}),
    trial: z
      .object({
        days: z.number().int().min(0).max(90).default(mobile.trial.days).describe('Essai simulé en mode mock ; le réel vient du store'),
        plan: z.enum(TRIAL_PLANS).default('annual'),
      })
      .strict()
      .prefault({}),
    layouts: z
      .object({
        onboarding: z.enum(ONBOARDING_LAYOUTS).default('cards'),
        paywall: z.enum(PAYWALL_LAYOUTS).default('benefits'),
        spacing: z.enum(SPACINGS).default('normal'),
      })
      .strict()
      .prefault({}),
    slides: z
      .array(z.object({ title: z.string().min(1).max(80), text: z.string().max(240), illustration: z.enum(ILLUSTRATIONS) }).strict())
      .min(LIMITS.slides[0])
      .max(LIMITS.slides[1])
      .default(mobile.slides as never),
    questions: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
            title: z.string().min(1).max(120),
            options: z.array(z.string().min(1).max(60)).min(LIMITS.options[0]).max(LIMITS.options[1]),
            multiple: z.boolean().default(false),
          })
          .strict(),
      )
      .max(LIMITS.questions[1])
      .refine((list) => new Set(list.map((q) => q.id)).size === list.length, 'Identifiants de questions en double')
      .default([]),
    paywall: z
      .object({
        title: z.string().min(1).max(80).default(mobile.paywall.title),
        subtitle: z.string().max(160).default(mobile.paywall.subtitle),
        illustration: z.enum(ILLUSTRATIONS).default('star'),
        benefits: z.array(z.string().min(1).max(100)).min(LIMITS.benefits[0]).max(LIMITS.benefits[1]).default(mobile.paywall.benefits),
      })
      .strict()
      .prefault({}),
  })
  .strict();
export type Mobile = z.infer<typeof Mobile>;
export const Spec = z.object({
  name: z.string().regex(SPEC_NAME),
  title: z.string().max(120).default(''),
  target: z.enum(PLATFORMS).default('web'),
  /** Conservé quand la spec repasse en web, ignoré tant que la cible est web. */
  mobile: Mobile.optional(),
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
export type IndexEntry = Omit<Meta, 'files' | 'tokens' | 'easings'> & {
  dir: string;
  fileCount: number;
  /** Où l'item s'utilise tel quel ; vide = hors des deux stacks (Uniwind). */
  platforms: Platform[];
  group?: string;
  isNew?: boolean;
};

export interface RegistryIndex {
  generatedAt: string;
  count: number;
  sources: Record<string, SourceInfo>;
  items: IndexEntry[];
}
