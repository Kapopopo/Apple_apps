"""French component types and bilingual search vocabulary shared by web and MCP."""
import re
import unicodedata


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value).lower()) if unicodedata.category(c) != 'Mn')

# Specific rules precede broad ones: a chart card is a chart, not a generic card.
RULES = [
    ('Graphiques', r'\b(chart\w*|echarts|graph|graphs|graphique\w*|sankey|sparkline\w*|flamegraph)\b', 'graphique graphiques chart charts graph graphs dataviz visualisation statistiques courbe courbes histogramme histogrammes diagramme diagrammes barres secteur secteurs camembert donut radar'),
    ('Carrousels', r'\b(carousel\w*|carrou?sel\w*|marquee)\b|\b(image[s]?|gallery|hero|infinite) slider[s]?\b', 'carrousel carrousels carousel carousels caroussel caroussels slider slides diaporama defilement galerie'),
    ('Curseurs', r'\bslider\b|range slider', 'curseur curseurs slider reglage plage range'),
    ('Boutons', r'\bbutton\w*\b', 'bouton boutons button buttons action cta'),
    ('Formulaires', r'\b(form\w*|input\w*|checkbox\w*|radio|select|combobox|switch|textarea|password|upload|fieldset)\b', 'formulaire formulaires form input saisie champ champs'),
    ('Tableaux de données', r'\btable\b|data table', 'tableau tableaux table tables donnees datatable'),
    ('Calendriers', r'\b(calendar|date picker|datepicker|date range)\b', 'calendrier calendriers calendar date dates'),
    ('FAQ', r'\b(accordion|faq|disclosure|collapsible)\b', 'faq accordeon accordeons accordion questions reponses'),
    ('Fenêtres et panneaux', r'\b(dialog|modal|drawer|sheet|popover)\b', 'fenetre fenetres dialog modal modale panneau panneaux drawer'),
    ('Navigation', r'\b(nav\w*|menu|dock|tabs?|breadcrumb\w*|pagination|sidebar|toolbar)\b', 'navigation menu menus onglet onglets tab tabs dock barre outils'),
    ('Notifications', r'\b(notification\w*|toast|alert|sonner)\b', 'notification notifications alerte alert toast'),
    ('Indicateurs', r'\b(number|ticker|counter|statistic\w*|progress|gauge)\b', 'indicateur indicateurs compteur compteurs chiffre chiffres number ticker counter jauge progression progress'),
    ('Cartes', r'\b(card\w*|bento)\b', 'carte cartes card cards bento'),
    ('Texte', r'\b(text|word|typing|typography|paragraph|heading)\b', 'texte textes text titre titres typographie mots'),
    ('Fonds', r'\b(background|backdrop|grid|pattern|beam|particle\w*|ripple|meteors|light rays)\b', 'fond fonds background backgrounds arriere plan motif motifs'),
    ('Images et galeries', r'\b(image\w*|gallery|avatar|photo\w*|lens)\b', 'image images galerie galeries gallery photo photos loupe avatar'),
    ('Chargement', r'\b(loader|loading|spinner|skeleton)\b', 'chargement loader loading spinner squelette'),
    ('Illustrations', r'\b(globe|orbit|icon|illustration|map)\b', 'illustration illustrations icone icones icon cartographie'),
]
VOCAB = {label: words for label, _, words in RULES}
VOCAB.update({'Transitions':'transition transitions apparition animation reveal fade', 'Affiches': 'affiche affiches poster posters visuel visuels', 'Maquettes': 'maquette maquettes mockup mockups visuel visuels', 'Dégradés': 'degrade degrades gradient gradients visuel visuels', 'Références visuelles': 'reference references visuel visuels inspiration image images'})


def classify(component):
    name = normalized(component.get('name', '') + ' ' + component.get('url', '').rstrip('/').rsplit('/', 1)[-1]).replace('-', ' ')
    label = component.get('type_label')
    if not label:
        slug = component.get('url','').rstrip('/').rsplit('/',1)[-1]
        label = {'animated-list':'Notifications','animated-background':'Navigation','tilt':'Cartes','spotlight':'Cartes','blur-fade':'Transitions'}.get(slug)
    if not label:
        label = next((label for label, pattern, _ in RULES if re.search(pattern, name)), 'Autres composants')
    terms = ' '.join([component.get('name',''), component.get('source',''), label, VOCAB.get(label,''), ' '.join(component.get('tags', []))])
    return dict(component, type_label=label, search_terms=normalized(terms))
