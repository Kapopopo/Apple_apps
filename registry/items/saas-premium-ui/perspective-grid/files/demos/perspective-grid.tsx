import { PerspectiveGrid } from '@/components/perspective-grid';
import { PhoneMockup } from '@/components/phone-mockup';

export default function PerspectiveGridDemo() {
  return (
    <PerspectiveGrid className="pl-root pl-dark w-full max-w-4xl rounded-pl-xl bg-pl-ink-dark">
      <div className="flex h-[420px] items-center justify-center gap-4 pb-10">
        <PhoneMockup width={150} placeholder={1} tilt={10} className="max-sm:hidden" />
        <PhoneMockup width={180} float />
        <PhoneMockup width={150} placeholder={2} tilt={-10} className="max-sm:hidden" />
      </div>
    </PerspectiveGrid>
  );
}
