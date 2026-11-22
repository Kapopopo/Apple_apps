/*
 * Aperçu schématique des variantes d'onboarding et de paywall du template mobile-base, aux tokens du thème.
 * Que des <span> : l'aperçu sert aussi de contenu aux boutons de choix. Couleurs posées par le CSSOM (CSP).
 */
import { esc, icon } from './common.js';

const FALLBACK = { '--background': '#ffffff', '--foreground': '#15171c', '--primary': '#1b1f2a', '--primary-foreground': '#ffffff' };
const VAR_NAME = /^--[\w-]{1,60}$/;

const art = (name, cls = '') => `<span class="ph-art ${cls}">${icon(`ill-${name}`)}</span>`;
const button = (label, cls = '') => `<span class="ph-button ${cls}">${esc(label)}</span>`;

function progress(step, total, cls = '') {
  return `<span class="ph-progress ${cls}">${Array.from({ length: total }, (_, i) => `<i${i <= step ? ' class="on"' : ''}></i>`).join('')}</span>`;
}

function question(q, step, total) {
  const options = q.options.map((o, i) => `<span class="ph-option${i === 0 ? ' on' : ''}">${esc(o)}</span>`).join('');
  return `<span class="ph-screen">${progress(step, total)}<span class="ph-body"><b class="ph-title">${esc(q.title || 'Votre question')}</b>${options}</span>${button('Continuer')}</span>`;
}

/** Écran `index` de l'onboarding : les slides, puis les questions. */
export function onboardingPhone(mobile, layout, index = 0) {
  const { slides, questions } = mobile;
  const total = slides.length + questions.length;
  const at = Math.max(0, Math.min(index, total - 1));
  if (at >= slides.length) return question(questions[at - slides.length], at, total);
  const slide = slides[at];
  const title = `<b class="ph-title">${esc(slide.title || 'Titre')}</b>`;
  const text = `<span class="ph-text">${esc(slide.text)}</span>`;
  if (layout === 'fullscreen')
    return `<span class="ph-screen ph-filled">${progress(at, total)}<span class="ph-hero">${art(slide.illustration, 'round')}</span>${title}${text}${button('Continuer', 'inverse')}</span>`;
  if (layout === 'list') {
    const before = slides.slice(0, at).map((s) => `<span class="ph-done">${icon('check')}<span>${esc(s.title)}</span></span>`);
    return `<span class="ph-screen">${progress(at, total)}<span class="ph-body top">${before.join('')}<span class="ph-current">${art(slide.illustration, 'small')}<span class="ph-stack">${title}${text}</span></span></span>${button('Continuer')}</span>`;
  }
  return `<span class="ph-screen ph-tinted">${progress(at, total)}<span class="ph-body"><span class="ph-card">${art(slide.illustration, 'wide')}${title}${text}</span></span>${button('Continuer')}</span>`;
}

export function paywallPhone(mobile, layout) {
  const p = mobile.paywall;
  const benefits = p.benefits.map((b) => `<span class="ph-benefit">${icon('check')}<span>${esc(b)}</span></span>`).join('');
  const plans = `<span class="ph-plans${layout === 'cards' ? ' columns' : ''}"><span class="ph-option on"><span>Annuel</span><b>39,99 €</b></span><span class="ph-option"><span>Hebdo</span><b>4,99 €</b></span></span>`;
  const trial =
    mobile.trial.days > 0 && mobile.trial.plan === 'annual'
      ? `Essai de ${mobile.trial.days} j, puis renouvelé`
      : 'Renouvelé jusqu’à résiliation';
  const footer = `<span class="ph-foot">${plans}<b class="ph-amount">39,99 € par an</b><span class="ph-legal">${esc(trial)}</span>${button('S’abonner')}<span class="ph-legal">Restaurer, CGU, Confidentialité</span></span>`;
  const title = `<b class="ph-title">${esc(p.title || 'Titre')}</b>`;
  const subtitle = `<span class="ph-text">${esc(p.subtitle)}</span>`;
  if (layout === 'image')
    return `<span class="ph-screen ph-flush"><span class="ph-banner">${art(p.illustration, 'round')}</span><span class="ph-body top">${title}${subtitle}${benefits}</span>${footer}</span>`;
  if (layout === 'cards')
    return `<span class="ph-screen ph-flush"><span class="ph-body center">${title}${subtitle}<span class="ph-box">${benefits}</span></span>${footer}</span>`;
  return `<span class="ph-screen ph-flush"><span class="ph-body top ph-big">${title}${subtitle}${benefits}</span>${footer}</span>`;
}

/** `colors` : tokens clairs du thème, `radius` : sa valeur de --radius, `font` : famille de la spec. */
export function paintPhone(el, { colors, radius, font, spacing }) {
  el.removeAttribute('style');
  const tokens = colors && Object.keys(colors).length ? colors : FALLBACK;
  for (const [name, value] of Object.entries(tokens)) if (VAR_NAME.test(name)) el.style.setProperty(name, value);
  const m = String(radius ?? '').match(/^([\d.]+)(px|rem)?$/);
  const px = m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : 12;
  // L'aperçu est à environ 60 % de la taille réelle.
  el.style.setProperty('--ph-radius', `${Math.min(20, px * 0.6)}px`);
  if (font) el.style.setProperty('--ph-font', `'${font}', system-ui, sans-serif`);
  el.dataset.spacing = spacing ?? 'normal';
}
