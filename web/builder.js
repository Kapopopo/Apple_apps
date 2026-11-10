/* Atlas Builder : galerie du registre + spec en cours (thème, polices, mouvement, sons, blocs ordonnés par page). */
import {
  $,
  $$,
  esc,
  icon,
  plural,
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

const PAGE = 24;
const TYPES = [
  ['', 'Tout'],
  ['component', 'Composants'],
  ['section', 'Sections'],
  ['screen', 'Écrans'],
  ['theme', 'Thèmes'],
  ['font', 'Polices'],
  ['easing', 'Mouvement'],
  ['sound', 'Sons'],
];
const RANK = { component: 0, section: 1, screen: 2, theme: 3, easing: 4, font: 5, sound: 6 };
const FILTERS = ['#q', '#f-category', '#f-tag', '#f-source', '#f-license'];

let items = [],
  byId = new Map(),
  sources = {},
  previewsBuilt = false,
  visible = PAGE,
  typeFilter = '',
  onlyNew = false,
  specs = [];
let spec = readDraft();

const persist = () => writeDraft(spec);
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

function staticVisual(i) {
  if (i.type === 'font')
    return `<div class="font-sample" data-font-css="${esc(i.font?.cssUrl || '')}" data-font="${esc(i.font?.family || i.name)}"><span class="big">Aa Gg</span><span class="line">Le vif zéphyr jubile sur les kumquats</span><span class="line">0123456789 · ${esc((i.font?.styles || []).length)} styles</span></div>`;
  if (i.type === 'theme') {
    const colors = Object.entries(i._colors || {})
      .filter(([, v]) => !/^var\(/.test(v))
      .slice(0, 12);
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
  if (i.framework === 'react-native')
    return `<div class="placeholder">${icon('device')}React Native (Expo)<br>pas de rendu web, code complet dans Claude Code</div>`;
  return `<div class="placeholder">${icon('code')}${esc(i.preview.reason || 'Pas d’aperçu web')}</div>`;
}

function visual(i, extra = '') {
  if (i.interactive && (!STYLE_TYPES.has(i.type) || i.type === 'sound'))
    return previewZone(i.id, i.name, i.thumb, extra, i.preview.kind === 'atlas-demo' ? 'stage' : $('#f-light').checked ? 'light' : '');
  return `<div class="visual">${staticVisual(i)}${extra}</div>`;
}

const loadedFonts = new Set();
const lazy = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      const css = target.dataset.fontCss;
      if (css && /^https:\/\/api\.fontshare\.com\//.test(css) && !loadedFonts.has(css)) {
        loadedFonts.add(css);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = css;
        link.referrerPolicy = 'no-referrer';
        document.head.append(link);
      }
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
  spec.fonts.includes(id) ||
  spec.easings.includes(id) ||
  spec.sounds.includes(id) ||
  spec.blocks.some((b) => b.id === id);
function actionLabel(i) {
  const yes = inSpec(i.id);
  if (i.type === 'theme') return yes ? `${icon('check')}Thème choisi` : 'Choisir ce thème';
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
  const badge = i.isNew ? '<span class="badge">Nouveau</span>' : '';
  return `<article class="card ${inSpec(i.id) ? 'in-spec' : ''}" data-card="${esc(i.id)}">
    ${visual(i, `${badge}<button class="visual-open" data-detail="${esc(i.id)}" aria-label="Détails et code : ${esc(i.name)}">${icon('expand')}</button>`)}
    <div class="card-body">
      <div class="card-meta"><span>${esc(TYPE_LABEL[i.type])}</span>·<span>${esc(i.category)}</span>·<span>${esc(i.source)}</span>${i.framework === 'react-native' ? '·<span>RN</span>' : ''}<span class="lic ${i.licenseStatus}" title="${esc(i.licenseNotes || i.license)}">${esc(shortLicense(i.license))}</span></div>
      <h3>${esc(i.name)}</h3>
      <p>${esc(i.descriptionFr || i.description || '')}</p>
      <div class="card-actions"><button class="btn small ghost" data-detail="${esc(i.id)}">${icon('code')}Code</button><button class="btn small" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}">${actionLabel(i)}</button></div>
    </div></article>`;
}

function render() {
  const rows = filtered();
  const active = FILTERS.filter((id) => $(id).value).length;
  $('#reset').hidden = !active && !typeFilter && !onlyNew;
  $('#count').textContent =
    `${plural(rows.length, 'item')}${rows.length > visible ? ` · ${visible} affichés` : ''}${previewsBuilt ? '' : ' · aperçus live non compilés (npm run previews)'}`;
  previews.reset($('#grid'));
  $('#grid').innerHTML = rows.length
    ? rows.slice(0, visible).map(card).join('')
    : '<div class="empty"><strong>Aucun item pour ces filtres.</strong><p>Essayez un autre mot (français ou anglais) ou réinitialisez les filtres.</p></div>';
  $('#more').hidden = rows.length <= visible;
  hydrateVisuals($('#grid'));
  previews.observe($('#grid'));
  for (const b of $$('#types button[data-type]')) b.setAttribute('aria-pressed', String(b.dataset.type === typeFilter));
  $('#only-new')?.setAttribute('aria-pressed', String(onlyNew));
}

function syncCards() {
  for (const el of $$('[data-card]')) el.classList.toggle('in-spec', inSpec(el.dataset.card));
  for (const b of $$('[data-toggle]')) {
    const i = byId.get(b.dataset.toggle);
    if (i && !b.closest('.token, .theme-token')) {
      b.innerHTML = actionLabel(i);
      b.setAttribute('aria-pressed', String(inSpec(i.id)));
    }
  }
}

function showType(type) {
  typeFilter = type;
  visible = PAGE;
  render();
  $('#types').scrollIntoView({ block: 'nearest' });
}

/* ---------- Spec ---------- */

function toggle(id) {
  const i = byId.get(id);
  if (!i) return;
  const flip = (list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  if (i.type === 'theme') spec.theme = spec.theme === id ? null : id;
  else if (i.type === 'font') spec.fonts = flip(spec.fonts);
  else if (i.type === 'easing') spec.easings = flip(spec.easings);
  else if (i.type === 'sound') spec.sounds = flip(spec.sounds);
  else if (spec.blocks.some((b) => b.id === id)) spec.blocks = spec.blocks.filter((b) => b.id !== id);
  else {
    spec.blocks.push({ id, note: '', ...(currentPage() ? { page: currentPage() } : {}) });
    toast(`${i.name} ajouté en position ${spec.blocks.length}${currentPage() ? ` (page ${currentPage()})` : ''}.`);
  }
  persist();
  renderSpec();
  syncCards();
  if (i.type === 'theme' && $('#f-skin').checked) previews.reload();
}

/** Page des derniers blocs ajoutés : un nouveau bloc rejoint la page en cours d'édition. */
const currentPage = () => spec.blocks.at(-1)?.page || '';
const pagesOf = () => [...new Set(spec.blocks.map((b) => b.page).filter(Boolean))];

function themeColors(id) {
  return Object.entries(byId.get(id)?._colors || {})
    .filter(([, v]) => !/^var\(/.test(v))
    .slice(0, 6);
}
const token = (id, label) =>
  `<span class="token"><span>${esc(label)}</span><button data-toggle="${esc(id)}" aria-label="Retirer ${esc(label)}">${icon('x')}</button></span>`;

function renderSpec() {
  $('#s-name').value = spec.name;
  $('#s-title').value = spec.title;
  $('#s-brief').value = spec.brief;
  $('#s-stack').value = spec.stack;
  $('#s-style').value = spec.style;
  $('#name-preview').textContent = slugify(spec.name) || 'nom';
  $('#mcp-command').textContent = command();
  $('.command').classList.toggle('saved', !!spec.loadedFrom);
  $('#spec-heading').textContent = spec.title || (spec.loadedFrom ? spec.name : 'Nouvelle spec');
  $('#spec-state').textContent = spec.loadedFrom
    ? `${savedKind() === 'preset' ? 'Preset' : 'Spec'} enregistrée : ${savedName()}`
    : 'Brouillon non enregistré';
  $('#guide').hidden = !!(spec.blocks.length || spec.theme || spec.name);
  for (const b of $$('[data-saved-only]')) b.disabled = !spec.loadedFrom;
  const theme = spec.theme && byId.get(spec.theme);
  $('#s-theme').innerHTML = theme
    ? `<span class="token theme-token"><span class="mini">${themeColors(theme.id)
        .map(([k, v]) => `<span data-color="${esc(v)}" title="${esc(k)}"></span>`)
        .join(
          '',
        )}</span><span>${esc(theme.name)}</span><button data-toggle="${esc(theme.id)}" aria-label="Retirer le thème">${icon('x')}</button></span>`
    : '<button class="ask" data-show="theme">Choisir dans la galerie</button>';
  for (const [slot, list, type] of [
    ['#s-fonts', spec.fonts, 'font'],
    ['#s-easings', spec.easings, 'easing'],
    ['#s-sounds', spec.sounds, 'sound'],
  ]) {
    $(slot).innerHTML = list.length
      ? list.map((id) => token(id, byId.get(id)?.name || id)).join('')
      : `<button class="ask" data-show="${type}">Choisir dans la galerie</button>`;
  }
  $('#s-count').textContent = spec.blocks.length;
  $('#jump-count').textContent = spec.blocks.length;
  $('#preview-page').disabled = !spec.blocks.length;
  const pages = pagesOf();
  $('#pages-list').innerHTML = pages.map((p) => `<option value="${esc(p)}">`).join('');
  let lastPage = null;
  $('#s-blocks').innerHTML = spec.blocks.length
    ? spec.blocks
        .map((b, k) => {
          const i = byId.get(b.id);
          const header =
            pages.length && (b.page || '') !== lastPage
              ? `<li class="page-break" aria-hidden="true">${icon('page')}${esc(b.page || 'Sans page')}</li>`
              : '';
          lastPage = b.page || '';
          return `${header}<li class="block" draggable="true" data-index="${k}">
      <div class="block-head"><span class="block-num">${k + 1}</span><span class="handle" aria-hidden="true">${icon('grip')}</span><span class="block-title"><strong>${esc(i?.name || b.id)}</strong><small>${esc(i ? `${TYPE_LABEL[i.type]} · ${i.source}${i.interactive ? '' : ' · sans aperçu web'}` : 'introuvable dans le registre')}</small></span>
      <span class="block-tools"><button class="btn icon-only ghost" data-move="${k}" data-dir="-1" aria-label="Monter" ${k === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="btn icon-only ghost" data-move="${k}" data-dir="1" aria-label="Descendre" ${k === spec.blocks.length - 1 ? 'disabled' : ''}>${icon('down')}</button><button class="btn icon-only ghost" data-detail="${esc(b.id)}" aria-label="Voir le code">${icon('code')}</button><button class="btn icon-only ghost" data-remove="${k}" aria-label="Retirer">${icon('x')}</button></span></div>
      <div class="block-fields"><textarea data-note="${k}" rows="1" maxlength="2000" placeholder="Consigne : emplacement, contenu, variante…" aria-label="Consigne pour ${esc(i?.name || b.id)}">${esc(b.note)}</textarea><input data-page="${k}" value="${esc(b.page || '')}" list="pages-list" maxlength="60" placeholder="Page" aria-label="Page de ${esc(i?.name || b.id)}"></div></li>`;
        })
        .join('')
    : '<li class="empty">Ajoutez des composants, sections ou écrans depuis la galerie (ou depuis le catalogue). Glissez-les ensuite pour les ordonner ; la colonne « Page » répartit un site en plusieurs pages.</li>';
  const restricted = [spec.theme, ...spec.fonts, ...spec.sounds, ...spec.blocks.map((b) => b.id)]
    .map((id) => id && byId.get(id))
    .filter((i) => i && i.licenseStatus === 'restricted');
  const bySource = [...new Map(restricted.map((i) => [i.sourceId, i])).values()];
  $('#s-attribution').innerHTML = bySource.length
    ? `<div class="attribution"><strong>Licences avec conditions</strong> : à créditer dans le projet (le bundle produit CREDITS.md).<ul>${bySource.map((i) => `<li>${esc(i.source)} : ${esc(i.attribution || i.licenseNotes || i.license)}</li>`).join('')}</ul></div>`
    : '';
  hydrateVisuals($('.spec'));
}

function move(from, to) {
  if (to < 0 || to >= spec.blocks.length || from === to) return;
  const [b] = spec.blocks.splice(from, 1);
  spec.blocks.splice(to, 0, b);
  persist();
  renderSpec();
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
  ['#s-title', 'title'],
  ['#s-brief', 'brief'],
  ['#s-stack', 'stack'],
  ['#s-style', 'style'],
])
  $(id).addEventListener('input', () => {
    spec[key] = $(id).value;
    persist();
    if (key === 'title') $('#spec-heading').textContent = spec.title || 'Nouvelle spec';
  });
$('#s-name').addEventListener('input', () => {
  spec.name = $('#s-name').value;
  $('#name-preview').textContent = slugify(spec.name) || 'nom';
  $('#mcp-command').textContent = command();
  persist();
});
$('#s-name').addEventListener('change', () => {
  spec.name = slugify($('#s-name').value);
  $('#s-name').value = spec.name;
  persist();
  renderSpec();
});
$('#s-title').addEventListener('change', () => {
  if (!spec.name && spec.title) {
    spec.name = slugify(spec.title);
    persist();
    renderSpec();
  }
});
onDraftChange((next) => {
  spec = next;
  renderSpec();
  syncCards();
});

/* ---------- Enregistrer, ouvrir, gérer les specs ---------- */

const specBody = (preset) => ({
  name: spec.name,
  title: spec.title,
  brief: spec.brief,
  stack: spec.stack,
  style: spec.style,
  theme: spec.theme,
  fonts: spec.fonts,
  easings: spec.easings,
  sounds: spec.sounds,
  blocks: spec.blocks.map(cleanBlock),
  preset,
});

async function save(preset) {
  spec.name = slugify(spec.name || spec.title);
  if (!spec.name) {
    toast('Donnez un nom de fichier à la spec (ex. site-boulangerie).');
    $('#s-name').focus();
    return;
  }
  if (!spec.blocks.length && !preset) {
    toast('Ajoutez au moins un bloc avant d’enregistrer.');
    return;
  }
  const send = (overwrite) => api('/api/specs', { method: 'POST', body: { spec: specBody(preset), overwrite } });
  try {
    let result;
    try {
      result = await send(spec.loadedFrom === `${preset ? 'preset' : 'spec'}:${spec.name}`);
    } catch (error) {
      if (error.status !== 409) throw error;
      if (
        !confirm(
          `${preset ? 'Le preset' : 'La spec'} « ${spec.name} » existe déjà. La remplacer ? (L’ancienne version reste dans l’historique.)`,
        )
      )
        return;
      result = await send(true);
    }
    spec.loadedFrom = `${preset ? 'preset' : 'spec'}:${spec.name}`;
    persist();
    renderSpec();
    await loadSpecList();
    toast(`Enregistré : ${result.saved}. Copiez la commande pour Claude Code.`);
  } catch (error) {
    toast(error.status ? error.message : 'Le serveur ne répond pas. Relancez « npm start ».');
  }
}

async function loadSpecList() {
  try {
    specs = await api('/api/specs');
  } catch {
    specs = [];
  }
  const own = specs.filter((s) => !s.preset),
    presets = specs.filter((s) => s.preset);
  $('#load-spec').innerHTML =
    '<option value="">Ouvrir…</option>' +
    (own.length
      ? `<optgroup label="Mes specs">${own.map((s) => `<option value="spec:${esc(s.name)}">${esc(s.title || s.name)} (${s.blocks})</option>`).join('')}</optgroup>`
      : '') +
    (presets.length
      ? `<optgroup label="Partir d’un preset">${presets.map((s) => `<option value="preset:${esc(s.name)}">${esc(s.title || s.name)} (${s.blocks})</option>`).join('')}</optgroup>`
      : '');
}

function adopt(data, from) {
  const next = Object.assign(blankSpec(), data, { loadedFrom: from });
  delete next.preset;
  delete next.createdAt;
  delete next.updatedAt;
  next.blocks = (next.blocks || []).map(cleanBlock);
  spec = next;
  persist();
  renderSpec();
  syncCards();
  return [spec.theme, ...spec.fonts, ...spec.easings, ...spec.sounds, ...spec.blocks.map((b) => b.id)].filter((id) => id && !byId.has(id))
    .length;
}

async function openSpec(kind, name, { confirmReplace = true } = {}) {
  if (
    confirmReplace &&
    spec.blocks.length &&
    spec.loadedFrom !== `${kind}:${name}` &&
    !confirm('Remplacer la spec en cours ? (Elle reste dans ce navigateur jusqu’à ce que vous la remplaciez.)')
  )
    return;
  try {
    const data = await api(`/api/specs/${encodeURIComponent(name)}${kind === 'preset' ? '?preset=1' : ''}`);
    const missing =
      kind === 'preset'
        ? adopt({ ...data, name: '', title: data.title ? `${data.title} (copie)` : '' }, null)
        : adopt(data, `spec:${name}`);
    toast(
      kind === 'preset'
        ? 'Preset chargé : donnez un nom de fichier, puis enregistrez.'
        : `Spec « ${name} » ouverte.${missing ? ` ${plural(missing, 'item absent', 'items absents')} du registre.` : ''}`,
    );
    if (kind === 'preset') $('#s-name').focus();
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
  if (spec.blocks.length && !confirm('Vider la spec en cours ?')) return;
  spec = blankSpec();
  persist();
  renderSpec();
  syncCards();
};
$('#duplicate-spec').onclick = () => {
  closeMenu();
  spec = {
    ...spec,
    name: spec.name ? `${spec.name}-copie`.slice(0, 64) : '',
    title: spec.title ? `${spec.title} (copie)` : '',
    loadedFrom: null,
  };
  persist();
  renderSpec();
  $('#s-name').focus();
  toast('Copie prête : ajustez le nom puis enregistrez.');
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
    persist();
    renderSpec();
    await loadSpecList();
    toast(`« ${name} » supprimée. Enregistrez pour la recréer.`);
  } catch (error) {
    toast(error.message);
  }
};
$('#save').onclick = () => save(false);
$('#save-preset').onclick = () => save(true);
$('#copy-command').onclick = async () =>
  toast(
    (await copyText(command()))
      ? spec.loadedFrom
        ? 'Commande copiée : collez-la dans Claude Code.'
        : 'Commande copiée. Enregistrez la spec avant de la lancer.'
      : 'Copie impossible : sélectionnez la commande à la main.',
  );
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
  openDialog(
    `<div class="page-preview-head"><div><h2 id="detail-title">Aperçu de la page${page ? ` « ${esc(page)} »` : ''}</h2><p class="help">Blocs empilés dans l’ordre${theme ? `, aux couleurs du thème ${esc(theme.name)}` : ''}. Chaque bloc reste isolé (aperçu sandboxé) : l’assemblage réel se fait dans le projet.</p></div>
    ${pages.length > 1 ? `<div class="page-tabs" role="tablist">${pages.map((p) => `<button class="chip" role="tab" data-page-tab="${esc(p)}" aria-selected="${p === page}" aria-pressed="${p === page}">${esc(p)}</button>`).join('')}${spec.blocks.some((b) => !b.page) ? `<button class="chip" role="tab" data-page-tab="" aria-pressed="${page === ''}">Sans page</button>` : ''}</div>` : ''}</div>
    <div class="page-frames ${$('#f-light').checked ? 'light' : ''}" id="page-frames">${
      blocks
        .map((b) => {
          const i = byId.get(b.id);
          if (!i) return `<div class="page-missing">${icon('x')}${esc(b.id)} : introuvable dans le registre</div>`;
          const note = b.note ? `<span class="page-note">${esc(b.note)}</span>` : '';
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

async function showThemeEditor(baseId = spec.theme) {
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
    if (!draftTheme.name && id) draftTheme.name = `${byId.get(id)?.name || 'Thème'} perso`;
  };
  if (baseId && byId.get(baseId)?.type === 'theme') await applyBase(baseId);
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
    const value = e.target.value.trim();
    if (!SAFE_VALUE.test(value) || value.includes('/*')) {
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
  for (const b of $$('[data-mode]'))
    b.onclick = () => {
      draftTheme.mode = b.dataset.mode;
      for (const x of $$('[data-mode]')) x.setAttribute('aria-pressed', String(x === b));
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
    const send = (overwrite) => api('/api/themes', { method: 'POST', body: { theme: body, overwrite } });
    try {
      let result;
      try {
        result = await send(false);
      } catch (error) {
        if (error.status !== 409 || !confirm(`${error.message}. Le remplacer ?`)) throw error;
        result = await send(true);
      }
      await loadRegistry();
      spec.theme = result.id;
      persist();
      renderSpec();
      render();
      $('#detail').close();
      toast(`Thème « ${body.name} » créé et choisi pour la spec.`);
    } catch (error) {
      if (error.status !== 409) toast(error.message);
    }
  };
}
$('#create-theme').onclick = () => showThemeEditor();

/* ---------- Détail : aperçu, métadonnées, code, installation ---------- */

function openDialog(html, mode = 'detail') {
  const dialog = $('#detail');
  dialog.dataset.mode = mode;
  $('#detail-body').innerHTML = html;
  for (const b of $$('[data-close]', dialog)) b.onclick = () => dialog.close();
  if (!dialog.open) dialog.showModal();
}
setupDialog($('#detail'), () => {
  if (location.hash.startsWith('#item=')) history.replaceState(null, '', location.pathname);
});

function equivalents(i) {
  if (!i.group) return [];
  return items
    .filter((x) => x.group === i.group && x.id !== i.id && x.interactive)
    .sort((a, b) => a.source.localeCompare(b.source))
    .slice(0, 8);
}

async function showDetail(id) {
  const i = byId.get(id);
  if (!i) return;
  openDialog('<p class="help">Chargement…</p>');
  let meta;
  try {
    meta = await api(`/api/registry/item?id=${encodeURIComponent(id)}`);
  } catch {
    $('#detail-body').innerHTML = '<p>Impossible de lire cet item.</p>';
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
        ${i.usages?.length ? `<dt>Cas d’usage</dt><dd>${i.usages.map(esc).join(' · ')}</dd>` : ''}
        <dt>Licence</dt><dd><span class="lic ${meta.licenseStatus}">${esc(meta.license)}</span>${meta.licenseNotes ? `<br><span class="help">${esc(meta.licenseNotes)}</span>` : ''}</dd>
        ${meta.attribution ? `<dt>Attribution</dt><dd>${esc(meta.attribution)}</dd>` : ''}
        <dt>Paquets npm</dt><dd>${deps}</dd>
        ${meta.registryDependencies.length ? `<dt>Dépendances du registre</dt><dd>${meta.registryDependencies.map((d) => `<code>${esc(d)}</code>`).join(' ')}</dd>` : ''}
        ${meta.font ? `<dt>Styles</dt><dd>${esc(meta.font.styles.map((s) => s.name).join(', '))}</dd><dt>CSS</dt><dd><code>${esc(meta.font.cssUrl)}</code></dd>` : ''}
        ${installable ? `<dt>Installer dans un projet shadcn</dt><dd><div class="command-line"><code>${esc(shadcnAdd)}</code><button class="btn icon-only ghost small" id="copy-shadcn" aria-label="Copier la commande shadcn">${icon('copy')}</button></div><span class="help">Le serveur Atlas doit tourner ; imports réécrits sur <code>@/</code>.</span></dd>` : ''}
        <dt>Source</dt><dd>${source ? `<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(meta.source)} ${icon('external')}</a>` : esc(meta.source)}</dd>
        <dt>Importé</dt><dd>${esc(meta.importedAt?.slice(0, 10) || '—')}${meta.updatedAt ? ` · mis à jour le ${esc(meta.updatedAt.slice(0, 10))}` : ''}</dd>
        <dd class="facts-actions"><button class="btn primary" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}">${actionLabel(i)}</button>${i.sourceId === 'perso' ? `<button class="btn ghost" id="delete-theme">${icon('trash')}Supprimer ce thème</button>` : ''}${i.type === 'theme' ? `<button class="btn ghost" id="derive-theme">${icon('palette')}Créer un thème à partir de celui-ci</button>` : ''}</dd>
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
    if (b.closest('#detail')) {
      b.innerHTML = actionLabel(byId.get(b.dataset.toggle));
      b.setAttribute('aria-pressed', String(inSpec(b.dataset.toggle)));
    }
  } else if (b.dataset.detail) showDetail(b.dataset.detail);
  else if (b.dataset.show) {
    $('#detail').close();
    showType(b.dataset.show);
  } else if (b.dataset.move !== undefined) move(Number(b.dataset.move), Number(b.dataset.move) + Number(b.dataset.dir));
  else if (b.dataset.remove !== undefined) {
    spec.blocks.splice(Number(b.dataset.remove), 1);
    persist();
    renderSpec();
    syncCards();
  } else if (b.dataset.type !== undefined) showType(b.dataset.type);
});
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
  typeFilter = '';
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
    }
  }
  // Galerie : ce qui est interactif, plus thèmes, polices, mouvement et sons. Le reste du registre reste accessible au MCP.
  const shown = all
    .filter((i) => STYLE_TYPES.has(i.type) || (i.interactive && i.type !== 'lib'))
    .sort((a, b) => RANK[a.type] - RANK[b.type] || a.name.localeCompare(b.name, 'fr'));
  items = Object.keys(RANK).flatMap((t) =>
    interleave(
      shown.filter((i) => i.type === t),
      (i) => i.sourceId,
    ),
  );
  await Promise.all(
    items
      .filter((i) => (i.type === 'theme' || i.type === 'easing') && !i._colors && !i._easings)
      .map(async (i) => {
        try {
          const m = await api(`/api/registry/item?id=${encodeURIComponent(i.id)}`);
          i._colors = m.tokens?.colors?.light || {};
          i._easings = m.easings || [];
        } catch {
          /* vignette simplifiée */
        }
      }),
  );
  buildFilters();
}

function buildFilters() {
  const count = (f) =>
    [
      ...items.reduce((m, i) => {
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
  const names = new Map(
    items.filter((i) => !STYLE_TYPES.has(i.type)).map((i) => [i.sourceId, i.source + (i.sourceId === 'panelui-web' ? ' (web)' : '')]),
  );
  $('#f-source').innerHTML =
    '<option value="">Toutes les sources</option>' +
    [...names]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`)
      .join('');
  [$('#f-category').value, $('#f-tag').value, $('#f-source').value] = [cat, tag, src];
  const types = count((i) => i.type);
  const fresh = items.filter((i) => i.isNew).length;
  $('#types').innerHTML =
    TYPES.filter(([t]) => !t || types.some(([k]) => k === t))
      .map(
        ([t, label]) =>
          `<button class="chip" data-type="${t}" aria-pressed="${t === typeFilter}">${label} <small>${t ? types.find(([k]) => k === t)?.[1] || 0 : items.length}</small></button>`,
      )
      .join('') +
    (fresh
      ? `<button class="chip new-chip" id="only-new" aria-pressed="${onlyNew}">${icon('sparkle')}Nouveautés <small>${fresh}</small></button>`
      : '');
  $('#only-new')?.addEventListener('click', () => {
    onlyNew = !onlyNew;
    visible = PAGE;
    render();
  });
  $('#sounds-row').hidden = !items.some((i) => i.type === 'sound') && !spec.sounds.length;
}

(async function boot() {
  try {
    await loadRegistry();
    const legacy = new Map([...byId.values()].filter((i) => i.catalogId).map((i) => [i.catalogId, i.id]));
    const moved = migrateLegacy((x) => legacy.get(x) ?? (byId.get(x)?.interactive ? x : undefined));
    if (moved) {
      spec = readDraft();
      toast(`${plural(moved, 'composant')} de l’ancienne sélection du catalogue ${moved > 1 ? 'ont' : 'a'} rejoint la spec.`);
    }
    await loadSpecList();
    renderSpec();
    render();
    syncAutoplay();
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.get('spec')) {
      history.replaceState(null, '', location.pathname);
      await openSpec('spec', hash.get('spec'));
    } else if (hash.get('item') && byId.has(hash.get('item'))) showDetail(hash.get('item'));
  } catch {
    $('#count').textContent = 'Registre introuvable : lancez « npm run import » puis « npm start ».';
    $('#grid').innerHTML =
      '<div class="empty"><strong>Registre indisponible.</strong><p>Impossible de charger registry/index.json.</p></div>';
  }
})();
