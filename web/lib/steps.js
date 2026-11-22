/*
 * Parcours du builder : étapes par cible, corps enregistré, contrôles avant enregistrement et résumés.
 * Sans DOM, testé dans Node (tests/ts/steps.test.ts) contre le schéma des specs.
 */
import { cleanBlock, slugify } from './common.js';
import { LAYOUT_LABEL, LIMITS, mobileDefaults, PALETTE_SOURCE, supports, unsupportedLabel } from './mobile.js';

export const STEP_LABEL = {
  project: 'Projet',
  style: 'Style',
  onboarding: 'Onboarding',
  paywall: 'Paywall',
  blocks: 'Blocs',
  launch: 'Lancer',
};
const STEPS = {
  web: ['project', 'style', 'blocks', 'launch'],
  mobile: ['project', 'style', 'onboarding', 'paywall', 'blocks', 'launch'],
};
export const stepsFor = (target) => STEPS[target] ?? STEPS.web;

/** Types de la galerie par étape. */
export const STEP_TYPES = {
  style: ['theme', 'font', 'easing', 'sound'],
  blocks: ['component', 'section', 'screen'],
};

/** Le nom de fichier suit le titre tant qu'il n'a été ni modifié à la main, ni enregistré. */
export function nameAfterTitle(spec, title) {
  const automatic = !spec.loadedFrom && (!spec.name || spec.name === slugify(spec.title));
  return automatic ? slugify(title) : spec.name;
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const BUNDLE = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;
// Même règle que z.email() côté serveur.
const EMAIL = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;
const KEY = /^[a-z][a-z0-9_]{0,39}$/;
const isHttps = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};
const field = (path) => `[data-m="${path}"]`;

/** Erreurs des réglages mobiles, chacune rattachée à son étape et à son champ. */
export function mobileErrors(m) {
  const out = [];
  const add = (step, path, message) => out.push({ level: 'error', step, field: field(path), message });

  if (m.appName.length > 30)
    out.push({ level: 'error', step: 'project', field: '#s-title', message: 'Nom de l’app : 30 caractères maximum.' });
  if (m.bundleId && (!BUNDLE.test(m.bundleId) || m.bundleId.length > 155))
    add('project', 'bundleId', 'Bundle id : minuscules et chiffres séparés par des points, sans tiret. Exemple : com.monstudio.monapp');
  if (m.slug && !SLUG.test(m.slug)) add('project', 'slug', 'Slug : minuscules, chiffres et tirets. Exemple : mon-app');
  if (!/^\d{0,15}$/.test(m.iosAppId)) add('project', 'iosAppId', 'Identifiant App Store : des chiffres uniquement.');

  const [minSlides, maxSlides] = LIMITS.slides;
  if (m.slides.length < minSlides || m.slides.length > maxSlides)
    add('onboarding', 'slides.0.title', `L’onboarding compte ${minSlides} à ${maxSlides} écrans.`);
  m.slides.forEach((s, i) => {
    if (!s.title || s.title.length > 80) add('onboarding', `slides.${i}.title`, `Écran ${i + 1} : titre de 1 à 80 caractères.`);
    if (s.text.length > 240) add('onboarding', `slides.${i}.text`, `Écran ${i + 1} : texte de 240 caractères maximum.`);
  });

  const keys = new Set();
  m.questions.forEach((q, i) => {
    const n = `Question ${i + 1}`;
    if (!q.title || q.title.length > 120) add('onboarding', `questions.${i}.title`, `${n} : écrivez la question (120 caractères maximum).`);
    const [min, max] = LIMITS.options;
    if (q.options.length < min || q.options.length > max)
      add('onboarding', `questions.${i}.options`, `${n} : ${min} à ${max} réponses, une par ligne.`);
    else if (q.options.some((o) => !o || o.length > 60))
      add('onboarding', `questions.${i}.options`, `${n} : 60 caractères maximum par réponse.`);
    if (!KEY.test(q.id)) add('onboarding', `questions.${i}.id`, `${n} : clé en minuscules, chiffres et _, commençant par une lettre.`);
    else if (keys.has(q.id)) add('onboarding', `questions.${i}.id`, `${n} : cette clé est déjà utilisée.`);
    keys.add(q.id);
  });

  const p = m.paywall;
  if (!p.title || p.title.length > 80) add('paywall', 'paywall.title', 'Paywall : titre de 1 à 80 caractères.');
  if (p.subtitle.length > 160) add('paywall', 'paywall.subtitle', 'Paywall : sous-titre de 160 caractères maximum.');
  const [minBenefits, maxBenefits] = LIMITS.benefits;
  if (p.benefits.length < minBenefits || p.benefits.length > maxBenefits)
    add('paywall', 'paywall.benefits', `${minBenefits} à ${maxBenefits} avantages, un par ligne.`);
  else if (p.benefits.some((b) => !b || b.length > 100)) add('paywall', 'paywall.benefits', '100 caractères maximum par avantage.');

  if (!Number.isInteger(m.trial.days) || m.trial.days < 0 || m.trial.days > 90) add('paywall', 'trial.days', 'Essai : 0 à 90 jours.');
  for (const [path, label] of [
    ['termsUrl', 'CGU'],
    ['privacyUrl', 'Confidentialité'],
  ])
    if (m[path] && !isHttps(m[path])) add('paywall', path, `${label} : adresse complète commençant par https://`);
  if (m.supportEmail && !EMAIL.test(m.supportEmail))
    add('paywall', 'supportEmail', 'Email du support : adresse complète. Exemple : support@mon-domaine.fr');
  if (!m.revenueCat.entitlement.trim() || m.revenueCat.entitlement.length > 100)
    add('paywall', 'revenueCat.entitlement', 'Entitlement RevenueCat requis (« premium » par défaut).');
  if (m.revenueCat.offering.length > 100) add('paywall', 'revenueCat.offering', 'Offering : 100 caractères maximum.');
  return out;
}

/**
 * Corps envoyé au serveur, et base de comparaison avec le fichier. En Web, des réglages mobiles à moitié
 * remplis ne bloquent pas l'enregistrement : ils restent dans le brouillon du navigateur.
 */
export function specBody(spec, preset = false) {
  const keepMobile = spec.mobile && (spec.target === 'mobile' || !mobileErrors(spec.mobile).length);
  return {
    name: spec.name,
    title: spec.title,
    target: spec.target,
    ...(keepMobile ? { mobile: spec.mobile } : {}),
    brief: spec.brief,
    stack: spec.stack,
    style: spec.style,
    theme: spec.theme,
    template: spec.template,
    fonts: spec.fonts,
    easings: spec.easings,
    sounds: spec.sounds,
    blocks: spec.blocks.map(cleanBlock),
    preset,
  };
}

/** Empreinte du contenu enregistré, indépendante de l'ordre des clés. */
export function fingerprint(spec) {
  const { preset: _preset, ...body } = specBody(spec);
  return JSON.stringify(body, (_key, value) =>
    value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort()) : value,
  );
}

/**
 * Tout ce qui empêche d'enregistrer (error) ou mérite un coup d'œil (warn), dans l'ordre des étapes.
 * `lookup(id)` renvoie l'item du registre.
 */
export function issues(spec, lookup, { preset = false } = {}) {
  const mobile = spec.target === 'mobile';
  const out = [];
  const add = (level, step, selector, message) => out.push({ level, step, field: selector, message });

  if (!slugify(spec.name || spec.title))
    add('error', 'project', '#s-title', mobile ? 'Donnez un nom à l’app.' : 'Donnez un nom au projet.');
  if (spec.title.length > 120) add('error', 'project', '#s-title', 'Nom : 120 caractères maximum.');
  if (spec.brief.length > 5000) add('error', 'project', '#s-brief', 'Brief : 5 000 caractères maximum.');
  if (spec.stack.length > 300) add('error', 'project', '#s-stack', 'Stack : 300 caractères maximum.');
  if (spec.style.length > 1000) add('error', 'style', '#s-style', 'Direction visuelle : 1 000 caractères maximum.');

  if (!mobile && !preset && !spec.blocks.length && !spec.template)
    add('error', 'blocks', '#q', 'Ajoutez au moins un bloc, ou choisissez un template de départ à l’étape Projet.');
  for (const [list, max, step, label] of [
    ['fonts', 20, 'style', 'polices'],
    ['easings', 20, 'style', 'courbes'],
    ['sounds', 40, 'style', 'sons'],
    ['blocks', 200, 'blocks', 'blocs'],
  ])
    if (spec[list].length > max) add('error', step, '#q', `${max} ${label} au maximum.`);

  for (const [step, ids] of [
    ['project', [spec.template]],
    ['style', [spec.theme, ...spec.fonts, ...spec.easings, ...spec.sounds]],
    ['blocks', spec.blocks.map((b) => b.id)],
  ])
    for (const id of ids) if (id && !lookup(id)) add('error', step, '', `« ${id} » n’existe plus dans le registre : retirez-le.`);

  if (!spec.brief.trim()) add('warn', 'project', '#s-brief', 'Sans brief, Claude Code devra deviner ce qu’il doit construire.');

  if (mobile && spec.mobile) {
    const m = spec.mobile;
    out.push(...mobileErrors(m));
    if (!m.bundleId)
      add('warn', 'project', field('bundleId'), 'Bundle id à définir avant publication : un exemple sera utilisé en attendant.');
    if (JSON.stringify(m.slides) === JSON.stringify(mobileDefaults().slides))
      add('warn', 'onboarding', field('slides.0.title'), 'Textes d’exemple dans l’onboarding : Claude Code les adaptera au brief.');
    for (const [path, label] of [
      ['termsUrl', 'CGU'],
      ['privacyUrl', 'Politique de confidentialité'],
      ['supportEmail', 'Email du support'],
    ])
      if (!m[path]) add('warn', 'paywall', field(path), `${label} à renseigner avant publication sur l’App Store.`);
    for (const id of [spec.theme, ...spec.fonts, ...spec.sounds]) {
      const item = id && lookup(id);
      if (item && !supports(item, 'mobile')) add('warn', 'style', '', `${item.name} est ${unsupportedLabel(item)} : ignoré dans l’app.`);
    }
  }

  const order = stepsFor(spec.target);
  return out.sort((a, b) => order.indexOf(a.step) - order.indexOf(b.step));
}

/** Une étape est « faite » quand elle porte un choix de l'utilisateur, pas une valeur par défaut. */
export function stepDone(step, spec) {
  const defaults = mobileDefaults();
  const changed = (pick) => !!spec.mobile && JSON.stringify(pick(spec.mobile)) !== JSON.stringify(pick(defaults));
  if (step === 'project') return !!(spec.title || spec.name) && !!spec.brief.trim();
  if (step === 'style') return !!(spec.theme || spec.fonts.length);
  if (step === 'onboarding') return changed((m) => [m.slides, m.questions, m.layouts.onboarding]);
  if (step === 'paywall') return changed((m) => [m.paywall, m.layouts.paywall, m.termsUrl, m.privacyUrl]);
  if (step === 'blocks') return spec.blocks.length > 0;
  return false;
}

/** Résumé d'une étape en une ligne, pour le récapitulatif. */
export function summary(step, spec, lookup) {
  const name = (id) => lookup(id)?.name ?? id;
  const mobile = spec.target === 'mobile';
  const m = spec.mobile;
  const count = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
  if (step === 'project') {
    if (!spec.title && !spec.name) return 'À nommer';
    const base = spec.title || spec.name;
    return !mobile && spec.template ? `${base}, template ${name(spec.template)}` : base;
  }
  if (step === 'style') {
    const parts = [spec.theme ? name(spec.theme) : mobile ? 'Encre' : '', spec.fonts.length ? spec.fonts.map(name).join(', ') : ''];
    return parts.filter(Boolean).join(', ') || 'Au choix de Claude Code';
  }
  if (step === 'onboarding' && m)
    return [
      LAYOUT_LABEL[m.layouts.onboarding],
      count(m.slides.length, 'écran'),
      m.questions.length ? count(m.questions.length, 'question') : '',
    ]
      .filter(Boolean)
      .join(', ');
  if (step === 'paywall' && m)
    return `${LAYOUT_LABEL[m.layouts.paywall]}, ${m.trial.days ? `essai de ${count(m.trial.days, 'jour')}` : 'sans essai'}`;
  if (step === 'blocks') {
    if (!spec.blocks.length) return mobile ? 'Aucun (facultatif)' : 'Aucun';
    const pages = new Set(spec.blocks.map((b) => b.page).filter(Boolean)).size;
    return `${count(spec.blocks.length, 'bloc')}${pages ? ` sur ${count(pages, mobile ? 'écran' : 'page')}` : ''}`;
  }
  return '';
}

const themesFirst = (items, source) => [
  ...items.filter((i) => i.type === 'theme' && i.sourceId === source),
  ...items.filter((i) => !(i.type === 'theme' && i.sourceId === source)),
];

/** Les palettes créées ici passent en tête des thèmes. */
export const ownFirst = (items) => themesFirst(items, 'perso');

/** En mobile, les palettes faites pour le template suivent les vôtres. */
export const palettesFirst = (items) => ownFirst(themesFirst(items, PALETTE_SOURCE));
