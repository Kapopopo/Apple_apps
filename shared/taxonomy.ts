/**
 * Catégories françaises et vocabulaire de recherche bilingue.
 * CATALOG_RULES : catégories de base (héritées du catalogue de liens d'origine) ;
 * REGISTRY_RULES l'étend pour les noms des composants importés (otp, toast, kpi…).
 */
export const normalize = (value: string) =>
  String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

type Rule = [string, RegExp, string];

const CATALOG_RULES: Rule[] = [
  ['Graphiques', /\b(chart\w*|echarts|graph|graphs|graphique\w*|sankey|sparkline\w*|flamegraph)\b/, 'graphique graphiques chart charts graph graphs dataviz visualisation statistiques courbe courbes histogramme histogrammes diagramme diagrammes barres secteur secteurs camembert donut radar'],
  ['Carrousels', /\b(carousel\w*|carrou?sel\w*|marquee)\b|\b(image[s]?|gallery|hero|infinite) slider[s]?\b/, 'carrousel carrousels carousel carousels caroussel caroussels slider slides diaporama defilement galerie'],
  ['Curseurs', /\bslider\b|range slider/, 'curseur curseurs slider reglage plage range'],
  ['Boutons', /\bbutton\w*\b/, 'bouton boutons button buttons action cta'],
  ['Formulaires', /\b(form\w*|input\w*|checkbox\w*|radio|select|combobox|switch|textarea|password|upload|fieldset)\b/, 'formulaire formulaires form input saisie champ champs'],
  ['Tableaux de données', /\btable\b|data table/, 'tableau tableaux table tables donnees datatable'],
  ['Calendriers', /\b(calendar|date picker|datepicker|date range)\b/, 'calendrier calendriers calendar date dates'],
  ['FAQ', /\b(accordion|faq|disclosure|collapsible)\b/, 'faq accordeon accordeons accordion questions reponses'],
  ['Fenêtres et panneaux', /\b(dialog|modal|drawer|sheet|popover)\b/, 'fenetre fenetres dialog modal modale panneau panneaux drawer'],
  ['Navigation', /\b(nav\w*|menu|dock|tabs?|breadcrumb\w*|pagination|sidebar|toolbar)\b/, 'navigation menu menus onglet onglets tab tabs dock barre outils'],
  ['Notifications', /\b(notification\w*|toast|alert|sonner)\b/, 'notification notifications alerte alert toast'],
  ['Indicateurs', /\b(number|ticker|counter|statistic\w*|progress|gauge)\b/, 'indicateur indicateurs compteur compteurs chiffre chiffres number ticker counter jauge progression progress'],
  ['Cartes', /\b(card\w*|bento)\b/, 'carte cartes card cards bento'],
  ['Texte', /\b(text|word|typing|typography|paragraph|heading)\b/, 'texte textes text titre titres typographie mots'],
  ['Fonds', /\b(background|backdrop|grid|pattern|beam|particle\w*|ripple|meteors|light rays)\b/, 'fond fonds background backgrounds arriere plan motif motifs'],
  ['Images et galeries', /\b(image\w*|gallery|avatar|photo\w*|lens)\b/, 'image images galerie galeries gallery photo photos loupe avatar'],
  ['Chargement', /\b(loader|loading|spinner|skeleton)\b/, 'chargement loader loading spinner squelette'],
  ['Illustrations', /\b(globe|orbit|icon|illustration|map)\b/, 'illustration illustrations icone icones icon cartographie'],
];

/** Compléments propres au registre, testés avant la règle de base de la même catégorie. */
const EXTENSIONS: Record<string, RegExp> = {
  Graphiques: /\b(heatmap|plot|funnel|candlestick|sankey|bars)\b/,
  Curseurs: /\b(scrubber|dial|knob)\b/,
  Boutons: /\b(fab|like)\b/,
  Formulaires: /\b(toggle|dropzone|otp|one time code|picker|signature|login|sign up|search bar|search)\b/,
  'Tableaux de données': /\bdata row\b/,
  Calendriers: /\bplanner\b/,
  'Fenêtres et panneaux': /\b(tooltip|context menu)\b/,
  Navigation: /\b(toc|rail|island|stepper)\b/,
  Notifications: /\b(toasts?|bell|banner)\b/,
  Indicateurs: /\b(stat|meter|kpi|metric\w*|countdown)\b/,
  Texte: /\b(letters|typewriter|glitch|scramble)\b/,
  Fonds: /\b(shader|stars|field|orb|aurora|warp)\b/,
  'Images et galeries': /\b(avatars|camera|compare|viewer)\b/,
  Illustrations: /\b(orbital|orbiting)\b/,
};
/** Catégories supplémentaires du registre, testées après toutes les catégories du catalogue. */
const EXTRA_RULES: Rule[] = [
  ['IA et messages', /\b(ai|chat|prompt|reasoning|response|messages?|agent\w*|thinking|generate|web search|sources|support)\b/, 'ia intelligence artificielle chat message messages assistant agent prompt'],
  ['Code', /\b(code|snippet|terminal|json|markdown|editor|github)\b/, 'code bloc de code snippet terminal editeur developpeur'],
  ['Listes et tâches', /\b(checklist|tasks?|todo|timeline|steps?|tree|sortable|list|leaderboard|lane board|plan|tour|questionnaire|rating|tower)\b/, 'liste listes tache taches todo checklist etapes chronologie classement'],
  ['Médias', /\b(voice\w*|sound\w*|audio|video|player|music|ascii)\b/, 'media medias audio son voix lecteur video'],
  ['Paiement', /\b(wallet|payment\w*|receipt|earnings|pricing|money|ledger|checkout|basket|bill|plan)\b/, 'paiement paiements portefeuille prix tarif facture recu argent'],
  ['Effets et interactions', /\b(drag\w*|ball|slingshot|eye|cursor|follower|swap|fold\w*|confetti|popper|party|corridor|morph\w*|blob|glass|reactions?|emoji|pull|aspect|palette|sketch|canvas|xy pad|lens|matrix|clock|package|evil|focus)\b/, 'effet effets interaction interactions micro interaction animation ludique'],
];
const REGISTRY_RULES: Rule[] = [
  ...CATALOG_RULES.map(([label, pattern, words]): Rule => [label, EXTENSIONS[label] ? new RegExp(`${pattern.source}|${EXTENSIONS[label].source}`) : pattern, words]),
  ...EXTRA_RULES,
];

export const VOCAB: Record<string, string> = Object.fromEntries([...CATALOG_RULES, ...EXTRA_RULES].map(([label, , words]) => [label, words]));
Object.assign(VOCAB, {
  Transitions: 'transition transitions apparition animation reveal fade',
  Affiches: 'affiche affiches poster posters visuel visuels',
  Maquettes: 'maquette maquettes mockup mockups visuel visuels',
  Dégradés: 'degrade degrades gradient gradients visuel visuels',
  'Références visuelles': 'reference references visuel visuels inspiration image images',
  Thèmes: 'theme themes couleurs palette tokens design system',
  Easings: 'easing easings courbe courbes animation timing bezier',
  Utilitaires: 'utilitaire helper hook lib',
  'Sans serif': 'police polices font fonts typographie sans',
  Serif: 'police polices font fonts typographie serif',
  Display: 'police polices font fonts typographie display titre',
  Manuscrite: 'police polices font fonts typographie manuscrite script',
  Monospace: 'police polices font fonts typographie mono code',
  'Slab serif': 'police polices font fonts typographie slab',
});

const first = (rules: Rule[], text: string) => rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'Autres composants';

/** Catégorie d'un item importé : d'après son nom (ou slug), sinon d'après sa description. */
export function classify(name: string, description = ''): string {
  const byName = first(REGISTRY_RULES, normalize(name).replace(/[-_]/g, ' '));
  return byName !== 'Autres composants' || !description ? byName : first(REGISTRY_RULES, normalize(description).replace(/[-_]/g, ' '));
}

const SECTION_HINT = /\b(pricing|hero|footer|features?|testimonials?|cta|contact|login|sign ?up|signup)\b/;
const SCREEN_HINT = /\b(not found|404)\b/;

/** Ajuste le type d'un item UI déclaré « composant » d'après son nom (sections et écrans complets). */
export function refineType(name: string, declared: 'component' | 'section' | 'screen'): 'component' | 'section' | 'screen' {
  if (declared !== 'component') return declared;
  const text = normalize(name).replace(/[-_]/g, ' ');
  if (SCREEN_HINT.test(text)) return 'screen';
  if (SECTION_HINT.test(text)) return 'section';
  return declared;
}

const TAG_RULES: [string, RegExp][] = [
  ['animé', /\b(animat\w*|motion|spring\w*|transition\w*|morph\w*)\b/],
  ['survol', /\bhover\w*\b/],
  ['drag', /\b(drag\w*|swip\w*|gesture\w*|fling)\b/],
  ['scroll', /\bscroll\w*\b/],
  ['3d', /\b(3d|three|tilt\w*|depth|perspective)\b/],
  ['clavier', /\bkeyboard\b/],
  ['accessible', /\b(accessib\w*|aria|screen reader)\b/],
  ['dark mode', /\b(dark mode|dark theme|light and dark)\b/],
  ['dataviz', /\b(chart\w*|graph\w*|heatmap)\b/],
  ['ia', /\b(ai|agent|llm|prompt|reasoning)\b/],
  ['webgl', /\b(webgl|shader\w*|three)\b/],
  ['son', /\b(sound\w*|audio|voice)\b/],
];

/** Tags dérivés du nom, de la description et des dépendances (aucune invention de comportement). */
export function deriveTags(name: string, description: string, dependencies: string[], extra: string[] = []): string[] {
  const text = normalize(`${name} ${description}`).replace(/[-_]/g, ' ');
  const tags = new Set(extra.map((t) => normalize(t).trim()).filter(Boolean));
  for (const [tag, pattern] of TAG_RULES) if (pattern.test(text)) tags.add(tag);
  for (const dep of dependencies) {
    if (/^(motion|framer-motion|react-native-reanimated)$/.test(dep)) tags.add('animé');
    if (/^three$|@react-three/.test(dep)) tags.add('3d');
  }
  return [...tags].sort();
}

/** Texte normalisé utilisé par les recherches du registre. */
export function searchTerms(parts: (string | undefined)[], category: string): string {
  return normalize([...parts, category, VOCAB[category] ?? ''].filter(Boolean).join(' '));
}

const ALIASES: Record<string, string> = { bouton: 'button', boutons: 'button', carte: 'card', cartes: 'card', tableau: 'table', tableaux: 'table', formulaire: 'form', formulaires: 'form', fenetre: 'dialog', onglet: 'tab', onglets: 'tab', calendrier: 'calendar' };
const REGISTRY_ALIASES: Record<string, string> = { ...ALIASES, texte: 'text', fond: 'background', fonds: 'background', police: 'font', polices: 'font' };

/** Identique à catalog.matches (alias historiques) ; `registry` ajoute quelques alias. */
export function matches(query: string, text: string, registry = false): boolean {
  const haystack = normalize(text);
  const aliases = registry ? REGISTRY_ALIASES : ALIASES;
  return normalize(query).split(/\s+/).filter(Boolean).every((w) => haystack.includes(w) || haystack.includes(aliases[w] ?? w));
}
