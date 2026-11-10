/* Catalogue Atlas : composants interactifs, sélection = spec en cours (partagée avec le builder), favoris, prompt. */
import {
  $,
  $$,
  esc,
  icon,
  plural,
  norm,
  toast,
  queryWords,
  matchesAll,
  relevance,
  interleave,
  safeHttps,
  api,
  copyText,
  download,
  readDraft,
  writeDraft,
  onDraftChange,
  readFavorites,
  writeFavorites,
  migrateLegacy,
  previewController,
  previewZone,
  setupDialog,
} from '/lib/common.js';
import { buildPrompt } from '/lib/prompt.js';

const PAGE = 18;
const VIEWS = {
  recommend: [
    'Sélection Atlas',
    'Composants testés et animés ici même, avec leur code dans le registre. Ajoutez-les à votre spec, puis ouvrez le builder ou générez un prompt.',
  ],
  components: [
    'Tous les composants',
    'Tous les composants dont l’aperçu interactif a été vérifié. Leur code réel est transmis à Claude Code par le MCP.',
  ],
  new: ['Nouveautés', 'Composants arrivés après le premier import de leur bibliothèque.'],
  selected: ['Ma sélection', 'Les blocs de la spec en cours, dans l’ordre. Le builder affiche la même spec.'],
  favorites: ['Favoris', 'Les composants marqués d’un cœur, conservés dans ce navigateur.'],
};
const FILTERS = ['search', 'source-filter', 'category-filter', 'effect-filter', 'usage-filter', 'license-filter'];

let data = null,
  view = 'recommend',
  visible = PAGE;
let draft = readDraft();
const favorites = readFavorites();
const byId = (id) => data?.byId.get(id);
const inSpec = (id) => draft.blocks.some((b) => b.id === id);
const category = (c) => c.type_label || c.curation?.category || 'Autres composants';

const previews = previewController({
  frameFor(id, el) {
    const c = byId(id);
    if (!c) return null;
    const large = el.classList.contains('detail-zone');
    return c.registry === false && c.curation?.demo
      ? { src: `/demos/index.html?demo=${encodeURIComponent(c.curation.demo)}`, title: `Démonstration interactive : ${c.name}` }
      : {
          src: `/registry-previews/index.html?id=${encodeURIComponent(c.id)}&theme=dark${large ? '' : '&card=1'}`,
          sandbox: 'allow-scripts',
          title: `Aperçu interactif : ${c.name}`,
        };
  },
});

/* ---------- Vues, filtres, rendu ---------- */

function resetFilters() {
  for (const id of FILTERS) $('#' + id).value = '';
  visible = PAGE;
}

function changeView(next) {
  view = next;
  visible = PAGE;
  const [title, intro] = VIEWS[view];
  $('#title').textContent = title;
  $('#intro').textContent = intro;
  for (const b of $$('[data-view]')) {
    const on = b.dataset.view === view;
    b.classList.toggle('active', on);
    b.setAttribute('aria-current', on ? 'page' : 'false');
  }
  $('#sort').value = view === 'new' ? 'recent' : $('#sort').value === 'recent' ? 'relevance' : $('#sort').value;
  render();
}

function results() {
  const words = queryWords($('#search').value);
  const source = $('#source-filter').value,
    cat = $('#category-filter').value,
    effect = $('#effect-filter').value,
    usage = $('#usage-filter').value,
    license = $('#license-filter').value;
  let list = data.components.filter(
    (c) =>
      (view !== 'recommend' || !!c.curation) &&
      (view !== 'new' || c.isNew) &&
      (view !== 'favorites' || favorites.has(c.id)) &&
      (view !== 'selected' || inSpec(c.id)) &&
      (!source || c.source_id === source) &&
      (!cat || category(c) === cat) &&
      (!effect || c.curation?.interaction === effect) &&
      (!usage || c.curation?.usage === usage) &&
      (!license || c.license_status === license) &&
      (!words.length || matchesAll(words, c._hay)),
  );
  const sort = $('#sort').value;
  if (view === 'selected') {
    const order = new Map(draft.blocks.map((b, i) => [b.id, i]));
    return list.sort((a, b) => order.get(a.id) - order.get(b.id));
  }
  if (sort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  if (sort === 'source') return list.sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name, 'fr'));
  if (sort === 'recent')
    return list.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || '') || a.name.localeCompare(b.name, 'fr'));
  if (words.length) {
    const scored = list.map((c) => ({
      c,
      s: relevance(words, { name: c.name, category: category(c), tags: c.tags, text: c._hay }) + (c.curation ? 1 : 0),
    }));
    return scored
      .sort((a, b) => b.s - a.s || (a.c.curation?.order ?? 9999) - (b.c.curation?.order ?? 9999) || a.c.name.localeCompare(b.c.name, 'fr'))
      .map((x) => x.c);
  }
  const curated = list.filter((c) => c.curation).sort((a, b) => a.curation.order - b.curation.order);
  return [
    ...curated,
    ...interleave(
      list.filter((c) => !c.curation),
      (c) => c.source_id,
    ),
  ];
}

function render() {
  if (!data) return;
  previews.reset($('#results'));
  const list = results();
  if (view === 'recommend' || view === 'selected') visible = list.length;
  const scope = {
    selected: ' dans votre sélection',
    favorites: ' dans vos favoris',
    recommend: '',
    components: '',
    new: ' parmi les nouveautés',
  }[view];
  $('#result-count').textContent = list.length;
  $('#scope-text').textContent =
    `résultat${list.length > 1 ? 's' : ''}${scope}${view === 'recommend' ? ' · une recherche ouvre tout le catalogue' : ''}`;
  $('#more').hidden = list.length <= visible;
  const active = FILTERS.filter((id) => $('#' + id).value).length;
  $('#filter-count').textContent = active ? `(${active})` : '';
  $('#reset-filters').hidden = !active;
  const outside = view === 'selected' ? draft.blocks.filter((b) => !byId(b.id)).length : 0;
  if (!list.length) {
    const empty =
      view === 'selected'
        ? [
            'Votre sélection est vide.',
            outside
              ? `${plural(outside, 'bloc ajouté', 'blocs ajoutés')} dans le builder (sections, écrans sans aperçu ici) : ouvrez le builder pour les voir.`
              : 'Cliquez sur « Ajouter » sous un composant : il rejoint la spec en cours, que le builder affiche aussi.',
            'Voir la sélection Atlas',
          ]
        : view === 'favorites'
          ? ['Aucun favori.', 'Le cœur d’une carte l’ajoute ici.', 'Voir la sélection Atlas']
          : [
              'Aucun résultat pour ces critères.',
              'Essayez un autre mot (en français ou en anglais) ou réinitialisez les filtres.',
              'Réinitialiser les filtres',
            ];
    $('#results').innerHTML =
      `<div class="empty"><strong>${empty[0]}</strong><p>${empty[1]}</p><button class="btn" id="empty-reset">${empty[2]}</button></div>`;
    $('#empty-reset').onclick = () => {
      resetFilters();
      if (view === 'selected' || view === 'favorites') changeView('recommend');
      else render();
    };
    syncSelection();
    return;
  }
  $('#results').innerHTML =
    list.slice(0, visible).map(card).join('') +
    (outside
      ? `<p class="help outside">+ ${plural(outside, 'bloc ajouté', 'blocs ajoutés')} dans le builder, sans aperçu ici. <a href="/builder">Ouvrir le builder</a></p>`
      : '');
  previews.observe($('#results'));
  syncSelection();
}

function selectLabel(id) {
  return inSpec(id) ? `${icon('check')}Dans la spec` : `${icon('plus')}Ajouter`;
}

function card(c) {
  const badge = c.curation ? '<span class="badge live">Sélection Atlas</span>' : c.isNew ? '<span class="badge new">Nouveau</span>' : '';
  return `<article class="card ${inSpec(c.id) ? 'is-selected' : ''}" data-card="${esc(c.id)}">
    ${previewZone(c.id, c.name, c.thumb, `${badge}<button class="btn icon-only expand" data-detail="${esc(c.id)}" aria-label="Agrandir ${esc(c.name)}">${icon('expand')}</button>`, c.registry === false ? 'stage' : 'is-registry')}
    <div class="card-body">
      <div class="card-meta"><span>${esc(c.source)}</span>${c.license_status === 'restricted' ? '<span class="lic restricted" title="Licence avec conditions : attribution à prévoir">Conditions</span>' : ''}<button class="fav" data-favorite="${esc(c.id)}" aria-label="${favorites.has(c.id) ? 'Retirer des' : 'Ajouter aux'} favoris : ${esc(c.name)}" aria-pressed="${favorites.has(c.id)}">${icon('heart', favorites.has(c.id) ? 'fill' : '')}</button></div>
      <h3><button data-detail="${esc(c.id)}">${esc(c.name)}</button></h3>
      <p class="component-type">${esc(category(c))}${c.curation ? ` · ${esc(c.curation.interaction)}` : ''}</p>
      <p class="choice-reason">${esc(c.curation?.reason || c.description || '')}</p>
      <div class="card-actions"><button class="btn small select-mini" data-select="${esc(c.id)}" aria-pressed="${inSpec(c.id)}" aria-label="${inSpec(c.id) ? 'Retirer de la spec' : 'Ajouter à la spec'} : ${esc(c.name)}">${selectLabel(c.id)}</button></div>
    </div></article>`;
}

/* ---------- Sélection = blocs de la spec en cours ---------- */

function syncSelection() {
  const count = draft.blocks.length;
  $('#selected-count').textContent = count;
  $('#open-prompt').disabled = !draft.blocks.some((b) => byId(b.id));
  $('#selection-bar').hidden = !count;
  document.body.classList.toggle('has-selection', !!count);
  $('#selection-total').textContent = `${plural(count, 'bloc')} dans la spec${draft.title ? ` « ${draft.title} »` : ''}`;
  $('#fav-count').textContent = data ? data.components.filter((c) => favorites.has(c.id)).length : 0;
  for (const b of $$('[data-select]')) {
    b.innerHTML = selectLabel(b.dataset.select);
    b.setAttribute('aria-pressed', String(inSpec(b.dataset.select)));
  }
  for (const el of $$('[data-card]')) el.classList.toggle('is-selected', inSpec(el.dataset.card));
}

function toggleSelection(id) {
  const c = byId(id);
  if (!c) return;
  if (inSpec(id)) draft.blocks = draft.blocks.filter((b) => b.id !== id);
  else {
    draft.blocks.push({ id, note: '' });
    toast(`${c.name} ajouté à la spec (bloc ${draft.blocks.length}).`);
  }
  writeDraft(draft);
  syncSelection();
  if (view === 'selected') render();
}

onDraftChange((next) => {
  draft = next;
  syncSelection();
  if (view === 'selected') render();
});

/* ---------- Détail ---------- */

function equivalents(c) {
  if (!c.group) return [];
  return data.components
    .filter((x) => x.group === c.group && x.id !== c.id)
    .sort((a, b) => Number(!!b.curation) - Number(!!a.curation) || a.source.localeCompare(b.source))
    .slice(0, 8);
}

function showDetail(c) {
  const atlas = !!c.curation;
  const same = equivalents(c);
  const url = safeHttps(c.url);
  openDialog(`<div class="detail-head">
      <div><h2 id="detail-title">${esc(c.name)}</h2><p class="detail-meta">${esc(c.source)} · ${esc(category(c))}${c.isNew ? ' · <span class="new-tag">Nouveau</span>' : ''}</p></div>
      <div class="detail-actions"><button class="btn ghost icon-only" data-favorite="${esc(c.id)}" aria-pressed="${favorites.has(c.id)}" aria-label="Favori">${icon('heart', favorites.has(c.id) ? 'fill' : '')}</button><button class="btn primary" data-select="${esc(c.id)}" aria-pressed="${inSpec(c.id)}">${selectLabel(c.id)}</button></div>
    </div>
    <div class="demo-toolbar"><span>Aperçu interactif : cliquez, survolez, tapez pour l’essayer.</span>${atlas ? `<button class="btn small ghost" id="replay-demo">${icon('reset')}Rejouer</button>` : ''}</div>
    <div class="detail-preview ${atlas ? '' : 'is-registry'}" id="detail-preview"></div>
    <p class="detail-caption">${esc(c.curation?.reason || c.description || '')}</p>
    <dl class="detail-facts">
      ${atlas ? `<div><dt>Usage</dt><dd>${esc(c.curation.usage)}</dd></div><div><dt>Animation</dt><dd>${esc(c.curation.interaction)}</dd></div>` : ''}
      ${!atlas && c.usages?.length ? `<div><dt>Cas d’usage</dt><dd>${c.usages.map(esc).join(' · ')}</dd></div>` : ''}
      <div><dt>Licence</dt><dd>${esc(c.license)}${c.license_status === 'restricted' ? ' (conditions)' : ''}</dd></div>
      ${c.attribution && c.license_status === 'restricted' ? `<div><dt>Attribution obligatoire</dt><dd>${esc(c.attribution)}</dd></div>` : ''}
      ${c.dependencies?.length ? `<div><dt>Paquets npm</dt><dd><code>${esc(c.dependencies.join(' '))}</code></dd></div>` : ''}
      <div><dt>Code</dt><dd><code>${esc(c.id)}</code> · <a href="/builder#item=${encodeURIComponent(c.id)}">voir le code dans le builder</a></dd></div>
      ${url ? `<div><dt>Source</dt><dd><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(c.source)} ${icon('external')}</a></dd></div>` : ''}
    </dl>
    ${same.length ? `<section class="equivalents" aria-labelledby="eq-title"><h3 id="eq-title">${icon('columns')}Équivalents dans d’autres bibliothèques <span class="count">${same.length}</span></h3><div class="eq-grid">${same.map((x) => `<button class="eq" data-detail="${esc(x.id)}"><strong>${esc(x.name)}</strong><small>${esc(x.source)}${inSpec(x.id) ? ' · dans la spec' : ''}</small></button>`).join('')}</div></section>` : ''}`);
  const zone = document.createElement('div');
  zone.dataset.preview = c.id;
  zone.className = 'detail-zone';
  $('#detail-preview').append(zone);
  previews.mount(zone);
  if (atlas)
    $('#replay-demo').onclick = () => $('#detail-preview iframe')?.contentWindow?.postMessage({ type: 'atlas-replay' }, location.origin);
}

function openDialog(html, mode = 'detail') {
  const dialog = $('#detail');
  dialog.classList.toggle('prompt-dialog', mode === 'prompt');
  $('#detail-body').innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
setupDialog($('#detail'));

/* ---------- Événements ---------- */

document.body.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.dataset.search) {
    resetFilters();
    $('#search').value = button.dataset.search;
    changeView('components');
    return;
  }
  if (button.dataset.select) {
    toggleSelection(button.dataset.select);
    return;
  }
  if (button.dataset.detail) {
    const c = byId(button.dataset.detail);
    if (c) showDetail(c);
    return;
  }
  if (button.dataset.favorite) {
    const id = button.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    writeFavorites(favorites);
    for (const b of $$(`[data-favorite="${CSS.escape(id)}"]`)) {
      b.querySelector('svg').classList.toggle('fill', favorites.has(id));
      b.setAttribute('aria-pressed', String(favorites.has(id)));
    }
    if (view === 'favorites') render();
    else syncSelection();
    return;
  }
  if (button.dataset.remove) {
    draft.blocks = draft.blocks.filter((b) => b.id !== button.dataset.remove);
    writeDraft(draft);
    syncSelection();
    if (view === 'selected') render();
    if (draft.blocks.some((b) => byId(b.id))) showPrompt();
    else {
      $('#detail').close();
      toast('Votre sélection est vide.');
    }
  }
});

for (const id of FILTERS)
  $('#' + id).addEventListener('input', () => {
    visible = PAGE;
    // La sélection Atlas est courte : une recherche ou un filtre de fond ouvre tout le catalogue.
    if (view === 'recommend' && ['search', 'source-filter', 'category-filter'].includes(id) && $('#' + id).value) changeView('components');
    else render();
  });
$('#reset-filters').onclick = () => {
  resetFilters();
  render();
};
for (const b of $$('[data-view]'))
  b.onclick = () => {
    resetFilters();
    changeView(b.dataset.view);
  };
$('#sort').onchange = () => render();
$('#more').onclick = () => {
  visible += PAGE;
  render();
};
$('#review-selection').onclick = () => {
  resetFilters();
  changeView('selected');
};
$('#clear-selection').onclick = () => {
  if (!confirm(`Retirer les ${draft.blocks.length} blocs de la spec en cours ? (Le builder affiche la même spec.)`)) return;
  draft.blocks = [];
  writeDraft(draft);
  syncSelection();
  if (view === 'selected') render();
};

const autoplayButton = $('#autoplay');
function syncAutoplay() {
  autoplayButton.setAttribute('aria-pressed', String(previews.autoplay));
  autoplayButton.querySelector('use').setAttribute('href', `/icons.svg#${previews.autoplay ? 'pause' : 'play'}`);
  autoplayButton.querySelector('span').textContent = previews.autoplay ? 'Animations auto' : 'Animer au survol';
  autoplayButton.title = previews.autoplay
    ? 'Les aperçus visibles s’animent seuls. Cliquer pour ne les animer qu’au survol.'
    : 'Les aperçus s’animent au survol ou au toucher. Cliquer pour les animer tous.';
}
autoplayButton.onclick = () => {
  previews.setAutoplay(!previews.autoplay);
  syncAutoplay();
};
syncAutoplay();

/* ---------- Prompt (assistants sans MCP) ---------- */

const promptItems = () => draft.blocks.map((b) => byId(b.id)).filter(Boolean);

function showPrompt() {
  const items = promptItems();
  if (!items.length) {
    toast('Ajoutez au moins un composant.');
    return;
  }
  const stacks = [
    'React + TypeScript + Tailwind CSS + Motion',
    'Next.js + React + TypeScript + Tailwind CSS + Motion',
    'Stack existante du projet (adapter les composants React si nécessaire)',
  ];
  const stack = draft.stack || stacks[0];
  const pages = [...new Set(draft.blocks.map((b) => b.page).filter(Boolean))];
  openDialog(
    `<div class="prompt-heading"><h2 id="detail-title">Prompt pour ${plural(items.length, 'composant')}</h2><p>Pour un assistant sans accès au registre. Avec Claude Code, préférez le builder et la commande MCP : le code réel est alors transmis.</p></div>
    <div class="prompt-layout">
      <div class="prompt-options">
        <label class="field" for="project-brief">Projet</label>
        <textarea id="project-brief" rows="3" placeholder="Ex. Landing page d’un studio de design : hero, projets, témoignages…">${esc(draft.brief)}</textarea>
        <label class="field" for="project-stack">Technologies</label>
        <select id="project-stack">${[...new Set([stack, ...stacks])].map((s) => `<option ${s === stack ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        <label class="field" for="project-style">Direction visuelle</label>
        <input id="project-style" value="${esc(draft.style)}" placeholder="Ex. Minimaliste, vert sauge, fond clair">
        <h3>Composants inclus <span class="count">${items.length}</span></h3>
        <datalist id="pages-list">${pages.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
        <div class="prompt-components">${items
          .map((c, i) => {
            const block = draft.blocks.find((b) => b.id === c.id);
            return `<div class="prompt-component">
          <div class="prompt-component-head"><span class="component-number">${i + 1}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.source)} · ${esc(category(c))}</small></div><button class="btn icon-only ghost small" data-remove="${esc(c.id)}" aria-label="Retirer ${esc(c.name)} de la spec">${icon('x')}</button></div>
          <div class="prompt-component-fields"><input data-note="${esc(c.id)}" value="${esc(block?.note)}" aria-label="Consigne pour ${esc(c.name)}" placeholder="Consigne : emplacement, contenu, variante…"><input data-page="${esc(c.id)}" value="${esc(block?.page)}" list="pages-list" aria-label="Page de ${esc(c.name)}" placeholder="Page"></div>
        </div>`;
          })
          .join('')}</div>
      </div>
      <div class="prompt-result">
        <label class="field" for="prompt-output">Prompt <span class="help">modifiable · généré sans IA</span></label>
        <textarea id="prompt-output" spellcheck="false">${esc(buildPrompt(items, draft))}</textarea>
        <div class="prompt-buttons"><button class="btn" id="download-prompt">${icon('download')}Télécharger .txt</button><button class="btn primary" id="copy-prompt">${icon('copy')}Copier le prompt</button></div>
      </div>
    </div>`,
    'prompt',
  );
  const update = () => {
    draft.brief = $('#project-brief').value;
    draft.stack = $('#project-stack').value;
    draft.style = $('#project-style').value;
    for (const input of $$('[data-note]')) {
      const b = draft.blocks.find((x) => x.id === input.dataset.note);
      if (b) b.note = input.value;
    }
    for (const input of $$('[data-page]')) {
      const b = draft.blocks.find((x) => x.id === input.dataset.page);
      if (b) {
        if (input.value.trim()) b.page = input.value.trim().slice(0, 60);
        else delete b.page;
      }
    }
    writeDraft(draft);
    $('#prompt-output').value = buildPrompt(promptItems(), draft);
  };
  for (const el of $$('#project-brief,#project-stack,#project-style,[data-note],[data-page]')) el.addEventListener('input', update);
  $('#copy-prompt').onclick = async () =>
    toast((await copyText($('#prompt-output').value, $('#prompt-output'))) ? 'Prompt copié.' : 'Texte sélectionné : utilisez Ctrl+C.');
  $('#download-prompt').onclick = () => download('atlas-prompt.txt', $('#prompt-output').value);
}
$('#open-prompt').onclick = showPrompt;

/* ---------- Aide Claude Code ---------- */

$('#mcp-button').onclick = async () => {
  let info = null;
  try {
    info = await api('/api/info');
  } catch {
    /* commande générique */
  }
  const add = info
    ? `claude mcp add atlas -s user -- ${info.mcp.command} ${info.mcp.args.map((a) => `"${a}"`).join(' ')}`
    : 'claude mcp add atlas -s user -- node --import tsx mcp/index.ts';
  openDialog(
    `<div class="prompt-heading"><h2 id="detail-title">Utiliser avec Claude Code</h2></div>
    <ol class="steps">
      <li><strong>Composer</strong> la spec : ajoutez des composants ici, puis ouvrez le <a href="/builder">builder</a> pour choisir le thème, les polices, l’ordre, les pages et une consigne par bloc.</li>
      <li><strong>Enregistrer</strong> : la spec est écrite dans <code>specs/&lt;nom&gt;.json</code> (les versions remplacées sont gardées).</li>
      <li><strong>Construire</strong> : dans Claude Code, lancez <code>/mcp__atlas__build-from-spec &lt;nom&gt;</code>. Le MCP transmet le code réel de chaque bloc, une seule commande <code>npm install</code> et les crédits obligatoires (CREDITS.md).</li>
      <li><strong>Ou tout poser d’un coup</strong> dans un projet : <code>npm run bundle -- &lt;nom&gt; --out &lt;dossier du projet&gt;</code>.</li>
    </ol>
    <p class="help">Dans ce dépôt, le serveur est déclaré dans <code>.mcp.json</code>. Pour l’utiliser depuis un autre projet :</p>
    <div class="command-line"><code id="mcp-add">${esc(add)}</code><button class="btn small" id="copy-mcp">${icon('copy')}Copier</button></div>`,
    'mcp',
  );
  $('#copy-mcp').onclick = async () => toast((await copyText(add)) ? 'Commande copiée.' : 'Copie impossible : sélectionnez la commande.');
};

/* ---------- Démarrage ---------- */

api('/api/catalog')
  .then((catalog) => {
    data = catalog;
    data.byId = new Map(data.components.map((c) => [c.id, c]));
    for (const c of data.components)
      c._hay = norm(
        [c.search_terms, c.name, c.source, category(c), c.curation?.interaction, c.curation?.usage, c.description, ...(c.tags || [])].join(
          ' ',
        ),
      );
    const legacy = new Map(data.components.filter((c) => c.catalog_id).map((c) => [c.catalog_id, c.id]));
    const moved = migrateLegacy((x) => legacy.get(x) ?? (data.byId.has(x) ? x : undefined));
    if (moved) {
      draft = readDraft();
      toast(`${plural(moved, 'composant')} de votre ancienne sélection ${moved > 1 ? 'ont' : 'a'} rejoint la spec en cours.`);
    }
    $('#nav-count').textContent = data.components.length;
    $('#live-nav').textContent = data.components.filter((c) => c.curation).length;
    const fresh = data.components.filter((c) => c.isNew).length;
    $('#new-nav').textContent = fresh;
    $('[data-view="new"]').hidden = !fresh;
    $('#source-filter').innerHTML += data.sources
      .map((s) => `<option value="${esc(s.id)}">${esc(s.name)} (${s.components})</option>`)
      .join('');
    for (const [id, values] of [
      ['category-filter', data.components.map(category)],
      ['effect-filter', data.components.filter((c) => c.curation).map((c) => c.curation.interaction)],
      ['usage-filter', data.components.filter((c) => c.curation).map((c) => c.curation.usage)],
    ]) {
      $('#' + id).innerHTML += [...new Set(values)]
        .sort((a, b) => a.localeCompare(b, 'fr'))
        .map((v) => `<option value="${esc(v)}">${esc(v)}</option>`)
        .join('');
    }
    if (!data.previewsBuilt) toast('Aperçus du registre non compilés : lancez « npm run previews ».');
    changeView('recommend');
  })
  .catch(() => {
    $('#results').innerHTML =
      '<div class="empty"><strong>Catalogue indisponible.</strong><p>Lancez le serveur (<code>npm start</code>) puis rechargez la page.</p></div>';
  });
