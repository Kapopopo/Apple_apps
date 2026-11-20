import { StepCard } from '@/components/step-card';

export default function StepCardDemo() {
  return (
    <div className="pl-root grid w-full max-w-5xl gap-5 rounded-pl-xl p-4 sm:grid-cols-2 sm:p-8">
      <StepCard
        step={1}
        stepName="Préparer"
        title="Importez vos contenus"
        description="Ajoutez vos fichiers en un geste, ils sont classés automatiquement."
      />
      <StepCard step={2} stepName="Planifier" title="Choisissez le rythme" description="Définissez quand et où publier, une seule fois." />
    </div>
  );
}
