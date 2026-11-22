/**
 * Démarre un projet depuis un template du registre :
 *   npm run scaffold -- <id> --out <dossier> [--force]
 * <id> : saas-starter/template, ou simplement saas-starter. Le dossier doit être vide ou absent
 * (sinon --force, qui ne remplace que les fichiers du template). Écrit aussi LICENSE (licence du template)
 * et ATLAS.md (origine, commandes, variables d'environnement à renseigner).
 *
 * App mobile depuis une spec (commande donnée par le MCP, à lancer dans le dossier de la nouvelle app) :
 *   node <atlas>/node_modules/tsx/dist/cli.mjs <atlas>/scripts/scaffold.ts mobile-base --spec <nom> --out . --install
 * injecte la config de la spec, ses blocs natifs et ses polices, puis lance npm ci.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_INSTRUCTION, TEMPLATE_ID } from '../web/lib/mobile.js';
import { downloadFonts } from '../shared/fontshare-files.js';
import { appIdentity, mobileApp } from '../shared/mobile.js';
import { indexItems, readMeta } from '../shared/registry.js';
import { fromCaller, REGISTRY, ROOT, safeJoin } from '../shared/paths.js';
import type { Spec } from '../shared/schema.js';
import { specBundle } from '../shared/spec-bundle.js';
import { getSpec } from '../shared/specs.js';

/** Présents dans un dossier « vide » où l'on vient de lancer Claude Code : laissés intacts. */
const HARMLESS = new Set(['.git', '.claude', '.mcp.json', '.DS_Store']);

function parse(argv: string[]) {
  const out: { id?: string; dir?: string; spec?: string; install: boolean; force: boolean } = { install: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out.dir = argv[++i];
    else if (argv[i] === '--spec') {
      out.spec = argv[++i];
      if (!out.spec) throw new Error('--spec attend le nom d’une spec');
    } else if (argv[i] === '--install') out.install = true;
    else if (argv[i] === '--force') out.force = true;
    else if (!argv[i].startsWith('--') && !out.id) out.id = argv[i];
    else throw new Error(`Argument inconnu : ${argv[i]}`);
  }
  return out;
}

/** `app` : spec mobile à injecter dans mobile-base, avec ses polices déjà téléchargées. */
export function scaffold(idOrSlug: string, outDir: string, force = false, app?: { spec: Spec; fonts: Map<string, Buffer> }) {
  const templates = indexItems().filter((e) => e.type === 'template');
  const entry = templates.find((e) => e.id === idOrSlug || e.sourceId === idOrSlug);
  if (!entry) throw new Error(`Template introuvable : ${idOrSlug}. Templates : ${templates.map((t) => t.sourceId).join(', ') || 'aucun'}`);
  const dir = path.join(REGISTRY, entry.dir);
  const meta = readMeta(dir);
  if (!meta?.template) throw new Error(`${entry.id} n'est pas un template complet.`);
  if (app && meta.id !== TEMPLATE_ID) throw new Error('--spec ne s’applique qu’au template mobile-base.');
  if (app && app.spec.target !== 'mobile')
    throw new Error(`La spec « ${app.spec.name} » a pour cible Web : choisir App mobile dans le builder.`);
  const out = path.resolve(outDir);
  if (out === path.resolve(ROOT)) throw new Error('Refus d’écrire un template dans le dépôt Atlas lui-même.');
  if (fs.existsSync(out) && fs.readdirSync(out).some((name) => !HARMLESS.has(name)) && !force)
    throw new Error(`Le dossier ${out} n'est pas vide (relancer avec --force pour y écrire quand même).`);
  // Tout ce qui peut échouer est calculé avant la première écriture.
  const generated = app ? appFiles(app.spec, app.fonts, new Set(meta.files.map((f) => f.path))) : null;
  fs.mkdirSync(out, { recursive: true });
  for (const f of meta.files) {
    const target = safeJoin(out, f.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(dir, 'files', f.path), target);
  }
  if (fs.existsSync(path.join(dir, 'LICENSE'))) fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(out, 'LICENSE'));
  if (app && generated) {
    for (const [file, content] of generated) {
      const target = safeJoin(out, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    renamePackage(out, appIdentity(app.spec).slug);
  }
  const t = meta.template;
  const lines = [
    `# ${meta.name}`,
    '',
    `Projet démarré depuis le template ${meta.id} du registre Component Atlas.`,
    '',
    `- Type : ${t.kind} · stack : ${t.stack}`,
    `- Source : ${meta.sourceUrl}`,
    `- Licence : ${meta.license} (fichier LICENSE)${meta.attribution ? ` — ${meta.attribution}` : ''}`,
    ...(t.demo ? [`- Démo officielle : ${t.demo}`] : []),
    '',
    '## Démarrer',
    '',
    '```bash',
    t.install,
    t.dev,
    '```',
  ];
  if (meta.id === TEMPLATE_ID) lines.push('', '## Consigne', '', `IMPORTANT : ${MOBILE_INSTRUCTION}. Détails : README.md.`);
  if (t.env.length)
    lines.push(
      '',
      '## Variables d’environnement',
      '',
      `À renseigner dans \`.env.local\` (voir \`.env.example\`) : ${t.env.map((v) => `\`${v}\``).join(', ')}.`,
    );
  if (t.skipped.length)
    lines.push(
      '',
      '## Fichiers non repris',
      '',
      'Trop lourds pour le registre, à récupérer dans le dépôt d’origine si besoin :',
      '',
      ...t.skipped.map((s) => `- ${s}`),
    );
  fs.writeFileSync(path.join(out, 'ATLAS.md'), lines.join('\n') + '\n');
  return { entry, meta, out, files: meta.files.length };
}

/** Config de la spec, polices, blocs natifs (sous src/) et crédits. Un fichier du template prime sur celui d'un bloc. */
function appFiles(spec: Spec, fonts: Map<string, Buffer>, template: Set<string>): Map<string, string | Buffer> {
  const app = mobileApp(spec);
  const absent = app.downloads.filter((f) => !fonts.has(f.path));
  if (absent.length) throw new Error(`Polices non téléchargées : ${absent.map((f) => f.path).join(', ')}`);
  const bundle = specBundle(spec, { alias: '@/' });
  const files = new Map<string, string | Buffer>(fonts);
  for (const f of [...bundle.extras, ...bundle.files]) {
    const target = f.path === 'CREDITS.md' ? f.path : `src/${f.path}`;
    if (!template.has(target)) files.set(target, f.content);
  }
  for (const f of app.files) files.set(f.path, f.content);
  return files;
}

/** Nom npm de l'app, dans package.json et dans le lockfile (que npm ci compare). */
function renamePackage(dir: string, name: string) {
  for (const file of ['package.json', 'package-lock.json']) {
    const target = path.join(dir, file);
    if (!fs.existsSync(target)) continue;
    const json = JSON.parse(fs.readFileSync(target, 'utf8'));
    json.name = name;
    if (json.packages?.['']) json.packages[''].name = name;
    fs.writeFileSync(target, JSON.stringify(json, null, 2) + '\n');
  }
}

/** Versions de Node acceptées par Expo SDK 58. */
export function nodeSupported(version: string): boolean {
  const [major, minor] = version.split('.').map(Number);
  return (major === 22 && minor >= 13) || (major === 24 && minor >= 3) || major >= 26;
}

/** Environnement de l'install : sans ce que `npm --prefix <atlas> run` transmet, qui ferait installer dans Atlas. */
export function installEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const atlasBin = path.resolve(ROOT, 'node_modules', '.bin').toLowerCase();
  return Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => !/^(npm_|INIT_CWD$)/i.test(key))
      .map(([key, value]) => [
        key,
        key.toLowerCase() === 'path'
          ? value
              ?.split(path.delimiter)
              .filter((p) => p && path.resolve(p).toLowerCase() !== atlasBin)
              .join(path.delimiter)
          : value,
      ]),
  );
}

/** `command` est une commande fixe, ou des noms de paquets validés par nativePackages (shell requis pour npm.cmd). */
function run(command: string, cwd: string) {
  console.log(`> ${command}`);
  const result = spawnSync(command, { cwd, env: installEnv(process.env), shell: true, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Échec de « ${command} ». Les fichiers sont écrits : relancer cette commande dans ${cwd}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join('scripts', 'scaffold.ts'))) {
  try {
    const args = parse(process.argv.slice(2));
    if (!args.id || !args.dir) {
      console.error('Usage : npm run scaffold -- <template> --out <dossier> [--spec <spec mobile>] [--install] [--force]');
      console.error(
        `Templates : ${indexItems()
          .filter((e) => e.type === 'template')
          .map((t) => t.sourceId)
          .join(', ')}`,
      );
      process.exit(2);
    }
    const mobile = args.id === TEMPLATE_ID || `${args.id}/template` === TEMPLATE_ID;
    if (args.install && !mobile) throw new Error('--install ne s’applique qu’au template mobile-base.');
    if (args.install && !nodeSupported(process.versions.node))
      throw new Error(
        `Node ${process.versions.node} est trop ancien pour Expo SDK 58 (22.13+, 24.3+ ou 26+). Rien n’a été écrit : mettre Node à jour (nvm install 22, puis nvm use 22), puis relancer.`,
      );
    let app: { spec: Spec; fonts: Map<string, Buffer> } | undefined;
    if (args.spec) {
      if (!mobile) throw new Error('--spec ne s’applique qu’au template mobile-base.');
      const stored = getSpec(args.spec);
      if (!stored) throw new Error(`Spec introuvable : ${args.spec}`);
      const planned = mobileApp(stored.spec);
      app = { spec: stored.spec, fonts: await downloadFonts(planned.downloads) };
    }
    const { meta, out, files } = scaffold(args.id, fromCaller('scaffold', args.dir), args.force, app);
    if (app) {
      const bundle = specBundle(app.spec);
      for (const r of bundle.replaced) console.log(`Non copié, ${r.id} : ${r.instruction}`);
      for (const line of bundle.ignored) console.log(`Ignoré en mobile : ${line}`);
      if (args.install) {
        run('npm ci --no-audit --no-fund', out);
        if (bundle.install) run(bundle.install, out);
      } else if (bundle.install) console.log(`Paquets des blocs, après l’install : ${bundle.install}`);
    } else if (args.install) run('npm ci --no-audit --no-fund', out);
    console.log(`${meta.name} : ${files} fichiers écrits dans ${out}`);
    console.log(`Ensuite : cd "${out}" && ${args.install ? '' : `${meta.template!.install} && `}${meta.template!.dev}`);
    if (meta.template!.env.length) console.log(`Variables à renseigner : ${meta.template!.env.join(', ')}`);
    console.log('Origine, licence et commandes : ATLAS.md');
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
