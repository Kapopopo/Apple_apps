import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.resolve(here, '../registry');
const SHIMS = path.resolve(here, 'shims');
const ANCHOR = path.resolve(here, 'src/main.tsx');
const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '/index.tsx', '/index.ts', '/index.js'];
const posix = (p: string) => p.split(path.sep).join('/');

/** Alias d'import par source, identiques à ceux des importers. */
function loadAliases(): Record<string, Record<string, string>> {
  const cfg = JSON.parse(fs.readFileSync(path.resolve(here, '../importers/sources.json'), 'utf8'));
  const map: Record<string, Record<string, string>> = { 'magic-ui': { '@/': 'demos/src/' }, 'motion-primitives': { '@/': 'demos/src/' } };
  for (const s of cfg.github) {
    if (s.aliases) map[s.id] = s.aliases;
    for (const v of s.variants ?? []) if (v.aliases) map[v.id] = v.aliases;
  }
  return map;
}

/** Fichiers de chaque source : chemin d'origine → chemin absolu (un import `@/x` peut viser un autre item). */
function loadFiles(): Map<string, Map<string, string>> {
  const { items } = JSON.parse(fs.readFileSync(path.join(REGISTRY, 'index.json'), 'utf8'));
  const bySource = new Map<string, Map<string, string>>();
  for (const item of items) {
    const meta = JSON.parse(fs.readFileSync(path.join(REGISTRY, item.dir, 'meta.json'), 'utf8'));
    const files = bySource.get(item.sourceId) ?? new Map();
    for (const f of meta.files) if (!files.has(f.path)) files.set(f.path, path.join(REGISTRY, item.dir, 'files', f.path));
    bySource.set(item.sourceId, files);
  }
  return bySource;
}

const firstExisting = (base: string) => EXTENSIONS.map((e) => base + e).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());

/**
 * Résolution des imports du code importé : alias de la source, fichiers d'autres items
 * de la même source, shims des helpers de site, paquets de previews/node_modules.
 * Tout ce qui manque devient un module qui lève une erreur au chargement : seul l'aperçu concerné échoue.
 */
function registryResolver(): Plugin {
  const aliases = loadAliases();
  const files = loadFiles();
  const missing = new Set<string>();
  const stub = (spec: string, from: string) => { missing.add(`${spec}  ←  ${posix(path.relative(REGISTRY, from))}`); return `\0atlas-missing:${spec}`; };
  const inSource = (source: string, rel: string) => {
    const map = files.get(source);
    for (const ext of EXTENSIONS) { const hit = map?.get(rel + ext); if (hit) return hit; }
  };
  /** Replis communs : helper cn, puis primitives shadcn/ui et hooks partagés qu'une source importe sans les fournir. */
  const shared = (target: string) => {
    if (/(^|\/)lib\/utils$/.test(target)) return path.join(SHIMS, 'global', 'lib', 'utils.ts');
    const primitive = target.match(/(?:^|\/)(ui|hooks)\/([\w.-]+)$/);
    return primitive ? inSource('shadcn', `${primitive[1]}/${primitive[2]}`) ?? inSource('shadcn', `${primitive[1] === 'ui' ? 'ui' : 'hooks'}/${primitive[2]}`) : undefined;
  };
  return {
    name: 'atlas-registry-resolver',
    enforce: 'pre',
    async resolveId(spec, importer, options) {
      if (!importer || spec.startsWith('\0')) return null;
      const from = path.resolve(importer.split('?')[0]);
      const rel = posix(path.relative(REGISTRY, from));
      const match = rel.match(/^items\/([^/]+)\/([^/]+)\/files\/(.+)$/) ?? (from.startsWith(SHIMS) ? ['', posix(path.relative(SHIMS, from)).split('/')[0], '', ''] : null);
      if (!match) {
        // Paquet tiers dont une dépendance optionnelle n'est pas installée (ex. styled-components) : erreur locale, pas d'échec du build.
        if (!from.includes(`${path.sep}node_modules${path.sep}`) || spec.startsWith('.') || spec.startsWith('/')) return null;
        const resolved = await this.resolve(spec, importer, { ...options, skipSelf: true });
        return resolved ?? stub(spec, from);
      }
      const [, source, slug, fileRel] = match;
      if (spec.startsWith('next/')) return firstExisting(path.join(SHIMS, 'global', spec)) ?? stub(spec, from);
      if (spec === 'cn') return path.join(SHIMS, 'global', 'lib', 'utils.ts'); // ReUI : alias réécrit par son CLI
      const alias = Object.keys(aliases[source] ?? {}).sort((a, b) => b.length - a.length).find((a) => spec.startsWith(a));
      if (alias !== undefined) {
        const target = aliases[source][alias] + spec.slice(alias.length);
        return firstExisting(path.join(REGISTRY, 'items', source, slug, 'files', target)) ?? inSource(source, target) ?? firstExisting(path.join(SHIMS, source, target)) ?? shared(target) ?? stub(spec, from);
      }
      if (spec.startsWith('.')) {
        if (firstExisting(path.resolve(path.dirname(from), spec.split('?')[0]))) return null;
        return inSource(source, path.posix.normalize(path.posix.join(path.posix.dirname(fileRel), spec))) ?? stub(spec, from);
      }
      const resolved = await this.resolve(spec, ANCHOR, { ...options, skipSelf: true });
      return resolved ?? stub(spec, from);
    },
    load(id) {
      if (!id.startsWith('\0atlas-missing:')) return null;
      const spec = id.slice('\0atlas-missing:'.length);
      return { code: `throw new Error(${JSON.stringify(`Module indisponible dans les previews : ${spec}`)});\nexport const __atlas = {};\nexport default undefined;`, syntheticNamedExports: '__atlas' };
    },
    buildEnd() {
      if (missing.size) {
        fs.writeFileSync(path.join(here, 'missing-modules.txt'), [...missing].sort().join('\n') + '\n');
        this.warn(`${missing.size} imports sans module (aperçus concernés en erreur) → previews/missing-modules.txt`);
      }
    },
  };
}

export default defineConfig({
  root: here,
  base: '/registry-previews/',
  plugins: [registryResolver(), react(), tailwindcss()],
  resolve: { alias: { '@registry': REGISTRY }, dedupe: ['react', 'react-dom', 'motion', 'framer-motion'] },
  build: {
    outDir: path.resolve(here, '../web/registry-previews'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      shimMissingExports: true,
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR' || warning.code === 'SHIMMED_EXPORT') return;
        warn(warning);
      },
    },
  },
  server: { fs: { allow: [here, REGISTRY] } },
});
