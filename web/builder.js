/* Atlas Builder : galerie du registre + composition d'une spec (thème, polices, easings, blocs ordonnés et annotés). */
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="/icons.svg#${name}"/></svg>`;
const ALIASES = { bouton: 'button', boutons: 'button', carte: 'card', cartes: 'card', tableau: 'table', formulaire: 'form', fenetre: 'dialog', onglet: 'tab', onglets: 'tab', calendrier: 'calendar', texte: 'text', fond: 'background', fonds: 'background', police: 'font', graphique: 'chart', graphiques: 'chart', carrousel: 'carousel', caroussel: 'carousel' };
const TYPES = [['', 'Tout'], ['component', 'Composants'], ['section', 'Sections'], ['screen', 'Écrans'], ['theme', 'Thèmes'], ['font', 'Polices'], ['easing', 'Easings']];
const TYPE_LABEL = { component: 'Composant', section: 'Section', screen: 'Écran', theme: 'Thème', font: 'Police', easing: 'Easing', lib: 'Utilitaire' };
const PAGE = 24;
const DRAFT_KEY = 'atlas-builder-draft';

let items = [], byId = new Map(), previewsBuilt = false, visible = PAGE, typeFilter = '', specs = [];
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible : brouillon gardé en mémoire */ } } };
const blank = () => ({ name: '', title: '', brief: '', stack: '', style: '', theme: null, fonts: [], easings: [], blocks: [], loadedFrom: null });
let spec = Object.assign(blank(), store.get(DRAFT_KEY, {}));
if (!Array.isArray(spec.blocks)) spec.blocks = [];

function toast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('visible'), 3400); }
function persist() { store.set(DRAFT_KEY, spec); }
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
const command = () => `/mcp__atlas__build-from-spec ${slugify(spec.name) || 'nom'}`;
const shortLicense = (l) => l.replace(/^LicenseRef-/, '').replace('MIT-Commons-Clause-Attribution', 'MIT + conditions').replace('ITF-FFL', 'ITF FFL');

/* ---------- Recherche et filtres ---------- */

function haystack(i) { return norm([i.id, i.name, i.description, i.category, i.type, TYPE_LABEL[i.type], i.source, i.framework, ...(i.tags || [])].join(' ')); }
function matches(query, text) { return norm(query).split(/\s+/).filter(Boolean).every((w) => text.includes(w) || text.includes(ALIASES[w] || w)); }
const FILTERS = ['#q', '#f-category', '#f-tag', '#f-source', '#f-license'];
// Interactif = démo Atlas ou aperçu live validé par l'audit (calculé par le serveur).
const hasLive = (i) => !!i.interactive;
const STYLE_TYPES = new Set(['theme', 'font', 'easing']);

function filtered() {
  const q = $('#q').value.trim(), cat = $('#f-category').value, tag = $('#f-tag').value, src = $('#f-source').value, lic = $('#f-license').value;
  return items.filter((i) => (!typeFilter || i.type === typeFilter) && (!cat || i.category === cat) && (!tag || (i.tags || []).includes(tag)) && (!src || i.sourceId === src) && (!lic || i.licenseStatus === lic) && (!q || matches(q, i._hay)));
}

/* Ordre par défaut : une source après l'autre, pour éviter qu'une bibliothèque à variantes (Origin UI) monopolise l'écran. */
function interleave(list, key) {
  const groups = new Map();
  for (const item of list) { const k = key(item); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(item); }
  const queues = [...groups.values()], out = [];
  for (let round = 0; out.length < list.length; round++) for (const q of queues) if (round < q.length) out.push(q[round]);
  return out;
}

/* ---------- Visuels ---------- */

function previewSrc(i, card) {
  if (i.preview.kind === 'atlas-demo') return `/demos/index.html?demo=${encodeURIComponent(i.preview.demo)}`;
  return `/registry-previews/index.html?id=${encodeURIComponent(i.id)}${$('#f-light').checked ? '' : '&theme=dark'}${card ? '&card=1' : ''}`;
}

function frame(i, large) {
  // Code tiers non revu : iframe sandboxée (origine opaque). Les démos Atlas existantes sont déjà revues.
  const sandbox = i.preview.kind === 'live' ? ' sandbox="allow-scripts"' : '';
  return `<iframe ${large ? 'src' : 'data-src'}="${esc(previewSrc(i, !large))}"${sandbox} title="Aperçu : ${esc(i.name)}" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
}

function curveSvg(b) {
  const pts = []; // Courbe de Bézier échantillonnée (x(t), y(t)).
  for (let k = 0; k <= 24; k++) { const t = k / 24, u = 1 - t; const x = 3 * u * u * t * b[0] + 3 * u * t * t * b[2] + t * t * t, y = 3 * u * u * t * b[1] + 3 * u * t * t * b[3] + t * t * t; pts.push(`${(4 + x * 52).toFixed(1)},${(52 - y * 40).toFixed(1)}`); }
  return `<svg viewBox="0 0 60 64" aria-hidden="true"><path class="axis" d="M4 52 H56 M4 12 H56" stroke-width=".6" fill="none"/><polyline class="curve" points="${pts.join(' ')}" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

function visual(i, large = false) {
  if (i.type === 'font') return `<div class="font-sample" data-font-css="${esc(i.font?.cssUrl || '')}" data-font="${esc(i.font?.family || i.name)}"><span class="big">Aa Gg</span><span class="line">Le vif zéphyr jubile sur les kumquats</span><span class="line">0123456789 · ${esc((i.font?.styles || []).length)} styles</span></div>`;
  if (i.type === 'theme') {
    const colors = Object.entries(i._colors || {}).filter(([, v]) => !/^var\(/.test(v)).slice(0, 12);
    return colors.length ? `<div class="swatches">${colors.map(([k, v]) => `<span data-color="${esc(v)}" title="${esc(k)} : ${esc(v)}"></span>`).join('')}</div>` : `<div class="placeholder">${icon('layers')}Tokens du thème</div>`;
  }
  if (i.type === 'easing') {
    const curves = (i._easings || []).filter((e) => e.cubicBezier).filter((_, k) => k % 3 === 2).slice(0, 8);
    return `<div class="curves">${curves.map((e) => `<figure>${curveSvg(e.cubicBezier)}<figcaption>${esc(e.name.replace(/^ease/, ''))}</figcaption></figure>`).join('')}</div>`;
  }
  if (hasLive(i)) return frame(i, large);
  if (i.preview.kind === 'live') return `<div class="placeholder">${icon('grid')}Aperçus pas encore compilés<br><code>npm run previews</code></div>`;
  if (i.framework === 'react-native') return `<div class="placeholder">${icon('device')}React Native (Expo)<br>pas de rendu web, code complet dans Claude Code</div>`;
  return `<div class="placeholder">${icon('code')}${esc(i.preview.reason || 'Pas d’aperçu')}</div>`;
}

function visualClass(i) {
  if (i.preview.kind === 'atlas-demo') return 'stage';
  return i.preview.kind === 'live' && $('#f-light').checked ? 'light' : '';
}

function hydrateVisuals(root = document) {
  for (const el of $$('[data-color]', root)) el.style.background = el.dataset.color;
  for (const el of $$('[data-font]', root)) el.style.fontFamily = `'${el.dataset.font}', system-ui, sans-serif`;
  for (const el of $$('iframe[data-src], [data-font-css]', root)) lazy.observe(el);
}

const loadedFonts = new Set();
const lazy = new IntersectionObserver((entries) => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    if (target.dataset.src) { target.src = target.dataset.src; delete target.dataset.src; }
    const css = target.dataset.fontCss;
    if (css && /^https:\/\/api\.fontshare\.com\//.test(css) && !loadedFonts.has(css)) {
      loadedFonts.add(css);
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = css; link.referrerPolicy = 'no-referrer'; document.head.append(link);
    }
    lazy.unobserve(target);
  }
}, { rootMargin: '200px' });

/* ---------- Galerie ---------- */

const inSpec = (id) => spec.theme === id || spec.fonts.includes(id) || spec.easings.includes(id) || spec.blocks.some((b) => b.id === id);
function actionLabel(i) {
  const yes = inSpec(i.id);
  if (i.type === 'theme') return yes ? `${icon('check')}Thème choisi` : 'Choisir ce thème';
  return yes ? `${icon('check')}Dans la spec` : `${icon('plus')}Ajouter`;
}

function card(i) {
  return `<article class="card ${inSpec(i.id) ? 'in-spec' : ''}" data-card="${esc(i.id)}">
    <div class="visual ${visualClass(i)}">${visual(i)}<button class="visual-open" data-detail="${esc(i.id)}" aria-label="Détails et code : ${esc(i.name)}">${icon('expand')}</button></div>
    <div class="card-body">
      <div class="card-meta"><span>${esc(TYPE_LABEL[i.type])}</span>·<span>${esc(i.category)}</span>·<span>${esc(i.source)}</span>${i.framework === 'react-native' ? '·<span>RN</span>' : ''}<span class="lic ${i.licenseStatus}" title="${esc(i.licenseNotes || i.license)}">${esc(shortLicense(i.license))}</span></div>
      <h3>${esc(i.name)}</h3>
      <p>${esc(i.description || '')}</p>
      <div class="card-actions"><button class="btn small ghost" data-detail="${esc(i.id)}">${icon('code')}Code</button><button class="btn small" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}">${actionLabel(i)}</button></div>
    </div></article>`;
}

function render() {
  const rows = filtered();
  const active = FILTERS.filter((id) => $(id).value).length;
  $('#reset').hidden = !active && !typeFilter;
  $('#count').textContent = `${rows.length} item${rows.length > 1 ? 's' : ''}${rows.length > visible ? ` · ${visible} affichés` : ''}${previewsBuilt ? '' : ' · aperçus live non compilés (npm run previews)'}`;
  $('#grid').innerHTML = rows.length ? rows.slice(0, visible).map(card).join('') : '<div class="empty"><strong>Aucun item pour ces filtres.</strong><p>Essayez un autre mot ou réinitialisez les filtres.</p></div>';
  $('#more').hidden = rows.length <= visible;
  hydrateVisuals($('#grid'));
  for (const b of $$('#types button')) b.setAttribute('aria-pressed', String(b.dataset.type === typeFilter));
}

function syncCards() {
  for (const el of $$('[data-card]')) el.classList.toggle('in-spec', inSpec(el.dataset.card));
  for (const b of $$('[data-toggle]')) { const i = byId.get(b.dataset.toggle); if (i && !b.closest('.token, .theme-token')) { b.innerHTML = actionLabel(i); b.setAttribute('aria-pressed', String(inSpec(i.id))); } }
}

function showType(type) { typeFilter = type; visible = PAGE; render(); $('#types').scrollIntoView({ block: 'nearest' }); }

/* ---------- Spec ---------- */

function toggle(id) {
  const i = byId.get(id);
  if (!i) return;
  if (i.type === 'theme') spec.theme = spec.theme === id ? null : id;
  else if (i.type === 'font') spec.fonts = spec.fonts.includes(id) ? spec.fonts.filter((x) => x !== id) : [...spec.fonts, id];
  else if (i.type === 'easing') spec.easings = spec.easings.includes(id) ? spec.easings.filter((x) => x !== id) : [...spec.easings, id];
  else if (spec.blocks.some((b) => b.id === id)) spec.blocks = spec.blocks.filter((b) => b.id !== id);
  else { spec.blocks.push({ id, note: '' }); toast(`${i.name} ajouté en position ${spec.blocks.length}.`); }
  persist(); renderSpec(); syncCards();
}

function themeColors(id) { return Object.entries(byId.get(id)?._colors || {}).filter(([, v]) => !/^var\(/.test(v)).slice(0, 6); }
const token = (id, label) => `<span class="token"><span>${esc(label)}</span><button data-toggle="${esc(id)}" aria-label="Retirer ${esc(label)}">${icon('x')}</button></span>`;

function atlasSelection() {
  const selection = store.get('atlas-selection', []);
  const byCatalog = new Map(items.filter((i) => i.catalogId).map((i) => [i.catalogId, i]));
  return (Array.isArray(selection) ? selection : []).map((id) => byCatalog.get(id) ?? byId.get(id)).filter(Boolean);
}

function renderSpec() {
  $('#s-name').value = spec.name; $('#s-title').value = spec.title; $('#s-brief').value = spec.brief; $('#s-stack').value = spec.stack; $('#s-style').value = spec.style;
  $('#name-preview').textContent = slugify(spec.name) || 'nom';
  $('#mcp-command').textContent = command();
  $('.command').classList.toggle('saved', !!spec.loadedFrom);
  $('#spec-heading').textContent = spec.title || (spec.loadedFrom ? spec.name : 'Nouvelle spec');
  $('#guide').hidden = !!(spec.blocks.length || spec.theme || spec.name);
  const theme = spec.theme && byId.get(spec.theme);
  $('#s-theme').innerHTML = theme
    ? `<span class="token theme-token"><span class="mini">${themeColors(theme.id).map(([k, v]) => `<span data-color="${esc(v)}" title="${esc(k)}"></span>`).join('')}</span><span>${esc(theme.name)}</span><button data-toggle="${esc(theme.id)}" aria-label="Retirer le thème">${icon('x')}</button></span>`
    : '<button class="ask" data-show="theme">Choisir dans la galerie</button>';
  for (const [slot, list, type] of [['#s-fonts', spec.fonts, 'font'], ['#s-easings', spec.easings, 'easing']]) {
    $(slot).innerHTML = list.length ? list.map((id) => token(id, byId.get(id)?.name || id)).join('') : `<button class="ask" data-show="${type}">Choisir dans la galerie</button>`;
  }
  $('#s-count').textContent = spec.blocks.length;
  $('#jump-count').textContent = spec.blocks.length;
  const pending = atlasSelection().filter((i) => !spec.blocks.some((b) => b.id === i.id));
  $('#import-atlas').hidden = !pending.length;
  $('#import-atlas').textContent = `Reprendre la sélection du catalogue (${pending.length})`;
  $('#s-blocks').innerHTML = spec.blocks.length ? spec.blocks.map((b, k) => {
    const i = byId.get(b.id);
    return `<li class="block" draggable="true" data-index="${k}">
      <div class="block-head"><span class="handle" aria-hidden="true">${icon('grip')}</span><span class="block-title"><strong>${esc(i?.name || b.id)}</strong><small>${esc(i ? `${TYPE_LABEL[i.type]} · ${i.source}` : 'introuvable dans le registre')}</small></span>
      <span class="block-tools"><button class="btn icon-only ghost" data-move="${k}" data-dir="-1" aria-label="Monter" ${k === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="btn icon-only ghost" data-move="${k}" data-dir="1" aria-label="Descendre" ${k === spec.blocks.length - 1 ? 'disabled' : ''}>${icon('down')}</button><button class="btn icon-only ghost" data-detail="${esc(b.id)}" aria-label="Voir le code">${icon('code')}</button><button class="btn icon-only ghost" data-remove="${k}" aria-label="Retirer">${icon('x')}</button></span></div>
      <textarea data-note="${k}" rows="1" maxlength="2000" placeholder="Note : emplacement, contenu, variante…" aria-label="Note pour ${esc(i?.name || b.id)}">${esc(b.note)}</textarea></li>`;
  }).join('') : '<li class="empty">Ajoutez des composants, sections ou écrans depuis la galerie. Glissez-les ensuite pour les ordonner.</li>';
  const restricted = [spec.theme, ...spec.fonts, ...spec.blocks.map((b) => b.id)].map((id) => id && byId.get(id)).filter((i) => i && i.licenseStatus === 'restricted');
  const sources = [...new Map(restricted.map((i) => [i.sourceId, i])).values()];
  $('#s-attribution').innerHTML = sources.length ? `<div class="attribution"><strong>Licences avec conditions</strong> : à créditer dans le projet.<ul>${sources.map((i) => `<li>${esc(i.source)} : ${esc(i.attribution || i.licenseNotes || i.license)}</li>`).join('')}</ul></div>` : '';
  hydrateVisuals($('.spec'));
}

function move(from, to) {
  if (to < 0 || to >= spec.blocks.length || from === to) return;
  const [b] = spec.blocks.splice(from, 1); spec.blocks.splice(to, 0, b);
  persist(); renderSpec();
}

/* Glisser-déposer des blocs (les boutons monter/descendre restent l'alternative clavier). */
let dragIndex = null;
$('#s-blocks').addEventListener('dragstart', (e) => { const li = e.target.closest('.block'); if (!li) return; dragIndex = Number(li.dataset.index); li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragIndex)); });
$('#s-blocks').addEventListener('dragover', (e) => { const li = e.target.closest('.block'); if (dragIndex === null || !li) return; e.preventDefault(); $$('.drop-before').forEach((x) => x.classList.remove('drop-before')); li.classList.add('drop-before'); });
$('#s-blocks').addEventListener('drop', (e) => { const li = e.target.closest('.block'); if (dragIndex === null || !li) return; e.preventDefault(); move(dragIndex, Number(li.dataset.index)); });
$('#s-blocks').addEventListener('dragend', () => { dragIndex = null; $$('.dragging,.drop-before').forEach((x) => x.classList.remove('dragging', 'drop-before')); });
$('#s-blocks').addEventListener('input', (e) => { if (e.target.dataset.note !== undefined) { spec.blocks[Number(e.target.dataset.note)].note = e.target.value; persist(); } });

for (const [id, key] of [['#s-title', 'title'], ['#s-brief', 'brief'], ['#s-stack', 'stack'], ['#s-style', 'style']]) $(id).addEventListener('input', () => { spec[key] = $(id).value; persist(); if (key === 'title') $('#spec-heading').textContent = spec.title || 'Nouvelle spec'; });
$('#s-name').addEventListener('input', () => { spec.name = $('#s-name').value; $('#name-preview').textContent = slugify(spec.name) || 'nom'; $('#mcp-command').textContent = command(); persist(); });
$('#s-name').addEventListener('change', () => { spec.name = slugify($('#s-name').value); $('#s-name').value = spec.name; persist(); renderSpec(); });
$('#s-title').addEventListener('change', () => { if (!spec.name && spec.title) { spec.name = slugify(spec.title); persist(); renderSpec(); } });

/* ---------- Sauvegarde, chargement, presets ---------- */

async function save(preset) {
  spec.name = slugify(spec.name || spec.title);
  if (!spec.name) { toast('Donnez un nom de fichier à la spec (ex. dashboard-padel).'); $('#s-name').focus(); return; }
  if (!spec.blocks.length && !preset) { toast('Ajoutez au moins un bloc avant d’enregistrer.'); return; }
  const body = { spec: { name: spec.name, title: spec.title, brief: spec.brief, stack: spec.stack, style: spec.style, theme: spec.theme, fonts: spec.fonts, easings: spec.easings, blocks: spec.blocks, preset } };
  const send = (overwrite) => fetch('/api/specs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, overwrite }) });
  try {
    let r = await send(spec.loadedFrom === `${preset ? 'preset' : 'spec'}:${spec.name}`);
    if (r.status === 409 && confirm(`${preset ? 'Le preset' : 'La spec'} « ${spec.name} » existe déjà. La remplacer ?`)) r = await send(true);
    const data = await r.json();
    if (!r.ok) { if (r.status !== 409) toast(data.error || 'Enregistrement impossible.'); return; }
    spec.loadedFrom = `${preset ? 'preset' : 'spec'}:${spec.name}`;
    persist(); renderSpec(); await loadSpecList();
    toast(`Enregistré : ${data.saved}. Copiez la commande pour Claude Code.`);
  } catch { toast('Le serveur ne répond pas. Relancez server.py.'); }
}

async function loadSpecList() {
  try { specs = await (await fetch('/api/specs')).json(); } catch { specs = []; }
  const own = specs.filter((s) => !s.preset), presets = specs.filter((s) => s.preset);
  $('#load-spec').innerHTML = '<option value="">Ouvrir…</option>' +
    (own.length ? `<optgroup label="Mes specs">${own.map((s) => `<option value="spec:${esc(s.name)}">${esc(s.title || s.name)} (${s.blocks})</option>`).join('')}</optgroup>` : '') +
    (presets.length ? `<optgroup label="Partir d’un preset">${presets.map((s) => `<option value="preset:${esc(s.name)}">${esc(s.title || s.name)} (${s.blocks})</option>`).join('')}</optgroup>` : '');
}

$('#load-spec').addEventListener('change', async () => {
  const value = $('#load-spec').value; $('#load-spec').value = '';
  if (!value) return;
  const [kind, name] = value.split(':');
  if (spec.blocks.length && !confirm('Remplacer la spec en cours ?')) return;
  try {
    const data = await (await fetch(`/api/specs/${encodeURIComponent(name)}${kind === 'preset' ? '?preset=1' : ''}`)).json();
    spec = Object.assign(blank(), data, kind === 'preset' ? { name: '', title: data.title ? `${data.title} (copie)` : '', loadedFrom: null } : { loadedFrom: value });
    delete spec.preset; delete spec.createdAt; delete spec.updatedAt;
    const missing = [spec.theme, ...spec.fonts, ...spec.easings, ...spec.blocks.map((b) => b.id)].filter((id) => id && !byId.has(id));
    persist(); renderSpec(); syncCards();
    toast(kind === 'preset' ? 'Preset chargé : donnez un nom de fichier, puis enregistrez.' : `Spec « ${name} » ouverte.${missing.length ? ` ${missing.length} item(s) absent(s) du registre.` : ''}`);
    if (kind === 'preset') $('#s-name').focus();
  } catch { toast('Ouverture impossible.'); }
});

$('#new-spec').onclick = () => { if (spec.blocks.length && !confirm('Vider la spec en cours ?')) return; spec = blank(); persist(); renderSpec(); syncCards(); };
$('#save').onclick = () => save(false);
$('#save-preset').onclick = () => save(true);
$('#copy-command').onclick = async () => {
  try { await navigator.clipboard.writeText(command()); toast(spec.loadedFrom ? 'Commande copiée : collez-la dans Claude Code.' : 'Commande copiée. Pensez à enregistrer la spec avant de la lancer.'); }
  catch { toast('Copie impossible : sélectionnez la commande à la main.'); }
};

/* La sélection du catalogue (page d'accueil) est stockée dans ce même navigateur : on la convertit en blocs du registre. */
function importAtlas() {
  const selection = store.get('atlas-selection', []), notes = store.get('atlas-prompt-draft', {}).notes || {};
  const byCatalog = new Map(items.filter((i) => i.catalogId).map((i) => [i.catalogId, i]));
  let added = 0, skipped = 0;
  for (const catalogId of Array.isArray(selection) ? selection : []) {
    // Démos Atlas : identifiant du catalogue ; autres composants : identifiant du registre.
    const i = byCatalog.get(catalogId) ?? (byId.get(catalogId)?.interactive ? byId.get(catalogId) : undefined);
    if (!i) { skipped++; continue; }
    if (!spec.blocks.some((b) => b.id === i.id)) { spec.blocks.push({ id: i.id, note: typeof notes[catalogId] === 'string' ? notes[catalogId] : '' }); added++; }
  }
  persist(); renderSpec(); syncCards();
  toast(added || skipped ? `${added} composant(s) repris${skipped ? ` · ${skipped} fiche(s) sans code dans le registre (liens ou fonds)` : ''}.` : 'La sélection du catalogue est vide.');
}
$('#import-atlas').onclick = importAtlas;

/* ---------- Détail : aperçu, métadonnées, code ---------- */

async function showDetail(id) {
  const i = byId.get(id);
  if (!i) return;
  $('#detail-body').innerHTML = '<p class="help">Chargement…</p>';
  if (!$('#detail').open) $('#detail').showModal();
  let meta;
  try { const r = await fetch(`/api/registry/item?id=${encodeURIComponent(id)}`); if (!r.ok) throw Error(); meta = await r.json(); } catch { $('#detail-body').innerHTML = '<p>Impossible de lire cet item.</p>'; return; }
  const deps = meta.dependencies.length ? `<code>npm install ${esc(meta.dependencies.join(' '))}</code>` : 'Aucun';
  $('#detail-body').innerHTML = `
    <h2 id="detail-title">${esc(i.name)}</h2>
    <p class="detail-meta">${esc(TYPE_LABEL[i.type])} · ${esc(i.category)} · ${esc(i.source)} · <code>${esc(i.id)}</code></p>
    <div class="detail-grid">
      <div class="detail-visual visual ${visualClass(i)}">${visual(i, true)}</div>
      <dl class="facts">
        <dt>Description</dt><dd>${esc(meta.description || '—')}</dd>
        <dt>Licence</dt><dd><span class="lic ${meta.licenseStatus}">${esc(meta.license)}</span>${meta.licenseNotes ? `<br><span class="help">${esc(meta.licenseNotes)}</span>` : ''}</dd>
        ${meta.attribution ? `<dt>Attribution</dt><dd>${esc(meta.attribution)}</dd>` : ''}
        <dt>Paquets npm</dt><dd>${deps}</dd>
        ${meta.registryDependencies.length ? `<dt>Dépendances du registre</dt><dd>${meta.registryDependencies.map((d) => `<code>${esc(d)}</code>`).join(' ')}</dd>` : ''}
        ${meta.font ? `<dt>Styles</dt><dd>${esc(meta.font.styles.map((s) => s.name).join(', '))}</dd><dt>CSS</dt><dd><code>${esc(meta.font.cssUrl)}</code></dd>` : ''}
        <dt>Source</dt><dd>${/^https:\/\//.test(meta.sourceUrl) ? `<a href="${esc(meta.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(meta.source)} ${icon('external')}</a>` : esc(meta.sourceUrl)}</dd>
        <dt>Importé</dt><dd>${esc(meta.importedAt?.slice(0, 10) || '—')}${meta.updatedAt ? ` · mis à jour le ${esc(meta.updatedAt.slice(0, 10))}` : ''}</dd>
        <dd><button class="btn primary" data-toggle="${esc(i.id)}" aria-pressed="${inSpec(i.id)}">${actionLabel(i)}</button></dd>
      </dl>
    </div>
    <div class="files"><h3>Fichiers (${meta.files.length})</h3>${meta.files.map((f, k) => `<details ${k === 0 ? 'open' : ''}><summary>${esc(f.path)} · ${esc(f.role)}${f.target ? ` → ${esc(f.target)}` : ''}</summary><pre class="code"><code>${esc(f.content)}</code></pre></details>`).join('') || '<p class="help">Métadonnées seules.</p>'}</div>`;
  hydrateVisuals($('#detail-body'));
}
$('#close-detail').onclick = () => $('#detail').close();
$('#detail').addEventListener('click', (e) => { if (e.target === $('#detail')) $('#detail').close(); });
$('#detail').addEventListener('close', () => { $('#detail-body').replaceChildren(); });

/* ---------- Événements ---------- */

document.body.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.toggle) { toggle(b.dataset.toggle); if (b.closest('#detail')) { b.innerHTML = actionLabel(byId.get(b.dataset.toggle)); b.setAttribute('aria-pressed', String(inSpec(b.dataset.toggle))); } }
  else if (b.dataset.detail) showDetail(b.dataset.detail);
  else if (b.dataset.show) showType(b.dataset.show);
  else if (b.dataset.move !== undefined) move(Number(b.dataset.move), Number(b.dataset.move) + Number(b.dataset.dir));
  else if (b.dataset.remove !== undefined) { spec.blocks.splice(Number(b.dataset.remove), 1); persist(); renderSpec(); syncCards(); }
  else if (b.dataset.type !== undefined) showType(b.dataset.type);
});
for (const id of [...FILTERS, '#f-light']) $(id).addEventListener('input', () => { visible = PAGE; render(); });
$('#more').onclick = () => { visible += PAGE; render(); };
$('#reset').onclick = () => { for (const id of FILTERS) $(id).value = ''; typeFilter = ''; visible = PAGE; render(); };

/* ---------- Démarrage ---------- */

(async function boot() {
  try {
    const r = await fetch('/api/registry');
    if (!r.ok) throw Error();
    const data = await r.json();
    previewsBuilt = data.previewsBuilt;
    // Ordre par défaut : composants, sections et écrans avec aperçu d'abord, puis thèmes, easings et polices.
    const rank = { component: 0, section: 1, screen: 2, theme: 3, easing: 4, font: 5, lib: 6 };
    // Galerie : uniquement ce qui est interactif, plus les thèmes, polices et easings. Le reste du registre reste accessible au MCP.
    const all = data.items.map((i) => ({ ...i, _hay: haystack(i) }));
    byId = new Map(all.map((i) => [i.id, i]));
    const sorted = all.filter((i) => STYLE_TYPES.has(i.type) || (i.interactive && i.type !== 'lib')).sort((a, b) => rank[a.type] - rank[b.type] || a.name.localeCompare(b.name, 'fr'));
    items = Object.keys(rank).flatMap((t) => interleave(sorted.filter((i) => i.type === t), (i) => i.sourceId));
    // Couleurs et courbes pour les vignettes (thèmes et easings), lues à la demande.
    await Promise.all(items.filter((i) => i.type === 'theme' || i.type === 'easing').map(async (i) => {
      try { const m = await (await fetch(`/api/registry/item?id=${encodeURIComponent(i.id)}`)).json(); i._colors = m.tokens?.colors?.light || {}; i._easings = m.easings || []; } catch { /* vignette simplifiée */ }
    }));
    const visibleItems = items;
    const count = (f) => [...visibleItems.reduce((m, i) => { for (const k of [].concat(f(i))) m.set(k, (m.get(k) || 0) + 1); return m; }, new Map())].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
    $('#f-category').innerHTML += count((i) => i.category).map(([k, n]) => `<option value="${esc(k)}">${esc(k)} (${n})</option>`).join('');
    $('#f-tag').innerHTML += count((i) => i.tags || []).filter(([, n]) => n > 1).map(([k, n]) => `<option value="${esc(k)}">${esc(k)} (${n})</option>`).join('');
    const sources = new Map(visibleItems.filter((i) => !STYLE_TYPES.has(i.type)).map((i) => [i.sourceId, i.source + (i.sourceId === 'panelui-web' ? ' (web)' : '')]));
    $('#f-source').innerHTML += [...sources].sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('');
    const types = count((i) => i.type);
    $('#types').innerHTML = TYPES.map(([t, label]) => `<button class="chip" data-type="${t}" aria-pressed="${t === typeFilter}">${label} <small>${t ? types.find(([k]) => k === t)?.[1] || 0 : visibleItems.length}</small></button>`).join('');
    await loadSpecList();
    renderSpec(); render();
    if (new URLSearchParams(location.search).get('import') === 'atlas') { history.replaceState(null, '', '/builder'); importAtlas(); }
  } catch {
    $('#count').textContent = 'Registre introuvable : lancez « npm run import » puis rechargez.';
    $('#grid').innerHTML = '<div class="empty"><strong>Registre indisponible.</strong><p>Impossible de charger registry/index.json.</p></div>';
  }
})();
