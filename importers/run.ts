/**
 * npm run import                 → tous les importers puis l'index
 * npm run import -- github --source rare-ui [--offline]
 * npm run import -- local | fontshare | easings | index
 */
import { buildIndex } from '../shared/registry.js';
import { importGithub } from './github.js';
import { importLocal } from './local.js';
import { importFontshare } from './fontshare.js';
import { importEasings } from './easings.js';

const args = process.argv.slice(2);
const flag = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : undefined; };
const command = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--source') ?? 'all';
const only = typeof flag('source') === 'string' ? (flag('source') as string) : undefined;
const offline = flag('offline') === true;

const steps: Record<string, () => unknown> = {
  github: () => importGithub({ only, offline }),
  local: () => importLocal(),
  fontshare: () => importFontshare(),
  easings: () => importEasings(),
  index: () => undefined,
};

if (command !== 'all' && !steps[command]) {
  console.error(`Importer inconnu : ${command}. Choix : ${Object.keys(steps).join(', ')}, all`);
  process.exit(2);
}

let failed = false;
for (const name of command === 'all' ? ['local', 'easings', 'github', 'fontshare'] : [command]) {
  try { await steps[name](); }
  catch (error) { failed = true; console.error(`✗ ${name} : ${(error as Error).message}`); }
}
const entries = buildIndex();
console.log(`Index : ${entries.length} items → registry/index.json`);
if (failed) process.exit(1);
