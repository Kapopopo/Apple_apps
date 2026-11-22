/** Parcours du builder : ce qu'il laisse passer est accepté par le schéma, ce que le schéma refuse est expliqué en français. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpecInput } from '../../shared/schema.js';
import { cleanMobile } from '../../web/lib/mobile.js';
// @ts-expect-error module ES du navigateur, sans déclaration de types
import { blankSpec } from '../../web/lib/common.js';
import { fingerprint, issues, nameAfterTitle, palettesFirst, specBody, stepsFor, summary } from '../../web/lib/steps.js';

type Mutate = (m: any) => void;
const known = () => ({ name: 'Item', platforms: ['web', 'mobile'] });
const app = (change?: Mutate) => {
  const mobile: any = cleanMobile(null);
  change?.(mobile);
  return { ...blankSpec(), name: 'respire', title: 'Respire', brief: 'Minuteur', target: 'mobile', mobile };
};
const errors = (spec: any, lookup: any = known) => issues(spec, lookup).filter((i: any) => i.level === 'error');
const question = (over = {}) => ({ id: 'objectif', title: 'Objectif ?', options: ['A', 'B'], multiple: false, ...over });

const VALID: [string, Mutate | undefined][] = [
  ['défauts', undefined],
  ['bundle id', (m) => (m.bundleId = 'com.monstudio.respire2')],
  ['email avec +', (m) => (m.supportEmail = 'aide+ios@mon-domaine.fr')],
  ['URL https', (m) => (m.termsUrl = 'https://exemple.fr/cgu?lang=fr')],
  ['cinq écrans', (m) => m.slides.push({ ...m.slides[0] }, { ...m.slides[0] })],
  ['question', (m) => m.questions.push(question())],
  ['sans essai', (m) => (m.trial.days = 0)],
];

const REFUSED: [string, string, Mutate][] = [
  ['nom trop long', 'project', (m) => (m.appName = 'x'.repeat(31))],
  ['bundle id avec tiret', 'project', (m) => (m.bundleId = 'com.Mon-App')],
  ['bundle id sans point', 'project', (m) => (m.bundleId = 'monapp')],
  ['slug', 'project', (m) => (m.slug = 'Mon App')],
  ['identifiant App Store', 'project', (m) => (m.iosAppId = 'id123')],
  ['deux écrans', 'onboarding', (m) => m.slides.pop()],
  ['titre d’écran vide', 'onboarding', (m) => (m.slides[1].title = '')],
  ['texte d’écran trop long', 'onboarding', (m) => (m.slides[0].text = 'x'.repeat(241))],
  ['question vide', 'onboarding', (m) => m.questions.push(question({ title: '' }))],
  ['une seule réponse', 'onboarding', (m) => m.questions.push(question({ options: ['A'] }))],
  ['réponse trop longue', 'onboarding', (m) => m.questions.push(question({ options: ['A', 'x'.repeat(61)] }))],
  ['clé invalide', 'onboarding', (m) => m.questions.push(question({ id: 'Mon objectif' }))],
  ['clé en double', 'onboarding', (m) => m.questions.push(question(), question())],
  ['titre de paywall vide', 'paywall', (m) => (m.paywall.title = '')],
  ['sous-titre trop long', 'paywall', (m) => (m.paywall.subtitle = 'x'.repeat(161))],
  ['un seul avantage', 'paywall', (m) => (m.paywall.benefits = ['Tout'])],
  ['avantage trop long', 'paywall', (m) => (m.paywall.benefits = ['A', 'x'.repeat(101)])],
  ['essai', 'paywall', (m) => (m.trial.days = 91)],
  ['URL sans https', 'paywall', (m) => (m.termsUrl = 'mon-site.fr/cgu')],
  ['URL http', 'paywall', (m) => (m.privacyUrl = 'http://mon-site.fr')],
  ['email', 'paywall', (m) => (m.supportEmail = 'support@localhost')],
  ['entitlement vide', 'paywall', (m) => (m.revenueCat.entitlement = '')],
  ['offering', 'paywall', (m) => (m.revenueCat.offering = 'x'.repeat(101))],
];

test('ce que le builder accepte, le schéma l’accepte', () => {
  for (const [label, change] of VALID) {
    const spec = app(change);
    assert.deepEqual(errors(spec), [], label);
    assert.ok(SpecInput.safeParse(specBody(spec)).success, `schéma : ${label}`);
  }
});

test('ce que le schéma refuse, le builder l’explique à la bonne étape, au champ, en français', () => {
  for (const [label, step, change] of REFUSED) {
    const spec = app(change);
    assert.ok(!SpecInput.safeParse(specBody(spec)).success, `le schéma devrait refuser : ${label}`);
    const [first] = errors(spec);
    assert.ok(first, `non signalé : ${label}`);
    assert.equal(first.step, step, label);
    assert.match(first.field, /^(#s-|\[data-m=")/, `sans champ : ${label}`);
    assert.doesNotMatch(first.message, /Invalid|pattern|expected|regex/i, label);
  }
});

test('règles web : nom, bloc ou template, items disparus', () => {
  const web = { ...blankSpec(), title: 'Site', brief: 'Vitrine' };
  assert.equal(errors(web)[0].step, 'blocks');
  assert.deepEqual(errors({ ...web, blocks: [{ id: 'a/b', note: '' }] }), []);
  assert.deepEqual(errors({ ...web, template: 'launch-ui/template' }), [], 'un template suffit');
  assert.deepEqual(issues(web, known, { preset: true }), [], 'un preset peut être vide');
  assert.equal(errors({ ...blankSpec(), template: 'a/template' })[0].field, '#s-title');
  assert.match(errors({ ...web, blocks: [{ id: 'a/disparu', note: '' }] }, () => undefined)[0].message, /registre/);
});

test('avertissements : jamais bloquants', () => {
  const list = issues({ ...app(), brief: '' }, known);
  assert.ok(list.length >= 4, 'brief, bundle id, textes, mentions');
  assert.deepEqual(
    list.filter((i: any) => i.level === 'error'),
    [],
  );
});

test('en Web, des réglages mobiles à moitié remplis ne bloquent pas', () => {
  const spec = { ...app((m) => (m.termsUrl = 'https://')), target: 'web', template: 'launch-ui/template' };
  assert.deepEqual(errors(spec), []);
  const body: any = specBody(spec);
  assert.equal(body.mobile, undefined);
  assert.ok(SpecInput.safeParse(body).success, 'corps web valide');
});

test('empreinte : le fichier relu vaut le brouillon, une retouche le rend modifié', () => {
  const spec = { ...app((m) => m.questions.push(question())), blocks: [{ id: 'panelui/card', note: '', page: 'Accueil' }] };
  const stored: any = SpecInput.parse(specBody(spec));
  assert.equal(fingerprint({ ...blankSpec(), ...stored }), fingerprint(spec));
  const reordered = { ...spec, mobile: Object.fromEntries(Object.entries(spec.mobile).reverse()) };
  assert.equal(fingerprint(reordered), fingerprint(spec), 'ordre des clés indifférent');
  assert.notEqual(fingerprint({ ...spec, brief: 'Autre' }), fingerprint(spec));
});

test('nom de fichier : suit le titre jusqu’à modification ou enregistrement', () => {
  assert.equal(nameAfterTitle(blankSpec(), 'Café Néon'), 'cafe-neon');
  assert.equal(nameAfterTitle({ ...blankSpec(), title: 'Café', name: 'cafe' }, 'Café Néon'), 'cafe-neon');
  assert.equal(nameAfterTitle({ ...blankSpec(), title: 'Café', name: 'client-12' }, 'Café Néon'), 'client-12');
  assert.equal(nameAfterTitle({ ...blankSpec(), title: 'Café', name: 'cafe', loadedFrom: 'spec:cafe' }, 'Bar'), 'cafe');
});

test('étapes, résumés, palettes en tête', () => {
  assert.equal(stepsFor('web').length, 4);
  assert.equal(stepsFor('mobile').length, 6);
  assert.equal(summary('blocks', app(), known), 'Aucun (facultatif)');
  assert.match(summary('paywall', app(), known), /essai de 7 jours/);
  const themes = [
    { id: 'x/theme', type: 'theme', sourceId: 'x' },
    { id: 'mobile-base/encre', type: 'theme', sourceId: 'mobile-base' },
  ];
  assert.equal(palettesFirst(themes)[0].id, 'mobile-base/encre');
});
