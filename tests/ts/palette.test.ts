/** Palette saisie en hexa, sans ordre : codes acceptés, rôles, tokens lisibles, conversion native, réouverture sans perte. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrast, parseColor } from '../../shared/color.js';
import { nativeColors } from '../../shared/native-theme.js';
import { hexList, hexOf, paletteColors, paletteErrors, paletteList, paletteRoles, paletteWarnings } from '../../web/lib/palette.js';

const BRAND = ['#2a9d8f', '#ffffff', '#15171c'];

/** Suite pseudo-aléatoire fixe : un échec se rejoue. */
function seeded() {
  let seed = 7;
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

test('hexa : formes acceptées et refusées', () => {
  for (const [given, expected] of [
    ['#FFF', '#ffffff'],
    ['abc', '#aabbcc'],
    [' 1B1F2A ', '#1b1f2a'],
    ['#2a9d8f', '#2a9d8f'],
  ])
    assert.equal(hexOf(given), expected);
  for (const bad of ['', '#12', '#1234', '#12345', '#11223344', '##fff', 'rgb(0,0,0)', 'red', null]) assert.equal(hexOf(bad), null);
});

test('hexa : listes collées', () => {
  assert.deepEqual(hexList('#FFF, #1a1a1a ; #2A9D8F'), ['#ffffff', '#1a1a1a', '#2a9d8f']);
  assert.deepEqual(hexList('https://coolors.co/264653-2a9d8f-e9c46a'), ['#264653', '#2a9d8f', '#e9c46a']);
  assert.deepEqual(hexList('--facade: #fff;\n--decade: #000;'), ['#ffffff', '#000000'], 'un mot en hexa n’est pas une couleur');
});

test('palette : erreurs à la bonne case, liste vide refusée', () => {
  assert.equal(paletteColors([]), null);
  assert.equal(paletteColors(['', 'oups']), null);
  assert.deepEqual(
    paletteErrors(['#fff', 'oups', '', '#12']).map((e) => e.index),
    [1, 3],
  );
  assert.deepEqual(
    paletteErrors(['', ' ']).map((e) => e.index),
    [-1],
  );
  assert.deepEqual(paletteErrors(BRAND), []);
});

test('palette : rôles choisis quel que soit l’ordre, manquants calculés', () => {
  const roles = { background: '#f1faee', foreground: '#1d3557', primary: '#e63946', secondary: '#457b9d', accent: '#a8dadc' };
  const codes = Object.values(roles);
  for (let shift = 0; shift < codes.length; shift++) {
    const turned = [...codes.slice(shift), ...codes.slice(0, shift)];
    assert.deepEqual(paletteRoles(turned), roles, turned.join());
    assert.deepEqual(paletteColors(turned), paletteColors(codes));
  }
  // Une seule couleur : fond et texte calculés, la couleur devient la principale.
  const one = paletteRoles(['00b4d8'])!;
  assert.equal(one.primary, '#00b4d8');
  assert.ok(one.background !== '#00b4d8' && one.foreground !== '#00b4d8');
  // Un jaune pâle sur blanc ne passe pas avant une couleur visible.
  assert.equal(paletteRoles(['#ffd60a', '#fff', '#0b6b74'])!.primary, '#0b6b74');
  // Doublons ignorés, couleurs au-delà de cinq rôles non utilisées.
  assert.deepEqual(paletteRoles(['#fff', '#FFFFFF', '#111']), { background: '#ffffff', foreground: '#111111', primary: '#111111' });
});

test('palette : couleurs saisies intactes, sombre inversé, lisibilité signalée', () => {
  const colors = paletteColors([...BRAND, '#e9c46a', '#f4e3c1'])!;
  assert.equal(colors.light['--background'], '#ffffff');
  assert.equal(colors.light['--foreground'], '#15171c');
  assert.equal(colors.light['--primary'], '#2a9d8f');
  assert.equal(colors.dark['--background'], '#15171c', 'le texte foncé devient le fond sombre');
  assert.equal(colors.dark['--foreground'], '#ffffff');
  assert.match(paletteWarnings(paletteColors(['#ffffff', '#ffd60a'])!).join(), /principale peu visible/);
});

test('palette : textes lisibles (4,5:1) sur 3 000 listes aléatoires, clair et sombre', () => {
  const next = seeded();
  const random = () =>
    `#${[0, 0, 0]
      .map(() =>
        Math.floor(next() * 256)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
  const ratio = (a: string, b: string) => contrast(parseColor(a)!, parseColor(b)!);
  for (let n = 0; n < 3000; n++) {
    const codes = Array.from({ length: 1 + (n % 7) }, random);
    const colors = paletteColors(codes)!;
    for (const [mode, tokens] of Object.entries(colors)) {
      const on = (text: string, under: string) => ratio(tokens[`--${text}`], tokens[`--${under}`]);
      for (const [text, under] of [
        ['foreground', 'background'],
        ['primary-foreground', 'primary'],
        ['secondary-foreground', 'secondary'],
        ['accent-foreground', 'accent'],
        ['card-foreground', 'card'],
        ['foreground', 'muted'],
        ['muted-foreground', 'background'],
        ['muted-foreground', 'card'],
        ['muted-foreground', 'muted'],
      ])
        assert.ok(on(text, under) >= 4.5, `${mode} ${text}/${under} = ${on(text, under)} pour ${codes.join()}`);
    }
  }
});

test('palette : convertie telle quelle pour mobile-base', () => {
  const colors = paletteColors(BRAND)!;
  const native = nativeColors({ colors, typography: {}, radius: {}, easings: [], other: {} })!;
  for (const mode of ['light', 'dark'] as const)
    for (const [token, hex] of Object.entries(colors[mode])) assert.equal(native[mode][token.slice(2)], hex, `${mode} ${token}`);
});

test('palette : réouverture exacte, thème réglé à la main non écrasé', () => {
  for (const codes of [BRAND, ['#00b4d8'], ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'], ['#101216', '#eef0f4', '#ff8a5c']]) {
    const colors = paletteColors(codes)!;
    const list = paletteList(colors)!;
    assert.deepEqual(paletteColors(list), colors, codes.join());
    assert.ok(list.length <= codes.length);
  }
  assert.deepEqual(paletteList(paletteColors(['#00b4d8'])!), ['#00b4d8'], 'les couleurs calculées ne reviennent pas');
  const colors = paletteColors(BRAND)!;
  assert.equal(paletteList({ ...colors, light: { ...colors.light, '--border': '#ff0000' } }), null);
});
