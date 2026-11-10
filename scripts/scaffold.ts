/**
 * Démarre un projet depuis un template du registre :
 *   npm run scaffold -- <id> --out <dossier> [--force]
 * <id> : saas-starter/template, ou simplement saas-starter. Le dossier doit être vide ou absent
 * (sinon --force, qui ne remplace que les fichiers du template). Écrit aussi LICENSE (licence du template)
 * et ATLAS.md (origine, commandes, variables d'environnement à renseigner).
 */
import fs from 'node:fs';
import path from 'node:path';
import { indexItems, readMeta } from '../shared/registry.js';
import { REGISTRY, safeJoin } from '../shared/paths.js';

function parse(argv: string[]) {
  const out: { id?: string; dir?: string; force: boolean } = { force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out.dir = argv[++i];
    else if (argv[i] === '--force') out.force = true;
    else if (!argv[i].startsWith('--') && !out.id) out.id = argv[i];
    else throw new Error(`Argument inconnu : ${argv[i]}`);
  }
  return out;
}

export function scaffold(idOrSlug: string, outDir: string, force = false) {
  const templates = indexItems().filter((e) => e.type === 'template');
  const entry = templates.find((e) => e.id === idOrSlug || e.sourceId === idOrSlug);
  if (!entry) throw new Error(`Template introuvable : ${idOrSlug}. Templates : ${templates.map((t) => t.sourceId).join(', ') || 'aucun'}`);
  const dir = path.join(REGISTRY, entry.dir);
  const meta = readMeta(dir);
  if (!meta?.template) throw new Error(`${entry.id} n'est pas un template complet.`);
  const out = path.resolve(outDir);
  if (fs.existsSync(out) && fs.readdirSync(out).length && !force)
    throw new Error(`Le dossier ${out} n'est pas vide (relancer avec --force pour y écrire quand même).`);
  fs.mkdirSync(out, { recursive: true });
  for (const f of meta.files) {
    const target = safeJoin(out, f.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(dir, 'files', f.path), target);
  }
  if (fs.existsSync(path.join(dir, 'LICENSE'))) fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(out, 'LICENSE'));
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

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join('scripts', 'scaffold.ts'))) {
  try {
    const args = parse(process.argv.slice(2));
    if (!args.id || !args.dir) {
      console.error('Usage : npm run scaffold -- <template> --out <dossier> [--force]');
      console.error(
        `Templates : ${indexItems()
          .filter((e) => e.type === 'template')
          .map((t) => t.sourceId)
          .join(', ')}`,
      );
      process.exit(2);
    }
    const { meta, out, files } = scaffold(args.id, args.dir, args.force);
    console.log(`${meta.name} : ${files} fichiers écrits dans ${out}`);
    console.log(`Ensuite : cd "${out}" && ${meta.template!.install} && ${meta.template!.dev}`);
    if (meta.template!.env.length) console.log(`Variables à renseigner : ${meta.template!.env.join(', ')}`);
    console.log('Origine, licence et commandes : ATLAS.md');
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
