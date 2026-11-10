/**
 * Racine Atlas temporaire pour les tests (registre minimal, pages factices, alias de sources).
 * `makeRoot()` doit être appelé AVANT d'importer les modules shared : la racine est lue à l'import.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function makeRoot(prefix = 'atlas-test-'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  process.env.ATLAS_ROOT = root;
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  write(
    'importers/sources.json',
    JSON.stringify({
      github: [
        { id: 'demo-src', aliases: { '@/': '' } },
        { id: 'shadcn', variants: [{ id: 'shadcn', aliases: { '@/registry/new-york/': '', '@/': '' } }] },
      ],
    }),
  );
  write('web/index.html', '<!doctype html><title>Catalogue</title>');
  write('web/builder.html', '<!doctype html><title>Builder</title>');
  write('web/app.js', 'console.log("app");');
  write('web/registry-previews/index.html', '<!doctype html><title>Aperçus</title>');
  write('data/curation.json', '[]');
  return root;
}

export const CN_SOURCE =
  "import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n";

const base = {
  tags: [] as string[],
  description: '',
  framework: 'react' as const,
  dependencies: [] as string[],
  registryDependencies: [] as string[],
  license: 'MIT',
  licenseStatus: 'open' as const,
  preview: { kind: 'live' as const },
};

/** shadcn/utils + shadcn/button, un composant restreint qui les importe, un thème et des easings. */
export async function seedRegistry() {
  const { writeItem, buildIndex } = await import('../../shared/registry.js');
  const shadcn = { ...base, source: 'shadcn/ui', sourceId: 'shadcn', sourceUrl: 'https://ui.shadcn.com' };
  writeItem(
    {
      ...shadcn,
      id: 'shadcn/utils',
      name: 'utils',
      type: 'lib',
      category: 'Utilitaires',
      files: [{ path: 'lib/utils.ts', role: 'source' }],
    },
    new Map([['lib/utils.ts', CN_SOURCE]]),
  );
  writeItem(
    {
      ...shadcn,
      id: 'shadcn/button',
      name: 'Button',
      type: 'component',
      category: 'Boutons',
      dependencies: ['@radix-ui/react-slot'],
      registryDependencies: ['shadcn/utils'],
      files: [
        { path: 'ui/button.tsx', role: 'source' },
        { path: 'examples/button-demo.tsx', role: 'demo' },
      ],
    },
    new Map([
      ['ui/button.tsx', "import { cn } from '@/lib/utils';\n\nexport function Button() {\n  return <button className={cn('btn')} />;\n}\n"],
      [
        'examples/button-demo.tsx',
        "import { Button } from '@/registry/new-york/ui/button';\n\nexport default function Demo() {\n  return <Button />;\n}\n",
      ],
    ]),
  );
  const demo = { ...base, source: 'Demo UI', sourceId: 'demo-src', sourceUrl: 'https://example.com/demo' };
  writeItem(
    {
      ...demo,
      id: 'demo-src/card',
      name: 'Fancy Card',
      type: 'component',
      category: 'Cartes',
      dependencies: ['motion'],
      registryDependencies: ['shadcn/button'],
      license: 'LicenseRef-Demo-Attribution',
      licenseStatus: 'restricted',
      attribution: 'Crédit « Demo UI » obligatoire',
      licenseNotes: 'Revente interdite',
      files: [
        { path: 'components/card/card.tsx', role: 'source' },
        { path: 'components/card/helper.ts', role: 'source' },
        { path: 'components/card/card.css', role: 'style' },
      ],
    },
    new Map([
      [
        'components/card/card.tsx',
        "import { motion } from 'motion/react';\nimport { Button } from '@/components/ui/button';\nimport { cn } from '@/lib/utils';\nimport { helper } from './helper';\nimport './card.css';\nimport { Ghost } from '@/components/ghost';\n\nexport function Card() {\n  return <motion.div className={cn(helper)}><Button /><Ghost /></motion.div>;\n}\n",
      ],
      ['components/card/helper.ts', "import clsx from 'clsx';\nexport const helper = clsx('card');\n"],
      ['components/card/card.css', '.card { color: red; }\n'],
    ]),
  );
  writeItem(
    {
      ...demo,
      id: 'demo-src/theme',
      name: 'Demo Theme',
      type: 'theme',
      category: 'Thèmes',
      framework: 'agnostic',
      preview: { kind: 'none' },
      tokens: {
        colors: { light: { '--background': '#ffffff', '--primary': 'oklch(0.6 0.2 250)' }, dark: { '--background': '#000000' } },
        typography: { '--font-sans': 'Inter' },
        radius: { '--radius': '8px' },
        easings: [],
        other: {},
      },
      files: [{ path: 'theme.css', role: 'theme' }],
    },
    new Map([['theme.css', ':root { --background: #ffffff; }\n']]),
  );
  writeItem(
    {
      ...base,
      id: 'atlas/easings-standard',
      name: 'Easings standard',
      type: 'easing',
      category: 'Easings',
      framework: 'agnostic',
      source: 'Component Atlas',
      sourceId: 'atlas',
      sourceUrl: 'https://robertpenner.com/easing/',
      license: 'BSD-3-Clause',
      preview: { kind: 'none' },
      files: [
        { path: 'easings.ts', role: 'source' },
        { path: 'easings.css', role: 'style' },
      ],
      easings: [{ name: 'easeOutCubic', kind: 'bezier', cubicBezier: [0.33, 1, 0.68, 1], css: 'cubic-bezier(0.33, 1, 0.68, 1)' }],
    },
    new Map([
      ['easings.ts', 'export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);\n'],
      ['easings.css', ':root { --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1); }\n'],
    ]),
  );
  writeItem(
    {
      ...base,
      id: 'demo-site/template',
      name: 'Demo Site',
      type: 'template',
      category: 'Sites vitrines',
      framework: 'react',
      source: 'Demo Site',
      sourceId: 'demo-site',
      sourceUrl: 'https://example.com/demo-site',
      preview: { kind: 'none' },
      dependencies: ['next@15.0.0'],
      template: {
        kind: 'Site vitrine',
        stack: 'Next.js',
        demo: 'https://example.com',
        pages: [{ path: '/', title: 'Accueil' }],
        install: 'npm install',
        dev: 'npm run dev',
        env: ['API_KEY'],
        skipped: [],
      },
      files: [
        { path: 'package.json', role: 'source' },
        { path: 'app/page.tsx', role: 'source' },
        { path: 'public/logo.png', role: 'asset' },
      ],
    },
    new Map<string, string | Buffer>([
      ['package.json', '{ "name": "demo-site", "scripts": { "dev": "next dev" } }\n'],
      ['app/page.tsx', 'export default function Page() {\n  return <h1>Bonjour</h1>;\n}\n'],
      ['public/logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff])],
    ]),
    new Map([['LICENSE', 'MIT License\n\nCopyright (c) 2026 Demo\n']]),
  );
  const { REGISTRY } = await import('../../shared/paths.js');
  const screens = path.join(REGISTRY, 'templates', 'demo-site', 'template', 'screens');
  fs.mkdirSync(screens, { recursive: true });
  fs.writeFileSync(path.join(screens, '01-desktop.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  fs.writeFileSync(
    path.join(screens, 'screens.json'),
    JSON.stringify([{ file: '01-desktop.jpg', path: '/', title: 'Accueil', viewport: 'desktop' }]),
  );
  buildIndex();
}
