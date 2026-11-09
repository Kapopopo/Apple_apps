# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Un seul utilisateur : le propriétaire du repo, développeur freelance. Usage principal confirmé : **démarrer un projet client**. Il part d'un brief, choisit vite un thème et une dizaine de blocs, les ordonne, annote chaque bloc, enregistre une spec, puis lance Claude Code (`/mcp__atlas__build-from-spec <nom>`). Outil personnel, jamais commercialisé, repo privé.

## Product Purpose

Centraliser des composants UI, sections, écrans, thèmes, polices et easings gratuits venant de plusieurs sites, pour ne plus refaire le tour des sites. Le succès : passer d'un brief à une spec exploitable par Claude Code en quelques minutes, avec le vrai code et des licences tracées.

## Positioning

Le registre contient le code source réel (pas des liens) avec licence et provenance vérifiées par item, et un serveur MCP le sert directement à Claude Code. La sélection devient un fichier de spec versionnable plutôt qu'un prompt copié-collé.

## Operating Context

- Application web locale servie par `server.py` (http://localhost:8000), deux pages conservées (décision du 2026-11-05) :
  - `/` Catalogue : essayer les composants — sélection Atlas (44 démos), tous les composants interactifs du registre, favoris, sélection, prompt à copier, envoi au builder.
  - `/builder` : composer une spec (thème, polices, easings, blocs ordonnés + notes), sauvegarde dans `specs/`, presets.
- **Uniquement de l'interactif dans l'interface** (décision du 2026-11-05) : un composant n'apparaît que s'il fonctionne en direct (démo Atlas ou aperçu live validé par l'audit). Les fiches « lien + capture », les fonds One Prompt Design et les composants React Native restent dans `data/` ou le registre (accessibles au MCP) mais ne sont plus affichés.
- Claude Code consomme les specs via le serveur MCP `atlas`.

## Capabilities and Constraints

- Vanilla HTML/CSS/JS sans build pour `web/` ; CSP stricte (pas de style inline en HTML, pas de script inline, pas de CDN). Les polices Fontshare peuvent être chargées par le builder uniquement.
- Les aperçus de code tiers restent dans des iframes sandboxées.
- Langue de l'interface : français.
- Les licences restreintes (Rare UI, React Bits, polices ITF FFL) doivent rester visibles avec leur attribution.
- L'utilisateur autorise l'import de tout composant utile publié gratuitement pour être copié (licence ouverte, ou gratuite avec conditions marquée `restricted`). Le contenu payant (Pro) ou explicitement fermé reste exclu, même pour un usage non commercial.

## Evidence on Hand

Registre réel dans `registry/`, presets dans `specs/presets/`, spec d'exemple `specs/dashboard-padel.json`, captures dans `data/previews/`. Aucun témoignage ni métrique d'usage : ne pas en inventer.

## Product Principles

1. Le chemin brief → spec → Claude Code d'abord ; tout ce qui ne le sert pas passe au second plan.
2. Le code réel et la licence de chaque item sont toujours à un clic.
3. Une interface d'outil : dense, scannable, sans texte promotionnel.
4. Rien n'est perdu : la sélection, le brouillon et les specs persistent.
