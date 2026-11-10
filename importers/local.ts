/**
 * Migration des 44 composants déjà vendorisés (demos/src/vendor) vers le registre.
 * Source de vérité éditoriale : data/curation.json. Les démos Atlas existantes servent de preview.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA, ROOT, toPosix } from '../shared/paths.js';
import { checkLicense } from '../shared/license.js';
import { deriveTags, refineType } from '../shared/taxonomy.js';
import type { FileMap } from '../shared/registry.js';
import { walk } from './lib/graph.js';
import { Collector } from './lib/collector.js';

interface Curated {
  id: string;
  name: string;
  demo: string;
  category: string;
  interaction: string;
  usage: string;
  reason: string;
  source_url: string;
  code_source: string;
  license: string;
  integration: string;
}

const LIBRARIES = {
  'magic-ui': { name: 'Magic UI', repo: 'https://github.com/magicuidesign/magicui', license: 'demos/licenses/magic-ui.txt' },
  'motion-primitives': {
    name: 'Motion Primitives',
    repo: 'https://github.com/ibelick/motion-primitives',
    license: 'demos/licenses/motion-primitives.txt',
  },
} as const;

export function importLocal() {
  const curation: Curated[] = JSON.parse(fs.readFileSync(path.join(DATA, 'curation.json'), 'utf8'));
  const collectors = new Map<string, Collector>();
  const aliases = { '@/': 'demos/src/' };
  for (const item of curation) {
    const sourceId = item.code_source.includes('magicui.design') ? 'magic-ui' : 'motion-primitives';
    const lib = LIBRARIES[sourceId];
    const licenseText = fs.readFileSync(path.join(ROOT, lib.license), 'utf8');
    const license = checkLicense(licenseText);
    const collector = collectors.get(sourceId) ?? new Collector('local', sourceId, { license: license.license });
    collectors.set(sourceId, collector);
    const id = `${sourceId}/${item.demo}`;
    if (license.status !== 'open') {
      collector.skip(id, license.reason);
      continue;
    }
    const entry = `demos/src/vendor/${item.demo}.tsx`;
    if (!fs.existsSync(path.join(ROOT, entry))) {
      collector.skip(id, `Fichier vendorisé absent : ${entry}`);
      continue;
    }
    const w = walk(ROOT, [entry], id, new Map(), aliases);
    const files: FileMap = new Map(w.files.map((rel) => [rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')]));
    const name = item.name || item.demo;
    const copyright = licenseText.match(/^\s*Copyright[^\n]+/im)?.[0].trim();
    collector.write(
      {
        id,
        name,
        type: refineType(name, 'component'),
        category: ({ Chiffres: 'Indicateurs', Témoignages: 'Carrousels' } as Record<string, string>)[item.category] ?? item.category,
        tags: deriveTags(name, item.reason, w.packages, [item.interaction, item.usage]),
        description: item.reason,
        framework: 'react',
        dependencies: w.packages,
        registryDependencies: [],
        source: lib.name,
        sourceId,
        sourceUrl: item.source_url,
        sourcePath: item.code_source,
        license: license.license,
        licenseStatus: 'open',
        licenseNotes:
          item.integration + (item.demo === 'accordion' ? ' Adaptation de typage pour React 19, sans changement de comportement.' : ''),
        ...(copyright ? { attribution: `Conserver la notice MIT : ${copyright}` } : {}),
        files: w.files.map((rel) => ({ path: toPosix(rel), role: rel.endsWith('.css') ? 'style' : 'source' })),
        preview: { kind: 'atlas-demo', demo: item.demo },
        catalogId: item.id,
      },
      files,
      new Map([['LICENSE', licenseText]]),
    );
  }
  // Magic UI et Motion Primitives sont aussi alimentés par l'importer GitHub : pas de contrôle « absent en amont » ici.
  return [...collectors].map(([, c]) => c.finish([]));
}
