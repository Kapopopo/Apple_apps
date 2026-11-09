/* Socle commun du catalogue et du builder : utilitaires, stockage, recherche, panier (spec en cours), aperçus. */

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="/icons.svg#${name}"/></svg>`;
export const plural = (n, word, many = `${word}s`) => `${n} ${n > 1 ? many : word}`;
export const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
export const shortLicense = (l) => String(l).replace(/^LicenseRef-/, '').replace('MIT-Commons-Clause-Attribution', 'MIT + conditions').replace('Commons-Clause', 'MIT + Commons Clause').replace('ITF-FFL', 'ITF FFL');
export const safeHttps = (v) => { try { const u = new URL(v); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };

export const TYPE_LABEL = { component: 'Composant', section: 'Section', screen: 'Écran', theme: 'Thème', font: 'Police', easing: 'Mouvement', sound: 'Son', lib: 'Utilitaire' };
export const STYLE_TYPES = new Set(['theme', 'font', 'easing', 'sound']);

/* ---------- Stockage local (navigateur) ---------- */

export const store = {
  get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* stockage indisponible */ } },
};

export function toast(message) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('visible'), 3600);
}

/* ---------- Recherche : vocabulaire français → anglais, pertinence ---------- */

export const ALIASES = {
  bouton: 'button', boutons: 'button', carte: 'card', cartes: 'card', tableau: 'table', tableaux: 'table', formulaire: 'form', formulaires: 'form',
  fenetre: 'dialog', modale: 'modal', onglet: 'tab', onglets: 'tab', calendrier: 'calendar', texte: 'text', textes: 'text', fond: 'background', fonds: 'background',
  police: 'font', polices: 'font', graphique: 'chart', graphiques: 'chart', carrousel: 'carousel', caroussel: 'carousel', curseur: 'slider', menu: 'menu',
  navigation: 'nav', tarif: 'pricing', tarifs: 'pricing', prix: 'pricing', connexion: 'login', inscription: 'sign', temoignage: 'testimonial', temoignages: 'testimonial',
  pied: 'footer', entete: 'header', recherche: 'search', notification: 'toast', chargement: 'loader', avatar: 'avatar', etoile: 'star', etoiles: 'rating', son: 'sound', sons: 'sound',
};
export const queryWords = (q) => norm(q).split(/\s+/).filter(Boolean);
const variants = (w) => (ALIASES[w] ? [w, ALIASES[w]] : [w]);
export const matchesAll = (words, hay) => words.every((w) => variants(w).some((v) => hay.includes(v)));

/** Score de pertinence : nom exact > début du nom > nom > catégorie > tags > reste du texte. */
export function relevance(words, { name, category = '', tags = [], text = '' }) {
  const n = norm(name), c = norm(category), t = tags.map(norm), x = norm(text);
  let score = 0;
  for (const w of words) {
    let best = 0;
    for (const v of variants(w)) {
      const s = n === v ? 12 : n.startsWith(v) ? 8 : n.includes(v) ? 5 : c.includes(v) ? 3 : t.some((tag) => tag.includes(v)) ? 2 : x.includes(v) ? 1 : 0;
      best = Math.max(best, s);
    }
    score += best;
  }
  return score;
}

/** Ordre par défaut : une source après l'autre, pour qu'une bibliothèque à variantes ne monopolise pas l'écran. */
export function interleave(list, key) {
  const groups = new Map();
  for (const item of list) { const k = key(item); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(item); }
  const queues = [...groups.values()], out = [];
  for (let round = 0; out.length < list.length; round++) for (const q of queues) if (round < q.length) out.push(q[round]);
  return out;
}

/** Restaure licenseNotes / attribution depuis la table des sources de l'index (textes communs stockés une fois). */
export function hydrateLicenses(items, sources = {}) {
  for (const i of items) {
    const s = sources[i.sourceId];
    if (!s || s.license !== i.license) continue;
    if (i.licenseNotes === undefined && s.licenseNotes) i.licenseNotes = s.licenseNotes;
    if (i.attribution === undefined && s.attribution) i.attribution = s.attribution;
  }
  return items;
}

/* ---------- Panier commun : la spec en cours, partagée par le catalogue et le builder ---------- */

export const DRAFT_KEY = 'atlas-builder-draft';
export const FAVORITES_KEY = 'atlas-favs';
export const blankSpec = () => ({ name: '', title: '', brief: '', stack: '', style: '', theme: null, fonts: [], easings: [], sounds: [], blocks: [], loadedFrom: null });

export function readDraft() {
  const raw = store.get(DRAFT_KEY, {});
  const spec = Object.assign(blankSpec(), raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {});
  for (const k of ['name', 'title', 'brief', 'stack', 'style']) if (typeof spec[k] !== 'string') spec[k] = '';
  for (const k of ['fonts', 'easings', 'sounds']) spec[k] = Array.isArray(spec[k]) ? spec[k].filter((x) => typeof x === 'string') : [];
  if (typeof spec.theme !== 'string') spec.theme = null;
  if (typeof spec.loadedFrom !== 'string') spec.loadedFrom = null;
  spec.blocks = (Array.isArray(spec.blocks) ? spec.blocks : []).filter((b) => b && typeof b.id === 'string').map(cleanBlock);
  return spec;
}
export const cleanBlock = (b) => ({ id: b.id, note: typeof b.note === 'string' ? b.note.slice(0, 2000) : '', ...(typeof b.page === 'string' && b.page.trim() ? { page: b.page.trim().slice(0, 60) } : {}) });

export function writeDraft(spec) {
  if (!store.set(DRAFT_KEY, spec)) toast('Stockage du navigateur indisponible : la spec reste en mémoire pour cette session.');
}

/** Autre onglet (catalogue ↔ builder) : la spec a changé. */
export function onDraftChange(callback) {
  window.addEventListener('storage', (e) => { if (e.key === DRAFT_KEY) callback(readDraft()); });
}

export function readFavorites() {
  const v = store.get(FAVORITES_KEY, []);
  return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
}
export const writeFavorites = (set) => store.set(FAVORITES_KEY, [...set]);

/**
 * Anciennes données du catalogue (sélection, notes et projet du prompt, favoris, par id de catalogue)
 * → panier commun et favoris par id du registre. Exécuté une fois, puis les anciennes clés sont retirées.
 */
export function migrateLegacy(legacyToRegistry) {
  const selection = store.get('atlas-selection', null), draft = store.get('atlas-prompt-draft', null), favs = store.get('atlas-favorites', null);
  if (selection === null && draft === null && favs === null) return 0;
  const spec = readDraft();
  const notes = draft && typeof draft.notes === 'object' && draft.notes ? draft.notes : {};
  let moved = 0;
  for (const legacy of Array.isArray(selection) ? selection : []) {
    const id = legacyToRegistry(legacy);
    if (!id || spec.blocks.some((b) => b.id === id)) continue;
    spec.blocks.push({ id, note: typeof notes[legacy] === 'string' ? notes[legacy] : '' });
    moved++;
  }
  if (draft && typeof draft === 'object') {
    if (!spec.brief && typeof draft.project === 'string') spec.brief = draft.project;
    if (!spec.stack && typeof draft.stack === 'string') spec.stack = draft.stack;
    if (!spec.style && typeof draft.style === 'string') spec.style = draft.style;
  }
  writeDraft(spec);
  const favorites = readFavorites();
  for (const legacy of Array.isArray(favs) ? favs : []) { const id = legacyToRegistry(legacy); if (id) favorites.add(id); }
  writeFavorites(favorites);
  for (const key of ['atlas-selection', 'atlas-prompt-draft', 'atlas-favorites']) store.remove(key);
  return moved;
}

/* ---------- Aperçus : vignette, iframe montée à la demande, plafond d'iframes actives ---------- */

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const AUTOPLAY_KEY = 'atlas-autoplay';
export const autoplayDefault = () => store.get(AUTOPLAY_KEY, !reducedMotion()) !== false;

/**
 * Gère les zones `[data-preview]` d'un conteneur :
 *  - animations auto : l'aperçu interactif se monte quand la carte est visible ;
 *  - sinon : vignette (si l'audit en a produit une), aperçu au survol, au focus ou au toucher ;
 *  - au plus `maxLive` iframes actives (les plus anciennes hors survol sont démontées), démontage hors écran.
 * `frameFor(id)` renvoie { src, sandbox?, title } ou null.
 */
export function previewController({ frameFor, maxLive = 12, onMount }) {
  let autoplay = autoplayDefault();
  const live = new Set();
  const leaveTimers = new WeakMap();
  const io = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      target.dataset.visible = String(isIntersecting);
      if (isIntersecting && (autoplay || !target.dataset.thumb)) mount(target);
      else if (!isIntersecting) unmount(target);
    }
  }, { rootMargin: '160px 0px' });

  function mount(el) {
    clearTimeout(leaveTimers.get(el));
    if (el.querySelector(':scope > iframe')) { live.delete(el); live.add(el); return; }
    const frame = frameFor(el.dataset.preview, el);
    if (!frame) return;
    const f = document.createElement('iframe');
    f.src = frame.src;
    f.title = frame.title;
    f.tabIndex = -1;
    f.referrerPolicy = 'no-referrer';
    if (frame.sandbox) f.setAttribute('sandbox', frame.sandbox);
    el.prepend(f);
    el.classList.add('is-live');
    live.add(el);
    onMount?.(el, f);
    for (const other of live) if (!other.isConnected) live.delete(other);
    for (const other of live) {
      if (live.size <= maxLive) break;
      if (other !== el && !other.closest('dialog') && !other.matches(':hover') && !other.contains(document.activeElement)) unmount(other);
    }
  }
  function unmount(el) {
    clearTimeout(leaveTimers.get(el));
    el.querySelector(':scope > iframe')?.remove();
    el.classList.remove('is-live');
    live.delete(el);
  }
  const zone = (e) => e.target.closest?.('[data-preview]');
  const enter = (e) => { const el = zone(e); if (el) mount(el); };
  const leave = (e) => {
    const el = zone(e);
    if (!el || autoplay || !el.dataset.thumb || el.contains(e.relatedTarget)) return;
    leaveTimers.set(el, setTimeout(() => { if (!el.matches(':hover')) unmount(el); }, 1500));
  };

  return {
    /** Observe les zones d'aperçu d'un conteneur (à rappeler après chaque rendu). */
    observe(root) {
      for (const el of $$('[data-preview]', root)) io.observe(el);
      if (!root.dataset.previewEvents) {
        root.dataset.previewEvents = '1';
        root.addEventListener('pointerover', enter);
        root.addEventListener('pointerout', leave);
        root.addEventListener('focusin', (e) => { const card = e.target.closest?.('[data-card]'); const el = card && $('[data-preview]', card); if (el) mount(el); });
      }
    },
    /** Avant un nouveau rendu d'un conteneur : arrête l'observation et démonte ses aperçus (pas ceux d'une fenêtre ouverte). */
    reset(root) { io.disconnect(); for (const el of [...live]) if (!el.isConnected || root.contains(el)) unmount(el); },
    get autoplay() { return autoplay; },
    setAutoplay(value) {
      autoplay = value;
      store.set(AUTOPLAY_KEY, value);
      for (const el of $$('[data-preview]')) {
        if (value && el.dataset.visible === 'true') mount(el);
        else if (!value && el.dataset.thumb && !el.matches(':hover')) unmount(el);
      }
    },
    reload() { for (const el of [...live]) { unmount(el); if (el.dataset.visible === 'true' && (autoplay || !el.dataset.thumb)) mount(el); } },
    mount,
  };
}

/** Zone d'aperçu d'une carte : vignette éventuelle + emplacement de l'iframe. */
export function previewZone(id, name, thumb, extra = '', cls = '') {
  return `<div class="visual ${cls}" data-preview="${esc(id)}" data-name="${esc(name)}"${thumb ? ' data-thumb="1"' : ''}>${thumb ? `<img class="thumb" src="${esc(thumb)}" alt="" loading="lazy" decoding="async">` : `<span class="visual-hint">${icon('play')}Survoler pour animer</span>`}${extra}</div>`;
}

/* ---------- Fenêtre modale partagée ---------- */

export function setupDialog(dialog, onClose) {
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
  // L'événement close est asynchrone : si la fenêtre a été rouverte entre-temps, son nouveau contenu est conservé.
  dialog.addEventListener('close', () => { if (dialog.open) return; onClose?.(); $('.dialog-body', dialog)?.replaceChildren(); });
  $('.close', dialog)?.addEventListener('click', () => dialog.close());
}

export async function copyText(text, input) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    if (!input) return false;
    input.focus(); input.select();
    try { return document.execCommand('copy'); } catch { return false; }
  }
}

export function download(name, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** JSON d'une API locale ; lève une erreur lisible (message du serveur) sinon. */
export async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, body === undefined ? { method } : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const error = new Error(data.error || `Erreur ${r.status}`); error.status = r.status; error.data = data; throw error; }
  return data;
}
