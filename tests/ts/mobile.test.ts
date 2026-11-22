/** Cible mobile sur le registre du repo : plateformes, thème natif, config injectée, bundle, scaffold, prompt. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PALETTES, paletteTokens } from '../../authored/mobile-palettes.js';
import { templateFiles, MOBILE_BASE } from '../../importers/mobile-base.js';
import { installEnv, nodeSupported, scaffold } from '../../scripts/scaffold.js';
import { bundleItems } from '../../shared/bundle.js';
import { contrast, parseColor, toHex } from '../../shared/color.js';
import { ttfUrl } from '../../shared/fontshare-files.js';
import { configFiles, mobileApp } from '../../shared/mobile.js';
import { fromCaller, REGISTRY, ROOT } from '../../shared/paths.js';
import { indexItems, readMeta } from '../../shared/registry.js';
import { Spec, SpecInput } from '../../shared/schema.js';
import { specBundle } from '../../shared/spec-bundle.js';
import { cleanMobile, ILLUSTRATIONS, MOBILE_INSTRUCTION, reusableFor, selectable, vary } from '../../web/lib/mobile.js';
// @ts-expect-error module ES du navigateur, importe /lib via un chemin relatif
import { buildPrompt } from '../../web/lib/prompt.js';

const items = indexItems();
const byId = new Map(items.map((i) => [i.id, i]));
const mobileSpec = (over: object = {}) => Spec.parse({ name: 'app-test', title: 'App test', target: 'mobile', ...over });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'atlas mobile '));

test('spec : web par défaut, app mobile complétée, valeurs dangereuses refusées', () => {
  const web = Spec.parse({ name: 'site' });
  assert.equal(web.target, 'web');
  assert.equal(web.mobile, undefined);
  const app = SpecInput.parse({ name: 'app', target: 'mobile', mobile: {} }).mobile!;
  assert.equal(app.slides.length, 3);
  assert.equal(app.revenueCat.entitlement, 'premium');
  assert.deepEqual(app, cleanMobile(null), 'mêmes valeurs par défaut que le builder');
  const bad = [
    { termsUrl: 'javascript:alert(1)' },
    { privacyUrl: 'http://exemple.fr' },
    { bundleId: 'com.Mon-App' },
    { bundleId: 'com.app";process.exit()//' },
    { supportEmail: 'pas un email' },
    { slides: [{ title: 'Seul', text: '', illustration: 'star' }] },
    { questions: [0, 1].map(() => ({ id: 'q', title: 'Q', options: ['a', 'b'] })) },
    { inconnu: true },
  ];
  for (const mobile of bad) assert.ok(!SpecInput.safeParse({ name: 'app', mobile }).success, JSON.stringify(mobile));
});

test('brouillon du navigateur : valeurs invalides remplacées, valeurs saisies gardées', () => {
  const clean = cleanMobile({ appName: 'Respire', slides: 'x', layouts: { paywall: '<img>' }, trial: { days: '7' } });
  assert.equal(clean.appName, 'Respire');
  assert.equal(clean.slides.length, 3);
  assert.equal(clean.layouts.paywall, 'benefits');
  assert.equal(clean.trial.days, 7);
});

test('couleurs : oklch, hsl, triplet, var, alpha ; syntaxe inconnue refusée', () => {
  const hex = (v: string, vars = {}) => toHex(parseColor(v, vars)!);
  assert.equal(hex('oklch(1 0 0)'), '#ffffff');
  assert.equal(hex('oklch(0.205 0 0)'), '#171717');
  assert.equal(hex('oklch(62.796% 0.25768 29.234)'), '#ff0000');
  assert.equal(hex('hsl(240 5.9% 10%)'), '#18181b');
  assert.equal(hex('0 0% 100%'), '#ffffff');
  assert.equal(hex('var(--a)', { '--a': 'var(--b)', '--b': '#abc' }), '#aabbcc');
  assert.equal(parseColor('rgba(0, 0, 0, .25)')![3], 0.25);
  assert.equal(parseColor('color-mix(in srgb, red, blue)'), null);
  assert.equal(parseColor('var(--boucle)', { '--boucle': 'var(--boucle)' }), null);
});

test('palettes : textes lisibles (4,5:1) en clair et en sombre', () => {
  const pairs = [
    ['foreground', 'background'],
    ['card-foreground', 'card'],
    ['primary-foreground', 'primary'],
    ['accent-foreground', 'accent'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'muted'],
    ['muted-foreground', 'accent'],
    ['secondary-foreground', 'secondary'],
    ['destructive', 'background'],
  ];
  for (const palette of PALETTES)
    for (const [mode, colors] of Object.entries(paletteTokens(palette).colors))
      for (const [fg, bg] of pairs) {
        const ratio = contrast(parseColor(colors[`--${fg}`])!, parseColor(colors[`--${bg}`])!);
        assert.ok(ratio >= 4.5, `${palette.slug} ${mode} : ${fg} sur ${bg} = ${ratio.toFixed(2)}`);
      }
});

test('template publié = authored/mobile-base, config par défaut = générateur', () => {
  const published = path.join(REGISTRY, 'templates', 'mobile-base', 'template');
  const meta = readMeta(published)!;
  const source = templateFiles();
  assert.deepEqual(meta.files.map((f) => f.path).sort(), [...source.keys()].sort(), 'lancer npm run import:authored');
  for (const [file, content] of source) {
    const copy = fs.readFileSync(path.join(published, 'files', file));
    assert.ok(copy.equals(Buffer.from(content)), `${file} : lancer npm run import:authored`);
  }
  for (const f of configFiles({ name: 'mon-app', title: 'Mon app' }, paletteTokens(PALETTES[0])).files)
    assert.equal(fs.readFileSync(path.join(MOBILE_BASE, f.path), 'utf8').replace(/\r\n/g, '\n'), f.content, f.path);
  const names = fs.readFileSync(path.join(MOBILE_BASE, 'src/config/illustrations.ts'), 'utf8');
  for (const name of ILLUSTRATIONS) assert.match(names, new RegExp(`['\\s]${name}'?: \\{ icon`), `illustration absente : ${name}`);
});

test('platforms : web, mobile, hors stack, licences des polices', () => {
  const platforms = (id: string) => byId.get(id)!.platforms;
  assert.deepEqual(platforms('shadcn/button'), ['web']);
  assert.deepEqual(platforms('panelui/card'), ['mobile']);
  assert.deepEqual(platforms('panelui/theme'), []);
  assert.deepEqual(platforms('mobile-base/template'), ['mobile']);
  assert.deepEqual(platforms('shadcn/theme'), ['web', 'mobile']);
  assert.deepEqual(platforms('panelui-web/theme'), ['web']);
  for (const font of items.filter((i) => i.type === 'font'))
    assert.deepEqual(font.platforms, font.licenseStatus === 'open' ? ['web', 'mobile'] : ['web'], font.id);
  for (const item of items.filter((i) => i.dependencies.some((d) => d.startsWith('uniwind'))))
    assert.ok(!item.platforms.includes('mobile'), item.id);
});

test('chaque item natif : imports résolus, aucune dépendance web ni Uniwind', () => {
  const native = items.filter((i) => i.framework === 'react-native' && i.type !== 'template' && i.platforms.includes('mobile'));
  assert.ok(native.length > 20, 'items natifs indexés');
  for (const item of native) {
    const bundle = bundleItems([item.id]);
    assert.deepEqual(bundle.missing, [], item.id);
    const web = bundle.dependencies.filter((d) => /^(@radix-ui|uniwind|motion|framer-motion|lucide-react(@|$))/.test(d));
    assert.deepEqual(web, [], item.id);
    assert.ok(!bundle.used.some((id) => id.startsWith('shadcn/')), `${item.id} : primitive web copiée`);
  }
});

test('bundle mobile : code natif seul, web remplacé, pas de CSS', () => {
  const spec = mobileSpec({
    theme: 'shadcn/theme',
    fonts: ['fontshare/manrope', 'fontshare/aktura'],
    blocks: [{ id: 'shadcn/button' }, { id: 'panelui/card' }, { id: 'absent/item' }],
  });
  const bundle = specBundle(spec);
  const files = [...bundle.files, ...bundle.extras].map((f) => f.path);
  assert.ok(files.includes('components/atlas/panelui/card/card.tsx'), 'code natif présent');
  assert.ok(!files.some((f) => f.endsWith('.css') || f.startsWith('components/ui/') || f === 'lib/utils.ts'), files.join(', '));
  assert.match(bundle.install, /^npx expo install .*tailwind-variants/);
  assert.ok(!/@\d|react-native( |$)|panelui-native|radix/.test(bundle.install), bundle.install);
  assert.equal(bundle.replaced.length, 1);
  assert.match(bundle.replaced[0].instruction, /reusables « button »/);
  assert.deepEqual(bundle.missing, ['absent/item']);
  assert.match(bundle.ignored.join(), /fontshare\/aktura/);
  assert.match(bundle.credits, /Founded Labs/);
  assert.equal(specBundle({ ...spec, target: 'web' }).replaced.length, 0);
});

test('scaffold : config injectée, texte hostile inoffensif, dossiers protégés', () => {
  const dir = tmp();
  try {
    for (const name of ['.git', '.claude']) fs.mkdirSync(path.join(dir, name));
    const hostile = 'L’app" }; process.exit(1); // </script> ${process.env.HOME} `x`';
    const spec = mobileSpec({
      theme: 'mobile-base/braise',
      blocks: [{ id: 'panelui/card' }, { id: 'shadcn/button' }],
      mobile: {
        appName: 'Respire',
        bundleId: 'fr.exemple.respire',
        layouts: { onboarding: 'list', paywall: 'image', spacing: 'airy' },
        slides: [1, 2, 3, 4].map((n) => ({ title: `Écran ${n}`, text: hostile, illustration: 'leaf' })),
      },
    });
    scaffold('mobile-base', dir, false, { spec, fonts: new Map() });
    const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf8');
    const source = read('src/config/app.ts');
    const config = JSON.parse(source.slice(source.indexOf('= {') + 2, source.lastIndexOf(';')));
    assert.equal(config.name, 'Respire');
    assert.equal(config.bundleId, 'fr.exemple.respire');
    assert.deepEqual(config.layouts, { onboarding: 'list', paywall: 'image' });
    assert.equal(config.onboarding.slides[3].text, hostile);
    const theme = JSON.parse(read('src/config/theme.json'));
    assert.equal(theme.radius, 22);
    assert.equal(theme.spacing.gutter, 30);
    assert.equal(JSON.parse(read('package.json')).name, 'app-test');
    assert.equal(JSON.parse(read('package-lock.json')).packages[''].name, 'app-test');
    assert.ok(fs.existsSync(path.join(dir, 'src/components/atlas/panelui/card/card.tsx')), 'bloc natif posé');
    assert.ok(!fs.existsSync(path.join(dir, 'src/components/atlas/shadcn')), 'code web non posé');
    assert.match(read('ATLAS.md'), /app\/\(main\)/);
    assert.throws(() => scaffold('mobile-base', dir), /n'est pas vide/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scaffold : refus sans rien écrire', () => {
  const dir = tmp();
  try {
    const app = (spec: Spec) => ({ spec, fonts: new Map<string, Buffer>() });
    assert.throws(() => scaffold('mobile-base', dir, false, app(Spec.parse({ name: 'site' }))), /cible Web/);
    assert.throws(() => scaffold('launch-ui', dir, false, app(mobileSpec())), /mobile-base/);
    assert.throws(() => scaffold('mobile-base', dir, false, app(mobileSpec({ fonts: ['fontshare/manrope'] }))), /Polices non téléchargées/);
    assert.throws(() => scaffold('mobile-base', ROOT, true), /dépôt Atlas/);
    assert.deepEqual(fs.readdirSync(dir), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI scaffold : --out relatif au dossier de l’appelant, pas à Atlas', () => {
  const caller = tmp();
  try {
    const tsx = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
    const args = [tsx, path.join(ROOT, 'scripts/scaffold.ts'), 'mobile-base', '--out', '.'];
    // Comme `npm --prefix <atlas> run scaffold` : cwd = Atlas, INIT_CWD = l'appelant.
    const run = spawnSync(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, npm_lifecycle_event: 'scaffold', INIT_CWD: caller },
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.ok(fs.existsSync(path.join(caller, 'app.config.ts')), 'écrit chez l’appelant');
    assert.ok(!fs.existsSync(path.join(ROOT, 'app.config.ts')), 'rien dans Atlas');
    assert.equal(fromCaller('autre', 'x'), path.resolve('x'), 'INIT_CWD ignoré hors du script');
  } finally {
    fs.rmSync(caller, { recursive: true, force: true });
  }
});

test('install : environnement de npm nettoyé, version de Node contrôlée', () => {
  const bin = path.resolve(ROOT, 'node_modules', '.bin');
  const env = installEnv({
    npm_config_local_prefix: ROOT,
    npm_package_json: 'x',
    INIT_CWD: 'y',
    HOME: 'h',
    PATH: [bin, 'ailleurs'].join(path.delimiter),
  });
  assert.deepEqual(env, { HOME: 'h', PATH: 'ailleurs' });
  for (const ok of ['22.13.0', '22.23.5', '24.3.0', '26.0.0']) assert.ok(nodeSupported(ok), ok);
  for (const old of ['20.19.0', '22.11.0', '23.5.0', '24.2.0', '25.1.0']) assert.ok(!nodeSupported(old), old);
});

test('polices : une graisse par fichier, TTF du CDN Fontshare seulement', () => {
  const planned = mobileApp(mobileSpec({ fonts: ['fontshare/manrope'] }));
  assert.deepEqual(
    planned.downloads.map((f) => f.weight),
    [400, 500, 700],
  );
  const css = (host: string) =>
    `@font-face { src: url('//${host}/a/b.woff2') format('woff2'), url('//${host}/a/b.ttf') format('truetype'); font-weight: 700; font-style: normal; }`;
  assert.equal(ttfUrl(css('cdn.fontshare.com'), 700), 'https://cdn.fontshare.com/a/b.ttf');
  assert.equal(ttfUrl(css('cdn.fontshare.com'), 400), null);
  assert.equal(ttfUrl(css('evil.example'), 700), null);
});

test('« Varier » : palette, police et variantes différentes du choix courant', () => {
  for (let n = 0; n < 40; n++) {
    const current = { theme: 'mobile-base/encre', fonts: ['fontshare/manrope'], mobile: cleanMobile(null) };
    const draw = vary(items, current, () => n / 40);
    assert.notEqual(draw.theme, current.theme);
    assert.notEqual(draw.fonts[0], current.fonts[0]);
    assert.ok(byId.get(draw.fonts[0])!.platforms.includes('mobile'), 'police embarquable');
    assert.equal(byId.get(draw.theme)!.sourceId, 'mobile-base');
    for (const key of ['onboarding', 'paywall', 'spacing'] as const) assert.notEqual(draw.layouts[key], current.mobile.layouts[key]);
  }
});

test('sélection mobile : intentions web gardées, sons et templates web refusés', () => {
  assert.ok(selectable(byId.get('shadcn/button'), 'mobile'), 'intention web gardée');
  assert.ok(!selectable(byId.get('launch-ui/template'), 'mobile'), 'template web refusé');
  assert.ok(
    !selectable(
      items.find((i) => i.type === 'sound'),
      'mobile',
    ),
    'son refusé',
  );
  assert.equal(reusableFor({ name: 'Shimmer Button' }), 'button');
  assert.equal(reusableFor({ group: 'alert dialog' }), 'alert-dialog');
  assert.equal(reusableFor({ name: 'Retro Grid' }), null);
});

test('prompt du catalogue : la cible change la stack et les règles', () => {
  const button = { id: 'shadcn/button', name: 'Button', source: 'shadcn/ui', platforms: ['web'], dependencies: ['@radix-ui/react-slot'] };
  const web = buildPrompt([button], { brief: 'Projet' });
  const mobile = buildPrompt([button], { brief: 'Projet', target: 'mobile', stack: 'Next.js' });
  assert.match(web, /React \+ TypeScript \+ Tailwind CSS/);
  assert.ok(!web.includes('Expo'), 'prompt web inchangé');
  for (const expected of ['Expo Router', 'NativeWind', 'RevenueCat', 'AsyncStorage', 'INTERDITS', 'reusables « button »'])
    assert.ok(mobile.includes(expected), expected);
  assert.ok(mobile.includes(MOBILE_INSTRUCTION), 'consigne du squelette');
  assert.ok(!mobile.includes('Next.js') && !mobile.includes('Paquets npm'), 'stack web absente');
  assert.match(buildPrompt([], { target: 'mobile' }), /app\/\(main\)/, 'prompt mobile possible sans bloc');
});
