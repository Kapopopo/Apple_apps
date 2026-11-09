/** Format du registre, idempotence des écritures, licences, graphe d'imports, tokens. Exécuté dans un ATLAS_ROOT temporaire. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-registry-'));
process.env.ATLAS_ROOT = tmp;
const { writeItem, buildIndex, allMeta, readFiles } = await import('../../shared/registry.js');
const { checkLicense, detectLicense } = await import('../../shared/license.js');
const { walk } = await import('../../importers/lib/graph.js');
const { extractTheme } = await import('../../importers/lib/css-tokens.js');
const { safeJoin } = await import('../../shared/paths.js');
const { classify, classifyCatalog, matches } = await import('../../shared/taxonomy.js');

const MIT = `MIT License\n\nCopyright (c) 2026 Exemple\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so.`;

const draft = (over: object = {}) => ({
  id: 'demo-src/button', name: 'Button', type: 'component' as const, category: 'Boutons', tags: [], description: 'Un bouton', framework: 'react' as const,
  dependencies: ['motion'], registryDependencies: [], source: 'Demo', sourceId: 'demo-src', sourceUrl: 'https://example.com/button',
  license: 'MIT', licenseStatus: 'open' as const, files: [{ path: 'src/button.tsx', role: 'source' as const }], preview: { kind: 'none' as const }, ...over,
});

test('écriture idempotente : ajout, inchangé, mise à jour, jamais de doublon', () => {
  const files = new Map([['src/button.tsx', 'export const Button = () => <button />;']]);
  assert.equal(writeItem(draft(), files), 'added');
  const first = allMeta()[0].meta;
  assert.equal(writeItem(draft({ sourceCommit: 'abc' }), files), 'unchanged', 'un nouveau commit sans changement de contenu ne réécrit pas');
  assert.equal(writeItem(draft(), new Map([['src/button.tsx', 'export const Button = () => <a />;']])), 'updated');
  const metas = allMeta();
  assert.equal(metas.length, 1);
  assert.equal(metas[0].meta.importedAt, first.importedAt, 'importedAt conservé');
  assert.ok(metas[0].meta.updatedAt);
  assert.match(readFiles(metas[0].meta, metas[0].dir)[0].content, /<a \/>/);
  const index = buildIndex();
  assert.equal(index.length, 1);
  assert.equal(index[0].fileCount, 1);
  assert.ok(!('files' in index[0]));
});

test('meta.json invalide refusé par le schéma', () => {
  assert.throws(() => writeItem(draft({ id: 'Pas Valide' }), new Map()));
  assert.throws(() => writeItem(draft({ type: 'widget' }), new Map()));
});

test('chemins de fichiers externes confinés au dossier de l’item', () => {
  assert.throws(() => safeJoin(tmp, '../evil.txt'));
  assert.throws(() => writeItem(draft({ id: 'demo-src/evil' }), new Map([['../../../evil.tsx', 'x']])));
  assert.ok(!fs.existsSync(path.join(tmp, 'evil.tsx')));
});

test('licences : liste blanche, clauses restrictives, absence', () => {
  assert.equal(detectLicense(MIT), 'MIT');
  assert.equal(checkLicense(MIT + '\n\n---\n\nNot covered by this licence: the Demo name and the photographs.\n').notes, 'Hors licence : the Demo name and the photographs.');
  const commons = 'MIT + Commons Clause License Condition v1.0 + Attribution\nPermission is hereby granted, free of charge...\nAttribution Requirement\nCommons Clause Restriction';
  assert.equal(checkLicense(commons).status, 'rejected');
  const accepted = checkLicense(commons, { license: 'LicenseRef-MIT-Commons-Clause-Attribution', attribution: 'Crédit obligatoire', notes: 'ok' });
  assert.equal(accepted.status, 'restricted');
  assert.equal(accepted.attribution, 'Crédit obligatoire');
  assert.equal(checkLicense(commons, { license: 'LicenseRef-Autre', attribution: '', notes: '' }).status, 'rejected', 'une acceptation ne vaut que pour le texte exact');
  assert.equal(checkLicense(null).status, 'rejected');
  assert.equal(checkLicense('All rights reserved.').reason, 'Licence non reconnue ou ambiguë');
  assert.equal(detectLicense('Licensed for non-commercial use only'), 'LicenseRef-NonCommercial');
});

test('graphe d’imports : fichiers internes, dépendances de registre, paquets npm', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-repo-'));
  const write = (rel: string, code: string) => { fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true }); fs.writeFileSync(path.join(repo, rel), code); };
  write('components/ui/card.tsx', "import { cn } from '@/lib/utils';\nimport { motion } from 'motion/react';\nimport type { X } from 'types-only';\nimport { helper } from './helper';\nimport React from 'react';");
  write('components/ui/helper.ts', "export const helper = 1; import './missing';");
  write('lib/utils.ts', "import { clsx } from 'clsx';");
  const w = walk(repo, ['components/ui/card.tsx'], 'src/card', new Map([['lib/utils.ts', 'src/utils']]), { '@/': '' });
  assert.deepEqual(w.files.sort(), ['components/ui/card.tsx', 'components/ui/helper.ts']);
  assert.deepEqual(w.dependsOn, ['src/utils']);
  assert.deepEqual(w.packages, ['motion'], 'react et les imports de type ne sont pas des dépendances');
  assert.deepEqual(w.unresolved, ['./missing']);
});

test('thème : custom properties clair/sombre, typographie et rayons séparés', () => {
  const { tokens, css } = extractTheme(':root{--background:#fff;--font-sans:Inter;--radius:8px;--shadow-x:0}\n.dark{--background:#000}\nbody{color:red}\n@media (prefers-color-scheme: dark){:root:not([data-theme=light]){--ink:#eee}}');
  assert.equal(tokens.colors.light['--background'], '#fff');
  assert.equal(tokens.colors.dark['--background'], '#000');
  assert.equal(tokens.colors.dark['--ink'], '#eee');
  assert.equal(tokens.typography['--font-sans'], 'Inter');
  assert.equal(tokens.radius['--radius'], '8px');
  assert.ok(!css.includes('color: red'), 'les styles du site sont exclus');
});

test('taxonomie : catégories du catalogue inchangées, extensions du registre', () => {
  assert.equal(classifyCatalog({ name: 'Images Slider' }).type_label, 'Carrousels');
  assert.equal(classifyCatalog({ name: 'Range Slider' }).type_label, 'Curseurs');
  assert.equal(classifyCatalog({ name: 'Chart Card' }).type_label, 'Graphiques');
  assert.notEqual(classifyCatalog({ name: 'Typography' }).type_label, 'Graphiques');
  assert.equal(classify('otp-input'), 'Formulaires');
  assert.equal(classify('voice-note'), 'Médias');
  assert.equal(classify('mystery', 'A vertical navigation list'), 'Navigation');
  assert.ok(matches('bouton', 'Button'));
  assert.ok(!matches('bouton', 'Calendar'));
});

test('importer : noms de composants et dépendances normalisés', async () => {
  const { slugify, depName } = await import('../../importers/github.js');
  assert.equal(slugify('AccordionGallery'), 'accordion-gallery');
  assert.equal(slugify('comp-01'), 'comp-01');
  assert.equal(depName('magic-ui', '@magicui/marquee'), 'magic-ui/marquee');
  assert.equal(depName('origin-ui', 'https://coss.com/origin/r/input.json'), 'origin-ui/input');
  assert.equal(depName('panelui-web', 'https://panelui.dev/r/web/button.json'), 'panelui-web/button');
});
