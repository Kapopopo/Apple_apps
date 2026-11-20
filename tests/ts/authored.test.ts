/** Source écrite pour Atlas (authored/saas-premium-ui) : manifeste cohérent, imports résolus, tokens du thème valides. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../shared/paths.js';
import { Meta } from '../../shared/schema.js';
import { safeValue } from '../../shared/themes.js';
import { analyse } from '../../importers/authored.js';
import { ITEMS, SOURCE, THEME } from '../../authored/saas-premium-ui/manifest.js';
import { themeTokens, tokensCss } from '../../authored/saas-premium-ui/tokens.js';

test('authored : chaque item a des fichiers présents et des imports résolus', () => {
  const slugs = new Set<string>();
  for (const item of ITEMS) {
    assert.ok(!slugs.has(item.slug), `slug en double : ${item.slug}`);
    slugs.add(item.slug);
    for (const f of [...item.files, item.demo]) assert.ok(fs.existsSync(path.join(ROOT, 'authored', SOURCE.id, 'src', f)), `absent : ${f}`);
    const { missing } = analyse([...item.files, item.demo], `${SOURCE.id}/${item.slug}`);
    assert.deepEqual(missing, [], `${item.slug} : imports introuvables`);
  }
  for (const f of THEME.files.filter((f) => f !== 'tokens.css')) assert.ok(fs.existsSync(path.join(ROOT, 'authored', SOURCE.id, 'src', f)));
});

test('authored : dépendances déduites des imports (paquets versionnés, items du registre)', () => {
  const hero = analyse(['sections/hero.tsx'], `${SOURCE.id}/hero`);
  assert.ok(hero.dependencies.some((d) => d.startsWith('motion@')));
  assert.ok(hero.registryDependencies.includes(`${SOURCE.id}/terminal-bar`));
  assert.ok(hero.registryDependencies.includes(`${SOURCE.id}/theme`), 'lib/motion appartient au thème');
  assert.ok(!hero.registryDependencies.includes(`${SOURCE.id}/hero`));
});

test('authored : tokens du thème acceptés par la feuille skin du builder', () => {
  const tokens = themeTokens();
  const all = { ...tokens.colors.light, ...tokens.colors.dark, ...tokens.typography, ...tokens.radius, ...tokens.other };
  const rejected = Object.entries(all).filter(([, v]) => !safeValue(v));
  assert.deepEqual(rejected, [], 'valeurs refusées par skinCss');
  assert.match(tokensCss(), /\.pl-dark,/);
  assert.equal(tokens.colors.light['--pl-accent'], '#2F5BFF');
});

test('authored : métadonnées publiées valides (si importées)', () => {
  const dir = path.join(ROOT, 'registry', 'items', SOURCE.id);
  if (!fs.existsSync(dir)) return;
  for (const slug of fs.readdirSync(dir)) {
    const meta = Meta.parse(JSON.parse(fs.readFileSync(path.join(dir, slug, 'meta.json'), 'utf8')));
    assert.ok(meta.registryDependencies.includes(`${SOURCE.id}/theme`), `${meta.id} doit dépendre du thème`);
    assert.equal(meta.licenseStatus, 'open');
  }
});
