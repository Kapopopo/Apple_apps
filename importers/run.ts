/**
 * npm run import                  → tous les importers aux commits verrouillés (importers/lock.json), puis l'index
 * npm run update                  → idem au dernier commit de chaque source, verrous mis à jour
 * npm run outdated                → sources qui ont publié depuis le verrou (registry/_updates.json), sans rien importer
 * npm run import -- github --source rare-ui [--offline] [--update]
 * npm run import -- local | fontshare | easings | index
 */
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY } from '../shared/paths.js';
import { buildIndex } from '../shared/registry.js';
import { importGithub, outdated } from './github.js';
import { importLocal } from './local.js';
import { importFontshare } from './fontshare.js';
import { importEasings } from './easings.js';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : undefined;
};
const command = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--source') ?? 'all';
const only = typeof flag('source') === 'string' ? (flag('source') as string) : undefined;
const offline = flag('offline') === true;
const update = flag('update') === true;

if (command === 'outdated') {
  const rows = outdated();
  const behind = rows.filter((r) => r.behind);
  for (const r of rows)
    console.log(`${r.behind ? '↑' : '='} ${r.name.padEnd(18)} ${r.locked?.slice(0, 7) ?? 'jamais'} → ${r.latest.slice(0, 7)}`);
  fs.writeFileSync(
    path.join(REGISTRY, '_updates.json'),
    JSON.stringify({ checkedAt: new Date().toISOString(), behind: behind.map((r) => r.id), sources: rows }, null, 1) + '\n',
  );
  console.log(behind.length ? `${behind.length} source(s) à mettre à jour : npm run update` : 'Toutes les sources sont à jour.');
  process.exit(0);
}

const steps: Record<string, () => unknown> = {
  github: () => importGithub({ only, offline, update }),
  local: () => importLocal(),
  fontshare: () => importFontshare(),
  easings: () => importEasings(),
  index: () => undefined,
};

if (command !== 'all' && !steps[command]) {
  console.error(`Importer inconnu : ${command}. Choix : ${Object.keys(steps).join(', ')}, outdated, all`);
  process.exit(2);
}

let failed = false;
for (const name of command === 'all' ? ['local', 'easings', 'github', 'fontshare'] : [command]) {
  try {
    await steps[name]();
  } catch (error) {
    failed = true;
    console.error(`✗ ${name} : ${(error as Error).message}`);
  }
}
const entries = buildIndex();
console.log(`Index : ${entries.length} items → registry/index.json`);
if (failed) process.exit(1);
