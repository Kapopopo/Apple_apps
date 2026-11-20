import { LedDisplay } from '@/components/led-display';

export default function LedDisplayDemo() {
  return (
    <div className="pl-root flex w-full max-w-2xl flex-col items-center gap-5 rounded-pl-xl p-6">
      <LedDisplay countdown={5 * 3600 + 12 * 60 + 40} dot={5} />
      <LedDisplay text="OFFRE -40%" dot={3.5} tone="white" />
      <LedDisplay text="EN LIGNE" dot={3} tone="success" />
    </div>
  );
}
