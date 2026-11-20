# Thème « Process-like » — fiche de style pour le registre

> Analyse du style visuel de useprocess.xyz (accueil, menu, onglets du hero, tarifs, avis, FAQ, footer, /commencer, /acces, /autopost-tiktok).
> Ce fichier décrit **un style** (tokens, patterns, recettes d'animation) à réimplémenter avec tes propres composants.
> Ne pas reprendre leur logo, leurs visuels 3D, leurs mockups, leurs textes ni leur code : c'est le look qu'on capture, pas les assets.

---

## 1. ADN en une phrase

SaaS mobile « Apple-like » : fond gris très clair, gros blocs **noirs arrondis plein écran**, titres **ultra-gras en majuscules serrés**, un seul accent **bleu électrique**, beaucoup de **pills**, du **verre dépoli**, des **halos bleus**, et des micro-animations à ressort partout.

---

## 2. Tokens

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `bg` | `#F5F5F7` | fond de page (clair) |
| `bg-soft` | `#F3F3F4` / `#E6E8EE` | sections, tuiles, skeletons |
| `surface` | `#FFFFFF` | cartes claires |
| `ink` | `#0A0A0A` | texte principal, boutons noirs |
| `ink-dark-bg` | `#08090B` | blocs sombres |
| `ink-raised` | dégradé `#1C1C20 → #141417` | items sur fond sombre (FAQ, inputs) |
| `muted` | `#52525B` | texte secondaire |
| `muted-2` | `#A1A1AA` | 2e ligne de titre, meta |
| `line` | `#ECECEF` | bordures 1px |
| `accent` | `#2F5BFF` | CTA, mots surlignés, badges |
| `accent-deep` | `#1E2BF0` env. | bouton « Installer » |
| `accent-soft-bg` | `#EEF5FF` | fond de badge clair |
| `accent-line` | `#C5DBFF` | bordure de badge |
| `link` | `#0B62D6` | liens texte |
| `success` | `#15803D` / bg `#ECFDF5` | statuts |
| `warning` | `#B45309` / bg `#FFFBEB` | statuts |
| `danger` | `#B91C1C` / bg `#FEF2F2` | erreurs |
| Accent secondaire ponctuel | `#D97757` (orange) → `#A7A1F5` → `#3C47F3` | animation de couleur sur l'icône agent |

Règle : **monochrome + 1 bleu**. Le bleu n'apparaît que sur ce qui doit être cliqué ou retenu.

### Typographie
- **Display / UI** : Geist Sans (fallback Inter, system-ui). Une police wordmark à part pour le logo.
- **Mono** : Geist Mono — compteurs, commande d'install, prix, afficheur LED.
- **H1 hero** : 900, MAJUSCULES, `letter-spacing: -0.045em` (≈ -1.8px à 40px), `line-height ~0.95`. Mobile 40px, desktop 72–96px.
- **H2 section** : 600–700, casse normale, deux lignes : ligne 1 `ink`, ligne 2 `muted-2` (« Titre / sous-titre gris »).
- **H2 bloc sombre** : 900 majuscules serré, blanc, avec une **icône inline** au milieu du titre (taille ≈ cap-height, petit glow).
- **Body** : 16px / 400, `letter-spacing: -0.01em`, gris `muted`.
- **Mots en dégradé** : quelques mots d'un titre en `linear-gradient(90deg, #8EC5FF, #2F5BFF)` clip sur texte.

### Rayons
| Token | Valeur |
|---|---|
| `r-pill` | `999px` (boutons, badges, onglets, inputs) |
| `r-xs` | `3px` |
| `r-sm` | `11–12px` (items FAQ, petites cartes) |
| `r-md` | `14px` |
| `r-lg` | `19–24px` (cartes, modales) |
| `r-xl` | `26–32px` (blocs sombres plein écran, coins **haut** seulement quand ils s'enchaînent) |

### Ombres
- `shadow-xs` : `0 1px 2px rgb(0 0 0/.04)`
- `shadow-card` : `0 1px 2px rgb(0 0 0/.04), 0 12px 32px -18px rgb(0 0 0/.18)`
- `shadow-btn` : `0 10px 28px rgb(0 0 0/.14)`
- `shadow-dark-item` : `inset 0 1px 0 rgb(255 255 255/.13), 0 0 0 1px rgb(255 255 255/.09), 0 12px 26px -12px #000` → effet « bouton physique » sur fond noir
- `glow-accent` : halo bleu `0 0 24px rgb(47 91 255/.45)` + bordure 1px bleu clair
- `ring-pulse` : `0 0 0 6px rgb(47 107 255/.14)` (statut, focus)
- `engrave` : `0 1px 0 rgb(255 255 255/.9), 0 -1px 0 rgb(0 0 0/.28)` → texte gravé sur fond clair

### Verre (glass)
- fond `rgb(255 255 255/.58)` (clair) ou `rgb(20 20 28/.52)` (sombre)
- `backdrop-filter: blur(18px) saturate(1.7)`
- liseré haut `inset 0 1px 0 rgb(255 255 255/.85)`, ombre légère `rgb(12 12 16/.1)`

### Easings (le cœur du « feel »)
| Nom | Courbe | Usage |
|---|---|---|
| `ease-out-soft` | `cubic-bezier(.2,.8,.2,1)` | apparitions, cartes, listes |
| `ease-out-expo` | `cubic-bezier(.22,1,.36,1)` | accordéons, slides, gros éléments |
| `ease-ios` | `cubic-bezier(.32,.72,0,1)` | sheets, drawers |
| `spring-sm` | `cubic-bezier(.2,1.2,.4,1)` | hover/press, pop de badges |
| `spring-md` | `cubic-bezier(.2,1.4,.4,1)` | boutons au press |
| `spring-back` | `cubic-bezier(.34,1.56,.64,1)` | entrée avec overshoot + blur |
| `inout` | `cubic-bezier(.65,0,.35,1)` | boucles d'échange (swap) |
| `slow-settle` | `cubic-bezier(.16,1,.3,1)` 1.3s | grosses transitions de scène |

### Durées
`120ms` (press) · `180–250ms` (hover, couleurs) · `320–500ms` (entrées) · `800ms` (cartes, arrivées) · `6–17s` (ambiances en boucle) · `70s` (marquee).

---

## 3. Structure de la landing (ordre des sections)

1. **Bandeau promo** fixe en haut, blanc, centré : badge pill bleu italique + prix + mini-bouton noir.
2. **Header** transparent : logo à gauche, burger à droite (menu plein écran même en desktop).
3. **Hero clair** : H1 majuscules serré avec icône animée au milieu, sous-titre gris 2 lignes, **barre « terminal »** noire pill avec commande mono qui défile + bouton bleu « Installer ». Fond : trame de points en halftone sur les côtés.
4. **Segmented tabs** pleine largeur (5 onglets : icône + label, onglet actif bleu avec dégradé vertical léger). Chaque onglet change le bloc dessous.
5. **Bloc sombre « vitrine »** arrondi plein écran : H2 blanc majuscules + icône inline, fond trame de points + halo, contenu selon l'onglet :
   - catalogue en carrousel de mockups iPhone,
   - sphère 3D de vignettes vidéo + barre de recherche + double segmented control,
   - liste filtrable (chips catégorie avec compteur) + cartes produit + bouton bleu,
   - overlay « contenu verrouillé » : dégradé noir vers le bas + pill cadenas + gros titre + CTA glow.
6. **« Comment ça marche »** : badge pill gris, H2 deux tons, puis **3 grandes cartes empilées** (fond blanc, bordure bleu pâle, glow bleu diffus autour). Chaque carte = visuel en haut (scène sombre en perspective, calendrier, sphère) + pill « Étape N · Nom » + titre 24px.
7. **CTA central** pill noir.
8. **Tarifs** : afficheur **LED à points** (mono, bleu sur noir, compte à rebours), H2, 2 cartes : sombre (mensuel) et **bleue en dégradé** (offre vedette, badge flottant incliné), prix barré + gros prix animé en **rouleau de chiffres**, toggle « payer en 3 fois », bouton blanc avec pill de réduction intégrée, liste de features avec icônes rondes.
9. **Avis** : H2 deux tons aligné à gauche + CTA à droite, **carrousel horizontal** de cartes blanches (screenshot ou bulle de message sombre + 5 étoiles vertes + citation + nom/meta).
10. **FAQ** sur bloc noir : badge, H2 deux tons, bouton « Nous contacter » avec point vert, **accordéon** d'items en relief sombre, icône `+` → `×`.
11. **Footer** : grande image d'ambiance (paysage nocturne + logo 3D en verre), puis 3 colonnes (marque + email + sélecteur de langue pill / Navigation / Informations), copyright gris.

Pages secondaires :
- **/commencer** : modale centrée sur la landing floutée. En-tête avec **grille de carreaux en verre** en perspective, H2 majuscules 3 lignes (dernière ligne en bleu dégradé), bouton Google pill outline, séparateur « ou », input pill gris, bouton noir pill avec flèche ↗, lien souligné, mentions 11px.
- **/acces** : même carte mais inline sur fond clair, bordure bleu pâle + glow, label au-dessus de l'input, magic code par email.
- **/autopost-tiktok**, légal : page texte simple, H1 centré 700, sections H2 + listes, puis footer standard.
- **Menu** : overlay plein écran clair semi-transparent, liste de liens 18px avec chevrons et séparateurs fins, liens légaux en petit en bas.
- **Popup promo** (à l'arrivée) : carte verre sombre, visuel clair en haut, badge pill, gros titre, compte à rebours en cases mono, CTA bleu glow.

---

## 4. Inventaire des composants à créer

| Composant | Détails clés |
|---|---|
| `PromoBar` | fixe, 36px, badge italique bleu, mini CTA noir |
| `Header` | transparent → léger fond verre au scroll, burger 2 traits |
| `FullscreenMenu` | overlay blur, items avec chevron, entrée en cascade |
| `HeroTitle` | majuscules 900 serré + slot icône inline animé |
| `AgentSwapIcon` | icône qui change en boucle (rotation + scale + fondu), couleur qui glisse orange → violet → bleu |
| `TerminalBar` | pill noire, `$` gris, commande mono tronquée (effet frappe / changement), bouton bleu |
| `SegmentedTabs` | pleine largeur, icône + label, indicateur bleu glissant |
| `DarkShowcase` | section noire `r-xl`, trame de points + halo, titre blanc |
| `DotGridBackground` | trame halftone, densité qui décroît vers le centre |
| `PixelWaveBackground` | vagues de pixels qui s'agrandissent et s'estompent (boucles 9–17s décalées) |
| `PhoneMockup` | cadre iPhone arrondi + Dynamic Island, contenu image/vidéo |
| `PerspectiveGrid` | sol en grille bleue en perspective sous les mockups |
| `MediaSphere` | sphère 3D de vignettes (canvas/three) |
| `ChipFilter` | chips pill avec compteur gris, actif blanc |
| `LockedOverlay` | dégradé vers le noir + pill cadenas + titre + CTA |
| `GlowButton` | pill noir, bordure dégradée qui tourne (`conic-gradient` + `@property` angle), halo bleu |
| `PrimaryButton` | pill noir plein, ombre douce, flèche |
| `AccentButton` | pill bleu dégradé vertical + glow |
| `PillBadge` | gris clair ou bleu, parfois avec icône/point |
| `StepCard` | carte blanche, glow bleu diffus, visuel + badge étape + titre |
| `LedDisplay` | matrice de points mono bleue sur noir (compte à rebours, texte) |
| `PricingCard` | variante sombre + variante bleue dégradée, prix barré, `RollingNumber`, toggle, liste features |
| `RollingNumber` | chiffres en colonnes 0–9 qui défilent jusqu'à la valeur |
| `Toggle` | style iOS, knob verre |
| `ReviewCard` | blanc, image ou bulle chat, étoiles vertes, citation |
| `HorizontalCarousel` | scroll horizontal, cartes qui dépassent du bord |
| `DarkAccordion` | items en relief sombre, `grid-template-rows 0fr→1fr`, `+` → `×` |
| `StatusDot` | point vert avec anneau qui pulse |
| `AuthCard` | Google pill, séparateur, input pill, bouton noir, mentions |
| `GlassTileHeader` | grille de carreaux en verre en perspective (en-tête de modale) |
| `Countdown` | cases mono arrondies avec bordure fine |
| `Marquee` | défilement infini lent (70s) |
| `Footer` | image d'ambiance + 3 colonnes + sélecteur de langue pill |

---

## 5. Recettes d'animation

### Entrées (au scroll ou au montage)
- **fade-up** : `opacity 0 → 1`, `translateY(8–14px) → 0`, 450–500ms `ease-out-soft`. Décalage de 40–60ms entre éléments d'une liste.
- **card-in** : `translateY(14px) scale(.985) → none`, 800ms `ease-out-soft`.
- **sheet-in** : `translateY(24px) scale(.98) → none` pour modales et popups.
- **blur-reveal** : `clip-path: inset(0 100% 0 0)` + `blur(4px)` → net, pour un mot ou une ligne.
- **pop-blur** (titres, icône agent) : `translateY(.45em) scale(.96) blur(8px)` → net avec `spring-back`.
- **swipe-in** : contenu qui arrive de ±48px horizontalement selon la direction de l'onglet (variable `--dir`).
- **line-in** : traits/lignes de tableau qui apparaissent un par un (500ms).

### Interactions
- **Press** : `transform` 120ms linear vers `scale(.97)`, retour en `spring-md` 340ms.
- **Hover carte** : léger lift `translateY(-2px)` + ombre plus large, 250ms.
- **Accordéon** : `grid-template-rows` 500ms `ease-out-expo` + `opacity` 350ms.
- **Onglets** : indicateur qui glisse 450ms `ease-ios`, contenu en `swipe-in`.
- **Copie réussie** : coche dessinée (`stroke-dashoffset 24 → 0`) + bouton qui grossit à 1.025 avec un anneau qui s'élargit et s'efface.
- **Like** : cœur `scale .4 → 1.28 → 1` + anneau qui s'étend + étincelles en étoile (`rotate(var(--a)) translateY`).

### Boucles d'ambiance
- **Halos bleus** qui dérivent : 2–3 blobs flous qui translatent/scale/opacité sur 12–15s `ease-in-out`, décalés (« near », « far », « shade »).
- **Pixel waves** : cercles de pixels `scale 0 → 1` + fondu, 4 couches à 9/11/14/17s.
- **Breathe** : `scale .94 ↔ 1.04` + opacité, pour une icône centrale.
- **Ripple** : anneau `scale .55 → 2.6` qui disparaît.
- **Float** : `translateY 0 ↔ -11px`.
- **Film grain** : texture qui saute de position par paliers (bruit animé).
- **Bordure tournante** du CTA : angle custom property 0 → 360deg en 4s linear.
- **Glow qui glisse** : `background-position 0% → 100%` sur un dégradé, 8s.
- **Shimmer** : skeletons / textes de chargement, `background-position 200% → -200%`.
- **Ping** : badge `scale .4 → 1.6` + fondu.
- **Grille qui défile** en perspective (fond de la section MCP) : `translateY(0 → 44px)` en boucle 2.4s sous un `rotateX`.
- **Swap** : deux éléments qui s'échangent toutes les 6s en `inout`.

### Accessibilité
Tout ce qui boucle doit s'arrêter sous `prefers-reduced-motion` (garder l'état final ou une frame fixe).

---

## 6. Règles de composition

- Alterner **clair / sombre** toutes les 1–2 sections ; les blocs sombres ont des coins arrondis et touchent les bords.
- Titres de section **toujours en deux tons** (noir + gris), sauf dans les blocs sombres (blanc majuscules).
- Un **badge pill** au-dessus de presque chaque H2.
- Un **seul CTA** visible par section, centré, pill.
- Le bleu n'est jamais en aplat sur un grand fond, sauf la carte de prix vedette.
- Mobile-first : cartes pleine largeur avec 16–20px de marge, carrousels qui débordent du bord.
- Beaucoup de vide : 96–140px entre sections.

---

## 7. Ce qu'il faut dans ton registre

```
registry/themes/process-like/
  tokens.css        # variables ci-dessus (couleurs, rayons, ombres, glass, easings, durées)
  tailwind.preset.ts
  motion.ts         # easings + variants (fadeUp, cardIn, sheetIn, popBlur, swipeIn)
  meta.json         # type: theme, source: "analyse useprocess.xyz", note: "style uniquement, pas d'assets"
registry/components/process-like/
  (un dossier par composant du §4)
registry/sections/process-like/
  hero, dark-showcase, steps, pricing, reviews, faq, footer, auth-modal
```

Prompt type pour Claude Code via ton MCP : *« Construis la landing de mon app avec le thème process-like : hero + dark-showcase (onglet catalogue) + steps + pricing + faq + footer. Remplace tous les visuels par des placeholders. »*
