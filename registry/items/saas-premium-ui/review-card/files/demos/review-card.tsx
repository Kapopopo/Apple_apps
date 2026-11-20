import { ReviewCard } from '@/components/review-card';

export default function ReviewCardDemo() {
  return (
    <div className="pl-root flex w-full max-w-4xl flex-wrap justify-center gap-4 rounded-pl-xl p-4 sm:p-8">
      <ReviewCard
        quote="Simple à prendre en main, je gagne un temps fou chaque semaine."
        author="Camille Martin"
        meta="Créatrice de contenu"
      />
      <ReviewCard variant="chat" quote="Réponse rapide et outil très fiable." author="Lucas Bernard" meta="Indépendant" />
      <ReviewCard
        variant="text"
        rating={4}
        quote="Exactement ce qu’il me fallait, sans fioritures."
        author="Inès Petit"
        meta="Petite entreprise"
      />
    </div>
  );
}
