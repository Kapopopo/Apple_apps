import type { PlanId } from './types';

/** Textes du squelette (français). Ceux propres à l'app sont dans src/config/app.ts. */
export const texts = {
  onboarding: {
    next: 'Continuer',
    back: 'Précédent',
    finish: 'Terminer',
    progress: (step: number, total: number) => `Étape ${step} sur ${total}`,
    single: 'Choisissez une réponse.',
    multiple: 'Plusieurs réponses possibles.',
  },
  plan: {
    name: { weekly: 'Hebdomadaire', annual: 'Annuel' } satisfies Record<PlanId, string>,
    duration: { weekly: 'Abonnement de 1 semaine', annual: 'Abonnement de 1 an' } satisfies Record<PlanId, string>,
    per: { weekly: 'par semaine', annual: 'par an' } satisfies Record<PlanId, string>,
  },
  duration: (count: number, unit: string) => {
    const words: Record<string, [string, string]> = {
      DAY: ['jour', 'jours'],
      WEEK: ['semaine', 'semaines'],
      MONTH: ['mois', 'mois'],
      YEAR: ['an', 'ans'],
    };
    const word = words[unit];
    return word ? `${count} ${word[count > 1 ? 1 : 0]}` : '';
  },
  paywall: {
    subscribe: 'S’abonner',
    restore: 'Restaurer les achats',
    terms: 'CGU',
    privacy: 'Confidentialité',
    settings: 'Réglages',
    retry: 'Réessayer',
    mock: 'Mode test : prix et achats fictifs',
    trial: (duration: string) => `Essai gratuit de ${duration}`,
    intro: (price: string, duration: string) => `${price} pendant ${duration}`,
    amount: (price: string, per: string) => `${price} ${per}`,
    renewal: 'Renouvelé automatiquement jusqu’à résiliation.',
    renewalAfter: (offer: string) => `${offer}, puis renouvelé automatiquement à ce prix jusqu’à résiliation.`,
    cancelIos: 'Paiement débité de votre compte Apple. Résiliez au moins 24 h avant la fin de la période dans les réglages de l’App Store.',
    cancelAndroid: 'Paiement débité de votre compte Google Play. Résiliez à tout moment dans les abonnements Google Play.',
  },
  purchases: {
    unconfigured: 'Les achats ne sont pas disponibles dans cette version de l’app.',
    noPlans: 'Impossible de charger les offres. Vérifiez votre connexion puis réessayez.',
    failed: 'L’opération n’a pas abouti. Réessayez.',
    inactive: 'Paiement enregistré, abonnement pas encore actif. Touchez « Restaurer les achats » dans un instant.',
    nothingToRestore: 'Aucun abonnement actif à restaurer.',
    restored: 'Abonnement restauré.',
  },
  settings: {
    title: 'Réglages',
    back: 'Retour',
    status: 'Abonnement',
    active: 'Actif',
    inactive: 'Inactif',
    mock: 'simulé',
    restore: 'Restaurer les achats',
    manage: 'Gérer l’abonnement',
    rate: 'Noter l’app',
    support: 'Contacter le support',
    terms: 'Conditions d’utilisation',
    privacy: 'Politique de confidentialité',
    reset: 'Réinitialiser les données',
    confirmReset: 'Effacer les réponses et toutes les données enregistrées sur cet appareil ? Un abonnement acheté n’est pas annulé.',
    cancel: 'Annuler',
    erase: 'Effacer',
    resetFailed: 'Les données n’ont pas pu être effacées.',
    version: (version: string) => `Version ${version}`,
  },
  links: {
    missing: 'Lien pas encore configuré (src/config/app.ts).',
    failed: 'Impossible d’ouvrir ce lien sur cet appareil.',
    email: (email: string) => `Aucune app Mail disponible. Écrivez à ${email}.`,
    noReview: 'La notation sera disponible une fois l’app publiée.',
  },
  gateLoading: 'Chargement',
};
