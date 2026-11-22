/* Atlas Builder : une spec en étapes (projet, style, onboarding et paywall en mobile, blocs, lancer), galerie filtrée par étape. */
import {
  $,
  $$,
  esc,
  icon,
  plural,
  store,
  norm,
  slugify,
  shortLicense,
  safeHttps,
  toast,
  queryWords,
  matchesAll,
  relevance,
  interleave,
  hydrateLicenses,
  TYPE_LABEL,
  STYLE_TYPES,
  readDraft,
  writeDraft,
  onDraftChange,
  blankSpec,
  cleanBlock,
  migrateLegacy,
  previewController,
  previewZone,
  setupDialog,
  copyText,
  api,
} from '/lib/common.js';
import { cleanMobile, LAYOUT_LABEL, MOBILE_STACK_LINE, selectable, supports, TEMPLATE_ID, unsupportedLabel, vary } from '/lib/mobile.js';
import { setupMobileForm } from '/lib/mobile-form.js';
import { fingerprint, issues, nameAfterTitle, ownFirst, palettesFirst, specBody, STEP_LABEL, STEP_TYPES, stepsFor } from '/lib/steps.js';
import { renderFieldErrors, renderLaunch, renderPhones, renderRecap, renderSteps, setupLayoutChoices, STATUS } from '/lib/flow.js';

import { hexOf, paletteList } from '/lib/palette.js';
import { setupPalette } from '/lib/palette-form.js';

const STEP_KEY = 'atlas-builder-step';
const DEFAULT_PALETTE = 'mobile-base/encre';
/** Recherches fréquentes de l'étape Blocs : [libellé, recherche]. */
const SUGGESTIONS = {
  web: [
    ['Hero', 'hero'],
    ['Navigation', 'navigation'],
    ['Tarifs', 'tarifs'],
    ['Témoignages', 'temoignages'],
    ['FAQ', 'faq'],
    ['Formulaire', 'formulaire'],
    ['Pied de page', 'footer'],
  ],
  mobile: [
    ['Bouton', 'bouton'],
    ['Carte', 'carte'],
    ['Onglets', 'tabs'],
    ['Formulaire', 'formulaire'],
    ['Dialogue', 'dialog'],
    ['Progression', 'progress'],
  ],
};

const PAGE = 24;
const TYPES = [
  ['', 'Tout'],
  ['component', 'Composants'],
  ['section', 'Sections'],
  ['screen', 'Écrans'],
];
const RANK = { template: 0, component: 1, section: 2, screen: 3, theme: 4, easing: 5, font: 6, sound: 7 };
const FILTERS = ['#q', '#f-category', '#f-tag', '#f-source', '#f-license'];

let items = [],
  galleries = { web: [], mobile: [] },
  shownTarget = '',
  byId = new Map(),
  sources = {},
  previewsBuilt = false,
  visible = PAGE,
  typeFilter = '',
  onlyNew = false,
  specs = [];
let spec = readDraft();
let step = '',
  /** Empreinte du fichier enregistré : undefined = pas encore lu, null = absent. */
  baseline,
  currentIssues = [],
  attempted = false,
  saving = false,
  palette = null,
  undoSpec = null,
  addPage = null,
  slideIndex = 0;
const touched = new Set();
const openBlocks = new Set();

function persist() {
  // Après une autre modification, « Annuler » l'écraserait : il n'est plus proposé.
  if (undoSpec) {
    undoSpec = null;
    $('#toast').classList.remove('visible');
  }
  writeDraft(spec);
  refresh();
}
const isMobile = () => spec.target === 'mobile';
/** En mobile le squelette est imposé ; le template web choisi est gardé pour un retour en Web. */
const activeTemplate = () => (isMobile() ? TEMPLATE_ID : spec.template);
/** Un brouillon à ne pas écraser sans demander. Choisir la cible ne suffit pas à en faire un. */
const hasContent = () =>
  !!(spec.blocks.length || spec.title || spec.brief || spec.theme || spec.template) ||
  (!!spec.mobile && JSON.stringify(spec.mobile) !== JSON.stringify(cleanMobile(null)));
const unsaved = () => hasContent() && statusOf() !== 'saved';
const renderMobileForm = setupMobileForm($('#main'), {
  getMobile: () => spec.mobile,
  onChange: persist,
  onRemove(list, remove) {
    const before = structuredClone(spec);
    remove();
    persist();
    withUndo(list === 'slides' ? 'Écran retiré.' : 'Question retirée.', before);
  },
});
const command = () => `/mcp__atlas__build-from-spec ${slugify(spec.name) || 'nom'}`;
const savedKind = () => (spec.loadedFrom || '').split(':')[0];
const savedName = () => (spec.loadedFrom || '').split(':')[1] || '';

/* ---------- Aperçus ---------- */

function previewUrl(i, { card = false, page = false } = {}) {
  if (i.preview.kind === 'atlas-demo') return `/demos/index.html?demo=${encodeURIComponent(i.preview.demo)}`;
  const params = new URLSearchParams({ id: i.id });
  if (!$('#f-light').checked) params.set('theme', 'dark');
  if (card) params.set('card', '1');
  if (page) params.set('page', '1');
  if ($('#f-skin').checked && spec.theme) params.set('skin', spec.theme);
  return `/registry-previews/index.html?${params}`;
}

const previews = previewController({
  frameFor(id, el) {
    const i = byId.get(id);
    if (!i?.interactive) return null;
    const live = i.preview.kind === 'live';
    return {
      src: previewUrl(i, { card: !el.classList.contains('detail-zone') }),
      title: `Aperçu : ${i.name}`,
      ...(live ? { sandbox: 'allow-scripts' } : {}),
    };
  },
});

function curveSvg(b) {
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24,
      u = 1 - t;
    const x = 3 * u * u * t * b[0] + 3 * u * t * t * b[2] + t ** 3,
      y = 3 * u * u * t * b[1] + 3 * u * t * t * b[3] + t ** 3;
    pts.push(`${(4 + x * 52).toFixed(1)},${(52 - y * 40).toFixed(1)}`);
  }
  return `<svg viewBox="0 0 60 64" aria-hidden="true"><path class="axis" d="M4 52 H56 M4 12 H56" stroke-width=".6" fill="none"/><polyline class="curve" points="${pts.join(' ')}" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

const KEY_TOKENS = ['--primary', '--background', '--foreground', '--accent', '--secondary', '--muted', '--border', '--card'];
/** Les couleurs qui distinguent un thème : primaire et fond d'abord, sans doublon. */
function keyColors(colors = {}, max = 12) {
  const rank = ([name]) => (KEY_TOKENS.includes(name) ? KEY_TOKENS.indexOf(name) : KEY_TOKENS.length);
  const seen = new Set();
  return Object.entries(colors)
    .filter(([, v]) => !/^var\(/.test(v))
    .sort((a, b) => rank(a) - rank(b))
    .filter(([, v]) => !seen.has(v) && seen.add(v))
    .slice(0, max);
}

function staticVisual(i) {
  if (i.type === 'template') {
    // Sans capture de page : la première section assez haute pour servir de visuel (pas une barre de navigation).
    const cover =
      i.screens?.find((s) => s.viewport !== 'full')?.url ||
      (i.sections || []).map((id) => byId.get(id)?.shot).find((s) => s && s.height >= 300)?.url ||
      i.screens?.[0]?.url;
    return cover
      ? `<img class="thumb" src="${esc(cover)}" alt="" loading="lazy" decoding="async">`
      : `<div class="placeholder">${icon('layers')}Template complet</div>`;
  }
  if (i.shot) return `<img class="thumb shot-thumb" src="${esc(i.shot.url)}" alt="" loading="lazy" decoding="async">`;
  if (i.type === 'font')
    return `<div class="font-sample" data-font-css="${esc(i.font?.cssUrl || '')}" data-font="${esc(i.font?.family || i.name)}"><span class="big">Aa Gg</span><span class="line">Le vif zéphyr jubile sur les kumquats</span><span class="line">0123456789 · ${esc((i.font?.styles || []).length)} styles</span></div>`;
  if (i.type === 'theme') {
    const colors = keyColors(i._colors);
    return colors.length
      ? `<div class="swatches">${colors.map(([k, v]) => `<span data-color="${esc(v)}" title="${esc(k)} : ${esc(v)}"></span>`).join('')}</div>`
      : `<div class="placeholder">${icon('palette')}Tokens du thème</div>`;
  }
  if (i.type === 'easing') {
    const curves = (i._easings || [])
      .filter((e) => e.cubicBezier)
      .filter((_, k) => k % 3 === 2)
      .slice(0, 6);
    const springs = (i._easings || []).filter((e) => e.kind === 'spring').length,
      durations = (i._easings || []).filter((e) => e.kind === 'duration').length;
    return `<div class="curves">${curves.map((e) => `<figure>${curveSvg(e.cubicBezier)}<figcaption>${esc(e.name.replace(/^ease/, ''))}</figcaption></figure>`).join('')}${springs || durations ? `<p class="curves-more">+ ${plural(springs, 'ressort')} · ${plural(durations, 'durée')}</p>` : ''}</div>`;
  }
  if (i.type === 'sound')
    return `<div class="placeholder">${icon('volume')}${esc((i.sound?.names || []).slice(0, 4).join(' · ') || 'Son d’interface')}</div>`;
  if (i.preview.kind === 'live' && !previewsBuilt)
    return `<div class="placeholder">${icon('grid')}Aperçus pas encore compilés<br><code>npm run previews</code></div>`;
  if (i.framework === 'react-native') return `<div class="placeholder">${icon('device')}Composant natif, sans aperçu web</div>`;
  return `<div class="placeholder">${icon('code')}${esc(i.preview.reason || 'Pas d’aperçu web')}</div>`;
}

function visual(i, extra = '') {
  if (i.interactive && (!STYLE_TYPES.has(i.type) || i.type === 'sound'))
    return previewZone(i.id, i.name, i.thumb, extra, i.preview.kind === 'atlas-demo' ? 'stage' : $('#f-light').checked ? 'light' : '');
  return `<div class="visual">${staticVisual(i)}${extra}</div>`;
}

const loadedFonts = new Set();
function loadFont(css) {
  if (!css || !/^https:\/\/api\.fontshare\.com\//.test(css) || loadedFonts.has(css)) return;
  loadedFonts.add(css);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = css;
  link.referrerPolicy = 'no-referrer';
  document.head.append(link);
}
const lazy = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      loadFont(target.dataset.fontCss);
      lazy.unobserve(target);
    }
  },
  { rootMargin: '200px' },
);

function hydrateVisuals(root) {
  for (const el of $$('[data-color]', root)) el.style.background = el.dataset.color;
  for (const el of $$('[data-font]', root)) el.style.fontFamily = `'${el.dataset.font}', system-ui, sans-serif`;
  for (const el of $$('[data-font-css]', root)) lazy.observe(el);
}

/* ---------- Galerie ---------- */

const inSpec = (id) =>
  spec.theme === id ||
  activeTemplate() === id ||
  spec.fonts.includes(id) ||
  spec.easings.includes(id) ||
  spec.sounds.includes(id) ||
  spec.blocks.some((b) => b.id === id);
/** Retirer reste toujours possible ; le squelette imposé ne se retire pas. */
function locked(i) {
  if (!isMobile()) return false;
  return i.type === 'template' || (!inSpec(i.id) && !selectable(i, 'mobile'));
}
function actionLabel(i) {
  const yes = inSpec(i.id);
  if (locked(i)) return i.id === TEMPLATE_ID ? `${icon('check')}Squelette imposé` : 'Indisponible en mobile';
  if (isMobile() && !yes && !supports(i, 'mobile')) return `${icon('plus')}Ajouter l’intention`;
  if (i.type === 'theme') return yes ? `${icon('check')}Thème choisi` : 'Choisir ce thème';
  if (i.type === 'template') return yes ? `${icon('check')}Template choisi` : 'Partir de ce template';
  return yes ? `${icon('check')}Dans la spec` : `${icon('plus')}Ajouter`;
}

function filtered() {
  const words = queryWords($('#q').value),
    cat = $('#f-category').value,
    tag = $('#f-tag').value,
    src = $('#f-source').value,
    lic = $('#f-license').value;
  const rows = items.filter(
    (i) =>
      !!STEP_TYPES[step]?.includes(i.type) &&
      (!typeFilter || i.type === typeFilter) &&
      (!onlyNew || i.isNew) &&
      (!cat || i.category === cat) &&
      (!tag || (i.tags || []).includes(tag)) &&
      (!src || i.sourceId === src) &&
      (!lic || i.licenseStatus === lic) &&
      (!words.length || matchesAll(words, i._hay)),
  );
  const sort = $('#f-sort').value;
  if (sort === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  if (sort === 'recent') return rows.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''));
  if (!words.length) return rows;
  return rows
    .map((i) => ({ i, s: relevance(words, { name: i.name, category: i.category, tags: i.tags, text: i._hay }) }))
    .sort((a, b) => b.s - a.s || (RANK[a.i.type] ?? 9) - (RANK[b.i.type] ?? 9))
    .map((x) => x.i);
}

function card(i) {
  const off = isMobile() && !supports(i, 'mobile');
  const badge = off ? `<span class="badge off">${unsupportedLabel(i)}</span>` : i.isNew ? '<span class="badge">Nouveau</span>' : '';
  return `<article class="card ${inSpec(i.id) ? 'in-spec' : ''} ${off ? 'is-off' : ''} ${i.framework === 'react-native' ? 'no-preview' : ''}" data-card="${esc(i.id)}">
    ${visual(i, `${badge}<button class="visual-open" data-detail="${esc(i.id)}" aria-label="Détails et code : ${esc(i.name)}">${icon('expand')}</button>`)}
    <div class="card-body">
      <div class="card-meta"><span>${esc(TYPE_LABEL[i.type])}</span>·<span>${esc(i.category)}</span>·<span>${esc(i.source)}</span>${i.framework === 'react-native' ? '·<span>RN</span>' : ''}<span class="lic ${i.licenseStatus}" title="${esc(i.licenseNotes || i.license)}">${esc(shortLicense(i.license))}</span></div>
      <h3>${esc(i.name)}</h3>
      <p>${esc(i.descriptionFr || i.description || '')}</p>
      <div class="card-actions"><button class="btn small ghost" data-detail="${esc(i.id)}">${icon('code')}Code</button><button class="btn small" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}" ${locked(i) ? 'disabled' : ''}>${actionLabel(i)}</button></div>
    </div></article>`;
}

function render() {
  if (!STEP_TYPES[step]) return;
  const rows = filtered();
  const active = FILTERS.filter((id) => $(id).value).length;
  $('#reset').hidden = !active && !onlyNew && (step === 'style' || !typeFilter);
  const hiddenFilters = FILTERS.slice(1).filter((id) => $(id).value).length;
  $('#filters-count').textContent = hiddenFilters ? ` (${hiddenFilters})` : '';
  for (const b of $$('#suggestions [data-q]')) b.setAttribute('aria-pressed', String(b.dataset.q === $('#q').value));
  $('#count').textContent =
    `${plural(rows.length, 'item')}${rows.length > visible ? ` · ${visible} affichés` : ''}${previewsBuilt ? '' : ' · aperçus live non compilés (npm run previews)'}`;
  previews.reset($('#grid'));
  $('#grid').innerHTML = rows.length
    ? rows.slice(0, visible).map(card).join('')
    : '<div class="empty"><strong>Aucun item pour ces filtres.</strong><p>Essayez un autre mot (français ou anglais) ou réinitialisez les filtres.</p></div>';
  $('#more').hidden = rows.length <= visible;
  hydrateVisuals($('#grid'));
  previews.observe($('#grid'));
  for (const b of $$('button[data-type]')) b.setAttribute('aria-pressed', String(b.dataset.type === typeFilter));
  $('#only-new')?.setAttribute('aria-pressed', String(onlyNew));
}

function syncCards() {
  for (const el of $$('[data-card]')) el.classList.toggle('in-spec', inSpec(el.dataset.card));
  for (const b of $$('[data-toggle]')) {
    const i = byId.get(b.dataset.toggle);
    if (i && !b.closest('.token, .theme-token')) {
      b.innerHTML = actionLabel(i);
      b.disabled = locked(i);
      b.setAttribute('aria-pressed', String(inSpec(i.id)));
    }
  }
}

function showType(type) {
  const target = type === 'template' ? 'project' : STEP_TYPES.style.includes(type) ? 'style' : 'blocks';
  typeFilter = target === 'project' ? '' : type;
  if (target !== step) {
    goTo(target);
    return;
  }
  visible = PAGE;
  onlyNew = false;
  buildFilters();
  render();
}

/* ---------- Spec ---------- */

function toggle(id) {
  const i = byId.get(id);
  if (!i || locked(i)) return;
  const flip = (list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const removed = inSpec(id) ? structuredClone(spec) : null;
  if (i.type === 'theme') spec.theme = spec.theme === id ? null : id;
  else if (i.type === 'template') spec.template = spec.template === id ? null : id;
  else if (i.type === 'font') spec.fonts = flip(spec.fonts);
  else if (i.type === 'easing') spec.easings = flip(spec.easings);
  else if (i.type === 'sound') spec.sounds = flip(spec.sounds);
  else if (spec.blocks.some((b) => b.id === id)) spec.blocks = spec.blocks.filter((b) => b.id !== id);
  else {
    const page = addPage ?? currentPage();
    spec.blocks.push({ id, note: '', ...(page ? { page } : {}) });
    toast(`${i.name} ajouté${page ? ` (${isMobile() ? 'écran' : 'page'} ${page})` : ''}.`);
  }
  persist();
  renderSpec();
  syncCards();
  if (removed) withUndo(`${i.name} retiré.`, removed);
  if (i.type === 'theme' && $('#f-skin').checked) previews.reload();
}

/** Page des derniers blocs ajoutés : un nouveau bloc rejoint la page en cours d'édition. */
const currentPage = () => spec.blocks.at(-1)?.page || '';
const pagesOf = () => [...new Set(spec.blocks.map((b) => b.page).filter(Boolean))];

function themeColors(id, max = 4) {
  return keyColors(byId.get(id)?._colors, max);
}
const offNote = (id) => {
  const i = isMobile() && byId.get(id);
  return i && !supports(i, 'mobile') ? ` <em class="off-note">${unsupportedLabel(i)}</em>` : '';
};
const token = (id, label) =>
  `<span class="token"><span>${esc(label)}${offNote(id)}</span><button data-toggle="${esc(id)}" aria-label="Retirer ${esc(label)}">${icon('x')}</button></span>`;

function renderSpec() {
  const mobile = isMobile();
  for (const b of $$('[data-target]')) b.setAttribute('aria-pressed', String(b.dataset.target === spec.target));
  for (const el of $$('[data-only]')) el.hidden = el.dataset.only !== spec.target;
  $('#stack-mobile-text').textContent = MOBILE_STACK_LINE;
  $('#title-label').textContent = mobile ? 'Nom de l’app' : 'Nom du projet';
  $('#s-title').maxLength = mobile ? 30 : 120;
  $('#s-title').placeholder = mobile ? 'Respire' : 'Site de la boulangerie Dupont';
  $('#s-brief').placeholder = mobile
    ? 'Ce que fait l’app, pour qui, et ce qui la rend différente…'
    : 'Pour qui, quelles pages, quel objectif…';
  $('#add-page-label').textContent = mobile ? 'Ajouter les prochains blocs à l’écran' : 'Ajouter les prochains blocs à la page';
  $('#add-page').placeholder = mobile ? 'Écran unique' : 'Page unique';
  if (mobile) renderMobileForm();
  for (const [selector, value] of [
    ['#s-title', shownTitle()],
    ['#s-name', spec.name],
    ['#s-brief', spec.brief],
    ['#s-stack', spec.stack],
    ['#s-style', spec.style],
    ['#add-page', addPage ?? currentPage()],
  ]) {
    const el = $(selector);
    if (el !== document.activeElement || !el.value) el.value = value;
  }
  $('#name-preview').textContent = slugify(spec.name || spec.title) || 'nom';
  for (const b of $$('[data-saved-only]')) b.disabled = !spec.loadedFrom;
  renderTemplates();

  const theme = spec.theme && byId.get(spec.theme);
  $('#palette-open span').textContent = theme?.sourceId === 'perso' ? 'Modifier ma palette' : 'Créer ma palette';
  $('#s-theme').innerHTML = theme
    ? `<span class="token theme-token"><span class="mini">${themeColors(theme.id)
        .map(([k, v]) => `<span data-color="${esc(v)}" title="${esc(k)}"></span>`)
        .join(
          '',
        )}</span><span>${esc(theme.name)}${offNote(theme.id)}</span><button data-toggle="${esc(theme.id)}" aria-label="Retirer le thème">${icon('x')}</button></span>`
    : mobile
      ? 'Encre, par défaut'
      : 'Au choix de Claude Code';
  for (const [slot, list, empty] of [
    ['#s-fonts', spec.fonts, mobile ? 'Police du système' : 'Au choix de Claude Code'],
    ['#s-easings', spec.easings, 'Standard'],
    ['#s-sounds', spec.sounds, 'Aucun'],
  ])
    $(slot).innerHTML = list.length ? list.map((id) => token(id, byId.get(id)?.name || id)).join('') : empty;

  renderBlocks();

  const restricted = [spec.template, spec.theme, ...spec.fonts, ...spec.sounds, ...spec.blocks.map((b) => b.id)]
    .map((id) => id && byId.get(id))
    .filter((i) => i && i.licenseStatus === 'restricted');
  const bySource = [...new Map(restricted.map((i) => [i.sourceId, i])).values()];
  const credit = bySource.length
    ? `<div class="attribution"><strong>Licences avec conditions</strong> : à créditer dans le projet (le bundle produit CREDITS.md).<ul>${bySource.map((i) => `<li>${esc(i.source)} : ${esc(i.attribution || i.licenseNotes || i.license)}</li>`).join('')}</ul></div>`
    : '';
  $('#s-attribution').innerHTML = $('#launch-attribution').innerHTML = credit;
  hydrateVisuals($('#s-theme'));
  refresh();
}

/** Templates de départ. En mobile ils restent visibles, grisés : le squelette est imposé. */
function renderTemplates() {
  const mobile = isMobile();
  const templates = galleries.web.filter((i) => i.type === 'template');
  const selected = mobile ? null : spec.template;
  const signature = `${mobile}|${selected}|${templates.length}`;
  const root = $('#s-template');
  if (root.dataset.signature === signature) return;
  root.dataset.signature = signature;
  $('#templates-fold').open = !mobile;
  const focused = root.contains(document.activeElement) ? document.activeElement.dataset.template : undefined;
  const pick = (id, name, cover) =>
    `<button type="button" class="template-pick" data-template="${esc(id)}" aria-pressed="${(selected || '') === id}" ${mobile ? 'disabled' : ''}><span class="template-cover">${cover}</span><span class="template-name">${esc(name)}</span></button>`;
  root.innerHTML =
    (mobile ? '' : `<div class="template-option">${pick('', 'Partir de zéro', `<span class="placeholder">${icon('plus')}</span>`)}</div>`) +
    templates
      .map(
        (i) =>
          `<div class="template-option">${pick(i.id, i.name, staticVisual(i))}<button type="button" class="link" data-detail="${esc(i.id)}">${mobile ? 'Web only, voir' : 'Voir'}</button></div>`,
      )
      .join('');
  if (focused !== undefined)
    $$('[data-template]', root)
      .find((b) => b.dataset.template === focused)
      ?.focus();
}

/** Un bloc = une ligne ; sa consigne et sa page s'ouvrent au clic sur son nom. */
function renderBlocks() {
  const root = $('#s-blocks');
  const active = root.contains(document.activeElement) ? document.activeElement : null;
  const focusKey = active && ['note', 'page', 'open', 'move'].find((k) => active.dataset[k] !== undefined);
  const focusSelector =
    focusKey && `[data-${focusKey}="${active.dataset[focusKey]}"]${focusKey === 'move' ? `[data-dir="${active.dataset.dir}"]` : ''}`;

  $('#s-count').textContent = spec.blocks.length;
  $('#preview-page').disabled = !spec.blocks.length;
  const pages = pagesOf();
  const where = isMobile() ? 'Écran' : 'Page';
  $('#pages-list').innerHTML = pages.map((p) => `<option value="${esc(p)}">`).join('');
  let lastPage = null;
  root.innerHTML = spec.blocks.length
    ? spec.blocks
        .map((b, k) => {
          const i = byId.get(b.id);
          const name = i?.name || b.id;
          const header =
            pages.length && (b.page || '') !== lastPage
              ? `<li class="page-break" aria-hidden="true">${icon('page')}${esc(b.page || `Sans ${where.toLowerCase()}`)}</li>`
              : '';
          lastPage = b.page || '';
          const open = openBlocks.has(b.id);
          const sub = b.note
            ? `<small class="has-note">${esc(b.note)}</small>`
            : `<small>${esc(i ? `${TYPE_LABEL[i.type]} · ${i.source}` : 'introuvable dans le registre')}${offNote(b.id)}</small>`;
          return `${header}<li class="block" draggable="true" data-index="${k}">
      <div class="block-head"><span class="handle" aria-hidden="true">${icon('grip')}</span><button type="button" class="block-title" data-open="${k}" aria-expanded="${open}" title="Consigne et ${where.toLowerCase()}"><strong>${esc(name)}</strong>${sub}</button>
      <span class="block-tools"><button class="btn icon-only ghost" data-move="${k}" data-dir="-1" aria-label="Monter ${esc(name)}" ${k === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="btn icon-only ghost" data-move="${k}" data-dir="1" aria-label="Descendre ${esc(name)}" ${k === spec.blocks.length - 1 ? 'disabled' : ''}>${icon('down')}</button><button class="btn icon-only ghost" data-detail="${esc(b.id)}" aria-label="Code de ${esc(name)}">${icon('code')}</button><button class="btn icon-only ghost" data-remove="${k}" aria-label="Retirer ${esc(name)}">${icon('x')}</button></span></div>
      <div class="block-fields" ${open ? '' : 'hidden'}><textarea data-note="${k}" rows="2" maxlength="2000" placeholder="Consigne : emplacement, contenu, variante…" aria-label="Consigne pour ${esc(name)}">${esc(b.note)}</textarea><input data-page="${k}" value="${esc(b.page || '')}" list="pages-list" maxlength="60" placeholder="${where}" aria-label="${where} de ${esc(name)}"></div></li>`;
        })
        .join('')
    : `<li class="empty">${isMobile() ? 'Facultatif : sans bloc, Claude Code code la fonctionnalité depuis le brief.' : 'Cliquez sur « Ajouter » sous un élément. Il apparaît ici, à ordonner par glisser-déposer.'}</li>`;
  if (focusSelector) $(focusSelector, root)?.focus();
}

/* ---------- Parcours : étapes, état d'enregistrement, contrôles ---------- */

const shownTitle = () => (isMobile() && spec.mobile?.appName) || spec.title;

function statusOf() {
  if (!spec.loadedFrom) return 'draft';
  if (baseline === undefined) return 'checking';
  return baseline !== null && baseline === fingerprint(spec) ? 'saved' : 'dirty';
}

/** Les items inconnus ne comptent qu'une fois le registre chargé. */
const lookup = (id) => byId.get(id) ?? (byId.size ? undefined : { name: id, platforms: ['web', 'mobile'] });

/** Les problèmes de la spec, plus une palette saisie mais pas enregistrée. */
function allIssues(options) {
  const order = stepsFor(spec.target);
  return [...(palette?.issues() ?? []), ...issues(spec, lookup, options)].sort((a, b) => order.indexOf(a.step) - order.indexOf(b.step));
}

/** Tout ce qui dépend de la spec sans reconstruire de champ : appelé à chaque frappe. */
function refresh() {
  const status = statusOf();
  currentIssues = allIssues();
  const state = { spec, step, status, issues: currentIssues, attempted, touched, lookup, command: command() };
  renderSteps(state);
  renderRecap(state);
  renderFieldErrors(state);
  renderLaunch(state);
  const name = shownTitle() || spec.name;
  $('#spec-heading').textContent = name || (isMobile() ? 'Nouvelle app' : 'Nouvelle spec');
  const label = status === 'saved' ? `${savedKind() === 'preset' ? 'Preset' : 'Spec'} ${savedName()} : enregistré` : STATUS[status];
  $('#spec-state').textContent = label;
  $('#save-state').textContent = STATUS[status];
  $('#spec-state').dataset.status = $('#save-state').dataset.status = status;
  $('#jump-label').textContent = step === 'blocks' ? 'Sélection' : 'Récap';
  $('#jump-count').textContent = step === 'blocks' ? spec.blocks.length : '';
  if (!isMobile()) return;
  const theme = byId.get(spec.theme ?? DEFAULT_PALETTE);
  const font = byId.get(spec.fonts[0]);
  const native = font && supports(font, 'mobile') ? font.font : null;
  if (native) loadFont(native.cssUrl);
  renderPhones({
    spec,
    step,
    slide: slideIndex,
    look: { colors: theme && supports(theme, 'mobile') ? theme._colors : null, radius: theme?._radius, font: native?.family },
  });
}

function showStep(next, { focus = true } = {}) {
  const steps = stepsFor(spec.target);
  const changed = step !== next;
  step = steps.includes(next) ? next : steps[0];
  store.set(STEP_KEY, step);
  for (const panel of $$('[data-panel]')) panel.hidden = panel.dataset.panel !== step;
  const types = STEP_TYPES[step];
  $('#gallery').hidden = !types;
  $('#rail-summary').hidden = step === 'blocks';
  $('#rail-blocks').hidden = step !== 'blocks';
  document.body.dataset.step = step;
  setRail(false);
  if (types) {
    if (changed) {
      for (const id of FILTERS) $(id).value = '';
      onlyNew = false;
      visible = PAGE;
    }
    if (step === 'style' && !types.includes(typeFilter)) typeFilter = 'theme';
    if (step === 'blocks' && !types.includes(typeFilter)) typeFilter = '';
    buildFilters();
    render();
  } else previews.reset($('#grid'));
  if (step === 'project') renderStarts();
  const at = steps.indexOf(step),
    before = steps[at - 1],
    after = steps[at + 1];
  $('#prev-step').hidden = !before;
  $('#next-step').hidden = !after;
  if (before) {
    $('#prev-step span').textContent = STEP_LABEL[before];
    $('#prev-step').setAttribute('aria-label', `Précédent : ${STEP_LABEL[before]}`);
  }
  if (after) {
    $('#next-step span').textContent = innerWidth < 560 ? 'Continuer' : `Continuer : ${STEP_LABEL[after]}`;
    $('#next-step').setAttribute('aria-label', `Continuer : ${STEP_LABEL[after]}`);
  }
  refresh();
  if (focus) {
    scrollTo(0, 0);
    $(`[data-panel="${step}"] h1`)?.focus({ preventScroll: true });
    $(`#steps [data-step="${step}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    // Sur téléphone les variantes défilent : montrer celle qui est choisie.
    $(`[data-panel="${step}"] .layout-choice[aria-pressed="true"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}

/** Navigation de l'utilisateur : une entrée d'historique, pour que Précédent du navigateur suive les étapes. */
function goTo(next, options) {
  if ($('#detail').open) $('#detail').close();
  if (next !== step) history.pushState(null, '', `#step=${next}`);
  showStep(next, options);
}

/** Amène au champ d'un problème, en ouvrant les sections qui le cachent. */
function fix(issue) {
  if (issue.field) touched.add(issue.field);
  goTo(issue.step, { focus: !issue.field });
  if (!issue.field) return;
  const el = $(issue.field);
  if (!el) return;
  for (let d = el.closest('details'); d; d = d.parentElement.closest('details')) d.open = true;
  el.focus();
  el.scrollIntoView({ block: 'center' });
}

function setRail(open) {
  document.body.classList.toggle('rail-open', open);
  $('#jump-spec').setAttribute('aria-expanded', String(open));
}

/** Suppression annulable, jusqu'à la modification suivante. */
function withUndo(message, before) {
  undoSpec = before;
  toast(message, {
    label: 'Annuler',
    run: () => {
      if (!undoSpec) return;
      spec = undoSpec;
      persist();
      if (!applyTarget()) syncCards();
      renderSpec();
      toast('Annulé.');
    },
  });
}

function renderStarts() {
  const empty = !spec.blocks.length && !spec.loadedFrom;
  const same = specs.filter((s) => (s.target ?? 'web') === spec.target);
  const own = same
    .filter((s) => !s.preset)
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    .slice(0, 4);
  const presets = same.filter((s) => s.preset);
  $('#starts-block').hidden = !empty || !(own.length + presets.length);
  const button = (kind, s, hint) =>
    `<button type="button" class="start" data-start="${kind}:${esc(s.name)}"><strong>${esc(s.title || s.name)}</strong><small>${hint}${s.blocks ? `, ${plural(s.blocks, 'bloc')}` : ''}</small></button>`;
  $('#starts').innerHTML =
    presets.map((s) => button('preset', s, 'Exemple à adapter')).join('') + own.map((s) => button('spec', s, 'Reprendre')).join('');
}

function move(from, to) {
  if (to < 0 || to >= spec.blocks.length || from === to) return;
  const [b] = spec.blocks.splice(from, 1);
  spec.blocks.splice(to, 0, b);
  persist();
  renderSpec();
  // Le focus suit le bloc déplacé, pour enchaîner au clavier.
  const dir = to > from ? 1 : -1;
  const again = $(`[data-move="${to}"][data-dir="${dir}"]`);
  if (again && !again.disabled) again.focus();
  else $(`[data-open="${to}"]`)?.focus();
}

/* Glisser-déposer des blocs (les boutons monter/descendre restent l'alternative clavier). */
let dragIndex = null;
$('#s-blocks').addEventListener('dragstart', (e) => {
  const li = e.target.closest('.block');
  if (!li || e.target.closest('textarea, input')) return;
  dragIndex = Number(li.dataset.index);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragIndex));
});
$('#s-blocks').addEventListener('dragover', (e) => {
  const li = e.target.closest('.block');
  if (dragIndex === null || !li) return;
  e.preventDefault();
  $$('.drop-before').forEach((x) => x.classList.remove('drop-before'));
  li.classList.add('drop-before');
});
$('#s-blocks').addEventListener('drop', (e) => {
  const li = e.target.closest('.block');
  if (dragIndex === null || !li) return;
  e.preventDefault();
  move(dragIndex, Number(li.dataset.index));
});
$('#s-blocks').addEventListener('dragend', () => {
  dragIndex = null;
  $$('.dragging,.drop-before').forEach((x) => x.classList.remove('dragging', 'drop-before'));
});
$('#s-blocks').addEventListener('input', (e) => {
  if (e.target.dataset.note !== undefined) {
    spec.blocks[Number(e.target.dataset.note)].note = e.target.value;
    persist();
  }
  if (e.target.dataset.page !== undefined) {
    const b = spec.blocks[Number(e.target.dataset.page)];
    const v = e.target.value.trim().slice(0, 60);
    if (v) b.page = v;
    else delete b.page;
    persist();
  }
});
$('#s-blocks').addEventListener('change', (e) => {
  if (e.target.dataset.page !== undefined) renderSpec();
});

for (const [id, key] of [
  ['#s-brief', 'brief'],
  ['#s-stack', 'stack'],
  ['#s-style', 'style'],
])
  $(id).addEventListener('input', () => {
    spec[key] = $(id).value;
    persist();
  });
$('#s-title').addEventListener('input', () => {
  const value = $('#s-title').value;
  spec.name = nameAfterTitle(spec, value);
  spec.title = value;
  // Un nom d'app distinct (spec créée par le MCP) suit le champ qui l'affiche.
  if (isMobile() && spec.mobile?.appName) spec.mobile.appName = value;
  $('#s-name').value = spec.name;
  $('#name-preview').textContent = spec.name || 'nom';
  persist();
});
$('#s-name').addEventListener('input', () => {
  spec.name = $('#s-name').value;
  $('#name-preview').textContent = slugify(spec.name) || 'nom';
  persist();
});
$('#s-name').addEventListener('change', () => {
  spec.name = slugify($('#s-name').value);
  $('#s-name').value = spec.name;
  persist();
});
$('#add-page').addEventListener('input', () => {
  addPage = $('#add-page').value.trim().slice(0, 60);
});
onDraftChange((next) => {
  const otherFile = next.loadedFrom !== spec.loadedFrom;
  spec = next;
  undoSpec = null;
  applyTarget();
  renderSpec();
  syncCards();
  if (otherFile) refreshBaseline();
});

/** Galerie de la cible en cours ; ne reconstruit l'étape que si la cible change. */
function applyTarget() {
  if (shownTarget === spec.target) return false;
  shownTarget = spec.target;
  items = galleries[spec.target];
  visible = PAGE;
  addPage = null;
  typeFilter = step === 'style' ? 'theme' : '';
  const next = stepsFor(spec.target).includes(step) ? step : 'style';
  history.replaceState(null, '', `#step=${next}`);
  showStep(next, { focus: next !== step });
  return true;
}

for (const b of $$('[data-target]'))
  b.onclick = () => {
    if (spec.target === b.dataset.target) return;
    spec.target = b.dataset.target;
    if (isMobile()) spec.mobile = cleanMobile(spec.mobile);
    attempted = false;
    persist();
    applyTarget();
    renderSpec();
  };

$('#vary').onclick = () => {
  const before = structuredClone(spec);
  const draw = vary([...byId.values()], spec);
  spec.theme = draw.theme;
  spec.fonts = draw.fonts;
  spec.mobile.layouts = draw.layouts;
  persist();
  renderSpec();
  syncCards();
  if ($('#f-skin').checked) previews.reload();
  const names = [byId.get(draw.theme)?.name, byId.get(draw.fonts[0])?.name, ...Object.values(draw.layouts).map((v) => LAYOUT_LABEL[v])];
  withUndo(names.filter(Boolean).join(' · '), before);
};

/* ---------- Enregistrer, ouvrir, gérer les specs ---------- */

/** Spec lue sur le disque, dans la forme du brouillon. */
function fromDisk(data) {
  const next = Object.assign(blankSpec(), data);
  delete next.preset;
  delete next.createdAt;
  delete next.updatedAt;
  next.blocks = (next.blocks || []).map(cleanBlock);
  if (next.mobile || next.target === 'mobile') next.mobile = cleanMobile(next.mobile);
  return next;
}

/** Empreinte du fichier : sans elle, la commande copiée pourrait construire une autre version que celle affichée. */
async function refreshBaseline() {
  const from = spec.loadedFrom;
  if (!from) {
    baseline = null;
    refresh();
    return;
  }
  if (saving) return;
  const known = baseline;
  let next = null,
    data = null;
  try {
    data = await api(`/api/specs/${encodeURIComponent(savedName())}${savedKind() === 'preset' ? '?preset=1' : ''}`);
    next = fingerprint(fromDisk(data));
  } catch {
    /* fichier supprimé ou serveur arrêté : à réenregistrer */
  }
  if (spec.loadedFrom !== from || saving || baseline !== known) return;
  const untouched = statusOf() === 'saved' && next !== null && next !== baseline;
  baseline = next;
  if (untouched) {
    adopt(data, from);
    toast('La spec a changé sur le disque : sa nouvelle version est affichée.');
  } else refresh();
}
window.addEventListener('focus', () => {
  if (spec.loadedFrom) refreshBaseline();
});

/** Refus du serveur : au champ concerné, sans le message technique du schéma. */
function serverRefusal(message) {
  const path = message.match(/^Spec invalide \(([\w.]+)\)/)?.[1];
  if (!path) return message;
  if (path.startsWith('mobile.') && isMobile()) {
    const key = path.slice('mobile.'.length);
    const el = $$('[data-m]').find((x) => x.dataset.m === key || key.startsWith(`${x.dataset.m}.`));
    if (el) {
      fix({ step: el.closest('[data-panel]').dataset.panel, field: `[data-m="${el.dataset.m}"]` });
      return 'Ce champ a une valeur refusée : corrigez-la puis enregistrez.';
    }
  }
  return `Valeur refusée par le serveur (${path}) : corrigez-la puis enregistrez.`;
}

/** true si la spec est enregistrée. */
async function save(preset = false) {
  if (saving || !byId.size) return false;
  // Safari et Firefox n'envoient pas « change » au champ actif sur Ctrl+S.
  spec.name = slugify(spec.name || spec.title);
  $('#s-name').value = spec.name;
  persist();
  const blocking = allIssues({ preset }).filter((i) => i.level === 'error');
  if (blocking.length) {
    attempted = true;
    refresh();
    fix(blocking[0]);
    toast(blocking.length > 1 ? `${blocking[0].message} (${plural(blocking.length, 'point')} à corriger)` : blocking[0].message);
    return false;
  }
  const body = specBody(spec, preset);
  // L'empreinte de ce qui part : une frappe pendant l'envoi laisse bien l'état « modifié ».
  const sent = fingerprint(spec);
  const from = `${preset ? 'preset' : 'spec'}:${spec.name}`;
  const send = (overwrite) => api('/api/specs', { method: 'POST', body: { spec: body, overwrite } });
  saving = true;
  $('#save').disabled = true;
  try {
    let result;
    try {
      result = await send(spec.loadedFrom === from);
    } catch (error) {
      if (error.status !== 409) throw error;
      if (
        !confirm(
          `${preset ? 'Le preset' : 'La spec'} « ${body.name} » existe déjà. La remplacer ? (L’ancienne version reste dans l’historique.)`,
        )
      )
        return false;
      result = await send(true);
    }
    spec.loadedFrom = from;
    baseline = sent;
    attempted = false;
    touched.clear();
    persist();
    renderSpec();
    await loadSpecList();
    toast(`Enregistré : ${result.saved}`);
    return true;
  } catch (error) {
    toast(error.status ? serverRefusal(error.message) : 'Le serveur ne répond pas. Relancez « npm start ».');
    return false;
  } finally {
    saving = false;
    $('#save').disabled = false;
  }
}

async function copyCommand() {
  await refreshBaseline();
  if (statusOf() !== 'saved') {
    toast('La spec a changé : enregistrez-la avant de copier la commande.');
    return;
  }
  toast(
    (await copyText(command()))
      ? 'Commande copiée : collez-la dans Claude Code.'
      : 'Copie impossible : sélectionnez la commande à la main.',
  );
}

$('#save-copy').onclick = async () => {
  if (statusOf() === 'saved') return copyCommand();
  if (!(await save())) return;
  toast(
    (await copyText(command()))
      ? 'Enregistré, commande copiée : collez-la dans Claude Code.'
      : 'Enregistré. Copiez la commande affichée ci-dessous.',
  );
};

async function loadSpecList() {
  try {
    specs = await api('/api/specs');
  } catch {
    specs = [];
  }
  if (step === 'project') renderStarts();
  const own = specs.filter((s) => !s.preset),
    presets = specs.filter((s) => s.preset);
  $('#load-spec').innerHTML =
    '<option value="">Ouvrir…</option>' +
    (own.length
      ? `<optgroup label="Mes specs">${own.map((s) => `<option value="spec:${esc(s.name)}">${esc(s.title || s.name)} (${s.blocks})${s.target === 'mobile' ? ' · mobile' : ''}</option>`).join('')}</optgroup>`
      : '') +
    (presets.length
      ? `<optgroup label="Partir d’un preset">${presets.map((s) => `<option value="preset:${esc(s.name)}">${esc(s.title || s.name)} (${s.blocks})${s.target === 'mobile' ? ' · mobile' : ''}</option>`).join('')}</optgroup>`
      : '');
}

function adopt(data, from) {
  spec = { ...fromDisk(data), loadedFrom: from };
  addPage = null;
  slideIndex = 0;
  attempted = false;
  touched.clear();
  openBlocks.clear();
  persist();
  applyTarget();
  renderSpec();
  syncCards();
  return [spec.theme, ...spec.fonts, ...spec.easings, ...spec.sounds, ...spec.blocks.map((b) => b.id)].filter((id) => id && !byId.has(id))
    .length;
}

async function openSpec(kind, name, { confirmReplace = true } = {}) {
  const from = kind === 'preset' ? null : `spec:${name}`;
  // Un exemple garde ce qui vient d'être saisi : il ne remplace que des blocs, jamais un nom ni un brief.
  const losing = kind === 'preset' ? spec.blocks.length > 0 && unsaved() : unsaved() && spec.loadedFrom !== from;
  if (confirmReplace && losing && !confirm('Remplacer la spec en cours ? Ses changements non enregistrés seront perdus.')) return;
  try {
    const data = await api(`/api/specs/${encodeURIComponent(name)}${kind === 'preset' ? '?preset=1' : ''}`);
    if (kind === 'preset') {
      const typed = spec.loadedFrom ? null : { title: spec.title, name: spec.name, brief: spec.brief };
      adopt({ ...data, title: typed?.title || '', name: typed?.name || '', brief: typed?.brief || data.brief }, null);
      baseline = null;
      goTo('project', { focus: false });
      $('#s-title').focus();
      toast('Exemple chargé : donnez-lui un nom, puis adaptez-le.');
      return;
    }
    baseline = fingerprint(fromDisk(data));
    const missing = adopt(data, from);
    goTo('launch');
    toast(`Spec « ${name} » ouverte.${missing ? ` ${plural(missing, 'item absent', 'items absents')} du registre.` : ''}`);
  } catch {
    toast('Ouverture impossible.');
  }
}

$('#load-spec').addEventListener('change', () => {
  const value = $('#load-spec').value;
  $('#load-spec').value = '';
  if (!value) return;
  const [kind, name] = value.split(':');
  openSpec(kind, name);
});

function closeMenu() {
  $('#spec-menu').open = false;
}
$('#new-spec').onclick = () => {
  closeMenu();
  if (unsaved() && !confirm('Vider la spec en cours ? Ses changements non enregistrés seront perdus.')) return;
  // La cible reste : on enchaîne souvent plusieurs apps.
  spec = { ...blankSpec(), target: spec.target, mobile: isMobile() ? cleanMobile(null) : null };
  baseline = null;
  attempted = false;
  addPage = null;
  slideIndex = 0;
  touched.clear();
  openBlocks.clear();
  persist();
  renderSpec();
  syncCards();
  goTo('project', { focus: false });
  $('#s-title').focus();
};
$('#duplicate-spec').onclick = () => {
  closeMenu();
  spec = {
    ...spec,
    mobile: spec.mobile && structuredClone(spec.mobile),
    name: spec.name ? `${spec.name}-copie`.slice(0, 64) : '',
    title: spec.title ? `${spec.title} (copie)` : '',
    loadedFrom: null,
  };
  if (spec.mobile?.appName) spec.mobile.appName = `${spec.mobile.appName} (copie)`.slice(0, 30);
  // Un bundle id identique désignerait la même app pour Apple.
  if (spec.mobile) spec.mobile.bundleId = '';
  baseline = null;
  persist();
  renderSpec();
  goTo('project', { focus: false });
  $('#s-title').focus();
  toast(
    spec.mobile ? 'Copie prête : changez le nom et donnez-lui son propre bundle id.' : 'Copie prête : ajustez le nom puis enregistrez.',
  );
};
$('#rename-spec').onclick = () => {
  closeMenu();
  openDialog(
    `<h2 id="detail-title">Renommer « ${esc(savedName())} »</h2>
    <form class="form-dialog" id="rename-form"><label class="field">Nouveau nom de fichier<input id="rename-to" value="${esc(savedName())}" required pattern="[a-z0-9][a-z0-9\\-]{0,63}" spellcheck="false" autocomplete="off"></label>
    <p class="help">Minuscules, chiffres et tirets. L’historique suit la spec. La commande Claude Code change avec le nom.</p>
    <div class="form-actions"><button type="button" class="btn ghost" data-close>Annuler</button><button class="btn primary">Renommer</button></div></form>`,
    'form',
  );
  $('#rename-to').select();
  $('#rename-form').onsubmit = async (e) => {
    e.preventDefault();
    const to = slugify($('#rename-to').value);
    if (!to || to === savedName()) {
      $('#detail').close();
      return;
    }
    try {
      await api(`/api/specs/${encodeURIComponent(savedName())}/rename${savedKind() === 'preset' ? '?preset=1' : ''}`, {
        method: 'POST',
        body: { to },
      });
      spec.name = to;
      spec.loadedFrom = `${savedKind()}:${to}`;
      persist();
      renderSpec();
      await refreshBaseline();
      await loadSpecList();
      $('#detail').close();
      toast(`Renommée : ${to}.`);
    } catch (error) {
      toast(error.message);
    }
  };
};
$('#history-spec').onclick = async () => {
  closeMenu();
  const name = savedName(),
    preset = savedKind() === 'preset' ? '?preset=1' : '';
  let versions = [];
  try {
    versions = await api(`/api/specs/${encodeURIComponent(name)}/history${preset}`);
  } catch {
    /* liste vide */
  }
  const date = (v) => {
    const d = new Date(v.at);
    return Number.isNaN(d.getTime()) ? v.stamp : d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  };
  openDialog(
    `<h2 id="detail-title">Historique de « ${esc(name)} »</h2>
    <p class="help">Une copie est gardée à chaque remplacement ou suppression (30 dernières). Restaurer charge la version dans le builder ; enregistrez pour l’appliquer.</p>
    ${versions.length ? `<ol class="history">${versions.map((v) => `<li><span><strong>${esc(date(v))}</strong><small>${esc(v.title || name)} · ${plural(v.blocks, 'bloc')}${v.deleted ? ' · suppression' : ''}</small></span><button class="btn small" data-restore="${esc(v.stamp)}">${icon('history')}Restaurer</button></li>`).join('')}</ol>` : '<div class="empty"><strong>Aucune version précédente.</strong><p>Elles apparaissent après le premier remplacement.</p></div>'}`,
    'form',
  );
  for (const b of $$('[data-restore]'))
    b.onclick = async () => {
      try {
        const data = await api(`/api/specs/${encodeURIComponent(name)}/history/${encodeURIComponent(b.dataset.restore)}${preset}`);
        adopt({ ...data, name }, spec.loadedFrom);
        $('#detail').close();
        toast('Version restaurée dans le builder : enregistrez pour la rendre active.');
      } catch {
        toast('Restauration impossible.');
      }
    };
};
$('#delete-spec').onclick = async () => {
  closeMenu();
  const name = savedName(),
    kind = savedKind();
  if (
    !confirm(
      `Supprimer ${kind === 'preset' ? 'le preset' : 'la spec'} « ${name} » ? Une copie reste dans l’historique, et son contenu reste ouvert ici.`,
    )
  )
    return;
  try {
    await api(`/api/specs/${encodeURIComponent(name)}${kind === 'preset' ? '?preset=1' : ''}`, { method: 'DELETE' });
    spec.loadedFrom = null;
    baseline = null;
    persist();
    renderSpec();
    await loadSpecList();
    toast(`« ${name} » supprimée. Enregistrez pour la recréer.`);
  } catch (error) {
    toast(error.message);
  }
};
$('#save').onclick = () => save();
$('#save-preset').onclick = () => {
  closeMenu();
  save(true);
};
$('#copy-command').onclick = copyCommand;
document.addEventListener('click', (e) => {
  if (!e.target.closest('#spec-menu')) closeMenu();
});

/* ---------- Aperçu composé de la page ---------- */

const frameHeights = new Map();
window.addEventListener('message', (e) => {
  if (e.data?.type !== 'atlas-height') return;
  const frame = $$('#page-frames iframe').find((f) => f.contentWindow === e.source);
  if (!frame) return;
  const h = Math.max(80, Math.min(2400, Math.round(Number(e.data.height) || 0)));
  frame.style.height = `${h}px`;
  frameHeights.set(frame.dataset.id, h);
});

function showPagePreview(page = pagesOf()[0] ?? '') {
  const pages = pagesOf();
  const blocks = spec.blocks.filter((b) => !pages.length || (b.page || '') === page);
  const theme = spec.theme && byId.get(spec.theme);
  const unpaged = pages.length > 0 && spec.blocks.some((b) => !b.page);
  openDialog(
    `<div class="page-preview-head"><div><h2 id="detail-title">Aperçu de la page${page ? ` « ${esc(page)} »` : ''}</h2><p class="help">Blocs empilés dans l’ordre${theme ? `, aux couleurs du thème ${esc(theme.name)}` : ''}. Chaque bloc reste isolé (aperçu sandboxé) : l’assemblage réel se fait dans le projet.</p></div>
    ${pages.length + (unpaged ? 1 : 0) > 1 ? `<div class="page-tabs" role="tablist">${pages.map((p) => `<button class="chip" role="tab" data-page-tab="${esc(p)}" aria-selected="${p === page}" aria-pressed="${p === page}">${esc(p)}</button>`).join('')}${unpaged ? `<button class="chip" role="tab" data-page-tab="" aria-selected="${page === ''}" aria-pressed="${page === ''}">Sans page</button>` : ''}</div>` : ''}</div>
    <div class="page-frames ${$('#f-light').checked ? 'light' : ''}" id="page-frames">${
      blocks
        .map((b) => {
          const i = byId.get(b.id);
          if (!i) return `<div class="page-missing">${icon('x')}${esc(b.id)} : introuvable dans le registre</div>`;
          const note = b.note ? `<span class="page-note">${esc(b.note)}</span>` : '';
          if (!i.interactive && i.shot)
            return `<figure class="page-block"><figcaption>${esc(i.name)} <small>${esc(i.source)} · capture</small>${note}</figcaption><img class="page-shot" src="${esc(i.shot.url)}" alt="Capture : ${esc(i.name)}" width="${i.shot.width}" height="${i.shot.height}" loading="lazy" decoding="async"></figure>`;
          if (!i.interactive)
            return `<div class="page-missing">${icon('code')}<strong>${esc(i.name)}</strong> — pas d’aperçu web (${esc(i.framework === 'react-native' ? 'React Native' : i.preview.reason || 'code seul')}) ; le code est transmis par le MCP.${note}</div>`;
          const live = i.preview.kind === 'live';
          return `<figure class="page-block"><figcaption>${esc(i.name)} <small>${esc(i.source)}</small>${note}</figcaption><iframe data-id="${esc(i.id)}" data-height="${frameHeights.get(i.id) ?? (live ? 360 : 440)}" src="${esc(previewUrl(i, { page: true }))}" title="${esc(i.name)}" ${live ? 'sandbox="allow-scripts"' : ''} referrerpolicy="no-referrer"></iframe></figure>`;
        })
        .join('') || '<div class="empty"><strong>Aucun bloc sur cette page.</strong></div>'
    }</div>`,
    'page',
  );
  // Hauteur initiale par le CSSOM (la CSP interdit les attributs style) ; les aperçus live l'ajustent ensuite (atlas-height).
  for (const f of $$('#page-frames iframe')) f.style.height = `${f.dataset.height}px`;
  for (const b of $$('[data-page-tab]')) b.onclick = () => showPagePreview(b.dataset.pageTab);
}
$('#preview-page').onclick = () => showPagePreview();

/* ---------- Éditeur de thème ---------- */

const THEME_KEYS = [
  ['--background', 'Fond'],
  ['--foreground', 'Texte'],
  ['--card', 'Carte'],
  ['--card-foreground', 'Texte de carte'],
  ['--primary', 'Primaire'],
  ['--primary-foreground', 'Texte sur primaire'],
  ['--secondary', 'Secondaire'],
  ['--secondary-foreground', 'Texte sur secondaire'],
  ['--muted', 'Atténué'],
  ['--muted-foreground', 'Texte atténué'],
  ['--accent', 'Accent'],
  ['--accent-foreground', 'Texte sur accent'],
  ['--border', 'Bordure'],
  ['--input', 'Bordure de champ'],
  ['--ring', 'Anneau de focus'],
  ['--destructive', 'Danger'],
];
const NEUTRAL = {
  light: {
    '--background': '#ffffff',
    '--foreground': '#0a0a0a',
    '--card': '#ffffff',
    '--card-foreground': '#0a0a0a',
    '--primary': '#171717',
    '--primary-foreground': '#fafafa',
    '--secondary': '#f5f5f5',
    '--secondary-foreground': '#171717',
    '--muted': '#f5f5f5',
    '--muted-foreground': '#737373',
    '--accent': '#f5f5f5',
    '--accent-foreground': '#171717',
    '--border': '#e5e5e5',
    '--input': '#e5e5e5',
    '--ring': '#a3a3a3',
    '--destructive': '#dc2626',
  },
  dark: {
    '--background': '#0a0a0a',
    '--foreground': '#fafafa',
    '--card': '#171717',
    '--card-foreground': '#fafafa',
    '--primary': '#e5e5e5',
    '--primary-foreground': '#171717',
    '--secondary': '#262626',
    '--secondary-foreground': '#fafafa',
    '--muted': '#262626',
    '--muted-foreground': '#a3a3a3',
    '--accent': '#262626',
    '--accent-foreground': '#fafafa',
    '--border': '#2e2e2e',
    '--input': '#383838',
    '--ring': '#737373',
    '--destructive': '#f87171',
  },
};
const SAFE_VALUE = /^[#(),.%\w\s\-/]{1,100}$/;
const EDITOR_SAMPLES = ['shadcn/card', 'shadcn/tabs', 'shadcn/select', 'shadcn/switch'];

/** Couleur CSS quelconque (oklch, hsl…) → #rrggbb pour le sélecteur natif. */
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
function toHex(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (!probe) return '#000000';
  probe.fillStyle = '#000';
  probe.fillStyle = value;
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

async function themeTokens(id) {
  try {
    const m = await api(`/api/registry/item?id=${encodeURIComponent(id)}`);
    return m.tokens || null;
  } catch {
    return null;
  }
}

async function showThemeEditor(baseId = spec.theme, seed = null) {
  const themes = items.filter((i) => i.type === 'theme');
  const draftTheme = {
    name: '',
    base: baseId || '',
    light: { ...NEUTRAL.light },
    dark: { ...NEUTRAL.dark },
    radius: '0.625rem',
    mode: 'light',
  };
  const applyBase = async (id) => {
    draftTheme.base = id;
    const t = id ? await themeTokens(id) : null;
    for (const mode of ['light', 'dark'])
      for (const [k] of THEME_KEYS)
        draftTheme[mode][k] = t?.colors?.[mode]?.[k] && SAFE_VALUE.test(t.colors[mode][k]) ? t.colors[mode][k] : NEUTRAL[mode][k];
    if (t?.radius?.['--radius'] && SAFE_VALUE.test(t.radius['--radius'])) draftTheme.radius = t.radius['--radius'];
    const from = byId.get(id);
    if (!draftTheme.name && id) draftTheme.name = from?.sourceId === 'perso' ? from.name : `${from?.name || 'Thème'} perso`;
  };
  if (seed) {
    Object.assign(draftTheme, { name: seed.name, base: '', radius: seed.radius || draftTheme.radius });
    for (const mode of ['light', 'dark']) for (const [k] of THEME_KEYS) draftTheme[mode][k] = seed[mode][k];
  } else if (baseId && byId.get(baseId)?.type === 'theme') await applyBase(baseId);
  const samples = EDITOR_SAMPLES.map((id) => byId.get(id))
    .filter((i) => i?.interactive)
    .slice(0, 2);
  openDialog(
    `<h2 id="detail-title">${icon('palette')}Créer un thème</h2>
    <p class="help">Couleurs des tokens shadcn (utilisés par la plupart des composants du registre). Le thème est enregistré dans <code>registry/themes/perso/</code> et devient choisissable dans toutes les specs.</p>
    <div class="theme-editor">
      <form class="theme-form" id="theme-form">
        <div class="row"><label class="field">Nom<input id="t-name" required maxlength="60" value="${esc(draftTheme.name)}" placeholder="Boulangerie Dupont"></label>
        <label class="field">Partir de<select id="t-base"><option value="">Neutre</option>${themes.map((t) => `<option value="${esc(t.id)}" ${t.id === draftTheme.base ? 'selected' : ''}>${esc(t.name)} · ${esc(t.source)}</option>`).join('')}</select></label></div>
        <div class="row"><div class="segmented" role="group" aria-label="Mode"><button type="button" class="chip" data-mode="light" aria-pressed="true">${icon('sun')}Clair</button><button type="button" class="chip" data-mode="dark" aria-pressed="false">Sombre</button></div>
        <label class="field inline">Rayon<input id="t-radius" value="${esc(draftTheme.radius)}" maxlength="20"></label></div>
        <div class="token-grid" id="token-grid"></div>
        <div class="form-actions"><button type="button" class="btn ghost" data-close>Annuler</button><button class="btn primary">${icon('save')}Enregistrer le thème</button></div>
      </form>
      <div class="theme-preview" id="theme-preview">${samples.map((i) => `<iframe data-sample="${esc(i.id)}" src="${esc(`/registry-previews/index.html?id=${encodeURIComponent(i.id)}&theme=light`)}" sandbox="allow-scripts" title="Aperçu du thème : ${esc(i.name)}" referrerpolicy="no-referrer"></iframe>`).join('') || '<p class="help">Aperçus indisponibles (npm run previews).</p>'}</div>
    </div>`,
    'theme',
  );
  const grid = () => {
    const values = draftTheme[draftTheme.mode];
    $('#token-grid').innerHTML = THEME_KEYS.map(
      ([k, label]) =>
        `<label class="token-row"><input type="color" data-pick="${k}" value="${toHex(values[k])}" aria-label="${esc(label)} (sélecteur)"><span>${esc(label)}<small>${k}</small></span><input data-value="${k}" value="${esc(values[k])}" spellcheck="false" aria-label="${esc(label)} (valeur CSS)"></label>`,
    ).join('');
  };
  const push = () => {
    for (const f of $$('#theme-preview iframe')) {
      const url = new URL(f.src, location.href);
      const mode = draftTheme.mode === 'dark' ? 'dark' : 'light';
      if (url.searchParams.get('theme') !== mode) {
        url.searchParams.set('theme', mode);
        f.src = url.pathname + url.search;
        continue;
      }
      f.contentWindow?.postMessage({ type: 'atlas-skin', light: draftTheme.light, dark: draftTheme.dark, radius: draftTheme.radius }, '*');
    }
  };
  grid();
  for (const f of $$('#theme-preview iframe')) f.addEventListener('load', () => setTimeout(push, 60));
  $('#token-grid').addEventListener('input', (e) => {
    const k = e.target.dataset.pick || e.target.dataset.value;
    if (!k) return;
    const value = hexOf(e.target.value) ?? e.target.value.trim();
    const isColor = CSS.supports('color', value) || CSS.supports('color', `hsl(${value})`);
    if (!isColor || !SAFE_VALUE.test(value) || value.includes('/*')) {
      e.target.setCustomValidity('Valeur CSS simple attendue (#hex, oklch(), hsl()…)');
      return;
    }
    e.target.setCustomValidity('');
    draftTheme[draftTheme.mode][k] = value;
    if (e.target.dataset.pick) $(`[data-value="${k}"]`).value = value;
    else $(`[data-pick="${k}"]`).value = toHex(value);
    push();
  });
  $('#t-radius').addEventListener('input', () => {
    if (SAFE_VALUE.test($('#t-radius').value)) {
      draftTheme.radius = $('#t-radius').value.trim();
      push();
    }
  });
  $('#t-name').addEventListener('input', () => {
    draftTheme.name = $('#t-name').value;
  });
  $('#t-base').addEventListener('change', async () => {
    await applyBase($('#t-base').value);
    $('#t-name').value = draftTheme.name;
    $('#t-radius').value = draftTheme.radius;
    grid();
    push();
  });
  for (const b of $$('#theme-form [data-mode]'))
    b.onclick = () => {
      draftTheme.mode = b.dataset.mode;
      for (const x of $$('#theme-form [data-mode]')) x.setAttribute('aria-pressed', String(x === b));
      grid();
      push();
    };
  $('#theme-form').onsubmit = async (e) => {
    e.preventDefault();
    const body = {
      name: $('#t-name').value.trim(),
      light: draftTheme.light,
      dark: draftTheme.dark,
      radius: draftTheme.radius,
      ...(draftTheme.base ? { base: draftTheme.base } : {}),
    };
    if (!(await saveTheme(body))) return;
    if (seed) palette.clear();
    $('#detail').close();
  };
}

/** true une fois le thème enregistré et choisi pour la spec. */
async function saveTheme(body) {
  const send = (overwrite) => api('/api/themes', { method: 'POST', body: { theme: body, overwrite } });
  try {
    let result;
    try {
      result = await send(false);
    } catch (error) {
      if (error.status !== 409) throw error;
      if (!confirm(`${error.message}. Le remplacer ? Les specs qui l’utilisent prendront les nouvelles couleurs.`)) return false;
      result = await send(true);
    }
    // Remplacé : loadRegistry garderait sinon les anciennes couleurs en mémoire.
    const stale = byId.get(result.id);
    if (stale) stale._colors = undefined;
    await loadRegistry();
    spec.theme = result.id;
    persist();
    renderSpec();
    render();
    if ($('#f-skin').checked) previews.reload();
    toast(`Thème « ${body.name} » enregistré et choisi pour la spec.`);
    return true;
  } catch (error) {
    toast(error.status ? error.message : 'Le serveur ne répond pas. Relancez « npm start ».');
    return false;
  }
}

/** Un nom libre : une palette neuve ne doit pas remplacer un thème perso existant. */
function newPaletteName() {
  const base = `Palette ${shownTitle() || spec.name || 'perso'}`.slice(0, 40).trim();
  let name = base;
  for (let n = 2; byId.has(`perso/${slugify(name)}`); n++) name = `${base} ${n}`;
  return name;
}

palette = setupPalette({
  async initial() {
    const theme = byId.get(spec.theme);
    const mine = theme?.sourceId === 'perso';
    const tokens = theme ? await themeTokens(theme.id) : null;
    const colors = mine && tokens ? paletteList(tokens.colors) : null;
    const radius = tokens?.radius?.['--radius'];
    return {
      colors,
      tuned: mine && !colors,
      radius: SAFE_VALUE.test(radius ?? '') ? radius : '',
      name: colors ? theme.name : newPaletteName(),
    };
  },
  save: ({ radius, ...colors }) => saveTheme(radius ? { ...colors, radius } : colors),
  fineTune: (seed) => showThemeEditor(spec.theme, seed),
  onChange: () => {
    // Le premier rendu a lieu pendant la création du bloc.
    if (palette) refresh();
  },
});

/* ---------- Détail : aperçu, métadonnées, code, installation ---------- */

function openDialog(html, mode = 'detail') {
  const dialog = $('#detail');
  dialog.dataset.kind = mode;
  $('#detail-body').innerHTML = html;
  for (const b of $$('[data-close]', dialog)) b.onclick = () => dialog.close();
  if (!dialog.open) dialog.showModal();
}
setupDialog($('#detail'), () => {
  if (location.hash.startsWith('#item=')) history.replaceState(null, '', `#step=${step}`);
});

function equivalents(i) {
  if (!i.group) return [];
  return items
    .filter((x) => x.group === i.group && x.id !== i.id && x.interactive)
    .sort((a, b) => a.source.localeCompare(b.source))
    .slice(0, 8);
}

/* ---------- Fiche d'un template ---------- */

/** Page de la démo (titre déclaré) où une section a été capturée : sert au filtre et aux groupes. */
const sectionGroup = (s, t) => t.pages?.find((p) => p.path === s.fromTemplate?.page)?.title || '';

/** Carte d'une section : capture (s'agrandit dans la fiche), nom, code, ajout à la spec. */
function sectionCard(s, view) {
  const ratio = s.shot ? s.shot.height / s.shot.width : 0;
  // Barre très fine (navigation) : vignette recadrée à gauche, lisible. Capture haute : coupée, avec un fondu.
  const shape = ratio && ratio < 1 / 7 ? ' wide' : ratio > 1.3 ? ' tall' : '';
  const visual = s.shot
    ? `<button class="section-img${shape}" data-view="${view}" aria-label="Agrandir la capture : ${esc(s.name)}"><img src="${esc(s.shot.url)}" alt="" width="${s.shot.width}" height="${s.shot.height}" loading="lazy" decoding="async"><span class="shot-zoom" aria-hidden="true">${icon('expand')}</span></button>`
    : `<div class="section-img placeholder">${icon('code')}Pas de capture</div>`;
  return `<figure class="section-shot${inSpec(s.id) ? ' in-spec' : ''}" data-card="${esc(s.id)}">${visual}
    <figcaption><span class="section-name"><strong>${esc(s.name)}</strong><small>${esc(s.category)}${s.type === 'screen' ? ' · écran' : ''}</small></span>
    <span class="section-actions"><button class="btn icon-only ghost small" data-detail="${esc(s.id)}" aria-label="Code : ${esc(s.name)}" title="Code">${icon('code')}</button><button class="btn small add" data-toggle="${esc(s.id)}" aria-pressed="${inSpec(s.id)}">${actionLabel(s)}</button></span></figcaption></figure>`;
}

/** Sections du template, filtrables par page de la démo ; chaque capture rejoint la visionneuse (`views`). */
function templateSections(i, t, views) {
  const list = (i.sections || []).map((id) => byId.get(id)).filter(Boolean);
  if (!list.length)
    return `<section class="tpl-section" aria-labelledby="tpl-sections"><div class="tpl-bar"><h3 id="tpl-sections">Sections</h3></div>
      <p class="tpl-empty">${t.demo ? 'Sections pas encore capturées : <code>npm run capture:templates</code>.' : 'Pas de sections : ce template n’a pas de démo en ligne fidèle à son code. Son code complet reste disponible plus bas et par <code>scaffold</code>.'}</p></section>`;
  const groups = new Map();
  for (const s of list) groups.set(sectionGroup(s, t), [...(groups.get(sectionGroup(s, t)) || []), s]);
  const several = groups.size > 1;
  const card = (s) => {
    if (!s.shot) return sectionCard(s, -1);
    views.push({ url: s.shot.url, title: s.name, sub: `${s.category}${s.type === 'screen' ? ' · écran' : ''}`, id: s.id });
    return sectionCard(s, views.length - 1);
  };
  return `<section class="tpl-section" aria-labelledby="tpl-sections">
    <div class="tpl-bar"><h3 id="tpl-sections">Sections <span class="count">${list.length}</span></h3>
      ${several ? `<div class="tpl-filter" role="group" aria-label="Filtrer les sections par page"><button class="chip" data-filter="*" aria-pressed="true">Toutes <small>${list.length}</small></button>${[...groups].map(([label, items]) => `<button class="chip" data-filter="${esc(label)}" aria-pressed="false">${esc(label || 'Autres')} <small>${items.length}</small></button>`).join('')}</div>` : ''}</div>
    <p class="help tpl-lead">Captures de la démo officielle, vérifiées contre le code. Une section ajoutée apporte son code, ses imports et la feuille de styles du template.</p>
    ${[...groups].map(([label, items]) => `<div class="section-group-block" data-group="${esc(label)}">${several ? `<h4 class="section-group">${esc(label || 'Autres')} <span class="count">${items.length}</span></h4>` : ''}<div class="section-shots">${items.map(card).join('')}</div></div>`).join('')}
  </section>`;
}

/** Pages capturées sur la démo, en bande défilante ; elles s'ouvrent aussi dans la visionneuse. */
function templatePages(shots, views) {
  if (!shots.length) return '';
  const cards = shots.map((s) => {
    views.push({ url: s.url, title: s.title, sub: s.path });
    return `<figure class="page-card${s.viewport === 'mobile' ? ' mobile' : ''}"><button class="section-img" data-view="${views.length - 1}" aria-label="Agrandir la page : ${esc(s.title)}"><img src="${esc(s.url)}" alt="" loading="lazy" decoding="async"><span class="shot-zoom" aria-hidden="true">${icon('expand')}</span></button><figcaption><strong>${esc(s.title)}</strong><small>${esc(s.path)}</small></figcaption></figure>`;
  });
  return `<section class="tpl-section" aria-labelledby="tpl-pages"><div class="tpl-bar"><h3 id="tpl-pages">Pages <span class="count">${shots.length}</span></h3></div>
    <div class="page-strip">${cards.join('')}</div></section>`;
}

/** Panneau latéral : action principale, commande de démarrage, faits, variables, licence, liens. */
function templateAside(i, meta, t) {
  const demo = safeHttps(t.demo || ''),
    repo = safeHttps(meta.sourceUrl);
  const env = t.env || [];
  const envChips = (list) => list.map((v) => `<li><code>${esc(v)}</code></li>`).join('');
  return `<aside class="tpl-aside" aria-label="Démarrer avec ce template">
    <div class="tpl-cta-block"><button class="btn primary tpl-cta" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}" ${locked(i) ? 'disabled' : ''}>${actionLabel(i)}</button>
      <p class="help">Base de la spec : Claude Code part de ce template et y intègre les blocs.</p></div>
    <div class="tpl-block"><h3>Démarrer</h3>
      <div class="command-line"><code><span>npm run scaffold --</span> <span>${esc(i.id)}</span> <span>--out ../mon-projet</span></code><button class="btn icon-only ghost small" id="copy-scaffold" aria-label="Copier la commande" title="Copier">${icon('copy')}</button></div>
      <p class="help">Puis <code>${esc(t.install || 'npm install')}</code> et <code>${esc(t.dev || 'npm run dev')}</code> dans le dossier créé.</p></div>
    <dl class="tpl-facts">
      <div><dt>Licence</dt><dd><span class="lic ${meta.licenseStatus}">${esc(meta.license)}</span></dd></div>
      <div><dt>Sections</dt><dd>${(i.sections || []).length || '—'}</dd></div>
      <div><dt>Pages capturées</dt><dd>${(i.screens || []).filter((x) => x.viewport !== 'full').length || '—'}</dd></div>
      <div><dt>Fichiers</dt><dd>${meta.files.length}${t.skipped?.length ? ` <span class="faint">+ ${t.skipped.length} non repris</span>` : ''}</dd></div>
      <div><dt>Gestionnaire</dt><dd>${esc((t.install || 'npm install').split(' ')[0])}</dd></div>
    </dl>
    ${env.length ? `<div class="tpl-block"><h3>Variables d’environnement <span class="count">${env.length}</span></h3><ul class="env-list">${envChips(env.slice(0, 6))}</ul>${env.length > 6 ? `<details class="env-more"><summary>${env.length - 6} autres</summary><ul class="env-list">${envChips(env.slice(6))}</ul></details>` : ''}</div>` : ''}
    ${meta.attribution ? `<p class="help tpl-credit">${esc(meta.attribution)}</p>` : ''}
    ${demo || repo ? `<div class="tpl-links">${demo ? `<a class="btn small" href="${esc(demo)}" target="_blank" rel="noopener noreferrer">${icon('external')}Démo officielle</a>` : ''}${repo ? `<a class="btn small" href="${esc(repo)}" target="_blank" rel="noopener noreferrer">${icon('external')}Dépôt</a>` : ''}</div>` : ''}
  </aside>`;
}

/** Détail d'un template : en-tête, sections et pages à gauche, panneau de démarrage à droite, visionneuse. */
function templateDetail(i, meta, views) {
  const t = meta.template || {};
  const stack = (t.stack || '').split(/,\s*/).filter(Boolean);
  const readme = meta.files.filter((f) => /(^|\/)(README\.md|package\.json)$/.test(f.path));
  const sections = templateSections(i, t, views);
  const firstPage = views.length;
  const screens = (i.screens || []).filter((x) => x.viewport !== 'full');
  const pages = templatePages(screens, views);
  const full = (i.screens || []).find((x) => x.viewport === 'full');
  const demo = safeHttps(t.demo || '');
  const host = demo ? new URL(demo).host : '';
  let cover = '';
  if (full) {
    // Page d'accueil entière : cadre de navigateur qui fait défiler tout le site au survol.
    views.push({
      url: full.url,
      title: full.title,
      sub: host ? host + (full.path === '/' ? '' : full.path) : 'Reconstituée à partir des sections capturées',
    });
    cover = `<button class="tpl-cover full" data-view="${views.length - 1}" data-ratio="${full.width && full.height ? (full.height / full.width).toFixed(3) : ''}" aria-label="Voir la page entière : ${esc(full.title)}">
      <span class="cover-bar" aria-hidden="true"><span class="cover-dots"><span></span><span></span><span></span></span><span class="cover-host">${esc(host || 'sections assemblées')}</span></span>
      <span class="cover-window"><img src="${esc(full.url)}" alt="" decoding="async"></span>
      <span class="shot-zoom" aria-hidden="true">${icon('expand')}</span></button>`;
  } else {
    // Sans page entière : la première page capturée, sinon la première section assez haute (pas une barre).
    const k = screens.length ? firstPage : views.findIndex((v) => v.id && byId.get(v.id)?.shot?.height >= 300);
    if (views[k])
      cover = `<button class="tpl-cover section-img" data-view="${k}" aria-label="Agrandir : ${esc(views[k].title)}"><img src="${esc(views[k].url)}" alt="" decoding="async"><span class="shot-zoom" aria-hidden="true">${icon('expand')}</span></button>`;
  }
  return `<div class="tpl">
    <header class="tpl-head${cover ? ' has-cover' : ''}">
      <div class="tpl-intro">
        <h2 id="detail-title">${esc(i.name)}</h2>
        ${meta.description ? `<p class="tpl-summary">${esc(meta.description)}</p>` : ''}
        <ul class="tpl-tags" aria-label="Nature et technologies"><li class="kind">${esc(t.kind || i.category)}</li>${stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
      ${cover}
    </header>
    <div class="tpl-layout">
      <div class="tpl-main">
        ${sections}
        ${pages}
        <section class="tpl-section tpl-files" aria-labelledby="tpl-files"><div class="tpl-bar"><h3 id="tpl-files">Fichiers <span class="count">${meta.files.length}</span></h3></div>
          <details><summary>${icon('folder')}Arborescence</summary><pre class="code"><code>${esc(meta.files.map((f) => f.path).join('\n'))}</code></pre></details>
          ${readme.map((f) => `<details><summary>${icon('code')}${esc(f.path)}</summary><pre class="code"><code>${esc(f.content)}</code></pre></details>`).join('')}
        </section>
      </div>
      ${templateAside(i, meta, t)}
    </div>
    <div class="shot-viewer" hidden>
      <div class="viewer-bar">
        <div class="viewer-title"><strong class="viewer-name"></strong><small class="viewer-sub"></small></div>
        <div class="viewer-actions">
          <button class="btn icon-only ghost viewer-prev" data-viewer="-1" aria-label="Capture précédente" title="Précédente (←)">${icon('arrow')}</button>
          <span class="viewer-pos count" aria-live="polite"></span>
          <button class="btn icon-only ghost" data-viewer="1" aria-label="Capture suivante" title="Suivante (→)">${icon('arrow')}</button>
          <button class="btn small ghost viewer-code" data-detail="" hidden>${icon('code')}Code</button>
          <button class="btn small viewer-add" data-toggle="" hidden></button>
          <button class="btn icon-only ghost" data-viewer="close" aria-label="Fermer la capture" title="Fermer (Échap)">${icon('x')}</button>
        </div>
      </div>
      <div class="viewer-stage" tabindex="-1"></div>
    </div>
  </div>`;
}

/** Visionneuse de la fiche ouverte (Échap la ferme avant la fenêtre). */
let templateViewer = null;

/** Comportements de la fiche : filtre par page, visionneuse (flèches, Échap), copie de la commande. */
function bindTemplateDetail(root, i, views) {
  const viewer = $('.shot-viewer', root),
    stage = $('.viewer-stage', viewer),
    img = document.createElement('img'), // ajoutée à l'ouverture, retirée à la fermeture
    layout = $('.tpl-layout', root),
    head = $('.tpl-head', root);
  let current = -1,
    opener = null;
  /** Captures visibles (filtre appliqué) du bloc de la capture affichée : sections ou pages, dans l'ordre de la fiche. */
  const order = () => {
    const button = $(`[data-view="${current}"]`, layout);
    const scope = button ? (button.closest('.tpl-section') ?? layout) : head;
    return $$('[data-view]', scope)
      .filter((b) => !b.closest('[hidden]'))
      .map((b) => Number(b.dataset.view));
  };
  const show = (k) => {
    const v = views[k];
    if (!v) return;
    current = k;
    img.classList.add('loading');
    img.onload = () => img.classList.remove('loading');
    img.src = v.url;
    if (!img.isConnected) stage.append(img);
    img.alt = `Capture : ${v.title}`;
    $('.viewer-name', viewer).textContent = v.title;
    $('.viewer-sub', viewer).textContent = v.sub;
    const seq = order(),
      pos = seq.indexOf(k);
    $('.viewer-pos', viewer).textContent = `${pos + 1} / ${seq.length}`;
    $('[data-viewer="-1"]', viewer).disabled = pos <= 0;
    $('[data-viewer="1"]', viewer).disabled = pos >= seq.length - 1;
    const code = $('.viewer-code', viewer),
      add = $('.viewer-add', viewer);
    code.hidden = add.hidden = !v.id;
    code.dataset.detail = v.id || '';
    add.dataset.toggle = v.id || '';
    if (v.id) {
      add.innerHTML = actionLabel(byId.get(v.id));
      add.setAttribute('aria-pressed', String(inSpec(v.id)));
    }
    stage.scrollTo(0, 0);
  };
  const step = (dir) => {
    const seq = order(),
      next = seq[seq.indexOf(current) + dir];
    if (next !== undefined) show(next);
  };
  const close = () => {
    viewer.hidden = true;
    layout.inert = head.inert = false;
    img.remove();
    img.removeAttribute('src');
    opener?.focus();
  };
  root.addEventListener('click', (e) => {
    const view = e.target.closest('[data-view]');
    if (view) {
      opener = view;
      viewer.hidden = false;
      layout.inert = head.inert = true; // la fiche derrière n'est plus atteignable au clavier
      show(Number(view.dataset.view));
      stage.focus({ preventScroll: true });
      return;
    }
    const nav = e.target.closest('[data-viewer]');
    if (nav) return nav.dataset.viewer === 'close' ? close() : step(Number(nav.dataset.viewer));
    const filter = e.target.closest('[data-filter]');
    if (filter) {
      for (const b of $$('[data-filter]', root)) b.setAttribute('aria-pressed', String(b === filter));
      for (const g of $$('.section-group-block', root))
        g.hidden = filter.dataset.filter !== '*' && g.dataset.group !== filter.dataset.filter;
    }
  });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  $('#copy-scaffold', root)?.addEventListener('click', async () =>
    toast((await copyText(`npm run scaffold -- ${i.id} --out ../mon-projet`)) ? 'Commande copiée.' : 'Copie impossible.'),
  );
  const full = $('.tpl-cover.full', root);
  if (full?.dataset.ratio)
    full.style.setProperty('--scroll-time', `${Math.min(14, Math.max(2.5, Number(full.dataset.ratio) * 1.7)).toFixed(1)}s`);
  templateViewer = { isOpen: () => viewer.isConnected && !viewer.hidden, close };
}
$('#detail').addEventListener('cancel', (e) => {
  if (!templateViewer?.isOpen()) return;
  e.preventDefault();
  templateViewer.close();
});

async function showDetail(id) {
  const i = byId.get(id);
  if (!i) return;
  openDialog('<p class="help">Chargement…</p>', i.type === 'template' ? 'template' : 'detail');
  let meta;
  try {
    meta = await api(`/api/registry/item?id=${encodeURIComponent(id)}`);
  } catch {
    $('#detail-body').innerHTML = '<p>Impossible de lire cet item.</p>';
    return;
  }
  if (i.type === 'template') {
    const views = [];
    $('#detail-body').innerHTML = templateDetail(i, meta, views);
    bindTemplateDetail($('#detail-body .tpl'), i, views);
    return;
  }
  const deps = meta.dependencies.length ? `<code>npm install ${esc(meta.dependencies.join(' '))}</code>` : 'Aucun';
  const source = safeHttps(meta.sourceUrl);
  const installable = ['component', 'section', 'screen', 'lib'].includes(i.type) && i.framework === 'react';
  const shadcnAdd = `npx shadcn@latest add ${location.origin}/r/${i.id}.json`;
  const same = equivalents(i);
  $('#detail-body').innerHTML = `
    <h2 id="detail-title">${esc(i.name)}</h2>
    <p class="detail-meta">${esc(TYPE_LABEL[i.type])} · ${esc(i.category)} · ${esc(i.source)} · <code>${esc(i.id)}</code>${i.isNew ? ' · <span class="new-tag">Nouveau</span>' : ''}</p>
    <div class="detail-grid">
      <div class="detail-visual">${i.interactive && (!STYLE_TYPES.has(i.type) || i.type === 'sound') ? `<div class="visual detail-zone ${i.preview.kind === 'atlas-demo' ? 'stage' : $('#f-light').checked ? 'light' : ''}" data-preview="${esc(i.id)}"></div>` : `<div class="visual">${staticVisual({ ...i, _colors: meta.tokens?.colors?.light || i._colors, _easings: meta.easings || i._easings })}</div>`}</div>
      <dl class="facts">
        <dt>Description</dt><dd>${esc(i.descriptionFr || meta.description || '—')}${i.descriptionFr && meta.description ? `<br><span class="help">${esc(meta.description)}</span>` : ''}</dd>
        ${i.fromTemplate ? `<dt>Template</dt><dd><button class="btn small ghost back-template" data-detail="${esc(i.fromTemplate.id)}">${icon('layers')}${esc(byId.get(i.fromTemplate.id)?.name || i.fromTemplate.id)} : toutes ses sections</button></dd>` : ''}
        ${i.fromTemplate?.publicAssets?.length ? `<dt>Images du dossier public/</dt><dd>${i.fromTemplate.publicAssets.map((a) => `<code>${esc(a)}</code>`).join(' ')}<br><span class="help">Référencées par le code, non incluses : à reprendre du template (scaffold).</span></dd>` : ''}
        ${i.usages?.length ? `<dt>Cas d’usage</dt><dd>${i.usages.map(esc).join(' · ')}</dd>` : ''}
        <dt>Licence</dt><dd><span class="lic ${meta.licenseStatus}">${esc(meta.license)}</span>${meta.licenseNotes ? `<br><span class="help">${esc(meta.licenseNotes)}</span>` : ''}</dd>
        ${meta.attribution ? `<dt>Attribution</dt><dd>${esc(meta.attribution)}</dd>` : ''}
        <dt>Cibles</dt><dd>${i.platforms.map((p) => (p === 'web' ? 'Web' : 'App mobile')).join(', ') || 'Aucune : dépend d’Uniwind, hors stack'}</dd>
        <dt>Paquets npm</dt><dd>${deps}</dd>
        ${meta.registryDependencies.length ? `<dt>Dépendances du registre</dt><dd>${meta.registryDependencies.map((d) => `<code>${esc(d)}</code>`).join(' ')}</dd>` : ''}
        ${meta.font ? `<dt>Styles</dt><dd>${esc(meta.font.styles.map((s) => s.name).join(', '))}</dd><dt>CSS</dt><dd><code>${esc(meta.font.cssUrl)}</code></dd>` : ''}
        ${installable ? `<dt>Installer dans un projet shadcn</dt><dd><div class="command-line"><code>${esc(shadcnAdd)}</code><button class="btn icon-only ghost small" id="copy-shadcn" aria-label="Copier la commande shadcn">${icon('copy')}</button></div><span class="help">Le serveur Atlas doit tourner ; imports réécrits sur <code>@/</code>.</span></dd>` : ''}
        <dt>Source</dt><dd>${source ? `<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(meta.source)} ${icon('external')}</a>` : esc(meta.source)}</dd>
        <dt>Importé</dt><dd>${esc(meta.importedAt?.slice(0, 10) || '—')}${meta.updatedAt ? ` · mis à jour le ${esc(meta.updatedAt.slice(0, 10))}` : ''}</dd>
        <dd class="facts-actions"><button class="btn primary" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}" ${locked(i) ? 'disabled' : ''}>${actionLabel(i)}</button>${i.sourceId === 'perso' ? `<button class="btn ghost" id="delete-theme">${icon('trash')}Supprimer ce thème</button>` : ''}${i.type === 'theme' ? `<button class="btn ghost" id="derive-theme">${icon('palette')}Créer un thème à partir de celui-ci</button>` : ''}</dd>
      </dl>
    </div>
    ${same.length ? `<section class="equivalents"><h3>${icon('columns')}Équivalents dans d’autres bibliothèques <span class="count">${same.length}</span></h3><div class="eq-grid">${same.map((x) => `<button class="eq" data-detail="${esc(x.id)}"><strong>${esc(x.name)}</strong><small>${esc(x.source)}${inSpec(x.id) ? ' · dans la spec' : ''}</small></button>`).join('')}</div></section>` : ''}
    <div class="files"><h3>Fichiers (${meta.files.length})</h3>${meta.files.map((f, k) => `<details ${k === 0 ? 'open' : ''}><summary>${esc(f.path)} · ${esc(f.role)}${f.target ? ` → ${esc(f.target)}` : ''}</summary><pre class="code"><code>${esc(f.content)}</code></pre></details>`).join('') || '<p class="help">Métadonnées seules.</p>'}</div>`;
  hydrateVisuals($('#detail-body'));
  const zone = $('#detail-body .detail-zone');
  if (zone) previews.mount(zone);
  if (installable)
    $('#copy-shadcn').onclick = async () => toast((await copyText(shadcnAdd)) ? 'Commande shadcn copiée.' : 'Copie impossible.');
  $('#derive-theme')?.addEventListener('click', () => showThemeEditor(i.id));
  $('#delete-theme')?.addEventListener('click', async () => {
    if (!confirm(`Supprimer le thème personnel « ${i.name} » ?`)) return;
    try {
      await api(`/api/themes/${i.id}`, { method: 'DELETE' });
      if (spec.theme === i.id) {
        spec.theme = null;
        persist();
      }
      await loadRegistry();
      renderSpec();
      render();
      $('#detail').close();
      toast('Thème supprimé.');
    } catch (error) {
      toast(error.message);
    }
  });
}

/* ---------- Événements ---------- */

document.body.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.toggle) {
    toggle(b.dataset.toggle);
    if (b.closest('#detail') && b.isConnected) {
      b.innerHTML = actionLabel(byId.get(b.dataset.toggle));
      b.setAttribute('aria-pressed', String(inSpec(b.dataset.toggle)));
    }
  } else if (b.dataset.detail) showDetail(b.dataset.detail);
  else if (b.dataset.step) goTo(b.dataset.step);
  else if (b.dataset.fix !== undefined) fix(currentIssues[Number(b.dataset.fix)]);
  else if (b.dataset.start) {
    const at = b.dataset.start.indexOf(':');
    openSpec(b.dataset.start.slice(0, at), b.dataset.start.slice(at + 1));
  } else if (b.dataset.template !== undefined) {
    if (isMobile()) return;
    spec.template = b.dataset.template || null;
    persist();
    renderSpec();
    syncCards();
  } else if (b.dataset.layout) {
    const [key, value] = b.dataset.layout.split(':');
    spec.mobile.layouts[key] = value;
    persist();
  } else if (b.dataset.open !== undefined) {
    const id = spec.blocks[Number(b.dataset.open)].id;
    const open = b.getAttribute('aria-expanded') !== 'true';
    if (open) openBlocks.add(id);
    else openBlocks.delete(id);
    b.setAttribute('aria-expanded', String(open));
    const fields = $('.block-fields', b.closest('.block'));
    fields.hidden = !open;
    if (open) $('textarea', fields).focus();
  } else if (b.dataset.q) {
    const q = $('#q');
    q.value = q.value === b.dataset.q ? '' : b.dataset.q;
    visible = PAGE;
    render();
  } else if (b.dataset.move !== undefined) move(Number(b.dataset.move), Number(b.dataset.move) + Number(b.dataset.dir));
  else if (b.dataset.remove !== undefined) {
    const before = structuredClone(spec);
    const [removed] = spec.blocks.splice(Number(b.dataset.remove), 1);
    persist();
    renderSpec();
    syncCards();
    withUndo(`${byId.get(removed.id)?.name ?? removed.id} retiré.`, before);
  } else if (b.dataset.type !== undefined) showType(b.dataset.type);
});

// Erreur montrée au champ dès qu'on le quitte ; avant, seulement après une tentative d'enregistrement.
document.body.addEventListener('change', (e) => {
  const el = e.target;
  const field = el.dataset?.m ? `[data-m="${el.dataset.m}"]` : el.id?.startsWith('s-') ? `#${el.id}` : '';
  if (!field) return;
  touched.add(field);
  refresh();
});
// L'aperçu suit l'écran d'onboarding en cours d'édition.
document.body.addEventListener('focusin', (e) => {
  const m = e.target.dataset?.m?.match(/^(slides|questions)\.(\d+)\./);
  if (!m || !spec.mobile) return;
  slideIndex = Number(m[2]) + (m[1] === 'questions' ? spec.mobile.slides.length : 0);
  refresh();
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!e.repeat && !$('#detail').open) save();
  } else if (e.key === 'Escape' && document.body.classList.contains('rail-open') && !$('#detail').open) {
    setRail(false);
    $('#jump-spec').focus();
  }
});
window.addEventListener('popstate', () => {
  const next = new URLSearchParams(location.hash.slice(1)).get('step');
  if (next && next !== step) showStep(next);
});
$('#prev-step').onclick = () => {
  const steps = stepsFor(spec.target);
  goTo(steps[steps.indexOf(step) - 1]);
};
$('#next-step').onclick = () => {
  const steps = stepsFor(spec.target);
  goTo(steps[steps.indexOf(step) + 1]);
};
$('#jump-spec').onclick = () => {
  const open = !document.body.classList.contains('rail-open');
  setRail(open);
  if (open) $('#load-spec').focus({ preventScroll: true });
};
$('#filters-toggle').onclick = () => {
  const panel = $('#more-filters');
  panel.hidden = !panel.hidden;
  $('#filters-toggle').setAttribute('aria-expanded', String(!panel.hidden));
};
$('#copy-mcp').onclick = async () =>
  toast((await copyText($('#mcp-add').textContent)) ? 'Commande copiée.' : 'Copie impossible : sélectionnez la commande.');

for (const id of [...FILTERS, '#f-sort'])
  $(id).addEventListener('input', () => {
    visible = PAGE;
    render();
  });
for (const id of ['#f-light', '#f-skin'])
  $(id).addEventListener('change', () => {
    render();
  });
$('#more').onclick = () => {
  visible += PAGE;
  render();
};
$('#reset').onclick = () => {
  for (const id of FILTERS) $(id).value = '';
  typeFilter = step === 'style' ? typeFilter : '';
  onlyNew = false;
  visible = PAGE;
  render();
};
$('#autoplay').onclick = () => {
  previews.setAutoplay(!previews.autoplay);
  syncAutoplay();
};
function syncAutoplay() {
  $('#autoplay').setAttribute('aria-pressed', String(previews.autoplay));
  $('#autoplay span').textContent = previews.autoplay ? 'Animations auto' : 'Animer au survol';
  $('#autoplay use').setAttribute('href', `/icons.svg#${previews.autoplay ? 'pause' : 'play'}`);
  $('#autoplay').title = previews.autoplay
    ? 'Les aperçus visibles s’animent seuls. Cliquer pour ne les animer qu’au survol.'
    : 'Les aperçus s’animent au survol ou au toucher. Cliquer pour les animer tous.';
}

/* ---------- Démarrage ---------- */

async function loadRegistry() {
  const data = await api('/api/registry');
  previewsBuilt = data.previewsBuilt;
  sources = data.sources || {};
  const behind = data.updates?.behind ?? [];
  $('#updates').hidden = !behind.length;
  if (behind.length)
    $('#updates').textContent =
      `${plural(behind.length, 'source a', 'sources ont')} publié depuis le dernier import (${behind.join(', ')}) : lancez « npm run update ».`;
  const all = hydrateLicenses(data.items, sources).map((i) => ({
    ...i,
    _hay: norm(
      [
        i.id,
        i.name,
        i.description,
        i.descriptionFr,
        i.category,
        i.type,
        TYPE_LABEL[i.type],
        i.source,
        i.framework,
        ...(i.tags || []),
        ...(i.keywords || []),
      ].join(' '),
    ),
  }));
  const previous = byId;
  byId = new Map(all.map((i) => [i.id, i]));
  for (const i of all) {
    const old = previous.get(i.id);
    if (old?._colors) {
      i._colors = old._colors;
      i._easings = old._easings;
      i._radius = old._radius;
    }
  }
  // Galerie web : ce qui est interactif, plus thèmes, polices, mouvement et sons. Le reste du registre reste accessible au MCP.
  const webShown = (i) => STYLE_TYPES.has(i.type) || i.type === 'template' || (i.interactive && i.type !== 'lib');
  const order = (list) =>
    Object.keys(RANK).flatMap((t) =>
      interleave(
        list.filter((i) => i.type === t).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        (i) => i.sourceId,
      ),
    );
  // Galerie mobile : le natif (sans aperçu) d'abord, puis la galerie web grisée, rien n'est masqué.
  const mobileShown = all.filter((i) => webShown(i) || (i.framework === 'react-native' && i.type !== 'lib'));
  galleries = {
    web: ownFirst(order(all.filter((i) => webShown(i) && supports(i, 'web')))),
    mobile: [
      ...palettesFirst(order(mobileShown.filter((i) => supports(i, 'mobile')))),
      ...order(mobileShown.filter((i) => !supports(i, 'mobile'))),
    ],
  };
  items = galleries[spec.target];
  shownTarget = spec.target;
  await Promise.all(
    mobileShown
      .filter((i) => (i.type === 'theme' || i.type === 'easing') && !i._colors && !i._easings)
      .map(async (i) => {
        try {
          const m = await api(`/api/registry/item?id=${encodeURIComponent(i.id)}`);
          i._colors = m.tokens?.colors?.light || {};
          i._radius = m.tokens?.radius?.['--radius'];
          i._easings = m.easings || [];
        } catch {
          /* vignette simplifiée */
        }
      }),
  );
  buildFilters();
}

function buildFilters() {
  const scope = items.filter((i) => STEP_TYPES[step]?.includes(i.type));
  // Au style, les catégories et sources suivent l'onglet ouvert.
  const listed = step === 'style' ? scope.filter((i) => i.type === typeFilter) : scope;
  const count = (f, list = listed) =>
    [
      ...list.reduce((m, i) => {
        for (const k of [].concat(f(i))) m.set(k, (m.get(k) || 0) + 1);
        return m;
      }, new Map()),
    ].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'fr'));
  const keep = (id) => $(id).value;
  const [cat, tag, src] = [keep('#f-category'), keep('#f-tag'), keep('#f-source')];
  $('#f-category').innerHTML =
    '<option value="">Toutes les catégories</option>' +
    count((i) => i.category)
      .map(([k, n]) => `<option value="${esc(k)}">${esc(k)} (${n})</option>`)
      .join('');
  $('#f-tag').innerHTML =
    '<option value="">Tous les tags</option>' +
    count((i) => i.tags || [])
      .filter(([, n]) => n > 1)
      .map(([k, n]) => `<option value="${esc(k)}">${esc(k)} (${n})</option>`)
      .join('');
  const names = new Map(listed.map((i) => [i.sourceId, i.source + (i.sourceId === 'panelui-web' ? ' (web)' : '')]));
  $('#f-source').innerHTML =
    '<option value="">Toutes les sources</option>' +
    [...names]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`)
      .join('');
  for (const [id, value] of [
    ['#f-category', cat],
    ['#f-tag', tag],
    ['#f-source', src],
  ])
    $(id).value = [...$(id).options].some((o) => o.value === value) ? value : '';
  const blocksStep = step === 'blocks';
  const types = count((i) => i.type, scope);
  const fresh = scope.filter((i) => i.isNew).length;
  $('#types').innerHTML = blocksStep
    ? TYPES.filter(([t]) => !t || types.some(([k]) => k === t))
        .map(
          ([t, label]) =>
            `<button class="chip" data-type="${t}" aria-pressed="${t === typeFilter}">${label} <small>${t ? types.find(([k]) => k === t)?.[1] || 0 : scope.length}</small></button>`,
        )
        .join('') +
      (fresh
        ? `<button class="chip new-chip" id="only-new" aria-pressed="${onlyNew}">${icon('sparkle')}Nouveautés <small>${fresh}</small></button>`
        : '')
    : '';
  $('#suggestions').innerHTML = blocksStep
    ? SUGGESTIONS[spec.target].map(([label, q]) => `<button class="chip" data-q="${q}" aria-pressed="false">${label}</button>`).join('')
    : '';
  $('#q').placeholder = blocksStep
    ? 'Rechercher un bloc : bouton, graphique, sidebar, tarifs…'
    : `Rechercher : ${{ theme: 'nom de thème', font: 'nom de police', easing: 'courbe', sound: 'son' }[typeFilter] ?? 'style'}…`;
  $('#only-new')?.addEventListener('click', () => {
    onlyNew = !onlyNew;
    visible = PAGE;
    render();
  });
  $('#sounds-row').hidden = !items.some((i) => i.type === 'sound') && !spec.sounds.length;
}

/** Commande d'installation du MCP pour les autres dossiers (étape Lancer). */
async function loadMcpHelp() {
  try {
    const { mcp } = await api('/api/info');
    $('#mcp-add').textContent = `claude mcp add atlas -s user -- ${mcp.command} ${mcp.args.map((a) => `"${a}"`).join(' ')}`;
  } catch {
    $('#mcp-add').textContent = 'claude mcp add atlas -s user -- node --import tsx mcp/index.ts';
  }
}

(async function boot() {
  const hash = new URLSearchParams(location.hash.slice(1));
  try {
    setupLayoutChoices();
    renderSpec();
    await loadRegistry();
    const legacy = new Map([...byId.values()].filter((i) => i.catalogId).map((i) => [i.catalogId, i.id]));
    const moved = migrateLegacy((x) => legacy.get(x) ?? (byId.get(x)?.interactive ? x : undefined));
    if (moved) {
      spec = readDraft();
      toast(`${plural(moved, 'composant')} de l’ancienne sélection du catalogue ${moved > 1 ? 'ont' : 'a'} rejoint la spec.`);
    }
    await loadSpecList();
    const started = hasContent() || !!spec.loadedFrom;
    step = hash.get('step') || (hash.get('item') ? 'blocks' : '') || (started ? store.get(STEP_KEY, 'project') : 'project');
    if (!stepsFor(spec.target).includes(step)) step = 'project';
    history.replaceState(null, '', `#step=${step}`);
    renderSpec();
    showStep(step, { focus: false });
    syncAutoplay();
    loadMcpHelp();
    await refreshBaseline();
    if (hash.get('spec')) await openSpec('spec', hash.get('spec'));
    else if (hash.get('item') && byId.has(hash.get('item'))) showDetail(hash.get('item'));
  } catch (error) {
    console.error(error);
    const box = $('#boot-error');
    box.hidden = false;
    box.textContent = 'Registre introuvable. Lancez « npm run import » puis « npm start », et rechargez la page.';
  }
})();
