import { PhoneMockup } from '@/components/phone-mockup';

export default function PhoneMockupDemo() {
  return (
    <div className="pl-root flex w-full max-w-4xl items-end justify-center gap-6 overflow-hidden rounded-pl-xl p-8">
      <PhoneMockup width={170} tilt={14} placeholder={1} className="max-sm:hidden" />
      <PhoneMockup width={220} float glow />
      <PhoneMockup width={170} frame="silver" tilt={-14} placeholder={2} className="max-sm:hidden" />
    </div>
  );
}
