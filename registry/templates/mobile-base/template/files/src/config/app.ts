import type { AppConfig } from './types';

// Config de l’app, générée depuis la spec Atlas au démarrage du projet. À modifier ici ensuite.
export const appConfig: AppConfig = {
  "name": "Mon app",
  "slug": "mon-app",
  "scheme": "monapp",
  "version": "1.0.0",
  "bundleId": "com.example.monapp",
  "iosAppId": "",
  "supportEmail": "",
  "termsUrl": "",
  "privacyUrl": "",
  "revenueCat": {
    "entitlement": "premium",
    "offering": "",
    "useDashboardPaywall": false
  },
  "trial": {
    "days": 7,
    "plan": "annual"
  },
  "layouts": {
    "onboarding": "cards",
    "paywall": "benefits"
  },
  "onboarding": {
    "slides": [
      {
        "title": "Bienvenue",
        "text": "Présentez ici ce que l’app permet de faire.",
        "illustration": "sparkles"
      },
      {
        "title": "Simple au quotidien",
        "text": "Expliquez comment on s’en sert, en une phrase.",
        "illustration": "target"
      },
      {
        "title": "Des résultats visibles",
        "text": "Montrez le bénéfice concret pour la personne.",
        "illustration": "trending-up"
      }
    ],
    "questions": []
  },
  "paywall": {
    "title": "Débloquez toute l’app",
    "subtitle": "Accès complet pendant toute la durée de l’abonnement.",
    "illustration": "star",
    "benefits": [
      "Toutes les fonctionnalités",
      "Les mises à jour de l’app",
      "Résiliable à tout moment"
    ]
  }
};
