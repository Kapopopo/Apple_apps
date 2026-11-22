# App mobile (squelette mobile-base)

Expo SDK 58, Expo Router, TypeScript strict, NativeWind, react-native-reusables, RevenueCat, AsyncStorage. Pas de backend ni de compte utilisateur.

**La fonctionnalité de l’app se code dans `app/(main)/`.** Ne toucher au reste qu’en cas de besoin.

## Démarrer

Node 22.13 ou plus récent (22.11 ne suffit pas).

```bash
npm ci
npx expo start          # vise un development build ; touche « s » pour passer dans Expo Go
npx expo start --go     # directement dans Expo Go (achats simulés)
npm run typecheck
```

Après un changement dans `src/config/theme.json` : `npx expo start --clear`.

## Configurer

| Quoi | Où |
|---|---|
| Nom, slug, bundle id, version | `src/config/app.ts` (lu par `app.config.ts`) |
| Écrans et questions de l’onboarding, textes du paywall, variantes | `src/config/app.ts` |
| Entitlement, offering, paywall RevenueCat oui/non | `src/config/app.ts` → `revenueCat` |
| CGU, confidentialité, email du support, identifiant App Store | `src/config/app.ts` |
| Couleurs, arrondis, espacements, police | `src/config/theme.json`, `src/config/fonts.ts` |
| Images de l’onboarding et du paywall | `src/config/illustrations.ts` |
| Textes du squelette | `src/config/texts.ts` |
| Clés RevenueCat | `.env.local`, variables EAS pour les builds |

Classes de tokens : `bg-primary`, `text-muted-foreground`, `rounded-lg`, `p-gutter`, `gap-stack`, `py-section`, `gap-tight`, `p-pad`, `font-display`. Le thème sombre suit le réglage du téléphone.

Réponses de l’onboarding : `useAnswers()` (`@/lib/storage`). Abonnement : `usePremium()` et `<PremiumGate>` (`@/features/premium`). `app/(main)/` est déjà réservé aux abonnés. **Un écran créé ailleurs dans `app/` n’est protégé ni par l’onboarding ni par le paywall** : le mettre dans `app/(main)/`, ou dans un `Stack.Protected` de `app/_layout.tsx`. Pour une partie gratuite, retirer `isPremium` de la garde de `(main)` dans `app/_layout.tsx` et entourer le contenu payant de `<PremiumGate>`.

Composants : `node scripts/add-ui.js card dialog` (CLI react-native-reusables, sans écraser ceux du squelette). Importer les icônes une par une (`lucide-react-native/icons/check`).

## Brancher RevenueCat

1. Créer les abonnements **1 semaine** et **1 an** dans App Store Connect (et Play Console), avec l’essai gratuit voulu. `trial` dans `app.ts` ne sert qu’au mode test : l’essai affiché en vrai vient du store et dépend de l’éligibilité de la personne.
2. Dans RevenueCat : importer les produits, créer l’entitlement (`premium` par défaut) et une offering qui contient les deux offres.
3. Copier `.env.example` en `.env.local` et y mettre les **clés publiques** (`appl_…`, `goog_…`). Jamais de clé `sk_…`.
4. Pour les builds EAS, créer les mêmes variables : `npx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --environment production` (et `development`).
5. Faire un development build, car les achats réels n’existent pas dans Expo Go : `npx eas-cli build --profile development --platform ios`, puis `npx expo start`.
6. Pour un paywall dessiné chez RevenueCat : le publier sur l’offering, puis passer `useDashboardPaywall` à `true`. Y mettre le bouton Restaurer, les liens CGU et confidentialité, et aucun bouton Fermer. Le paywall du squelette reprend la main si l’offering ne se charge pas.

| Situation | Achats |
|---|---|
| Expo Go, web, développement sans clé | simulés (« Mode test ») |
| Development build avec clé | RevenueCat, sandbox |
| Release sans clé | indisponibles, rien n’est débloqué |
| Build EAS `production` mal configuré | refusé par `app.config.ts` |

## Checklist avant soumission App Store

### Différenciation (4.3, 4.2.6)
- [ ] La fonctionnalité principale est propre à cette app. Un autre thème, d’autres textes ou un autre contenu sur la même fonctionnalité constituent la « même app » pour Apple (4.3a) : en faire une seule app.
- [ ] L’app apporte quelque chose de nettement différent de ce qui existe déjà dans sa catégorie (4.3b).
- [ ] Icône, captures, nom, description et mots-clés sont propres à cette app.
- [ ] L’app est soumise depuis le compte développeur de celui qui en possède le contenu (4.2.6).

### Abonnement (3.1.2)
- [ ] L’abonnement apporte une valeur continue ; les avantages du paywall sont tous vrais.
- [ ] Prix débité, durée et renouvellement lisibles sur un petit iPhone et en grande taille de texte.
- [ ] L’essai affiché correspond à l’offre du store ; testé avec un compte qui y a droit et un qui n’y a plus droit.
- [ ] « Restaurer les achats » fonctionne après réinstallation.
- [ ] CGU (ou [EULA standard d’Apple](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/)) et confidentialité s’ouvrent depuis le paywall, et figurent aussi dans la fiche App Store.
- [ ] Achat, annulation, expiration et restauration testés en sandbox ou TestFlight.
- [ ] Contrat « Paid Apps », fiscalité et banque actifs ; abonnements joints à la première version soumise.

### Technique et conformité
- [ ] `assets/icon.png` (1024 × 1024, sans transparence), bundle id définitif, `iosAppId` renseigné.
- [ ] Aucune clé `test_` ni `sk_` ; « Mode test » absent du build TestFlight.
- [ ] Confidentialité de l’app déclarée dans App Store Connect, achats via RevenueCat compris.
- [ ] `ITSAppUsesNonExemptEncryption: false` encore vrai.
- [ ] Parcours complet testé sur un vrai iPhone, en clair et en sombre, avec VoiceOver et hors ligne.
- [ ] Notes de review : ce que fait l’app, en quoi elle est différente, comment atteindre la partie payante.
- [ ] `npm run typecheck` et `npx expo-doctor` passent.

## Licences

`THIRD_PARTY_LICENSES.txt` (react-native-reusables, MIT), `assets/fonts/OFL.txt` (polices embarquées) et `CREDITS.md` (créé au démarrage du projet).
