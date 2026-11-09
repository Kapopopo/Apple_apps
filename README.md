# Component Atlas

Outil personnel (non commercialisé, **repo privé**) qui centralise des composants UI, sections, écrans, thèmes, polices et easings **gratuits et sous licence vérifiée**, pour ne plus refaire le tour des sites.

1. **Registre** (`registry/`) : le vrai code de chaque item, avec licence et provenance.
2. **Importers** (`importers/`) : récupèrent les nouveautés des sources, relançables sans doublon.
3. **Builder** (`/builder`) : je choisis un thème et des blocs, je les ordonne et je les annote, puis j’enregistre une spec (`specs/dashboard-padel.json`).
4. **Serveur MCP** (`mcp/`) : Claude Code lit mes specs et récupère le **code source réel** pour construire le projet.

L’interface ne montre **que ce qui est interactif** : le catalogue (`/`) pour essayer les composants, le builder (`/builder`) pour composer. Un composant n’y apparaît que s’il fonctionne en direct (démo Atlas ou aperçu live validé par l’audit). Le reste (catalogue de liens, captures, fonds One Prompt Design, composants React Native) reste dans `data/` et le registre, accessible au MCP.

## Démarrer

Prérequis : Node.js 20.19+ et Python 3.10+. Sous Windows, si `python` pointe vers une version plus ancienne, utiliser `py -3.12`.

```bash
npm install                 # outillage TypeScript ; compile le serveur MCP dans dist/
npm --prefix previews install
npm run import              # tous les importers (Internet nécessaire), puis l’index
npm run previews            # compile les aperçus live du registre
npm --prefix previews run audit   # vérifie chaque aperçu (Chrome) → registry/_previews.json
python3 server.py           # http://localhost:8000 · builder : http://localhost:8000/builder
```

Le registre est versionné : `npm run import` ne sert qu’à récupérer les nouveautés.

## 1. Registre

```
registry/
  items/<source>/<slug>/     composants, sections, écrans, utilitaires (lib)
  themes/<source>/theme/     tokens séparés des composants (couleurs clair/sombre, typo, rayons)
  fonts/fontshare/<slug>/    polices : métadonnées + lien CSS, aucun fichier de police
  easings/atlas/easings-standard/
  index.json                 généré : résumé de tous les items (builder, MCP)
  _import-log.json           100 derniers passages : ajoutés, mis à jour, sautés + raison, absents en amont
```

Chaque dossier contient `meta.json`, `files/` (chemins identiques au repo d’origine) et `LICENSE` (copie du texte de la source). Le schéma est défini dans [shared/schema.ts](shared/schema.ts) et validé à chaque écriture.

| Champ | Rôle |
|---|---|
| `id` | `source/slug`, stable : il fixe le dossier, donc pas de doublon |
| `type` | `component` · `section` · `screen` · `theme` · `font` · `easing` · `lib` (helpers requis par d’autres items, masqués du builder) |
| `category`, `tags` | catégories françaises partagées avec le catalogue (`shared/taxonomy.ts`), tags dérivés du nom, de la description et des dépendances |
| `framework` | `react` · `react-native` · `agnostic` |
| `dependencies` | paquets npm (déclarés par la source + imports réellement trouvés) |
| `registryDependencies` | autres items requis (ex. `rare-ui/utils`), résolus récursivement par le MCP |
| `source`, `sourceUrl`, `sourcePath`, `sourceCommit` | provenance exacte (lien GitHub au commit importé) |
| `license`, `licenseStatus`, `licenseNotes`, `attribution` | voir *Licences* |
| `files[]` | `path`, `role` (`source`, `style`, `demo`, `doc`, `theme`), `target` conseillé |
| `preview` | `live` (app previews), `atlas-demo` (démos existantes), `none` (+ raison) |
| `importedAt`, `updatedAt`, `contentHash` | relance idempotente : même contenu, rien n’est réécrit |

État actuel : 12 sources de composants, environ 2 050 items (composants, sections, écrans, thèmes, 100 polices, easings, utilitaires). Les chiffres à jour sont dans `registry/index.json` et `registry/_previews.json`.

## 2. Importers

```bash
npm run import                         # local, easings, github, fontshare, puis index
npm run import:github -- --source rare-ui
npm run import:github -- --offline     # réutilise .cache/sources sans réseau
npm run import:fontshare
npm run index                          # régénère seulement registry/index.json
```

| Importer | Source | Ce qui est importé |
|---|---|---|
| `github` · `shadcn-registry` | [Rare UI](https://github.com/swamimalode07/rare-ui), [Easy UI](https://github.com/Surajmaurya1/easyui) | items de `registry.json`, fichiers internes manquants retrouvés par le graphe d’imports, démos d’usage (Rare UI), README des props (Easy UI), thème |
| `github` · `shadcn-built` | [shadcn/ui](https://github.com/shadcn-ui/ui), [Magic UI](https://github.com/magicuidesign/magicui), [Motion Primitives](https://github.com/ibelick/motion-primitives), [Cult UI](https://github.com/nolly-studio/cult-ui), [Kokonut UI](https://github.com/kokonut-labs/kokonutui), [ReUI](https://github.com/keenthemes/reui), [Origin UI](https://github.com/cosscom/ui), [React Bits](https://github.com/DavidHDev/react-bits), [PanelUI](https://github.com/panel-ui/PanelUI) | registres construits (code inline) : exemples officiels rattachés comme démos et aperçus, une variante par composant (React Bits : TS + Tailwind), dépendances manquantes résolues vers shadcn/ui, items déjà intégrés par `local` conservés, primitives PanelUI classées `lib` |
| `github` · `folder-blocks` | [Bencho](https://github.com/cabralorenzo/bencho) | les 46 blocs gratuits du repo (`blocks/`), `tokens.css` comme thème. Exclus : `assets/` (photos), `sounds/`, `playground/`. Les blocs Pro n’existent que sur bencho.dev |
| `local` | `demos/src/vendor` + `data/curation.json` | les 44 composants Magic UI / Motion Primitives de la sélection Atlas, avec leur démo adaptée |
| `fontshare` | API Fontshare v2 | nom, styles, lien CSS (`font.css` = `@import` + variable) |
| `easings` | généré | 30 courbes : cubic-bezier CSS, tableaux Motion, fonctions JS |

Les sources GitHub sont déclarées dans [importers/sources.json](importers/sources.json) (alias d’import, motifs de démos, fichier de thème). Les clones superficiels vont dans `.cache/sources/` (gitignoré). Le code cloné est **lu, jamais exécuté**.

Un item disparu en amont n’est jamais supprimé : il est signalé dans `missingUpstream` du journal.

### Licences

- La licence est relue dans le **texte** du `LICENSE` à chaque import (le champ SPDX de GitHub renvoie `NOASSERTION` dès qu’une clause est ajoutée).
- **Liste blanche** (`licenseStatus: open`) : MIT, Apache-2.0, ISC, BSD-2/3, 0BSD, Unlicense, CC0, OFL-1.1.
- Licence absente, non reconnue ou restrictive : la source est **sautée et journalisée**, sauf acceptation explicite dans `sources.json` (`acceptRestricted`). Cette acceptation ne vaut que pour le texte exact : si la licence change en amont, l’import s’arrête.
- `licenseStatus: restricted`, acceptés le 2026-11-05 :
  - **Rare UI** : MIT + Commons Clause + Attribution. Usage libre dans les projets, mais interdiction de redistribuer ou vendre les composants eux-mêmes, et **lien visible vers rareui.com obligatoire** dans tout projet qui en embarque un. C’est pour cette raison que le repo doit rester privé.
  - **64 polices Fontshare** sous ITF Free Font License : gratuites, fichiers non redistribuables. Seul le lien CSS est stocké. Les 36 autres sont sous OFL.
- Les mentions « hors licence » (ex. nom et photos Bencho) sont conservées dans `licenseNotes`. Le MCP et le builder affichent l’attribution de chaque item restreint.

## 3. Builder

`http://localhost:8000/builder`

L’interface est en mode sombre ; les deux pages partagent `web/theme.css` (tokens, contrôles) et `web/icons.svg`. Les aperçus du registre s’affichent en sombre par défaut (« Aperçus sur fond clair » pour l’inverse) ; les 44 démos Atlas gardent leur scène claire d’origine.

- Galerie avec aperçus live, filtres par type, catégorie, tag, source, framework, licence et « avec aperçu ». La recherche est bilingue (« bouton », « graphique », « carrousel »…).
- **Code** : aperçu agrandi, licence, attribution, paquets npm, dépendances, tous les fichiers.
- Panneau de spec dans l’ordre du travail : **Projet** (nom de fichier, titre, brief, stack, direction), **Style** (thème, polices, easings ; « Choisir dans la galerie » filtre directement), **Blocs** ordonnés par glisser-déposer ou monter/descendre, avec une note par bloc. Le brouillon est conservé dans le navigateur.
- **Enregistrer la spec** écrit `specs/<nom>.json` (validation du nom, des champs et de chaque id) ; la commande Claude Code s’affiche dessous avec un bouton de copie. **Comme preset** écrit `specs/presets/`.
- **Ouvrir…** : reprendre une spec, ou partir d’un preset (`landing-produit`, `dashboard-saas`, `app-mobile-expo`).
- Depuis le catalogue, **Envoyer au builder** reprend les composants sélectionnés qui ont du code dans le registre, notes comprises (bouton « Reprendre la sélection du catalogue » dans le panneau sinon).

### Aperçus live

`npm run previews` compile [previews/](previews/) (Vite, React 19, Tailwind 4) vers `web/registry-previews/` (gitignoré) :

- un chunk par item : une erreur ne casse que son aperçu ;
- une feuille Tailwind par source, avec ses tokens (les classes `text-primary` d’Easy UI et de shadcn ne se mélangent pas) ;
- les imports `@/…` sont résolus vers les fichiers du registre ; les helpers des sites d’origine (`next/link`, `PreviewControls`…) sont remplacés par des shims. Un import introuvable devient une erreur locale, listée dans `previews/missing-modules.txt` ;
- chaque aperçu tourne dans une **iframe sandboxée** (`allow-scripts`, origine opaque, `connect-src 'none'`) : le code tiers n’accède ni à la page ni au stockage.

`npm --prefix previews run audit` ouvre chaque aperçu dans Chrome headless (6 onglets) et le classe `ok`, `empty` (rien de visible sans props) ou `error`. Le serveur n’affiche que les `ok` ; sans audit, tout aperçu compilé est supposé valide. À relancer après chaque `npm run previews`. Les imports introuvables sont listés dans `previews/missing-modules.txt`.

## 4. Serveur MCP

TypeScript, `@modelcontextprotocol/sdk`, stdio, outils en lecture seule. Il remplace l’ancien `mcp_server.py`, dont les trois outils ont été portés à l’identique (même classement, vérifié par un test de parité avec `catalog.py`).

| Outil | Rôle |
|---|---|
| `list_specs` | specs et presets |
| `get_spec(name)` | thème, polices, easings, blocs ordonnés avec notes ; pour chaque item : type, source, licence, attribution, dépendances, ou `found: false` |
| `get_component(id)` | **tous les fichiers source réels**, licence et attribution, paquets npm, code des dépendances de registre (`include_dependencies`), démo d’usage (`include_demo`), docs (`include_docs`) |
| `get_theme(id)` | tokens et CSS d’un thème, styles et lien CSS d’une police, courbes d’un jeu d’easings |
| `search_registry(query, type, framework, source, category, license_status, tags, limit)` | recherche bilingue dans le registre |
| `list_sources`, `search_components`, `recommend_components` | catalogue de liens et sélection éditoriale (outils historiques) |

Prompt MCP **`build-from-spec`** (nom de spec complété automatiquement) : consignes, brief, attributions obligatoires, plan des blocs avec leurs notes, thème, puis le code de chaque bloc dans l’ordre. Au-delà d’environ 180 ko, les blocs restants sont signalés pour être récupérés avec `get_component`.

### Dans Claude Code

[.mcp.json](.mcp.json) déclare le serveur `atlas` pour ce projet. Après `npm install`, lancer `claude` dans le repo et approuver le serveur, puis :

```
/mcp__atlas__build-from-spec dashboard-padel
```

Depuis un autre projet :

```bash
claude mcp add atlas -- node "/chemin/vers/Apple_apps/dist/mcp/index.js"
```

Le serveur relit le registre et les specs à chaque appel : un import ou une spec enregistrée est visible sans redémarrage.

## Vérifier

```bash
npm run typecheck && npm test                 # registre, licences, importers, MCP (stdio réel) + parité catalog.py
python3 -m unittest discover -s tests -v      # catalogue, curation, captures, validation des specs
node tests/test_prompt.cjs
node --check web/app.js && node --check web/builder.js
node tests/browser_builder.mjs http://127.0.0.1:8000   # serveur lancé, Chrome requis
```

## Catalogue (`/`)

- **Sélection Atlas** : 44 composants Magic UI et Motion Primitives animés localement avec un contenu adapté (`demos/`, compilés dans `web/demos/`). Pour modifier ces démos : `npm --prefix demos ci && npm --prefix demos run build`.
- **Tous les composants** : chaque aperçu live validé du registre, en sombre, dans une iframe sandboxée. Filtres : bibliothèque, type, licence, animation et usage (sélection Atlas).
- **Sélection** conservée dans le navigateur : **Envoyer au builder** (blocs avec leurs notes) ou **Générer le prompt** (texte déterministe, sans IA, qui renvoie au code du registre via `get_component`).
- Données historiques non affichées, conservées pour le MCP (`search_components`, `recommend_components`) : `data/catalog.json` (liens de 53 sites), captures `data/previews/` (`scripts/capture_previews.py`), fonds `data/reference_sources.json`.
