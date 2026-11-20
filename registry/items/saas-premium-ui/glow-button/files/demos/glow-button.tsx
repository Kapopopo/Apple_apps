import { ArrowUpRight, Lock } from 'lucide-react';
import { GlowButton } from '@/components/glow-button';

export default function GlowButtonDemo() {
  return (
    <div className="pl-root pl-dark flex w-full max-w-2xl flex-col items-center gap-8 rounded-pl-xl bg-pl-ink-dark px-6 py-14">
      <GlowButton size="lg" iconRight={<ArrowUpRight />}>
        Accéder maintenant
      </GlowButton>
      <GlowButton icon={<Lock />} halo={false}>
        Sans halo
      </GlowButton>
    </div>
  );
}
