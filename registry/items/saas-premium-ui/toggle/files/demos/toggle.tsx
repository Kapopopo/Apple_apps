import { Toggle } from '@/components/toggle';

export default function ToggleDemo() {
  return (
    <div className="pl-root flex w-full max-w-xl flex-col gap-5 rounded-pl-xl p-6">
      <Toggle defaultChecked label="Payer en 3 fois" />
      <Toggle label="Notifications" size="sm" />
      <div className="pl-dark rounded-pl-lg bg-pl-ink-dark p-5 text-white">
        <Toggle tone="dark" label="Mode avancé" />
      </div>
    </div>
  );
}
