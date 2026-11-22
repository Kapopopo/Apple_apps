/** Template maison mobile-base (authored/mobile-base) et ses palettes → registre. */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, toPosix } from '../shared/paths.js';
import type { FileMap } from '../shared/registry.js';
import type { FileEntry } from '../shared/schema.js';
import { skinCss } from '../shared/themes.js';
import { MOBILE_STACK_LINE, PALETTE_SOURCE, TEMPLATE_ID } from '../web/lib/mobile.js';
import { PALETTES, paletteTokens } from '../authored/mobile-palettes.js';
import { Collector } from './lib/collector.js';

export const MOBILE_BASE = path.join(ROOT, 'authored', 'mobile-base');
/** Produits par l'install, Expo ou une copie de travail : jamais publiés. */
const SKIP = /^(node_modules|\.expo|dist|web-build|ios|android|expo-env\.d\.ts|\.env|\.env\..*local|\.DS_Store)$/;
const BINARY = /\.(png|jpe?g|webp|ttf|otf)$/i;

/** Fichiers du template tels que publiés (fins de ligne LF). */
export function templateFiles(dir = MOBILE_BASE, base = dir, out: FileMap = new Map()): FileMap {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP.test(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) templateFiles(abs, base, out);
    else if (entry.isFile())
      out.set(
        toPosix(path.relative(base, abs)),
        BINARY.test(entry.name) ? fs.readFileSync(abs) : fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n'),
      );
  }
  return out;
}

export function importMobileBase() {
  const collector = new Collector('authored', PALETTE_SOURCE);
  const common = {
    source: 'Mobile Base',
    sourceId: PALETTE_SOURCE,
    sourceUrl: '' as const,
    license: 'LicenseRef-Personnel',
    licenseStatus: 'open' as const,
    licenseNotes: 'Création personnelle, libre d’usage dans tes projets. Code tiers (MIT) : THIRD_PARTY_LICENSES.txt du template.',
    attribution:
      'Conserver la notice MIT de react-native-reusables : Copyright (c) 2025 Founded Labs (THIRD_PARTY_LICENSES.txt du projet).',
  };

  for (const palette of PALETTES) {
    const tokens = paletteTokens(palette);
    collector.write(
      {
        ...common,
        id: `${PALETTE_SOURCE}/${palette.slug}`,
        name: palette.name,
        type: 'theme',
        category: 'Thèmes',
        tags: ['tokens', 'mobile', 'dark mode'],
        description: `Palette ${palette.name} : clair et sombre, rayon ${palette.radius} px. Tirée par « Varier » en cible mobile.`,
        framework: 'agnostic',
        dependencies: [],
        registryDependencies: [],
        files: [{ path: 'theme.css', role: 'theme' }],
        tokens,
        preview: { kind: 'none', reason: 'Palette de couleurs' },
      },
      new Map([['theme.css', skinCss(tokens)]]),
    );
  }

  const files = templateFiles();
  const pkg = JSON.parse(files.get('package.json') as string) as { dependencies: Record<string, string> };
  const entries: FileEntry[] = [...files].map(([file, content]) => ({
    path: file,
    role: Buffer.isBuffer(content) ? 'asset' : file.endsWith('.css') ? 'style' : 'source',
  }));
  collector.write(
    {
      ...common,
      id: TEMPLATE_ID,
      name: 'Mobile Base',
      type: 'template',
      category: 'Apps mobiles',
      tags: ['apps mobiles', 'template', 'expo', 'abonnement'],
      description:
        'Squelette d’app mobile à abonnement : onboarding configurable, paywall bloquant (RevenueCat ou secours), contrôle d’accès, réglages, thème par tokens. La fonctionnalité se code dans app/(main)/.',
      framework: 'react-native',
      dependencies: Object.entries(pkg.dependencies)
        .map(([name, version]) => `${name}@${version}`)
        .sort(),
      registryDependencies: [],
      preview: { kind: 'none', reason: 'App native : à lancer avec Expo' },
      template: {
        kind: 'App mobile à abonnement',
        stack: MOBILE_STACK_LINE.replaceAll(' · ', ', '),
        demo: '',
        pages: [
          { path: '/onboarding', title: 'Onboarding' },
          { path: '/paywall', title: 'Paywall' },
          { path: '/', title: 'Accueil' },
          { path: '/settings', title: 'Réglages' },
        ],
        install: 'npm ci',
        dev: 'npx expo start',
        env: [...(files.get('.env.example') as string).matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]),
        skipped: [],
      },
      files: entries,
    },
    files,
    new Map([['LICENSE', `Mobile Base — création personnelle.\n\n${common.licenseNotes}\n\n${common.attribution}\n`]]),
  );

  return collector.finish([PALETTE_SOURCE]);
}
