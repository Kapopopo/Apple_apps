import { GlassLogo, GlassMark } from '@/components/glass-logo';

export default function GlassLogoDemo() {
  return (
    <div className="pl-root pl-dark flex w-full max-w-3xl flex-col items-center gap-10 rounded-pl-xl bg-[radial-gradient(80%_70%_at_50%_30%,#1d3a8a,#05070d)] py-16">
      <GlassLogo className="size-44" />
      <div className="flex items-center gap-4 text-white">
        <GlassMark size={32} />
        <GlassMark size={48} />
      </div>
    </div>
  );
}
