# Sources des démonstrations Atlas

Les 44 composants de `src/vendor/` proviennent des registres officiels de Magic UI et du dépôt officiel de Motion Primitives. La provenance précise de chaque composant est enregistrée dans `../data/curation.json`.

- Magic UI — copyright Magic UI — licence MIT dans `licenses/magic-ui.txt`.
- Motion Primitives — copyright 2024 ibelick — licence MIT dans `licenses/motion-primitives.txt`.

Les composants sont intégrés avec des contenus de démonstration créés pour Atlas. L’unique adaptation du code composant actuel est l’ajout du paramètre de type `Record<string, unknown>` à `React.isValidElement` dans `accordion.tsx`, pour la compatibilité avec les types de React 19. Les imports `@/lib/utils` sont résolus par l’utilitaire local `cn`. Les animations CSS définies par les registres sont conservées dans `src/registry.css`.

Les licences des dépendances de production distribuées avec le bundle sont réunies dans `../web/demos/THIRD_PARTY_LICENSES.txt`. Il ne faut pas attribuer la licence MIT à l’ensemble des bibliothèques répertoriées dans le catalogue : cette vérification concerne uniquement les composants intégrés ci-dessus.
