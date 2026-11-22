/* Section « App mobile » du builder : champs reliés à spec.mobile par data-m (chemin pointé). */
import { $, $$, esc, icon } from './common.js';
import { ILLUSTRATIONS, LAYOUT_LABEL, LIMITS, SPACINGS, TRIAL_PLANS } from './mobile.js';

const ILLUSTRATION_LABEL = {
  sparkles: 'Étincelles',
  target: 'Cible',
  'trending-up': 'Progression',
  heart: 'Cœur',
  star: 'Étoile',
  zap: 'Éclair',
  'shield-check': 'Bouclier',
  clock: 'Horloge',
  leaf: 'Feuille',
  'book-open': 'Livre',
  camera: 'Appareil photo',
  bell: 'Cloche',
};
const options = (values) =>
  values.map((v) => `<option value="${esc(v)}">${esc(ILLUSTRATION_LABEL[v] ?? LAYOUT_LABEL[v] ?? v)}</option>`).join('');

function slideRow(i, count) {
  return `<li class="m-row">
    <div class="m-head"><span>Écran ${i + 1}</span>
      <select data-m="slides.${i}.illustration" aria-label="Illustration de l’écran ${i + 1}">${options(ILLUSTRATIONS)}</select>
      <button type="button" class="btn icon-only ghost" data-m-remove="slides.${i}" aria-label="Retirer l’écran ${i + 1}" ${count <= LIMITS.slides[0] ? 'disabled' : ''}>${icon('x')}</button></div>
    <input data-m="slides.${i}.title" maxlength="80" placeholder="Titre" aria-label="Titre de l’écran ${i + 1}">
    <textarea data-m="slides.${i}.text" maxlength="240" rows="2" placeholder="Texte" aria-label="Texte de l’écran ${i + 1}"></textarea></li>`;
}

function questionRow(i) {
  return `<li class="m-row">
    <div class="m-head"><span>Question ${i + 1}</span>
      <label class="check"><input type="checkbox" data-m="questions.${i}.multiple"> Plusieurs réponses</label>
      <button type="button" class="btn icon-only ghost" data-m-remove="questions.${i}" aria-label="Retirer la question ${i + 1}">${icon('x')}</button></div>
    <input data-m="questions.${i}.title" maxlength="120" placeholder="Question" aria-label="Question ${i + 1}">
    <textarea data-m="questions.${i}.options" data-lines="${LIMITS.options[1]}" rows="3" placeholder="Une réponse par ligne" aria-label="Réponses à la question ${i + 1}, une par ligne"></textarea>
    <details class="m-key"><summary>Clé technique</summary><label class="field">Nom de la réponse dans le code<input data-m="questions.${i}.id" maxlength="40" spellcheck="false"></label></details></li>`;
}

const parentOf = (root, path) => {
  const keys = path.split('.');
  const last = keys.pop();
  return [keys.reduce((o, k) => o?.[k], root), last];
};

function valueOf(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return Math.min(Number(el.max), Math.max(0, Math.round(Number(el.value) || 0)));
  if (el.dataset.lines) {
    const lines = el.value.split('\n').map((l) => l.trim());
    return [...new Set(lines.filter(Boolean))].slice(0, Number(el.dataset.lines));
  }
  return el.dataset.trim === undefined ? el.value : el.value.trim();
}

/**
 * `getMobile` renvoie spec.mobile (l'objet peut être remplacé), `onChange` persiste.
 * Renvoie la fonction qui réaffiche les valeurs, sans reconstruire un champ en cours de saisie.
 */
export function setupMobileForm(root, { getMobile, onChange, onRemove }) {
  for (const [selector, values] of [
    ['[data-m="layouts.spacing"]', SPACINGS],
    ['[data-m="trial.plan"]', TRIAL_PLANS],
    ['[data-m="paywall.illustration"]', ILLUSTRATIONS],
  ])
    $(selector, root).innerHTML = options(values);

  let shape = '';
  function render() {
    const m = getMobile();
    if (!m) return;
    const next = `${m.slides.length}/${m.questions.length}`;
    if (next !== shape) {
      shape = next;
      $('#m-slides', root).innerHTML = m.slides.map((_, i) => slideRow(i, m.slides.length)).join('');
      $('#m-questions', root).innerHTML = m.questions.map((_, i) => questionRow(i)).join('');
    }
    $('[data-m-add="slides"]', root).disabled = m.slides.length >= LIMITS.slides[1];
    $('[data-m-add="questions"]', root).disabled = m.questions.length >= LIMITS.questions[1];
    for (const el of $$('[data-m]', root)) {
      if (el === document.activeElement && el.matches('textarea, input:not([type="checkbox"])')) continue;
      const [parent, key] = parentOf(m, el.dataset.m);
      const value = parent?.[key];
      if (el.type === 'checkbox') el.checked = value === true;
      else el.value = Array.isArray(value) ? value.join('\n') : (value ?? '');
    }
  }

  root.addEventListener('input', (e) => {
    const el = e.target.closest('[data-m]');
    if (!el || !getMobile()) return;
    const [parent, key] = parentOf(getMobile(), el.dataset.m);
    if (!parent) return;
    parent[key] = valueOf(el);
    onChange();
  });

  root.addEventListener('click', (e) => {
    const button = e.target.closest('[data-m-add], [data-m-remove]');
    const m = getMobile();
    if (!button || !m) return;
    if (button.dataset.mAdd === 'slides') m.slides.push({ title: 'Nouvel écran', text: '', illustration: 'sparkles' });
    else if (button.dataset.mAdd === 'questions') {
      let n = 1;
      while (m.questions.some((q) => q.id === `question_${n}`)) n++;
      m.questions.push({ id: `question_${n}`, title: 'Votre question', options: ['Réponse A', 'Réponse B'], multiple: false });
    } else {
      const [list, index] = button.dataset.mRemove.split('.');
      // onRemove enregistre l'état d'avant, pour « Annuler ».
      onRemove(list, () => m[list].splice(Number(index), 1));
      render();
      return;
    }
    onChange();
    render();
    // Le champ ajouté est prêt à être saisi.
    const list = button.dataset.mAdd;
    const added = $(`[data-m="${list}.${m[list].length - 1}.title"]`, root);
    added?.focus();
    added?.select();
  });

  return render;
}
