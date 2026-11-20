import { Sparkles } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';

export default function SectionHeadingDemo() {
  return (
    <div className="pl-root flex w-full max-w-5xl flex-col gap-4">
      <div className="rounded-pl-xl px-5 py-16">
        <SectionHeading badge="Comment ça marche" title="Trois étapes, aucune configuration" subtitle="et tout le reste se fait seul" />
      </div>
      <div className="pl-dark rounded-pl-xl bg-pl-ink-dark px-5 py-16">
        <SectionHeading tone="dark" badge="Vitrine" title="Tout votre catalogue en un geste" icon={<Sparkles />} iconAt={3} />
      </div>
    </div>
  );
}
