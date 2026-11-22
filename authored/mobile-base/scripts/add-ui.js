/**
 * Ajoute des composants react-native-reusables :
 *   node scripts/add-ui.js card dialog
 * La CLI seule demande « écraser text.tsx ? » et, sans terminal interactif, s'arrête sans rien créer en rendant 0.
 * Ici elle écrase, puis les composants déjà présents sont remis tels quels.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const names = process.argv.slice(2);
if (!names.length || !names.every((name) => /^[a-z][a-z-]*$/.test(name))) {
  console.error('Usage : node scripts/add-ui.js <composant> [composant…]');
  process.exit(2);
}

const dir = path.join(__dirname, '..', 'src', 'components', 'ui');
const kept = fs.readdirSync(dir).map((file) => [file, fs.readFileSync(path.join(dir, file))]);

// shell : npx est un .cmd sous Windows ; les noms sont validés au-dessus.
const result = spawnSync(`npx --yes @react-native-reusables/cli@0.7.1 add -y -o --styling-library nativewind ${names.join(' ')}`, {
  cwd: path.join(__dirname, '..'),
  shell: true,
  stdio: ['ignore', 'inherit', 'inherit'],
});
for (const [file, content] of kept) fs.writeFileSync(path.join(dir, file), content);

const missing = names.filter((name) => !fs.existsSync(path.join(dir, `${name}.tsx`)));
if (result.status !== 0 || missing.length) {
  console.error(`Composants non ajoutés : ${(missing.length ? missing : names).join(', ')}`);
  process.exit(1);
}
console.log(`Ajoutés : ${names.join(', ')}`);
