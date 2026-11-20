import { FinanceDemo, HabitsDemo, PhoneDemo, WorkoutDemo } from '@/components/app-demos';

export default function AppDemosDemo() {
  return (
    <div className="pl-root flex w-full max-w-3xl flex-wrap items-center justify-center gap-5 rounded-pl-xl bg-[radial-gradient(120%_90%_at_50%_0%,#1d3a8a,#0a1638_60%,#060b1f)] p-8">
      <PhoneDemo width={170}>
        <HabitsDemo />
      </PhoneDemo>
      <PhoneDemo width={170} glow>
        <FinanceDemo />
      </PhoneDemo>
      <PhoneDemo width={170}>
        <WorkoutDemo />
      </PhoneDemo>
    </div>
  );
}
