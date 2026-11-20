import { Countdown } from '@/components/countdown';

export default function CountdownDemo() {
  return (
    <div className="pl-root flex w-full max-w-xl flex-col items-center gap-6 rounded-pl-xl p-6">
      <Countdown seconds={2 * 86400 + 5 * 3600 + 42 * 60 + 9} />
      <div className="pl-dark rounded-pl-lg bg-pl-ink-dark px-6 py-5">
        <Countdown tone="dark" size="sm" units={['h', 'm', 's']} seconds={3 * 3600 + 25} />
      </div>
    </div>
  );
}
