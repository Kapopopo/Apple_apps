/** Prompt texte du catalogue (assistants sans MCP) : ordre, pages, consignes, attributions, doublons. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error module ES du navigateur, sans déclaration de types
import { buildPrompt } from '../../web/lib/prompt.js';

const card = (over: Record<string, unknown> = {}) => ({
  id: 'magic-ui/marquee',
  name: 'Marquee',
  source: 'Magic UI',
  type_label: 'Carrousels',
  url: 'https://magicui.design/docs/components/marquee',
  description: 'Défilement infini',
  license: 'MIT',
  license_status: 'open',
  dependencies: ['motion'],
  curation: null,
  ...over,
});

test('vide sans composant', () => {
  assert.equal(buildPrompt([], {}), '');
});

test('une entrée par composant, dans l’ordre, sans doublon, avec consigne', () => {
  const a = card(),
    b = card({ id: 'react-bits/blur-text', name: 'Blur Text', source: 'React Bits' });
  const text = buildPrompt([a, b, a], {
    brief: 'Site de boulangerie',
    blocks: [
      { id: a.id, note: 'Bandeau des avis' },
      { id: b.id, note: '' },
    ],
  });
  assert.match(text, /PROJET\nSite de boulangerie/);
  assert.match(text, /COMPOSANTS À INTÉGRER \(2\)/);
  assert.ok(text.indexOf('1. Marquee') < text.indexOf('2. Blur Text'));
  assert.match(text, /Consigne : Bandeau des avis/);
  assert.match(text, /Identifiant du registre Atlas : magic-ui\/marquee/);
  assert.match(text, /Paquets npm : motion/);
});

test('pages regroupées et attributions obligatoires', () => {
  const a = card(),
    b = card({
      id: 'rare-ui/folder',
      name: 'Folder',
      source: 'Rare UI',
      license: 'LicenseRef-MIT-Commons-Clause-Attribution',
      license_status: 'restricted',
      attribution: 'Crédit Rare UI',
    });
  const text = buildPrompt([a, b], {
    blocks: [
      { id: a.id, note: '', page: 'Accueil' },
      { id: b.id, note: '', page: 'Contact' },
    ],
  });
  assert.match(text, /— Page : Accueil[\s\S]*1\. Marquee[\s\S]*— Page : Contact[\s\S]*2\. Folder/);
  assert.match(text, /ATTRIBUTIONS OBLIGATOIRES\n- Rare UI : Crédit Rare UI/);
  assert.match(text, /Licence : LicenseRef-MIT-Commons-Clause-Attribution \(conditions\)/);
});
