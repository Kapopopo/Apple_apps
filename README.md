# Component Atlas

Outil personnel (non commercialisé, **repo privé**) qui centralise des composants UI, sections, écrans, thèmes, polices, courbes d’animation et sons **gratuits et sous licence vérifiée**, pour démarrer un projet client sans refaire le tour des sites.

1. **Registre** (`registry/`) : le vrai code de chaque item, avec sa licence et sa provenance.
2. **Importers** (`importers/`) : récupèrent les sources à des commits verrouillés, relançables sans doublon.
3. **Catalogue** (`/`) et **builder** (`/builder`) : j’essaie les composants, je compose une spec (thème, blocs par page, consignes) et je l’enregistre (`specs/<nom>.json`).
4. **Serveur MCP** (`mcp/`) : Claude Code lit la spec et reçoit le **code source réel**, prêt à poser, avec les crédits.

L’interface ne montre **que ce qui est interactif** : un composant n’y apparaît que si son aperçu fonctionne en direct (démo Atlas ou aperçu live validé par l’audit). Le reste du registre (composants React Native, utilitaires, aperçus en erreur) reste accessible au MCP et au bundle.

## Démarrer

Prérequis : Node.js 22.13+ (ESLint 10 l’exige ; le serveur, le MCP et les tests tournent dès 22.11), Git, Chrome ou Edge pour les aperçus, l’audit et les tests e2e.

```bash
npm run setup     # installe l’outillage, les aperçus et les démos, active le hook pre-commit
npm start         # http://localhost:8000 · builder : http://localhost:8000/builder
```

Le registre est versionné : rien à importer pour démarrer. Pour les aperçus live et les vignettes :

```bash
npm run previews  # compile les aperçus du registre (≈ 2 min) → web/registry-previews/
npm run audit     # vérifie chaque aperçu dans Chrome, capture les vignettes → registry/_previews.json, web/thumbs/
```

L’audit est incrémental : il ne refait que les items dont le code, l’empreinte du chunk compilé ou la vignette ont changé (`npm run audit -- --all` pour tout refaire, `-- --only id1,id2` pour une liste). Une retouche de l’app d’aperçus elle-même (`main.tsx`, `base.css`) ne relance rien : passer `--only` ou `--all`.

## Projet client : du brief au code

1. **Catalogue** : chercher en français (« tarifs », « graphique », « connexion »…), essayer, **Ajouter** → le composant rejoint la spec en cours, la même que celle du builder.
2. **Builder** : nommer la spec, coller le brief, choisir un thème (ou **Créer** le vôtre : couleurs clair/sombre, rayon, aperçu en direct), des polices, des courbes et des sons ; ordonner les blocs, leur donner une **page** et une **consigne** ; **Aperçu de la page** empile les blocs aux couleurs du thème ; **Enregistrer**.
3. **Claude Code**, dans ce dépôt : `/mcp__atlas__build-from-spec <nom>`. Le MCP fournit le plan, le thème, une seule commande `npm install`, puis le code bloc par bloc (`get_component` avec `target_alias`) ou en une fois (`get_spec_bundle`).
4. **Ou directement** dans le projet : `npm run bundle -- <nom> --out ../mon-projet` (composants, thème CSS, polices, easings, `CREDITS.md` ; rien n’est écrasé sans `--force`).
   **Partir d’un site complet** : choisir un template dans le builder (onglet *Templates*, « Partir de ce template »), puis `npm run scaffold -- <template> --out ../mon-projet` avant le bundle. Le MCP l’indique aussi en tête du plan.
5. **Crédits** : `CREDITS.md` liste chaque source et les attributions obligatoires à afficher (Rare UI, React Bits…).

Un composant seul s’installe aussi dans un projet shadcn : `npx shadcn@latest add http://localhost:8000/r/<source>/<slug>.json` (le serveur Atlas doit tourner).

## Registre

```
registry/
  items/<source>/<slug>/     composants, sections, écrans, utilitaires (lib)
  themes/<source>/theme/     tokens séparés des composants ; themes/perso/ = thèmes créés dans le builder
  fonts/fontshare/<slug>/    polices : métadonnées + lien CSS, aucun fichier de police
  easings/atlas/easings-standard/   courbes, ressorts Motion, durées
  sounds/<source>/<slug>/    sons d’interface (Web Audio, sans fichier audio)
  templates/<id>/template/   sites complets : tout le dépôt dans files/, captures de la démo dans screens/
  index.json                 généré : résumé de tous les items, textes de licence communs par source
  _previews.json             résultat de l’audit (état, hash du code, chunk, vignette)
  _enrichment.json           descriptions françaises générées (npm run enrich), si présent
  _import-log.json           100 derniers passages : ajoutés, mis à jour, sautés + raison, absents en amont
```

Chaque dossier contient `meta.json`, `files/` (chemins du repo d’origine) et `LICENSE` (copie du texte de la source). Le schéma est défini dans [shared/schema.ts](shared/schema.ts) et validé à chaque écriture.

| Champ | Rôle |
|---|---|
| `id` | `source/slug`, stable : il fixe le dossier, donc pas de doublon |
| `type` | `component` · `section` · `screen` · `theme` · `font` · `easing` · `sound` · `template` (site complet) · `lib` (helpers et primitives requis par d’autres items, masqués de l’interface) |
| `category`, `tags` | catégories françaises (`shared/taxonomy.ts`), tags dérivés du nom, de la description et des dépendances |
| `framework` | `react` · `react-native` · `agnostic` |
| `dependencies`, `registryDependencies` | paquets npm ; autres items requis, résolus récursivement par le MCP et le bundle |
| `source`, `sourceUrl`, `sourcePath`, `sourceCommit` | provenance exacte (lien GitHub au commit importé) |
| `license`, `licenseStatus`, `licenseNotes`, `attribution` | voir *Licences* |
| `files[]` | `path`, `role` (`source`, `style`, `demo`, `doc`, `theme`, `data`, `asset` = fichier binaire d’un template), `target` conseillé |
| `template` | templates seulement : type de site, stack, démo, pages, commandes, variables d’environnement, fichiers écartés |
| `preview` | `live` (app previews), `atlas-demo` (démos existantes), `none` (+ raison) |
| `sound` | moteur (`react-bits` ou `bencho`) et noms des sons |
| `importedAt`, `updatedAt`, `contentHash` | relance idempotente : même contenu, rien n’est réécrit |

État actuel : 12 sources, ≈ 3 600 items dont 1 264 exemples officiels ReUI, 224 sons, 100 polices, et 6 templates complets. Chiffres à jour : `registry/index.json` et `registry/_previews.json`.

## Sources et importers

```bash
npm run import                         # local, easings, github, templates, fontshare, puis l’index (commits verrouillés)
npm run import:github -- --source reui --offline   # une source, depuis .cache/sources sans réseau
npm run outdated                       # sources qui ont publié depuis leur verrou (registry/_updates.json), sans rien importer
npm run update                         # derniers commits + aperçus + audit ; met à jour importers/lock.json
npm run refresh                        # import + aperçus + audit aux commits verrouillés
```

| Source | Ce qui est importé |
|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui), [Magic UI](https://github.com/magicuidesign/magicui), [Cult UI](https://github.com/nolly-studio/cult-ui), [Kokonut UI](https://github.com/kokonut-labs/kokonutui) | registres construits, exemples officiels rattachés comme démos ; dépendances manquantes résolues vers shadcn/ui |
| [Motion Primitives](https://github.com/ibelick/motion-primitives) | composants + démos de la documentation (`app/docs/<nom>/`) |
| [ReUI](https://github.com/keenthemes/reui) | composants, **1 264 exemples officiels** nommés et décrits par la source, primitives Base UI et hooks propres (au lieu du repli Radix de shadcn) ; les sous-parties d’une famille (`data-grid-table`…) sont des utilitaires, la famille montre ses exemples |
| [Origin UI](https://github.com/cosscom/ui) | ≈ 650 exemples, nommés d’après le libellé visible dans leur code (« Simple input ») |
| [React Bits](https://github.com/DavidHDev/react-bits) | une variante par composant (TS + Tailwind) ; 200 sons et leur moteur Web Audio ; aperçu désactivé pour les items qui dépendent de `vgpu` (paquet non vérifié) |
| [Rare UI](https://github.com/swamimalode07/rare-ui) | `registry.json`, graphe d’imports, démos d’usage |
| [Easy UI](https://github.com/Surajmaurya1/easyui) | `registry.json`, README des props, démos de route avec leur registre `DEMO_COMPONENTS` rendu statique (limité aux composants utilisés) |
| [PanelUI](https://github.com/panel-ui/PanelUI) | composants React Native (code seul) et variante web (aperçus) |
| [Bencho](https://github.com/cabralorenzo/bencho) | blocs gratuits (`blocks/`), 24 sons (`sounds/sounds.ts`), `tokens.css` comme thème ; exclus : photos, playground, blocs Pro (bencho.dev) |
| local | les 44 composants de la sélection Atlas (`demos/src/vendor` + `data/curation.json`) |
| Fontshare, easings | nom, styles et lien CSS des polices ; 30 courbes, 5 ressorts Motion (+ `linear()` CSS), 5 durées |

Les sources sont déclarées dans [importers/sources.json](importers/sources.json) (alias d’import, démos, thème, dossiers extraits). Les clones vont dans `.cache/sources/` (gitignoré), **partiels** quand la source le permet : seuls les dossiers utiles sont extraits (≈ 0,7 Go au lieu de 1,5 Go ; supprimer un dossier de cache pour le recloner en partiel). Le code cloné est **lu, jamais exécuté**. Un item disparu en amont n’est jamais supprimé : il est signalé dans `missingUpstream` du journal.

**Aperçus React Native (PanelUI)** : non retenus. 141 composants dépendent de `uniwind` (Tailwind compilé par Metro/Babel) et de Reanimated ; la variante PanelUI Web couvre les mêmes composants avec aperçus, et le détail d’un composant natif renvoie vers ses équivalents.

### Templates complets

Six sites entiers, choisis pour couvrir des besoins différents (tous MIT, maintenus, avec démo officielle sauf le blog) :

| Template | Type | Stack | Fichiers | Captures |
|---|---|---|---|---|
| [launch-ui](https://github.com/launch-ui/launch-ui) | site vitrine (landing page) | Next.js, Tailwind 4, shadcn/ui | 58 | 2 |
| [saas-starter](https://github.com/nextjs/saas-starter) | SaaS : landing, comptes, tableau de bord, paiement | Next.js, Postgres (Drizzle), Stripe | 53 | 5 |
| [shadcn-admin](https://github.com/satnaing/shadcn-admin) | application d’administration (tâches, utilisateurs, messagerie, réglages) | Vite, React, TanStack Router | 259 | 8 |
| [studio-admin](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) | tableaux de bord métier (CRM, finance, analytics, e-commerce) | Next.js, Tailwind 4, shadcn/ui | 359 | 7 |
| [starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) | blog MDX (tags, recherche, commentaires, newsletter) | Next.js, Contentlayer, Tailwind | 103 | image du dépôt |
| [magicui-portfolio](https://github.com/magicuidesign/portfolio) | portfolio / CV en ligne | Next.js, Magic UI | 87 | 3 |

```bash
npm run import:templates               # clone au commit verrouillé, copie tout le dépôt (registry/templates/<id>/template/)
npm run capture:templates              # captures bureau + mobile des pages déclarées, sur la démo officielle
npm run scaffold -- saas-starter --out ../mon-projet   # copie le template entier + LICENSE + ATLAS.md
```

- **Repris** : tout le dépôt, images comprises (≤ 1,5 Mo par fichier, 12 Mo par template). **Écartés** : `node_modules`, builds, verrous de paquets, `.env*` (seul `.env.example` est gardé), `.github`, fichiers trop lourds (listés dans `template.skipped`).
- `meta.json → template` : type de site, stack, démo, pages, commandes `install`/`dev` (gestionnaire déduit du verrou), variables d’environnement à renseigner (lues dans `.env.example`).
- Le code des templates est **copié, jamais exécuté** ici : les captures viennent des démos officielles (`importers/sources.json → templates[].pages`), pas d’un build local.
- `ATLAS.md`, écrit par `scaffold` dans le projet, rappelle la source, la licence, les commandes et les variables à renseigner.

**Vérification hebdomadaire** (Windows) : `npm run schedule` enregistre une tâche qui lance `npm run outdated` le lundi à 9 h (aucun import automatique ; le builder signale les sources à mettre à jour) ; `npm run unschedule` la retire.

### Licences

- La licence est relue dans le **texte** du `LICENSE` à chaque import (le champ SPDX de GitHub renvoie `NOASSERTION` dès qu’une clause est ajoutée).
- **Liste blanche** (`licenseStatus: open`) : MIT, Apache-2.0, ISC, BSD-2/3, 0BSD, Unlicense, CC0, OFL-1.1.
- Licence absente, non reconnue ou restrictive : la source est **sautée et journalisée**, sauf acceptation explicite dans `sources.json` (`acceptRestricted`), qui ne vaut que pour le texte exact : si la licence change en amont, l’import s’arrête.
- `licenseStatus: restricted`, acceptés explicitement :
  - **Rare UI** : MIT + Commons Clause + Attribution. Usage libre dans les projets ; interdiction de redistribuer ou vendre les composants eux-mêmes ; **lien visible vers rareui.com obligatoire** dans tout projet qui en embarque un. C’est l’une des raisons pour lesquelles le repo doit rester privé.
  - **React Bits** : MIT + Commons Clause. Usage libre, y compris commercial ; interdiction de vendre ou redistribuer les composants eux-mêmes ; notice de copyright à conserver.
  - **64 polices Fontshare** sous ITF Free Font License : gratuites, fichiers non redistribuables. Seul le lien CSS est stocké.
- Les mentions « hors licence » (ex. nom et photos Bencho) sont conservées dans `licenseNotes`. Les logos de marques présents dans certains exemples ReUI restent la propriété de leurs titulaires (contenu de démonstration).
- Le bundle et le MCP produisent `CREDITS.md`, attributions obligatoires en tête.

## Serveur web

`npm start` (TypeScript, aucune dépendance de serveur) écoute uniquement sur 127.0.0.1.

- **DNS rebinding** : seuls les en-têtes `Host` `127.0.0.1`, `localhost` et `[::1]` au port écouté sont acceptés ; **écritures** : même origine, JSON uniquement.
- **CSP** par type de page ; aperçus de code tiers dans des **iframes sandboxées** (`allow-scripts`, origine opaque, `connect-src 'none'`).
- API : `/api/catalog`, `/api/registry`, `/api/registry/item?id=`, `/api/specs` (+ `/<nom>`, `/history`, `/history/<version>`, `/rename`, `DELETE`), `/api/themes` (création, suppression des thèmes personnels), `/api/skin.css?id=`, `/api/info` ; registre shadcn sous `/r/`.
- Chaque remplacement ou suppression de spec garde une copie dans `specs/.history/` (30 dernières, locales).

## Catalogue et builder

- **Panier unique** : « Ajouter » (catalogue) et la galerie du builder alimentent la même spec en cours, conservée dans le navigateur et synchronisée entre onglets. Les anciennes sélections du catalogue sont reprises automatiquement.
- **Aperçus à la demande** : vignette de l’audit, aperçu monté au survol, au focus ou au toucher (« Animer au survol ») ou dès qu’il est visible (« Animations auto ») ; au plus 12 aperçus actifs, démontés hors écran.
- **Recherche** bilingue classée par pertinence ; vues **Nouveautés**, favoris ; **équivalents** d’un composant dans les autres bibliothèques.
- **Builder** : menu de la spec (nouvelle, dupliquer, renommer, historique et restauration, supprimer), page par bloc, aperçu composé, « Thème de la spec » appliqué aux aperçus, éditeur de thème, sons jouables, commande shadcn dans le détail, ouverture par `/builder#spec=<nom>` ou `#item=<id>`.
- **Templates** : onglet dédié du builder (captures bureau et mobile, pages, commande `scaffold` à copier, variables d’environnement, arborescence, README) ; un template par spec, emplacement « Template » sous le thème.
- Le **prompt texte** du catalogue reste disponible pour un assistant sans MCP.

## Aperçus et audit

`npm run previews` compile [previews/](previews/) (Vite, React 19, Tailwind 4) vers `web/registry-previews/` (gitignoré) : un chunk par item (une erreur ne casse que son aperçu), une feuille Tailwind par source, imports `@/…` résolus vers le registre (même résolution que le bundle, [shared/resolve.ts](shared/resolve.ts)), helpers des sites d’origine remplacés par des shims, imports introuvables listés dans `previews/missing-modules.txt`. Paramètres : `theme`, `card`, `page` (hauteur transmise au builder), `skin=<thème>` ; message `atlas-skin` pour l’éditeur de thème. Les dépendances des aperçus s’installent sans scripts d’installation (`previews/.npmrc`).

`npm run audit` ouvre chaque aperçu dans Chrome headless, le classe `ok` (contenu DOM visible **et** capture non uniforme), `empty` ou `error`, compte les images introuvables et enregistre une vignette JPEG. Seuls les `ok` à jour (même `contentHash`) sont affichés.

## Serveur MCP

TypeScript, `@modelcontextprotocol/sdk`, stdio. Relit le registre et les specs à chaque changement : un import ou une spec enregistrée est visible sans redémarrage.

| Outil | Rôle |
|---|---|
| `list_specs` | specs et presets (pages, nombre de versions) |
| `get_spec(name)` | thème, polices, easings, sons, blocs ordonnés avec page et consigne ; pour chaque item : type, source, licence, attribution, dépendances, aperçu interactif, ou `found: false` |
| `get_spec_bundle(name, target_alias?)` | tout le code de la spec prêt à poser : chemins cibles, imports réécrits, thème CSS, polices, easings, `CREDITS.md`, une commande `npm install` |
| `get_component(id, target_alias?)` | **les fichiers source réels**, licence, paquets npm, dépendances de registre, démo, docs ; avec `target_alias` (`@/`, `~/`, `relative`) : chemins et imports adaptés au projet |
| `get_template(id, files?)` | template complet : type, stack, pages, commande `scaffold`, variables d’environnement, arborescence, README et `package.json` ; avec `files`, le contenu de fichiers précis |
| `get_theme(id)` | tokens et CSS d’un thème, styles et lien d’une police, courbes, ressorts et durées |
| `search_registry(…, interactive_only?)` | recherche bilingue ; à pertinence égale, les items à aperçu vérifié passent devant |
| `create_spec(…)` | enregistre une spec, template de départ compris (ids vérifiés ; version remplacée archivée) |

Prompt **`build-from-spec`** : mode `light` par défaut (plan, thème, installation, appels `get_component` par bloc), `full` pour tout le code inline (≈ 180 ko max).

Dans ce dépôt, [.mcp.json](.mcp.json) déclare le serveur `atlas`. Depuis un autre projet, la commande exacte (chemins absolus) est affichée par « Utiliser avec Claude Code » dans le catalogue :

```bash
claude mcp add atlas -s user -- node --import "file:///<chemin>/node_modules/tsx/dist/loader.mjs" "<chemin>/mcp/index.ts"
```

## Enrichissement en français (optionnel)

`npm run enrich` demande à Claude (Opus 5.5, sorties structurées) une description courte, des cas d’usage et des mots-clés français pour chaque composant, à partir de ses métadonnées et d’un extrait de son code. Le résultat (`registry/_enrichment.json`, mis en cache par version du code) est affiché et cherchable dans le catalogue, le builder et le MCP.

```bash
npm run enrich -- --dry-run          # sans clé : items, requêtes, tokens et coût estimés (≈ 16 $ pour tout le registre)
npm run enrich -- --source reui      # une source ; --limit, --batch, --concurrency, --effort, --force
```

Identifiants : `ANTHROPIC_API_KEY`, ou un profil `ant auth login`.

## Vérifier

```bash
npm run check       # types, ESLint, Prettier, tests unitaires (registre, licences, importers, bundle, serveur, MCP stdio, prompt)
npm run test:e2e    # catalogue et builder dans Chrome headless, serveur sur un port libre
```

La CI (`.github/workflows/ci.yml`) lance `check` puis les e2e à chaque push. Le hook `pre-commit` (activé par `npm run setup`) lance `check`.

## Démos Atlas

Les 44 démos de la sélection Atlas (`demos/`, compilées dans `web/demos/`, versionnées) : `npm --prefix demos ci && npm --prefix demos run build` pour les modifier.
