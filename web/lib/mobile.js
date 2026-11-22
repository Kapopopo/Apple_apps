/*
 * Cible « App mobile » : stack imposée, interdits, squelette, valeurs par défaut et tirage « Varier ».
 * Un seul texte pour le builder, le prompt du catalogue, le MCP et le schéma des specs (module sans dépendance).
 */

export const TARGETS = /** @type {const} */ (['web', 'mobile']);
export const TEMPLATE_ID = 'mobile-base/template';
export const PALETTE_SOURCE = 'mobile-base';

export const ONBOARDING_LAYOUTS = /** @type {const} */ (['fullscreen', 'cards', 'list']);
export const PAYWALL_LAYOUTS = /** @type {const} */ (['image', 'cards', 'benefits']);
export const SPACINGS = /** @type {const} */ (['compact', 'normal', 'airy']);
export const TRIAL_PLANS = /** @type {const} */ (['weekly', 'annual']);
export const LAYOUT_LABEL = {
  fullscreen: 'Image plein écran',
  cards: 'Cartes',
  list: 'Liste progressive',
  image: 'Image en tête',
  benefits: 'Liste d’avantages',
  compact: 'Compact',
  normal: 'Normal',
  airy: 'Aéré',
  weekly: 'Offre hebdo',
  annual: 'Offre annuelle',
};
/** Clés de src/config/illustrations.ts dans le template. */
export const ILLUSTRATIONS = /** @type {const} */ ([
  'sparkles',
  'target',
  'trending-up',
  'heart',
  'star',
  'zap',
  'shield-check',
  'clock',
  'leaf',
  'book-open',
  'camera',
  'bell',
]);
export const LIMITS = { slides: [3, 5], questions: [0, 5], options: [2, 8], benefits: [2, 6] };

export const MOBILE_STACK = [
  'Expo SDK 58 (dernier stable du template), Expo Router, TypeScript strict',
  'NativeWind 4 pour le style ; react-native-reusables (le port de shadcn pour React Native) comme équivalent des composants du catalogue',
  'RevenueCat (react-native-purchases + react-native-purchases-ui) avec expo-dev-client',
  'Stockage local AsyncStorage, sans backend ni compte utilisateur par défaut',
];
export const MOBILE_STACK_LINE = 'Expo · Expo Router · TypeScript strict · NativeWind · react-native-reusables · RevenueCat · AsyncStorage';

export const MOBILE_FORBIDDEN = [
  'Balises HTML et API du DOM (div, span, button, img, window, document, fichiers CSS par composant) : uniquement des composants React Native.',
  'Classes Tailwind non supportées par NativeWind (grid, backdrop-blur, space-x-*, sélecteurs enfants [&_…], group-hover, variantes hover: comme seule interaction, syntaxe Tailwind 4).',
  'Librairies web-only (react-dom, @radix-ui/*, motion / framer-motion, next, lucide-react, recharts, gsap…) : copier du code web du catalogue est interdit.',
  'Couleurs, polices, arrondis ou espacements de thème en dur : classes de tokens (bg-primary, rounded-lg, p-gutter, gap-stack, font-display).',
  'Backend, compte utilisateur ou analytics, sauf demande explicite du brief.',
];

export const MOBILE_STRUCTURE = [
  'app/(main)/          ← la fonctionnalité de l’app (accueil : index.tsx) ; un écran créé ailleurs échappe au paywall',
  'app/_layout.tsx      providers et gardes : onboarding → paywall → (main)',
  'app/onboarding.tsx   écrans et questions de src/config/app.ts',
  'app/paywall.tsx      paywall RevenueCat ou paywall de secours',
  'app/settings.tsx     abonnement, support, mentions, réinitialisation',
  'app.config.ts        lit src/config/app.ts, contrôle les builds de production',
  'src/config/          app.ts, theme.json, fonts.ts, illustrations.ts, texts.ts',
  'src/features/        onboarding (useAnswers), paywall, premium (usePremium, PremiumGate)',
  'src/components/ui/   composants react-native-reusables',
  'src/lib/             stockage local, utilitaires',
];

export const MOBILE_INSTRUCTION = 'code uniquement la fonctionnalité dans app/(main)/, ne touche au squelette qu’en cas de besoin';

export const MOBILE_REVIEW = [
  'La fonctionnalité doit être propre à cette app et apporter une valeur qui justifie un abonnement : Apple refuse les apps qui ne diffèrent d’une autre que par le thème, les textes ou le contenu (4.3), quel que soit le visuel. Si le brief décrit une variante d’une app existante, le signaler au lieu de la construire en silence.',
  'Les avantages du paywall décrivent uniquement ce que l’app fait réellement (3.1.2) : les ajuster dans src/config/app.ts une fois la fonctionnalité écrite.',
];

/** Composants fournis par la CLI react-native-reusables. */
const REUSABLES = [
  'accordion',
  'alert-dialog',
  'alert',
  'aspect-ratio',
  'avatar',
  'badge',
  'button',
  'card',
  'checkbox',
  'collapsible',
  'context-menu',
  'dialog',
  'dropdown-menu',
  'hover-card',
  'input',
  'label',
  'menubar',
  'popover',
  'progress',
  'radio-group',
  'select',
  'separator',
  'skeleton',
  'switch',
  'tabs',
  'text',
  'textarea',
  'toggle-group',
  'toggle',
  'tooltip',
].sort((a, b) => b.length - a.length);
/** Dans l'app créée. La CLI nue bloque sur une question et ne crée rien hors terminal interactif. */
export const REUSABLES_CLI = 'node scripts/add-ui.js';

/** Équivalent reusables d'un item web, d'après son groupe ou son nom (« Shimmer Button » → button), sinon null. */
export function reusableFor(item) {
  const key = ` ${String(item?.group || item?.name || '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()}`;
  return REUSABLES.find((name) => key.endsWith(` ${name.replace(/-/g, ' ')}`)) ?? null;
}

/** Consigne de remplacement d'un item du catalogue qui n'a pas de code natif. */
export function nativeEquivalent(item) {
  const name = reusableFor(item);
  if (name === 'button' || name === 'text')
    return `web only : utiliser l’équivalent react-native-reusables « ${name} » déjà dans src/components/ui/${name}.tsx, sans copier le code web`;
  return name
    ? `web only : utiliser l’équivalent react-native-reusables « ${name} » (${REUSABLES_CLI} ${name}), sans copier le code web`
    : 'web only : recréer l’intention en React Native + NativeWind avec react-native-reusables, sans copier le code web';
}

/** Item utilisable tel quel dans une cible. */
export const supports = (item, target) => !!item?.platforms?.includes(target);

/** Blocs (intentions) traduisibles en mobile ; le reste doit être compatible pour être choisi. */
export function selectable(item, target) {
  if (target !== 'mobile' || supports(item, 'mobile')) return true;
  return ['component', 'section', 'screen'].includes(item?.type) && supports(item, 'web');
}

export function unsupportedLabel(item) {
  return supports(item, 'web') ? 'web only' : 'hors stack';
}

export const mobileDefaults = () => ({
  appName: '',
  slug: '',
  bundleId: '',
  supportEmail: '',
  termsUrl: '',
  privacyUrl: '',
  iosAppId: '',
  revenueCat: { entitlement: 'premium', offering: '', useDashboardPaywall: false },
  trial: { days: 7, plan: 'annual' },
  layouts: { onboarding: 'cards', paywall: 'benefits', spacing: 'normal' },
  slides: [
    { title: 'Bienvenue', text: 'Présentez ici ce que l’app permet de faire.', illustration: 'sparkles' },
    { title: 'Simple au quotidien', text: 'Expliquez comment on s’en sert, en une phrase.', illustration: 'target' },
    { title: 'Des résultats visibles', text: 'Montrez le bénéfice concret pour la personne.', illustration: 'trending-up' },
  ],
  questions: [],
  paywall: {
    title: 'Débloquez toute l’app',
    subtitle: 'Accès complet pendant toute la durée de l’abonnement.',
    illustration: 'star',
    benefits: ['Toutes les fonctionnalités', 'Les mises à jour de l’app', 'Résiliable à tout moment'],
  },
});

/** Brouillon du navigateur : mêmes clés et types que les valeurs par défaut, le reste est remplacé. */
export function cleanMobile(raw) {
  const base = mobileDefaults();
  const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!isObject(raw)) return base;
  const merge = (def, value) =>
    isObject(def)
      ? Object.fromEntries(Object.entries(def).map(([k, v]) => [k, merge(v, isObject(value) ? value[k] : undefined)]))
      : typeof value === typeof def && Array.isArray(value) === Array.isArray(def)
        ? value
        : def;
  const out = merge(base, raw);
  for (const [key, allowed] of [
    ['onboarding', ONBOARDING_LAYOUTS],
    ['paywall', PAYWALL_LAYOUTS],
    ['spacing', SPACINGS],
  ])
    if (!allowed.includes(out.layouts[key])) out.layouts[key] = base.layouts[key];
  const str = (v) => typeof v === 'string';
  out.slides = out.slides.filter((s) => isObject(s) && str(s.title) && str(s.text) && str(s.illustration));
  if (out.slides.length < LIMITS.slides[0] || out.slides.length > LIMITS.slides[1]) out.slides = base.slides;
  out.questions = out.questions
    .filter((q) => isObject(q) && str(q.id) && str(q.title) && Array.isArray(q.options) && q.options.every(str))
    .slice(0, LIMITS.questions[1]);
  if (!out.paywall.benefits.every(str)) out.paywall.benefits = base.paywall.benefits;
  return out;
}

/** Police lisible en texte courant : un regular et un gras, ni script, ni mono, ni blackletter. */
function readableFont(i) {
  const weights = (i.font?.styles || []).filter((s) => !s.italic).map((s) => s.weight);
  return (
    weights.includes(400) &&
    weights.some((w) => w >= 600) &&
    !/script|hand|mono|blackletter/i.test(`${i.font?.category} ${i.name} ${i.category}`)
  );
}

/** « Varier » : palette, police, variantes et espacement, chacun différent du choix courant. */
export function vary(items, spec, random = Math.random) {
  const pick = (list, current) => {
    const pool = list.filter((x) => x !== current);
    return pool.length ? pool[Math.floor(random() * pool.length)] : (current ?? null);
  };
  const mobile = items.filter((i) => supports(i, 'mobile'));
  const palettes = mobile.filter((i) => i.type === 'theme' && i.sourceId === PALETTE_SOURCE).map((i) => i.id);
  const fonts = mobile.filter((i) => i.type === 'font' && readableFont(i)).map((i) => i.id);
  const layouts = (spec.mobile || mobileDefaults()).layouts;
  return {
    theme: pick(palettes, spec.theme),
    fonts: fonts.length ? [pick(fonts, spec.fonts?.[0])] : [],
    layouts: {
      onboarding: pick([...ONBOARDING_LAYOUTS], layouts.onboarding),
      paywall: pick([...PAYWALL_LAYOUTS], layouts.paywall),
      spacing: pick([...SPACINGS], layouts.spacing),
    },
  };
}

/** Partie commune des deux prompts mobiles (catalogue et build-from-spec). `heading` met en forme un titre. */
export function mobileBrief(spec, heading) {
  const m = spec.mobile || mobileDefaults();
  return [
    heading('Stack imposée'),
    ...MOBILE_STACK.map((l) => `- ${l}`),
    '',
    heading('Interdits'),
    ...MOBILE_FORBIDDEN.map((l) => `- ${l}`),
    '',
    heading('Structure du squelette mobile-base'),
    ...MOBILE_STRUCTURE.map((l) => `    ${l}`),
    `- Variantes : onboarding « ${LAYOUT_LABEL[m.layouts.onboarding]} », paywall « ${LAYOUT_LABEL[m.layouts.paywall]} », espacement « ${LAYOUT_LABEL[m.layouts.spacing]} ».`,
    '',
    heading('Consigne'),
    `- IMPORTANT : ${MOBILE_INSTRUCTION}.`,
    ...MOBILE_REVIEW.map((l) => `- ${l}`),
  ];
}
