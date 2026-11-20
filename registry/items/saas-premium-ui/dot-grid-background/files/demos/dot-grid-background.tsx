import { DotGridBackground } from '@/components/dot-grid-background';

export default function DotGridBackgroundDemo() {
  return (
    <div className="pl-root flex w-full max-w-4xl flex-col gap-4">
      <DotGridBackground className="rounded-pl-xl border border-pl-border bg-pl-bg">
        <div className="grid h-72 place-items-center text-center">
          <p className="pl-display text-4xl">Fond clair</p>
        </div>
      </DotGridBackground>
      <DotGridBackground tone="dark" className="pl-dark rounded-pl-xl bg-pl-ink-dark">
        <div className="grid h-72 place-items-center text-center">
          <p className="pl-display text-4xl text-white">Bloc sombre</p>
        </div>
      </DotGridBackground>
    </div>
  );
}
