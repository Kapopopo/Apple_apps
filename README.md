# Component Atlas

Un catalogue français avec **18 composants sélectionnés et animés directement dans la plateforme**, une sélection multiple persistante et un générateur de prompt. Les autres fiches du catalogue restent consultables avec leurs captures statiques.

## Démarrer

Python 3.10 ou supérieur suffit. Les démonstrations sont déjà compilées dans `web/demos/` : aucune installation npm n’est nécessaire pour utiliser l’interface.

```bash
python3 server.py
```

Ouvrir **http://localhost:8000**. Le serveur écoute uniquement sur l’interface locale. Autre port : `python3 server.py --port 8080`.

## Utilisation

1. **La sélection Atlas** présente 18 composants de Magic UI et Motion Primitives. Animations, clics et survols fonctionnent localement, sans redirection, y compris hors ligne.
2. Au survol d’une carte, **Agrandir** ouvre la démonstration interactive et **Sélectionner** l’ajoute au projet. Ces actions restent visibles sur écran tactile et accessibles au clavier.
3. Sélectionner autant de composants que souhaité, en changeant de recherche ou de filtre. Les choix sont conservés dans le navigateur. **Ma sélection** les réunit.
4. **Générer le prompt** permet de saisir un brief, une stack, un style et une consigne par composant. Le prompt inclut tous les composants, leurs sources exactes, leur rôle, leur animation et leurs consignes.
5. Modifier le prompt si nécessaire, puis **Copier** ou **Télécharger .txt**. Le générateur est déterministe et ne fait aucun appel à une IA.

Filtres combinables : recherche française/anglaise, bibliothèque, catégorie, comportement d’animation, usage (landing page, application, dashboard, portfolio), démonstration interactive ou capture statique. Les filtres peuvent être réinitialisés. Un bouton met les animations en pause ; la vue agrandie permet de les rejouer.

Le brief, les consignes, les favoris et la sélection sont enregistrés dans `localStorage`. Ils ne sont ni envoyés à un assistant, ni partagés automatiquement avec le serveur MCP. Les modifications manuelles du texte final ne sont pas conservées après fermeture ; le brief et les consignes permettent de le régénérer.

## Composants retenus

La sélection éditoriale figure dans `data/curation.json`. Chaque choix répond à un usage concret et possède une justification. Elle ne prétend pas représenter un classement universel de qualité.

- **Magic UI** : Marquee, Shimmer Button, Dock, Number Ticker, Border Beam, Magic Card, Animated List, Orbiting Circles, Animated Gradient Text, Ripple, Retro Grid, Word Rotate.
- **Motion Primitives** : Tilt, Accordion, Spotlight, Text Effect, Animated Background, Animated Number.

Les composants originaux sont conservés dans `demos/src/vendor/`. Leur contenu de démonstration est adapté à Atlas dans `demos/src/main.tsx`. L’accordéon reçoit une adaptation de typage pour React 19, sans changement de comportement. Les licences MIT et mentions de dépendances sont conservées dans `demos/licenses/` et `web/demos/THIRD_PARTY_LICENSES.txt`.

Les démos sont exécutées dans des cadres locaux. Elles n’intègrent pas les sites tiers, n’utilisent pas de CDN et ne chargent pas de ressource distante. Les cadres sont chargés à proximité de la zone visible puis mis en pause hors écran. Les préférences de réduction des animations sont prises en compte par Motion et les styles ; leur adaptation reste à vérifier dans l’application finale. Retro Grid utilise WebGL avec le repli prévu dans son composant original.

Les autres fiches portent la mention **Statique** : leur animation n’est pas intégrée. Elles peuvent être ajoutées au prompt, qui indique explicitement que leur comportement et leurs conditions d’intégration restent à vérifier.

## Modifier les démonstrations

Node.js 20.19+ est utilisé pour la compilation. Les versions exactes sont verrouillées par `demos/package-lock.json`.

```bash
npm --prefix demos ci
npm --prefix demos run typecheck
npm --prefix demos run build
```

Les sources officielles et la provenance sont répertoriées dans `data/curation.json`. `scripts/vendor_demos.py` permet de les récupérer à nouveau (Internet nécessaire) ; toute actualisation doit être suivie d’un examen du code, des licences et d’une nouvelle validation du rendu avant compilation. Le script n’installe ni n’exécute le code téléchargé.

## Catalogue et captures

`data/sources.txt` conserve le document fourni comme données, jamais comme instructions à exécuter. `data/catalog.json` contient le relevé public des 53 URL uniques ; sa couverture est partielle, limitée à 160 fiches par source. Certaines fiches représentent une famille de composants. Les sites d’inspiration restent dans le répertoire.

```bash
python3 scripts/index_sources.py
# Ou une seule bibliothèque :
python3 scripts/index_sources.py --source shadcn-ui
```

L’indexation vérifie les quatre premières fiches de chaque source pour le score documentaire : page HTML accessible (+40), balise de code présente (+20), mention d’accessibilité (+10). Le MCP ajoute 30 points pour une correspondance avec la recherche. Ce score ne mesure ni qualité du code, ni performance, ni accessibilité réelle. Il est distinct de la sélection éditoriale.

Les captures existantes sont servies localement depuis `data/previews/`. Créer d’autres captures nécessite Internet, Chrome/Chromium et la dépendance optionnelle :

```bash
python3 -m pip install -r requirements-preview.txt
python3 scripts/capture_previews.py
```

Le catalogue complet peut aussi demander des captures au serveur (deux simultanées maximum, file bornée). Elles sont statiques ; aucun lien de test externe n’est imposé dans le parcours utilisateur. Les erreurs restent signalées. `ATLAS_CHROME` permet de choisir le navigateur. Son sandbox est activé par défaut ; `ATLAS_CHROME_NO_SANDBOX=1` est disponible pour les conteneurs qui l’exigent. Cette dépendance n’est pas nécessaire pour les 18 démos locales.

## Serveur MCP

Serveur stdio JSON-RPC, versions négociées `2024-11-05`, `2025-03-26`, `2025-06-18`. Outils de lecture uniquement, sans transport HTTP MCP. Exemple de configuration :

```json
{
  "mcpServers": {
    "component-atlas": {
      "command": "python3",
      "args": ["/home/kapopay/3_année/Apple_apps/mcp_server.py"]
    }
  }
}
```

- `list_sources` : sources, statut et couverture.
- `search_components` : recherche avec `query`, `source`, `kind`, `verified_only`, `limit` (1 à 100), métadonnées éditoriales incluses.
- `recommend_components` : priorité aux composants retenus par Atlas qui correspondent aux filtres, puis aux autres fiches selon leur documentation ; 6 résultats par défaut. `verified_only` peut être activé explicitement.

Le serveur n’accède pas à la sélection du navigateur ; le prompt se copie ou se télécharge depuis l’interface.

## Vérifier

```bash
python3 -m unittest discover -s tests -v
node tests/test_prompt.cjs
node --check web/app.js
npm --prefix demos run typecheck
```

Avec le serveur lancé et la dépendance navigateur installée :

```bash
python3 tests/browser_live.py
```

Le test navigateur vérifie l’animation réelle, les 18 démos sans ressource distante, le survol 3D, les clics, plus de trois sélections à travers les filtres, la persistance, le prompt complet, sa copie et son export ainsi que la disposition mobile.
