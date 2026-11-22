/*
 * Bloc « Ma palette » de l'étape Style : une liste de couleurs en hexa, sans ordre ni rôle imposé, collage d'une
 * liste, aperçu clair et sombre. La saisie survit au rechargement tant qu'elle n'est ni enregistrée ni annulée.
 */
import { $, $$, esc, icon, plural, store, toast } from './common.js';
import { hexList, hexOf, paletteColors, paletteErrors, paletteRoles, paletteWarnings, ROLE_LABELS } from './palette.js';

const KEY = 'atlas-builder-palette';
const MAX = 10;
const MODES = [
  ['light', 'Clair'],
  ['dark', 'Sombre'],
];
const empty = () => ({ open: false, name: '', colors: [''], initial: null, radius: '' });

function read() {
  const saved = store.get(KEY, null);
  return saved && typeof saved.name === 'string' && Array.isArray(saved.colors) && saved.colors.length
    ? { ...empty(), ...saved, colors: saved.colors.slice(0, MAX).map(String) }
    : empty();
}

/**
 * `initial()` : de quoi préremplir à l'ouverture. `save` : renvoie true une fois le thème enregistré.
 * `onChange` : l'état « palette en attente » a pu changer.
 */
export function setupPalette({ initial, save, fineTune, onChange }) {
  const form = $('#palette-form'),
    opener = $('#palette-open');
  let draft = read(),
    attempted = false,
    busy = false,
    touched = new Set();

  const typed = () => draft.colors.map((c) => c.trim()).filter(Boolean);
  const print = () => JSON.stringify([draft.name, typed()]);
  const pending = () => draft.open && draft.initial !== print() && (!!draft.initial || typed().length > 0);

  $('#pal-preview').innerHTML = MODES.map(
    ([mode, name]) =>
      `<span class="pal-sample" data-sample-mode="${mode}"><b>${name}</b><span class="pal-soft">Texte secondaire</span><span class="pal-card">Carte</span><span class="pal-picked">Option choisie</span><span class="pal-buttons"><i class="pal-main">Principal</i><i class="pal-second">Autre</i></span></span>`,
  ).join('');

  /** Une ligne par couleur ; refait quand la liste change de longueur ou de contenu. */
  function rows() {
    $('#pal-name').value = draft.name;
    $('#pal-rows').innerHTML = draft.colors
      .map((value, i) => {
        const n = i + 1;
        return `<li class="pal-item"><input type="color" data-swatch="${i}" aria-label="Couleur ${n} : choisir"><input data-hex="${i}" value="${esc(value)}" placeholder="#rrggbb" aria-label="Couleur ${n} : code hexa" maxlength="32" spellcheck="false" autocomplete="off" autocapitalize="off"><span class="pal-role" id="pal-role-${i}"></span><button class="btn icon-only ghost small" type="button" data-drop="${i}" aria-label="Retirer la couleur ${n}" title="Retirer">${icon('x')}</button></li>`;
      })
      .join('');
    render();
  }

  function render() {
    form.hidden = !draft.open;
    opener.hidden = draft.open;
    if (!draft.open) return;
    const colors = paletteColors(draft.colors);
    const roles = paletteRoles(draft.colors) ?? {};
    const errors = paletteErrors(draft.colors);
    const shown = errors.filter((e) => attempted || (e.index >= 0 && touched.has(e.index)));
    const seen = new Set();
    for (const el of $$('[data-hex]', form)) {
      const i = Number(el.dataset.hex);
      const hex = hexOf(el.value);
      if (shown.some((e) => e.index === i)) {
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('aria-describedby', 'pal-errors');
      } else {
        el.setAttribute('aria-describedby', `pal-role-${i}`);
        el.removeAttribute('aria-invalid');
      }
      const swatch = el.previousElementSibling;
      swatch.value = hex ?? '#808080';
      swatch.classList.toggle('empty', !hex);
      const keys = hex && !seen.has(hex) ? Object.keys(roles).filter((key) => roles[key] === hex) : [];
      const role = $(`#pal-role-${i}`, form);
      role.textContent = keys.length
        ? keys.map((key) => ROLE_LABELS[key]).join(' et ')
        : hex
          ? seen.has(hex)
            ? 'en double'
            : 'non utilisée'
          : '';
      role.classList.toggle('unused', !!hex && !keys.length);
      if (hex) seen.add(hex);
    }
    const computed = ['background', 'foreground'].filter((key) => roles[key] && !seen.has(roles[key]));
    $('#pal-auto').textContent = computed.length
      ? `${computed.map((key) => ROLE_LABELS[key]).join(' et ')} ${computed.length > 1 ? 'calculés' : 'calculé'} à partir de vos couleurs.`
      : '';
    $('#pal-add').disabled = draft.colors.length >= MAX;
    $('#pal-preview').hidden = !colors;
    $('#pal-wait').hidden = !!colors;
    for (const sample of $$('[data-sample-mode]', form)) {
      if (!colors) break;
      for (const [name, value] of Object.entries(colors[sample.dataset.sampleMode])) sample.style.setProperty(name, value);
    }
    const list = (box, messages) => {
      const html = messages.map((m) => `<li>${esc(m)}</li>`).join('');
      if (box.dataset.html === html) return;
      box.dataset.html = html;
      box.innerHTML = html;
    };
    list(
      $('#pal-errors'),
      shown.map((e) => e.message),
    );
    list($('#pal-warnings'), colors ? paletteWarnings(colors) : []);
    $('#pal-save').disabled = busy;
    const updating = draft.initial && JSON.parse(draft.initial)[0] === draft.name;
    $('#pal-save span').textContent = updating ? 'Mettre à jour la palette' : 'Enregistrer et utiliser';
  }

  function changed() {
    store.set(KEY, draft);
    render();
    onChange();
  }

  function clear() {
    draft = empty();
    attempted = false;
    touched = new Set();
    store.remove(KEY);
    rows();
    onChange();
  }

  const focusRow = (i) => ($(`[data-hex="${i}"]`, form) ?? $('#pal-add')).focus();

  opener.onclick = async () => {
    opener.disabled = true;
    const start = await initial();
    opener.disabled = false;
    draft = { ...empty(), open: true, name: start.name, radius: start.radius || '' };
    if (start.colors) {
      draft.colors = [...start.colors];
      draft.initial = print();
    }
    $('#pal-note').hidden = !start.tuned;
    rows();
    changed();
    focusRow(0);
  };

  $('#pal-add').onclick = () => {
    if (draft.colors.length >= MAX) return;
    draft.colors.push('');
    rows();
    changed();
    focusRow(draft.colors.length - 1);
  };

  form.addEventListener('click', (e) => {
    const button = e.target.closest('[data-drop]');
    if (!button) return;
    const i = Number(button.dataset.drop);
    draft.colors.splice(i, 1);
    if (!draft.colors.length) draft.colors.push('');
    touched = new Set([...touched].filter((n) => n !== i).map((n) => (n > i ? n - 1 : n)));
    rows();
    changed();
    focusRow(Math.min(i, draft.colors.length - 1));
  });

  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.id === 'pal-name') draft.name = el.value;
    else {
      const id = el.dataset.swatch ?? el.dataset.hex;
      if (id === undefined) return;
      draft.colors[Number(id)] = el.value;
      if (el.dataset.swatch) el.nextElementSibling.value = el.value;
    }
    changed();
  });

  form.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.hex === undefined) return;
    const i = Number(el.dataset.hex);
    touched.add(i);
    const hex = hexOf(el.value);
    if (hex) el.value = draft.colors[i] = hex;
    changed();
  });

  // Une liste collée prend la place de la case, les autres codes s'ajoutent juste après.
  form.addEventListener('paste', (e) => {
    const el = e.target;
    if (el.dataset.hex === undefined) return;
    const codes = hexList(e.clipboardData?.getData('text') ?? '');
    if (codes.length < 2) return;
    e.preventDefault();
    const i = Number(el.dataset.hex);
    const room = MAX - draft.colors.length + 1;
    const placed = codes.slice(0, room);
    draft.colors.splice(i, 1, ...placed);
    rows();
    changed();
    focusRow(i + placed.length - 1);
    const extra = codes.length - placed.length;
    toast(
      `${plural(placed.length, 'couleur ajoutée', 'couleurs ajoutées')}${extra ? `, ${plural(extra, 'ignorée', 'ignorées')} au-delà de ${MAX}` : ''}.`,
    );
  });

  $('#pal-cancel').onclick = () => {
    const before = pending() ? draft : null;
    clear();
    opener.focus();
    if (!before) return;
    toast('Palette annulée.', {
      label: 'Rétablir',
      run: () => {
        if (draft.open) return;
        draft = before;
        rows();
        changed();
      },
    });
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    attempted = true;
    render();
    const [error] = paletteErrors(draft.colors);
    if (error) {
      focusRow(Math.max(error.index, 0));
      return;
    }
    if (!draft.name.trim()) {
      $('#pal-name').focus();
      toast('Donnez un nom à la palette.');
      return;
    }
    const sent = print();
    busy = true;
    render();
    let saved;
    try {
      saved = await save({ name: draft.name.trim(), radius: draft.radius, ...paletteColors(draft.colors) });
    } finally {
      busy = false;
      render();
    }
    if (!saved) return;
    // Une frappe pendant l'envoi reste à enregistrer.
    if (print() !== sent) return;
    clear();
    opener.focus();
  };

  $('#create-theme').onclick = () => {
    const colors = paletteColors(draft.colors);
    fineTune(colors && { name: draft.name, radius: draft.radius, ...colors });
  };

  rows();

  return {
    clear,
    /** Erreur ajoutée à celles de la spec : sans elle, la commande partirait sans la palette saisie. */
    issues: () =>
      pending()
        ? [
            {
              level: 'error',
              step: 'style',
              field: '#pal-name',
              message: 'Palette pas encore enregistrée : enregistrez-la ou annulez-la.',
            },
          ]
        : [],
  };
}
