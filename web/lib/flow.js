/*
 * Habillage du parcours : barre d'étapes, récapitulatif, erreurs au champ, contrôle avant lancement et
 * aperçus téléphone. builder.js garde l'état de la spec et le passe à chaque rendu.
 */
import { $, $$, esc, icon, plural } from './common.js';
import { LAYOUT_LABEL, ONBOARDING_LAYOUTS, PAYWALL_LAYOUTS } from './mobile.js';
import { onboardingPhone, paintPhone, paywallPhone } from './phone.js';
import { STEP_LABEL, stepDone, stepsFor, summary } from './steps.js';

export const STATUS = {
  draft: 'Brouillon, pas encore enregistré',
  checking: 'Vérification du fichier…',
  dirty: 'Modifié depuis l’enregistrement',
  saved: 'Enregistré, prêt à lancer',
};

/** Ce qui est montré de chaque étape : erreur seulement si le champ a été touché ou un enregistrement tenté. */
const shown = (issue, { attempted, touched }) => issue.level === 'error' && (attempted || touched.has(issue.field));

export function renderSteps(state) {
  const { spec, step, status } = state;
  const list = stepsFor(spec.target);
  const nav = $('#steps');
  if (nav.dataset.target !== spec.target) {
    nav.dataset.target = spec.target;
    nav.innerHTML = list
      .map(
        (id, i) =>
          `<li><button type="button" class="step" data-step="${id}"><span class="step-mark">${i + 1}</span><span class="step-name">${STEP_LABEL[id]}</span></button></li>`,
      )
      .join('');
  }
  list.forEach((id, i) => {
    const button = $(`[data-step="${id}"]`, nav);
    const error = state.issues.some((issue) => issue.step === id && shown(issue, state));
    const done = id === 'launch' ? status === 'saved' : stepDone(id, spec);
    const mark = error ? 'error' : done ? 'done' : '';
    button.toggleAttribute('data-current', id === step);
    if (id === step) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    if (button.dataset.mark === mark) return;
    button.dataset.mark = mark;
    $('.step-mark', button).innerHTML = error ? '!' : done ? icon('check') : String(i + 1);
    button.setAttribute('aria-label', `${STEP_LABEL[id]}${error ? ', à corriger' : done ? ', fait' : ''}`);
  });
}

export function renderRecap(state) {
  const { spec, step, lookup } = state;
  const html = stepsFor(spec.target)
    .filter((id) => id !== 'launch')
    .map(
      (id) =>
        `<li><button type="button" class="recap-row" data-step="${id}"${id === step ? ' data-current' : ''}><span>${STEP_LABEL[id]}</span><strong>${esc(summary(id, spec, lookup))}</strong></button></li>`,
    )
    .join('');
  const el = $('#recap');
  if (el.dataset.html === html) return;
  el.dataset.html = html;
  el.innerHTML = html;
}

/** Message sous chaque champ fautif, relié par aria-describedby. */
export function renderFieldErrors(state) {
  const wanted = new Map();
  for (const issue of state.issues) {
    if (!issue.field || wanted.has(issue.field) || !shown(issue, state)) continue;
    // La recherche sert à deux étapes : son erreur ne s'affiche qu'à la sienne.
    if (issue.field === '#q' && issue.step !== state.step) continue;
    wanted.set(issue.field, issue.message);
  }

  for (const p of $$('.field-error')) {
    if (wanted.has(p.dataset.for)) continue;
    const el = $(p.dataset.for);
    el?.removeAttribute('aria-invalid');
    el?.removeAttribute('aria-describedby');
    p.remove();
  }
  let n = 0;
  for (const [selector, message] of wanted) {
    n++;
    const el = $(selector);
    if (!el) continue;
    const host = el.closest('label.field') ?? el.closest('.search')?.parentElement ?? el.parentElement;
    let p = $$('.field-error', host).find((x) => x.dataset.for === selector);
    if (!p) {
      p = document.createElement('span');
      p.className = 'field-error';
      p.dataset.for = selector;
      host.append(p);
    }
    p.id = `field-error-${n}`;
    if (p.textContent !== message) p.textContent = message;
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', p.id);
  }
}

export function renderLaunch(state) {
  const { spec, status, issues, command } = state;
  const errors = issues.filter((i) => i.level === 'error'),
    warnings = issues.filter((i) => i.level === 'warn');
  const saved = status === 'saved' && !errors.length;
  $('#launch-title').textContent = errors.length
    ? `${plural(errors.length, 'point')} à corriger`
    : saved
      ? 'Prêt pour Claude Code'
      : 'Tout est prêt à enregistrer';
  const row = (issue) =>
    `<li class="check-row ${issue.level}"><span>${esc(issue.message)}</span><button type="button" class="btn small ghost" data-fix="${issues.indexOf(issue)}">${issue.level === 'error' ? 'Corriger' : 'Compléter'}</button></li>`;
  const list = (found) => (found.length ? `<ul class="checks">${found.map(row).join('')}</ul>` : '');
  for (const [id, html] of [
    ['#launch-checks', list(errors)],
    ['#launch-warnings', warnings.length ? `<h2>À compléter plus tard <small>rien de bloquant</small></h2>${list(warnings)}` : ''],
  ]) {
    const box = $(id);
    if (box.dataset.html === html) continue;
    box.dataset.html = html;
    box.innerHTML = html;
  }
  const primary = $('#save-copy');
  primary.disabled = !!errors.length;
  $('span', primary).textContent = saved ? 'Copier la commande' : 'Enregistrer et copier la commande';
  // Tant que le fichier n'est pas à jour, la commande construirait une autre version : elle reste cachée.
  $('#command-ready').hidden = !saved;
  $('#command-wait').hidden = saved;
  $('#mcp-command').textContent = saved ? command : '';
  $('#launch-where').textContent =
    spec.target === 'mobile'
      ? 'Créez un dossier vide pour l’app et ouvrez-y Claude Code. La commande copie le squelette, injecte vos réglages et installe.'
      : 'Ouvrez Claude Code dans le dossier du projet à construire, ou dans ce dépôt.';
}

/** Les boutons de variantes gardent leur élément (focus) ; seul leur contenu change. */
export function setupLayoutChoices() {
  for (const [id, key, layouts] of [
    ['#onboarding-layouts', 'onboarding', ONBOARDING_LAYOUTS],
    ['#paywall-layouts', 'paywall', PAYWALL_LAYOUTS],
  ])
    $(id).innerHTML = layouts
      .map(
        (value) =>
          `<button type="button" class="layout-choice" data-layout="${key}:${value}" aria-pressed="false"><span class="phone" aria-hidden="true"></span><span class="layout-name">${LAYOUT_LABEL[value]}</span></button>`,
      )
      .join('');
}

/** `look` : couleurs, rayon, police. `slide` : écran d'onboarding en cours d'édition. */
export function renderPhones({ spec, step, look, slide }) {
  if (spec.target !== 'mobile' || !spec.mobile) return;
  const m = spec.mobile;
  const paint = (el, html) => {
    paintPhone(el, { ...look, spacing: m.layouts.spacing });
    if (el.dataset.html === html) return;
    el.dataset.html = html;
    el.innerHTML = html;
  };
  for (const button of $$('[data-layout]')) {
    const [key, value] = button.dataset.layout.split(':');
    button.setAttribute('aria-pressed', String(m.layouts[key] === value));
    if (key !== step) continue;
    paint($('.phone', button), key === 'onboarding' ? onboardingPhone(m, value) : paywallPhone(m, value));
  }
  const paywall = step === 'paywall';
  paint($('#rail-phone'), paywall ? paywallPhone(m, m.layouts.paywall) : onboardingPhone(m, m.layouts.onboarding, slide));
  $('#rail-phone-caption').textContent = paywall
    ? 'Aperçu schématique, prix d’exemple'
    : `Aperçu schématique, écran ${Math.min(slide, m.slides.length + m.questions.length - 1) + 1}`;
}
