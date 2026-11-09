/* Catalogue Atlas : sélection éditoriale, catalogue de liens, favoris, sélection et prompt. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const aliases = { bouton: 'button', boutons: 'button', carte: 'card', cartes: 'card', tableau: 'table', formulaire: 'form', fenetre: 'dialog', onglet: 'tab', onglets: 'tab', calendrier: 'calendar', texte: 'text', fond: 'background', fonds: 'background' };
const matches = (words, text) => words.every(w => norm(text).includes(w) || norm(text).includes(aliases[w] || w));
const safeURL = v => { try { const u = new URL(v); return u.protocol === 'https:' ? esc(u.href) : '#'; } catch { return '#'; } };
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="/icons.svg#${name}"/></svg>`;
function stored(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
function readSet(key) { const v = stored(key, []); return new Set(Array.isArray(v) ? v.filter(x => typeof x === 'string') : []); }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Stockage indisponible : vos choix restent conservés pour cette session.'); } }

let data, view = 'recommend', visible = 18, displayed = [], generation = 0, detailId = null, modalMode = null, paused = false;
const selected = readSet('atlas-selection'), favorites = readSet('atlas-favorites');
let draft = stored('atlas-prompt-draft', {});
if (!draft || typeof draft !== 'object' || Array.isArray(draft)) draft = {};
for (const key of ['project', 'stack', 'style']) if (typeof draft[key] !== 'string') draft[key] = '';
if (!draft.notes || typeof draft.notes !== 'object' || Array.isArray(draft.notes)) draft.notes = {};
for (const key of Object.keys(draft.notes)) if (typeof draft.notes[key] !== 'string') delete draft.notes[key];

const VIEWS = {
  recommend: ['Sélection Atlas', '44 composants testés et animés ici même, avec leur code dans le registre. Sélectionnez-les, puis envoyez-les au builder ou générez un prompt.'],
  components: ['Tous les composants', 'Tous les composants interactifs du registre, essayables ici et dont le code réel est transmis à Claude Code.'],
  selected: ['Ma sélection', 'Les éléments sélectionnés, conservés dans ce navigateur.'],
  favorites: ['Favoris', 'Les composants marqués d’un cœur.'],
};
const isLive = c => !!c.curation?.demo || !!c.registry;
const byId = id => data?.components.find(c => c.id === id);
const selectedItems = () => [...selected].map(byId).filter(Boolean);
const category = c => c.type_label || c.curation?.category || 'Autres composants';
const isBackground = c => AtlasPrompt.isBackground(c);
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

function toast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('visible'), 3200); }
function modal(html, mode = 'detail') { modalMode = mode; $('#detail').classList.toggle('prompt-dialog', mode === 'prompt'); $('#detail-body').innerHTML = html; if (!$('#detail').open) $('#detail').showModal(); }
$('.close').onclick = () => $('#detail').close();
$('#detail').addEventListener('close', () => { if ($('#detail').open) return; detailId = null; modalMode = null; $('#detail-body').replaceChildren(); });
$('#detail').addEventListener('click', e => { if (e.target !== $('#detail')) return; const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); });

function selectionSummary(items) { const n = items.filter(isBackground).length, m = items.length - n; return [n ? plural(n, 'fond') : '', m ? plural(m, 'composant') : ''].filter(Boolean).join(' + '); }

/* Ordre par défaut : une source après l'autre, pour éviter qu'une bibliothèque à variantes (Origin UI) monopolise l'écran. */
function interleave(list, key) {
  const groups = new Map();
  for (const item of list) { const k = key(item); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(item); }
  const queues = [...groups.values()], out = [];
  for (let round = 0; out.length < list.length; round++) for (const q of queues) if (round < q.length) out.push(q[round]);
  return out;
}

/* ---------- Aperçus ---------- */

function demoFrame(c, large = false) {
  return `<iframe class="live-demo" ${large ? 'src' : 'data-src'}="/demos/index.html?demo=${encodeURIComponent(c.curation.demo)}" title="Démonstration interactive : ${esc(c.name)}" data-demo-id="${c.id}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer"></iframe>`;
}
function registryFrame(c, large = false) {
  // Code tiers importé : iframe sandboxée (origine opaque, aucun accès à cette page ni au stockage).
  return `<iframe class="registry-demo" ${large ? 'src' : 'data-src'}="/registry-previews/index.html?id=${encodeURIComponent(c.registry_id)}&theme=dark${large ? '' : '&card=1'}" title="Aperçu interactif : ${esc(c.name)}" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>`;
}
function previewMarkup(c, large = false) {
  return c.registry ? registryFrame(c, large) : demoFrame(c, large);
}
const demoObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const frame = entry.target;
    frame.dataset.visible = String(entry.isIntersecting);
    if (entry.isIntersecting && frame.dataset.src) { frame.src = frame.dataset.src; delete frame.dataset.src; }
    if (frame.getAttribute('src')) frame.contentWindow?.postMessage({ type: 'atlas-playback', playing: entry.isIntersecting && !paused }, location.origin);
  }
}, { rootMargin: '180px' });
function mountDemos() { $$('#results iframe.live-demo, #results iframe.registry-demo').forEach(f => demoObserver.observe(f)); }
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'atlas-demo-ready') return;
  const frame = $$('iframe.live-demo').find(f => f.contentWindow === event.source);
  if (frame) { frame.dataset.ready = 'true'; frame.contentWindow.postMessage({ type: 'atlas-playback', playing: !paused && frame.dataset.visible !== 'false' }, location.origin); }
});
$('#pause-all').onclick = () => {
  paused = !paused;
  const b = $('#pause-all');
  b.setAttribute('aria-pressed', String(paused));
  b.querySelector('use').setAttribute('href', `/icons.svg#${paused ? 'play' : 'pause'}`);
  b.querySelector('span').textContent = paused ? 'Reprendre les animations' : 'Pause des animations';
  $$('iframe.live-demo').forEach(f => f.contentWindow?.postMessage({ type: 'atlas-playback', playing: !paused }, location.origin));
};
/* ---------- Vues et filtres ---------- */

const filterIds = ['search', 'source-filter', 'license-filter', 'category-filter', 'effect-filter', 'usage-filter'];
function resetFilters() { for (const id of filterIds) $('#' + id).value = ''; visible = 18; }
function changeView(next) {
  view = next; visible = 18;
  const [title, intro] = VIEWS[view];
  $('#title').textContent = title; $('#intro').textContent = intro;
  $$('[data-view]').forEach(b => { const on = b.dataset.view === view; b.classList.toggle('active', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  render();
}
for (const id of filterIds) $('#' + id).addEventListener('input', () => {
  visible = 18;
  if (view === 'recommend' && ['search', 'source-filter', 'category-filter'].includes(id) && $('#' + id).value) changeView('components'); else render();
});
$('#reset-filters').onclick = () => { resetFilters(); render(); };
$$('[data-view]').forEach(b => b.onclick = () => { resetFilters(); changeView(b.dataset.view); });
$('#sort').onchange = () => render();
$('#more').onclick = () => { visible += 18; render(); };

function render() {
  if (!data) return;
  generation++; demoObserver.disconnect();
  const q = norm($('#search').value.trim()).split(/\s+/).filter(Boolean), source = $('#source-filter').value, cat = $('#category-filter').value, effect = $('#effect-filter').value, usage = $('#usage-filter').value, license = $('#license-filter').value;
  let items = data.components.filter(c => (view !== 'recommend' || !!c.curation) && (view !== 'selected' || selected.has(c.id)) && (view !== 'favorites' || favorites.has(c.id)) && (!source || c.source_id === source) && (!cat || category(c) === cat) && (!effect || c.curation?.interaction === effect) && (!usage || c.curation?.usage === usage) && (!license || (c.license_status || 'open') === license) && matches(q, [c.search_terms || '', c.name, c.source, category(c), c.curation?.interaction || '', c.curation?.usage || ''].join(' ')));
  items.sort((a, b) => {
    switch ($('#sort').value) {
      case 'name': return a.name.localeCompare(b.name);
      case 'source': return a.source.localeCompare(b.source) || a.name.localeCompare(b.name);
      default: return (a.curation?.order ?? 9999) - (b.curation?.order ?? 9999) || a.name.localeCompare(b.name);
    }
  });
  if ($('#sort').value === 'selection') items.splice(0, items.length, ...items.filter(c => c.curation), ...interleave(items.filter(c => !c.curation), c => c.source_id));
  if (view === 'recommend') visible = items.length;
  const scope = { selected: ' dans votre sélection', favorites: ' dans vos favoris', recommend: '', components: '' }[view];
  $('#result-count').textContent = items.length;
  $('#scope-text').textContent = `résultat${items.length > 1 ? 's' : ''}${scope}${view === 'recommend' ? ' · une recherche ouvre tout le catalogue' : ''}`;
  $('#more').hidden = items.length <= visible;
  const active = filterIds.filter(id => $('#' + id).value).length;
  $('#filter-count').textContent = active ? `(${active})` : '';
  $('#reset-filters').hidden = !active;
  displayed = items.slice(0, visible);
  if (!items.length) {
    const empty = view === 'selected' ? ['Votre sélection est vide.', 'Cliquez sur « Sélectionner » sous un composant. Vos choix restent disponibles entre les recherches.', 'Voir la sélection Atlas'] : view === 'favorites' ? ['Aucun favori.', 'Le cœur d’une carte l’ajoute ici.', 'Voir la sélection Atlas'] : ['Aucun résultat pour ces critères.', 'Essayez un autre type ou réinitialisez les filtres.', 'Réinitialiser les filtres'];
    $('#results').innerHTML = `<div class="empty"><strong>${empty[0]}</strong><p>${empty[1]}</p><button class="btn" id="empty-reset">${empty[2]}</button></div>`;
    $('#empty-reset').onclick = () => { resetFilters(); if (view === 'selected' || view === 'favorites') changeView('recommend'); else render(); };
    syncSelection(); return;
  }
  $('#results').innerHTML = items.slice(0, visible).map(componentCard).join('');
  mountDemos(); syncSelection();
}

function selectLabel(id) { return selected.has(id) ? `${icon('check')}Sélectionné` : `${icon('plus')}Sélectionner`; }
function componentCard(c) {
  const restricted = c.license_status === 'restricted';
  return `<article class="card ${selected.has(c.id) ? 'is-selected' : ''}" data-card="${c.id}">
    <div class="visual ${c.registry ? 'is-registry' : 'is-live'}" data-preview="${c.id}"><div class="preview-content">${previewMarkup(c)}</div>${c.curation ? '<span class="badge live">Sélection Atlas</span>' : ''}<button class="btn icon-only expand" data-detail="${c.id}" aria-label="Agrandir ${esc(c.name)}">${icon('expand')}</button></div>
    <div class="card-body">
      <div class="card-meta"><span>${esc(c.source)}</span>${restricted ? '<span class="lic restricted" title="Licence avec conditions : attribution à prévoir">Conditions</span>' : ''}<button class="fav" data-favorite="${c.id}" aria-label="${favorites.has(c.id) ? 'Retirer des' : 'Ajouter aux'} favoris : ${esc(c.name)}" aria-pressed="${favorites.has(c.id)}">${icon('heart', favorites.has(c.id) ? 'fill' : '')}</button></div>
      <h3><button data-detail="${c.id}">${esc(c.name)}</button></h3>
      <p class="component-type">${esc(category(c))}${c.curation ? ` · ${esc(c.curation.interaction)}` : ''}</p>
      <p class="choice-reason">${esc(c.curation?.reason || c.description || '')}</p>
      <div class="card-actions"><button class="btn small select-mini" data-select="${c.id}" aria-pressed="${selected.has(c.id)}" aria-label="Sélectionner ${esc(c.name)}">${selectLabel(c.id)}</button></div>
    </div></article>`;
}

/* ---------- Sélection ---------- */

function syncSelection() {
  const items = selectedItems(), count = items.length;
  $('#selected-count').textContent = count;
  $('#open-prompt').disabled = !count;
  $('#selection-bar').hidden = !count;
  document.body.classList.toggle('has-selection', !!count);
  $('#selection-total').textContent = `${selectionSummary(items)} sélectionné${count > 1 ? 's' : ''}`;
  $('#fav-count').textContent = data.components.filter(c => favorites.has(c.id)).length;
  $$('[data-select]').forEach(b => { b.innerHTML = selectLabel(b.dataset.select); b.setAttribute('aria-pressed', String(selected.has(b.dataset.select))); });
  $$('[data-card]').forEach(card => card.classList.toggle('is-selected', selected.has(card.dataset.card)));
}
function toggleSelection(id) { if (!byId(id)) return; selected.has(id) ? selected.delete(id) : selected.add(id); save('atlas-selection', [...selected]); syncSelection(); if (view === 'selected') render(); }

function showDetail(c) {
  detailId = c.id;
  const atlas = !!c.curation;
  modal(`<div class="detail-head">
      <div><h2 id="detail-title">${esc(c.name)}</h2><p class="detail-meta">${esc(c.source)} · ${esc(category(c))}</p></div>
      <button class="btn primary" data-select="${c.id}" aria-pressed="${selected.has(c.id)}">${selectLabel(c.id)}</button>
    </div>
    <div class="demo-toolbar"><span>Aperçu interactif : cliquez et survolez pour l’essayer.</span>${atlas ? `<button class="btn small ghost" id="replay-demo">${icon('reset')}Rejouer</button>` : ''}</div>
    <div class="detail-preview detail-live ${c.registry ? 'is-registry' : ''}" id="detail-preview">${previewMarkup(c, true)}</div>
    <p class="detail-caption">${esc(c.curation?.reason || c.description || '')}</p>
    <dl class="detail-facts">
      ${atlas ? `<div><dt>Usage</dt><dd>${esc(c.curation.usage)}</dd></div><div><dt>Animation</dt><dd>${esc(c.curation.interaction)}</dd></div>` : ''}
      <div><dt>Licence</dt><dd>${esc(atlas ? c.curation.license : c.license)}${c.license_status === 'restricted' ? ' (conditions)' : ''}</dd></div>
      ${c.attribution && c.license_status === 'restricted' ? `<div><dt>Attribution</dt><dd>${esc(c.attribution)}</dd></div>` : ''}
      ${c.dependencies?.length ? `<div><dt>Paquets npm</dt><dd><code>${esc(c.dependencies.join(' '))}</code></dd></div>` : ''}
      <div><dt>Code</dt><dd>Dans le registre : <code>${esc(c.registry_id || c.id)}</code>, visible dans le builder et transmis par le MCP.</dd></div>
      <div><dt>Source</dt><dd><a href="${safeURL(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.source)} ${icon('external')}</a></dd></div>
    </dl>`);
  if (atlas) $('#replay-demo').onclick = () => $('#detail-preview iframe').contentWindow.postMessage({ type: 'atlas-replay' }, location.origin);
}

document.body.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.dataset.search) { resetFilters(); $('#search').value = button.dataset.search; changeView('components'); return; }
  if (button.dataset.select) { toggleSelection(button.dataset.select); return; }
  if (button.dataset.detail) { showDetail(byId(button.dataset.detail)); return; }
  if (button.dataset.favorite) {
    const id = button.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    save('atlas-favorites', [...favorites]);
    button.querySelector('svg').classList.toggle('fill', favorites.has(id));
    button.setAttribute('aria-pressed', String(favorites.has(id)));
    if (view === 'favorites') render(); else syncSelection();
    return;
  }
  if (button.dataset.remove) {
    selected.delete(button.dataset.remove); save('atlas-selection', [...selected]); syncSelection();
    if (view === 'selected') render();
    if (selectedItems().length) showPrompt(); else { $('#detail').close(); toast('Votre sélection est vide.'); }
  }
});
$('#review-selection').onclick = () => { resetFilters(); changeView('selected'); };
$('#clear-selection').onclick = () => { selected.clear(); save('atlas-selection', []); syncSelection(); if (view === 'selected') render(); };

/* ---------- Prompt ---------- */

function generatePrompt() { return AtlasPrompt.buildPrompt(selectedItems(), draft); }
function showPrompt() {
  const items = selectedItems();
  if (!items.length) { toast('Sélectionnez au moins un composant.'); return; }
  detailId = null;
  const stacks = ['React + TypeScript + Tailwind CSS + Motion', 'Next.js + React + TypeScript + Tailwind CSS + Motion', 'Stack existante du projet (adapter les composants React si nécessaire)'];
  modal(`<div class="prompt-heading"><h2 id="detail-title">Prompt pour ${esc(selectionSummary(items))}</h2><p>Décrivez le projet et la place de chaque élément, puis copiez le texte dans votre assistant. Avec Claude Code, préférez « Envoyer au builder » : le code réel est alors transmis par le MCP.</p></div>
    <div class="prompt-layout">
      <div class="prompt-options">
        <label class="field" for="project-brief">Projet</label>
        <textarea id="project-brief" rows="3" placeholder="Ex. Landing page d’un studio de design : hero, projets, témoignages…">${esc(draft.project || '')}</textarea>
        <label class="field" for="project-stack">Technologies</label>
        <select id="project-stack">${stacks.map(s => `<option ${s === (draft.stack || stacks[0]) ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        <label class="field" for="project-style">Direction visuelle</label>
        <input id="project-style" value="${esc(draft.style || '')}" placeholder="Ex. Minimaliste, vert sauge, fond clair">
        <h3>Éléments inclus <span class="count">${items.length}</span></h3>
        <div class="prompt-components">${items.map((c, i) => `<div class="prompt-component">
          <div class="prompt-component-head"><span class="component-number">${i + 1}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.source)} · ${isBackground(c) ? 'Fond' : esc(category(c))}</small></div><button class="btn icon-only ghost small" data-remove="${c.id}" aria-label="Retirer ${esc(c.name)} de la sélection">${icon('x')}</button></div>
          <input data-note="${c.id}" value="${esc(draft.notes[c.id] || '')}" aria-label="Consigne pour ${esc(c.name)}" placeholder="${isBackground(c) ? 'Ex. Fond du hero, voile sombre sous les titres' : 'Ex. Dans le hero, au-dessus du fond'}">
        </div>`).join('')}</div>
      </div>
      <div class="prompt-result">
        <label class="field" for="prompt-output">Prompt <span class="help">modifiable · généré sans IA</span></label>
        <textarea id="prompt-output" spellcheck="false">${esc(generatePrompt())}</textarea>
        <div class="prompt-buttons"><button class="btn" id="download-prompt">${icon('download')}Télécharger .txt</button><button class="btn primary" id="copy-prompt">${icon('copy')}Copier le prompt</button></div>
      </div>
    </div>`, 'prompt');
  const update = () => {
    draft.project = $('#project-brief').value; draft.stack = $('#project-stack').value; draft.style = $('#project-style').value;
    $$('[data-note]').forEach(input => draft.notes[input.dataset.note] = input.value);
    save('atlas-prompt-draft', draft);
    $('#prompt-output').value = generatePrompt();
  };
  for (const el of $$('#project-brief,#project-stack,#project-style,[data-note]')) el.addEventListener('input', update);
  $('#copy-prompt').onclick = async () => {
    const text = $('#prompt-output').value;
    try { await navigator.clipboard.writeText(text); toast('Prompt copié.'); }
    catch { $('#prompt-output').focus(); $('#prompt-output').select(); try { toast(document.execCommand('copy') ? 'Prompt copié.' : 'Texte sélectionné : utilisez Ctrl+C.'); } catch { toast('Texte sélectionné : utilisez Ctrl+C.'); } }
  };
  $('#download-prompt').onclick = () => { const url = URL.createObjectURL(new Blob([$('#prompt-output').value], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'atlas-prompt.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
}
$('#open-prompt').onclick = showPrompt;

$('#mcp-button').onclick = () => {
  detailId = null;
  modal(`<div class="prompt-heading"><h2 id="detail-title">Utiliser avec Claude Code</h2></div>
    <ol class="steps">
      <li><strong>Composer</strong> une spec dans le <a href="/builder">builder</a> : un thème, des blocs dans l’ordre, une note par bloc. Ou sélectionnez ici puis « Envoyer au builder ».</li>
      <li><strong>Enregistrer</strong> : la spec est écrite dans <code>specs/&lt;nom&gt;.json</code>.</li>
      <li><strong>Construire</strong> : dans Claude Code, ouvert dans ce repo, lancez <code>/mcp__atlas__build-from-spec &lt;nom&gt;</code>. Le serveur MCP transmet le code réel de chaque bloc, sa licence et les attributions obligatoires.</li>
    </ol>
    <p class="help">Le serveur est déclaré dans <code>.mcp.json</code> (approbation demandée au premier lancement de <code>claude</code>). Depuis un autre projet : <code>claude mcp add atlas -- node /chemin/vers/Apple_apps/dist/mcp/index.js</code></p>`, 'mcp');
};

fetch('/api/catalog').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(catalog => {
  data = catalog;
  $('#nav-count').textContent = data.components.length;
  $('#live-nav').textContent = data.components.filter(c => c.curation).length;
  $('#source-filter').innerHTML += data.sources.map(s => `<option value="${esc(s.id)}">${esc(s.name)} (${s.components})</option>`).join('');
  for (const [id, values] of [['category-filter', data.components.map(category)], ['effect-filter', data.components.filter(c => c.curation).map(c => c.curation.interaction)], ['usage-filter', data.components.filter(c => c.curation).map(c => c.curation.usage)]])
    $('#' + id).innerHTML += [...new Set(values)].sort((a, b) => a.localeCompare(b)).map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  changeView('recommend');
}).catch(() => { $('#results').innerHTML = '<div class="empty"><strong>Catalogue indisponible.</strong><p>Redémarrez le serveur Python puis rechargez la page.</p></div>'; });
