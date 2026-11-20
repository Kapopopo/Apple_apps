/**
 * Manifeste de la source « Saas premium UI » : un enregistrement par item du registre.
 * Lu par importers/authored.ts (npm run import:authored), qui calcule les dépendances npm et de registre
 * d'après les imports de chaque fichier source.
 *
 * Chemins relatifs à authored/saas-premium-ui/src/ ; ils deviennent les chemins d'origine dans registry/.
 */
export interface AuthoredItem {
  slug: string;
  name: string;
  type: 'component' | 'section' | 'screen';
  category: string;
  tags: string[];
  /** Rôle, props et variantes (affiché dans le catalogue et renvoyé par le MCP). */
  description: string;
  /** Fichiers publiés (le premier est l'entrée). */
  files: string[];
  /** Démo rendue par l'app d'aperçus (export par défaut). */
  demo: string;
}

export const SOURCE = {
  id: 'saas-premium-ui',
  name: 'Saas premium UI',
  license: 'LicenseRef-Personnel',
  licenseNotes:
    'Style uniquement, aucun asset : thème réimplémenté (tokens, patterns, recettes d’animation) pour un style SaaS premium. Aucun logo, visuel, mockup, texte ni code d’un site existant n’est repris ; visuels en placeholders, textes génériques. Création personnelle, libre d’usage dans tes projets.',
  attribution: 'Polices Geist et Geist Mono : paquet npm geist, © Vercel, SIL Open Font License 1.1 (installées, non redistribuées).',
} as const;

export const THEME = {
  slug: 'theme',
  name: 'Thème Saas premium UI',
  tags: ['tokens', 'dark mode', 'tailwind 4', 'motion', 'geist', 'apple-like', 'glass', 'saas-premium-ui', 'saas premium ui'],
  description:
    'SaaS mobile « Apple-like » : fond gris très clair, blocs noirs arrondis plein écran, titres ultra-gras en majuscules serrées, un seul accent bleu électrique, pills, verre dépoli, halos bleus et micro-animations à ressort. Fichiers : tokens.css (variables --pl-*, bascule sombre .pl-dark), theme.css (mapping Tailwind 4 : bg-pl-ink, rounded-pl-xl, shadow-pl-card, ease-pl-ios, animate-pl-*, keyframes, garde prefers-reduced-motion), fonts.css (Geist via le paquet npm geist), lib/motion.ts (8 courbes nommées, variants fadeUp, cardIn, sheetIn, popBlur, blurReveal, swipeIn, lineIn, presets press/lift). Style uniquement, aucun asset.',
  files: ['theme.css', 'tokens.css', 'fonts.css', 'lib/motion.ts'],
} as const;

const T = ['saas-premium-ui', 'saas premium ui'];

export const ITEMS: AuthoredItem[] = [
  {
    slug: 'theme-board',
    name: 'Planche du thème Saas premium UI',
    type: 'component',
    category: 'Autres composants',
    tags: [...T, 'tokens', 'couleurs', 'typographie', 'easings'],
    description:
      'Planche de référence du thème : couleurs, titres (display majuscules, H2 deux tons, mots en dégradé), rayons, ombres, verre et courbes d’animation en mouvement. Sert à vérifier le thème, pas à être posée telle quelle.',
    files: ['components/theme-board.tsx'],
    demo: 'demos/theme-board.tsx',
  },
  ...(
    [
      [
        'pill-badge',
        'Pill badge',
        'Navigation',
        ['badge', 'pill', 'pastille', 'statut'],
        'Pastille au-dessus des titres de section ou étiquette de statut. Props : variant (neutral, accent, solid, dark, glass), size (sm, md), icon, dot (success, accent, warning, danger) + pulse, italic, pop (entrée à ressort).',
      ],
      [
        'primary-button',
        'Bouton principal pill noir',
        'Boutons',
        ['bouton', 'button', 'cta', 'pill'],
        'Pill noir plein, ombre douce, flèche ↗ animée au survol, press scale(.97) puis retour spring-md. Props : variant (solid, white, outline), size (sm, md, lg), arrow, icon, addon (pastille intégrée, ex. réduction), href (rendu en lien), fullWidth, disabled.',
      ],
      [
        'accent-button',
        'Bouton accent bleu',
        'Boutons',
        ['bouton', 'button', 'cta', 'glow', 'bleu'],
        'Pill bleu en dégradé vertical avec liseré clair et halo bleu, pour le CTA à retenir. Props : size (sm, md, lg), tone (default, deep), icon, iconRight, href, fullWidth.',
      ],
      [
        'glow-button',
        'Bouton à bordure lumineuse tournante',
        'Boutons',
        ['bouton', 'button', 'cta', 'glow', 'conic-gradient', 'border', 'animation'],
        'Pill noir en majuscules 15 px dont l’anneau bleu nuit porte un reflet conique qui tourne (@property --pl-angle, 4 s linéaire), halo bleu dessous ; figé sous prefers-reduced-motion. Props : size (md, lg), icon, iconRight, halo, href.',
      ],
      [
        'segmented-tabs',
        'Onglets segmentés à indicateur glissant',
        'Navigation',
        ['tabs', 'onglets', 'segmented control', 'indicateur'],
        'Onglets avec indicateur qui glisse (450 ms ease-ios), clavier ← →. Variantes : pill, ios (contrôle segmenté clair), bar (barre pleine largeur à filets, 2 colonnes sous 640 px). Option progress (variante bar) : le trait de l’onglet actif se remplit pendant N ms puis onProgressEnd (rotation automatique), progressPaused. Props : tabs, value / defaultValue, onChange, variant, tone, size, compactOnMobile, fullWidth, panelId, progress, progressPaused, onProgressEnd.',
      ],
      [
        'dark-accordion',
        'Accordéon FAQ en relief sombre',
        'FAQ',
        ['accordion', 'accordéon', 'faq', 'questions'],
        'Items en relief « bouton physique » sur fond noir, ouverture grid-template-rows 0fr → 1fr (500 ms ease-out-expo) + fondu, icône + qui pivote en ×. Props : items (id, question, answer), defaultOpen, multiple, tone (dark, light).',
      ],
      [
        'terminal-bar',
        'Barre terminal avec commande animée',
        'Code',
        ['terminal', 'commande', 'install', 'typing', 'copie'],
        'Pill noire avec « $ », commande mono tapée puis effacée en rotation, curseur clignotant, copie au clic (coche dessinée) et bouton bleu à droite. Props : commands, prompt, ctaLabel, onCta / ctaHref, typingSpeed, hold, copyable. Statique sous prefers-reduced-motion.',
      ],
      [
        'status-dot',
        'Point de statut pulsant',
        'Indicateurs',
        ['statut', 'status', 'pulse', 'point', 'en ligne'],
        'Point coloré avec anneau qui s’élargit et s’efface en boucle. Props : tone (success, accent, warning, danger), pulse, size (sm, md), label.',
      ],
      [
        'toggle',
        'Interrupteur iOS à knob verre',
        'Formulaires',
        ['switch', 'toggle', 'interrupteur', 'ios'],
        'Interrupteur style iOS, knob en verre qui glisse avec un ressort, piste bleue active. Props : checked / defaultChecked, onCheckedChange, label, tone (light, dark), size (sm, md), disabled.',
      ],
      [
        'countdown',
        'Compte à rebours en cases mono',
        'Indicateurs',
        ['countdown', 'compte à rebours', 'timer', 'promo'],
        'Cases mono arrondies à bordure fine, chiffres qui glissent à chaque changement. Props : target (date) ou seconds (durée), units (d, h, m, s), labels, tone (light, dark), size (sm, md), onComplete.',
      ],
      [
        'dot-grid-background',
        'Trame de points halftone',
        'Fonds',
        ['background', 'fond', 'dots', 'halftone', 'halo', 'grille'],
        'Trame de points dont la densité décroît vers le centre, halos bleus flous qui dérivent (12–15 s, décalés, coupés sous prefers-reduced-motion). Props : tone (light, dark), spacing, dotSize, clearCenter, halo, children (sinon calque absolute).',
      ],
      [
        'led-display',
        'Afficheur LED à matrice de points',
        'Indicateurs',
        ['led', 'dot matrix', 'afficheur', 'countdown', 'mono'],
        'Matrice de points 5×7 en SVG dans un cadre noir épais, avec étiquette en onglet optionnelle. Une ou plusieurs lignes (chiffres, lettres, : - . % €) et/ou un compte à rebours « NJ HH:MM:SS ». Tons accent, white, success, dim, dimAccent, réglables par ligne. Props : text, countdown, label, tone, rowTones, dot, gap, framed.',
      ],
      [
        'rolling-number',
        'Nombre à rouleaux de chiffres',
        'Indicateurs',
        ['number', 'compteur', 'rolling', 'prix', 'ticker'],
        'Chaque chiffre est une colonne 0–9 qui défile jusqu’à sa valeur à l’apparition puis à chaque changement. Props : value, format (Intl.NumberFormatOptions), locale, prefix, suffix, duration, stagger.',
      ],
      [
        'pricing-card',
        'Carte de prix sombre ou bleue',
        'Paiement',
        ['pricing', 'tarifs', 'prix', 'offre', 'abonnement'],
        'Carte de prix à deux couches : cadre noir et panneau graphite (dark) ou bleu (accent, étiquette inclinée) ; nom + pastille, prix barré puis prix à rouleaux, encart « payer en N fois », bouton blanc à pastille de réduction, features. Option glow : soft (défaut) ou colored (glow marqué bleu / gris bleuté). Props : variant, name, tag, description, price, originalPrice, currency, period, installments, installmentsLabel, features, ctaLabel, onCta, discountLabel, badge, glow.',
      ],
      [
        'step-card',
        'Carte d’étape à glow bleu',
        'Cartes',
        ['card', 'étape', 'step', 'comment ça marche', 'glow'],
        'Grande carte blanche bordée de bleu pâle avec glow diffus : visuel en haut (scène sombre en perspective par défaut), pill « Étape N · Nom », titre 24 px, texte. Lift au survol, entrée card-in. Props : step, stepName, title, description, visual, visualHeight.',
      ],
      [
        'review-card',
        'Carte d’avis avec étoiles vertes',
        'Cartes',
        ['avis', 'review', 'témoignage', 'testimonial', 'étoiles'],
        'Carte d’avis blanche : capture (placeholder), bulle de messages sombre ou texte seul, 5 étoiles vertes, citation, nom et meta. Options : shot (blocks par défaut, ou stats : tableau de bord avec histogramme), equalHeight (h-full + citation limitée à 3 lignes). Props : variant, rating, quote, author, meta, messages, image, shot, equalHeight. IMAGES : placeholders par défaut, mettre vos photos à leur place via image.',
      ],
      [
        'horizontal-carousel',
        'Carrousel horizontal qui déborde du bord',
        'Carrousels',
        ['carousel', 'carrousel', 'scroll', 'snap', 'slider'],
        'Défilement horizontal à scroll-snap : cartes qui débordent du bord (bleed) ou carrousel bord à bord aligné sur la grille (inset), flèches dès 640 px, cartes étirées ou alignées en haut. Exporte CarouselItem. Props : children, bleed, inset, align (stretch, start), gap, controls, tone, label.',
      ],
      [
        'locked-overlay',
        'Overlay de contenu verrouillé',
        'Fenêtres et panneaux',
        ['paywall', 'verrouillé', 'lock', 'overlay', 'premium'],
        'Dégradé vers le noir sur le bas d’un contenu, pill cadenas, gros titre blanc et CTA à bordure lumineuse ; le contenu au-dessus reste visible et inerte. Props : children, label, title, description, ctaLabel, onCta, height, blur.',
      ],
      [
        'phone-mockup',
        'Mockup de smartphone générique',
        'Images et galeries',
        ['mockup', 'phone', 'iphone', 'device', 'téléphone'],
        'Cadre de smartphone générique, écran placeholder clair ou sombre (réduit d’un bloc dans les petits téléphones) ou contenu libre. Exporte ScreenPlaceholder et DarkScreenPlaceholder. Props : children, width, frame, screen, float, tilt, glow, placeholder. IMAGES : placeholders par défaut, mettre vos photos à leur place via children (capture ou vidéo de votre app).',
      ],
      [
        'perspective-grid',
        'Sol en grille bleue en perspective',
        'Fonds',
        ['grid', 'grille', 'perspective', 'background', 'retro'],
        'Sol en grille vu en perspective (rotateX) qui défile en boucle, fondu à l’horizon et lueur au point de fuite ; à placer sous des mockups. Props : color, cell, angle, speed (0 = fixe), horizon, children.',
      ],
      [
        'pixel-wave-background',
        'Fond de vagues de pixels',
        'Fonds',
        ['pixel', 'wave', 'vagues', 'background', 'ambiance'],
        'Vagues concentriques de pixels qui s’agrandissent et s’estompent, 4 couches à 9, 11, 14 et 17 s ; une couche fixe sous prefers-reduced-motion. Props : tone (accent, white), pixel, origin, opacity, children.',
      ],
      [
        'auth-card',
        'Carte de connexion avec code par email',
        'Formulaires',
        ['login', 'connexion', 'inscription', 'auth', 'magic code', 'otp'],
        'Carte de connexion. modal : carreaux de verre derrière un titre centré majuscules sur 3 lignes (dernière en dégradé, icône inline), bouton fournisseur pill, séparateur texte, champ email gris gravé, bouton noir lumineux ↗, lien, mentions. inline : bordure bleu pâle et halo, explication centrée, label + champ pill blanc, bouton noir. Puis 6 cases de code. Props : variant, titleLines, titleIcon, subtitle, provider (ou null), separator, emailLabel, submitLabel, onSubmitEmail, onSubmitCode, header, footerLink, legal.',
      ],
      [
        'fullscreen-menu',
        'Menu plein écran flouté',
        'Navigation',
        ['menu', 'navigation', 'overlay', 'burger', 'mobile'],
        'Overlay clair semi-transparent et flouté, liens 18 px à chevrons et séparateurs fins, entrée en cascade, liens légaux en bas ; Échap ferme, défilement bloqué. Props : open, onClose, links, legalLinks, cta, contained, top.',
      ],
      [
        'promo-bar',
        'Bandeau promo',
        'Notifications',
        ['bandeau', 'promo', 'annonce', 'banner'],
        'Bandeau de 36 px blanc et centré : badge pill bleu en italique, texte ou prix, mini bouton noir, fermeture optionnelle. Props : badge, children, ctaLabel, onCta / ctaHref, fixed, onDismiss.',
      ],
      [
        'header',
        'Header transparent avec burger',
        'Navigation',
        ['header', 'navbar', 'burger', 'glass', 'menu'],
        'Transparent au repos, verre blanc 72 % au défilement ; bureau : liens mono majuscules séparés par « · » + CTA ; mobile : burger → menu plein écran. Options : cta (solid par défaut, ou glow : bordure lumineuse tournante + halo, visible aussi sur mobile), autoDark (verre sombre et texte blanc au-dessus des sections .pl-dark), logoMark (tile ou glass). Exporte Wordmark. Props : logo, links, legalLinks, ctaLabel, onCta, menuCta, sticky, top, contained, scrolled, cta, autoDark, logoMark.',
      ],
      [
        'footer',
        'Footer avec visuel d’ambiance',
        'Navigation',
        ['footer', 'pied de page', 'langue', 'liens'],
        'Footer sombre : grand visuel d’ambiance (420 px mobile, 720 px bureau) puis marque + email + langue / Navigation / Informations, copyright. Visuel par défaut en CSS/SVG (ciel, montagnes, lac, objet de verre) ; option glass : dalle plate (défaut) ou extrudée en 3D qui lévite avec reflet sur le lac. Props : brand, email, columns, languages, copyright, visual, visualHeight, glass. IMAGES : placeholders par défaut, mettre vos photos à leur place via visual.',
      ],
      [
        'media-sphere',
        'Sphère 3D de vignettes',
        'Images et galeries',
        ['sphere', 'sphère', '3d', 'galerie', 'vignettes', 'globe'],
        'Sphère 3D de vignettes en CSS (sans three.js), inclinée, qui tourne lentement, avec ombrage et reflet. Options : selectable (clic → rotation + zoom vers la vignette, mise en avant de plusieurs vignettes), auto (même animation en boucle), match (filtre qui assombrit les vignettes exclues), variety (répartition de N visuels sans doublons voisins), tileAspect (ex. 9/16). Props : size, bands, density, speed, tilt, renderTile, variety, tileAspect, selectable, auto, match, zoom, featureCount. IMAGES : placeholders par défaut, mettre vos photos à leur place via renderTile (ex. ShortVideoTile).',
      ],
      [
        'search-bar',
        'Barre de recherche en verre sombre',
        'Formulaires',
        ['search', 'recherche', 'input', 'glass', 'placeholder animé'],
        'Champ de recherche 520×52 en verre sombre (ou clair), loupe, placeholder qui se tape tout seul entre plusieurs suggestions, bouton blanc « Chercher ». Props : suggestions, buttonLabel, onSearch, defaultValue, tone (dark, light), label.',
      ],
      [
        'calendar-card',
        'Carte calendrier de planification',
        'Calendriers',
        ['calendar', 'calendrier', 'planning', 'planification', 'publication'],
        'Carte calendrier blanche : en-tête (titre, mois, compte), grille L→D, cases planifiées avec vignette, case mise en avant (bordure bleue + heure). Options : fill (cases étirées sur toute la hauteur), coverSlots (vignette pleine case, date en blanc), startDay ≤ 0 + prevMonthDays (jours du mois précédent grisés). Props : title, month, account, weeks, slots, highlight, startDay, renderSlot, compact, fill, coverSlots, prevMonthDays.',
      ],
      [
        'glass-logo',
        'Logo en verre 3D',
        'Illustrations',
        ['logo', 'verre', 'glass', '3d', 'glassmorphism'],
        'Logo en verre 3D : tuile arrondie inclinée vers la lumière, verre dépoli qui floute le décor, tranche extrudée, liseré lumineux, reflet et éclat qui balaie la surface en boucle, lévitation lente ; symbole générique au centre (remplaçable via children). Exporte GlassMark (version compacte pour un header) et Spark. Animations coupées sous prefers-reduced-motion.',
      ],
      [
        'short-video-tile',
        'Vignette de vidéo courte 9:16',
        'Images et galeries',
        ['vignette', 'short', 'vidéo', 'réseau social', 'carrousel', '9:16'],
        'Vignette verticale 9:16 pour MediaSphere ou un calendrier : photo + habillage de réseau social générique (vidéo ou carrousel, deux mises en page A / B, sans logo ni marque), ou photo seule (bare). Exporte ShortVideoPhotos (fournit les photos au sous-arbre), useShortVideoCount, shortVideoMeta. IMAGES : placeholders par défaut, mettre vos photos à leur place avec <ShortVideoPhotos photos={[…]}> (verticales ~180×320, libres de droits).',
      ],
      [
        'app-demos',
        'Démos d’app animées pour mockups',
        'Images et galeries',
        ['démo', 'app', 'mockup', 'animation', 'téléphone', 'écran'],
        'Écrans de démo d’app animés en boucle à glisser dans un téléphone (comme une vidéo) : HabitsDemo (tâches qui se cochent, anneau de progression), FinanceDemo (solde qui défile, courbe, opérations), WorkoutDemo (chrono, rythme cardiaque, égaliseur). PhoneDemo les met à l’échelle dans un PhoneMockup. En pause hors écran, figés sous prefers-reduced-motion.',
      ],
      [
        'section-heading',
        'En-tête de section deux tons',
        'Texte',
        ['titre', 'heading', 'h2', 'badge', 'deux tons'],
        'Badge pill au-dessus (blanc gravé ou sombre), H2 deux tons 30/56 px graisse 600 (encre + gris) ou, dans un bloc sombre, H2 blanc majuscules 800 de 26/46 px avec icône inline optionnelle ; accroche 16,5/18 px ; cascade fade-up au scroll. Exporte InlineIcon. Props : badge, badgeIcon, badgeTone, title, subtitle, icon, iconAt, description, tone (light, dark), align (center, left), as (h1, h2).',
      ],
    ] as [string, string, string, string[], string][]
  ).map(([slug, name, category, tags, description]): AuthoredItem => ({
    slug,
    name,
    type: 'component',
    category,
    tags: [...T, ...tags],
    description,
    files: [`components/${slug}.tsx`],
    demo: `demos/${slug}.tsx`,
  })),
  ...(
    [
      [
        'hero',
        'Hero majuscules avec barre terminal',
        'Hero',
        ['hero', 'landing', 'terminal', 'titre', 'header', 'promo'],
        'Bandeau promo + header, H1 majuscules 900 avec icône animée au milieu, accroche grise, barre terminal noire (seul CTA), trame de points. Options : fixedChrome (bandeau + header fixés pendant tout le défilement), header (cta, autoDark, logoMark, logo transmis au header), onStart (CTA « Commencer » du header et du menu). Exporte SwapIcon. Props : titleBefore, titleAfter, subtitle, commands, ctaLabel, onCta, onStart, chrome, promo, links, fixedChrome, header.',
      ],
      [
        'dark-showcase',
        'Vitrine sombre à onglets',
        'Fonctionnalités',
        ['showcase', 'vitrine', 'onglets', 'catalogue', 'paywall', 'mockups'],
        'Barre d’onglets posée sur un bloc noir pur arrondi en haut ; 4 onglets en swipe-in : automatiser (console d’agent animée, calendrier qui se remplit, téléphone), écrans (mur de mockups qui défilent, rangée verrouillée floutée avec accroche), formats (recherche, sphère de vignettes 9:16, contrôles segmentés, CTA lumineux), captures (filtres, rangées de fiches store, fondu avec accroche). Options : autoplay (ms, 0 par défaut ; 7000 = rotation des onglets avec trait qui se remplit, pause au survol), interactiveSphere (sphère cliquable et filtrée par les contrôles). Props : defaultTab, autoplay, interactiveSphere, photos. IMAGES : placeholders par défaut, mettre vos photos à leur place avec la prop photos (vignettes verticales ~180×320).',
      ],
      [
        'steps',
        'Comment ça marche en 3 cartes',
        'Fonctionnalités',
        ['steps', 'étapes', 'comment ça marche', 'process', 'cartes'],
        'Pastille, H2 deux tons, 3 cartes d’étape en verre clair à halo bleu : téléphones sur bleu nuit avec couloir quadrillé, sphère de vignettes, calendrier de publications, puis CTA pill noir. Options : animated (démos d’app qui tournent dans les téléphones, grilles qui défilent, sphère qui zoome, calendrier qui se remplit), tall (visuels de 420 px). Props : badge, title, subtitle, steps, ctaLabel, onCta, animated, tall, photos. IMAGES : placeholders par défaut, mettre vos photos à leur place avec la prop photos.',
      ],
      [
        'pricing',
        'Tarifs sombres avec afficheur LED',
        'Tarifs',
        ['pricing', 'tarifs', 'prix', 'led', 'countdown', 'offre'],
        'Bloc sombre arrondi : afficheur LED à points (compte à rebours de l’offre), badge, H2 blanc majuscules, carte mensuelle sombre et carte vedette bleue (badge incliné, prix barré, prix à rouleaux, paiement en 3 fois). Props : badge, title, countdown, plans.',
      ],
      [
        'reviews',
        'Avis en carrousel',
        'Carrousels',
        ['avis', 'reviews', 'témoignages', 'testimonials', 'carrousel'],
        'H2 deux tons aligné à gauche + accroche + CTA, puis défilement continu bord à bord des cartes d’avis (pause au survol). Options : equalHeight (cartes de même hauteur, citation sur 3 lignes), shot (blocks ou stats : placeholder des captures). Props : badge, title, subtitle, description, reviews, ctaLabel, onCta, equalHeight, shot. IMAGES : placeholders par défaut, mettre vos photos à leur place via la prop image de chaque avis.',
      ],
      [
        'faq',
        'FAQ sur bloc noir',
        'FAQ',
        ['faq', 'questions', 'accordéon', 'contact'],
        'Fond noir pur : en-tête aligné à gauche (pastille sombre, H2 deux tons, accroche), bouton « Nous contacter » à point vert, accordéon en relief dans un cadre. Option blendBottom : fondu du bas vers le bleu nuit d’une photo de footer et filets latéraux fondus (raccord sans couture). Props : badge, title, subtitle, description, items, contactLabel, contactHref, blendBottom.',
      ],
      [
        'site-footer',
        'Footer de landing',
        'Pied de page',
        ['footer', 'pied de page', 'liens', 'langue'],
        'Footer de landing (colonnes Navigation / Informations, email, langue, copyright) avec visuel d’ambiance pleine largeur. Props : columns, email, visual, photo, glass. Exporte NightPhotoVisual (photo fondue en haut et en bas + logo de verre au-dessus de l’horizon et reflet). IMAGES : placeholders par défaut, mettre vos photos à leur place : prop photo (paysage nocturne, lac et montagnes, ~1920×1080) au lieu du paysage placeholder.',
      ],
      [
        'auth-modal',
        'Modale de connexion sur page floutée',
        'Authentification',
        ['login', 'connexion', 'inscription', 'modal', 'auth', 'glass'],
        'Modale centrée sur la page assombrie et floutée : carte blanche avec en-tête de carreaux de verre en perspective derrière le titre majuscules 3 lignes (icône inline, dernière ligne en dégradé), bouton fournisseur, email, bouton noir lumineux, code à 6 chiffres ; bouton de fermeture rond cerclé. Échap / clic sur le fond / × ferment. Exporte GlassTiles. Props : open, onOpenChange, background, card (props d’AuthCard), contained.',
      ],
    ] as [string, string, string, string[], string][]
  ).map(([slug, name, category, tags, description]): AuthoredItem => ({
    slug,
    name,
    type: 'section',
    category,
    tags: [...T, 'section', ...tags],
    description,
    files: [`sections/${slug}.tsx`],
    demo: `demos/${slug}.tsx`,
  })),
  {
    slug: 'landing-demo',
    name: 'Landing complète Saas premium UI',
    type: 'screen',
    category: 'Pages d’accueil',
    tags: [...T, 'landing', 'page', 'démo', 'saas', 'apple-like'],
    description:
      'Landing complète assemblée comme un vrai site, toutes les options activées : bandeau + header fixés (CTA lumineux, verre sombre auto, logo de verre), hero, vitrine (onglet automatiser, rotation des onglets, sphère cliquable), étapes animées, tarifs avec trame et halos, avis de même hauteur, FAQ raccordée au footer, footer à dalle de verre 3D ; la modale de connexion s’ouvre depuis les CTA et bloque le défilement. IMAGES : placeholders, mettre vos photos à leur place (props photos et footerPhoto).',
    files: ['screens/landing-demo.tsx'],
    demo: 'demos/landing-demo.tsx',
  },
];
