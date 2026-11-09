/**
 * Écrit le bundle d'une spec dans un projet :
 *   npm run bundle -- <spec> --out <dossier du projet> [--src src] [--alias @/] [--demos] [--dry-run] [--force]
 *
 * Les composants, le thème (styles/atlas-theme.css), les polices, les easings et le helper cn vont
 * dans la racine source (src/ si elle existe, sinon la racine) ; CREDITS.md à la racine du projet.
 * Aucun fichier existant n'est remplacé sans --force. Les paquets npm à installer sont affichés.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getSpec, listSpecs } from '../shared/specs.js';
import { specBundle } from '../shared/spec-bundle.js';

interface Args { spec?: string; out?: string; src?: string; alias: string; demos: boolean; dryRun: boolean; force: boolean }

function parse(argv: string[]): Args {
  const args: Args = { alias: '@/', demos: false, dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--src') args.src = argv[++i];
    else if (a === '--alias') args.alias = argv[++i];
    else if (a === '--demos') args.demos = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (!a.startsWith('--') && !args.spec) args.spec = a;
    else throw new Error(`Argument inconnu : ${a}`);
  }
  return args;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (!args.spec || !args.out) {
    console.error('Usage : npm run bundle -- <spec> --out <dossier du projet> [--src src] [--alias @/] [--demos] [--dry-run] [--force]');
    console.error(`Specs : ${listSpecs().map((s) => s.spec.name).join(', ') || 'aucune'}`);
    process.exit(2);
  }
  const stored = getSpec(args.spec);
  if (!stored) { console.error(`Spec introuvable : ${args.spec}`); process.exit(1); }
  if (!/^(relative|[@~#$][\w-]*\/)$/.test(args.alias)) { console.error(`Alias invalide : ${args.alias}`); process.exit(2); }

  const out = path.resolve(args.out);
  const srcDir = path.resolve(out, args.src ?? (fs.existsSync(path.join(out, 'src')) ? 'src' : '.'));
  const bundle = specBundle(stored.spec, { alias: args.alias, demos: args.demos });
  const writes = [...bundle.extras, ...bundle.files].map((f) => {
    const base = f.path === 'CREDITS.md' ? out : srcDir;
    const target = path.resolve(base, f.path);
    const inside = path.relative(base, target);
    if (inside.startsWith('..') || path.isAbsolute(inside)) throw new Error(`Chemin hors du projet refusé : ${f.path}`);
    return { target, content: f.content, label: path.relative(out, target).split(path.sep).join('/') };
  });

  const conflicts = writes.filter((w) => fs.existsSync(w.target) && fs.readFileSync(w.target, 'utf8') !== w.content);
  if (conflicts.length && !args.force && !args.dryRun) {
    console.error(`${conflicts.length} fichier(s) existent déjà avec un autre contenu (relancer avec --force pour les remplacer) :`);
    for (const c of conflicts) console.error(`  ${c.label}`);
    process.exit(1);
  }

  let written = 0;
  for (const w of writes) {
    const same = fs.existsSync(w.target) && fs.readFileSync(w.target, 'utf8') === w.content;
    if (args.dryRun) { console.log(`${same ? '=' : fs.existsSync(w.target) ? '~' : '+'} ${w.label}`); continue; }
    if (same) continue;
    fs.mkdirSync(path.dirname(w.target), { recursive: true });
    fs.writeFileSync(w.target, w.content);
    written++;
  }

  console.log(`\nSpec « ${stored.spec.title || stored.spec.name} » : ${writes.length} fichiers${args.dryRun ? ' (simulation)' : `, ${written} écrits`} dans ${out}`);
  if (bundle.install) console.log(`Paquets à installer :\n  ${bundle.install}`);
  if (bundle.missing.length) console.log(`À vérifier (imports non résolus) :\n  ${bundle.missing.join('\n  ')}`);
  if (args.alias !== 'relative') console.log(`Alias : les imports utilisent « ${args.alias} » → ${path.relative(out, srcDir) || '.'}/ (tsconfig paths).`);
  console.log('Crédits : CREDITS.md (attributions obligatoires à conserver).');
}

try { main(); } catch (error) { console.error((error as Error).message); process.exit(1); }
