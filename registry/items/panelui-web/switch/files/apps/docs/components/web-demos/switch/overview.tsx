'use client';

import { Switch } from 'panelui-web/switch';

export default function SwitchOverview() {
  return (
    <div className="flex items-center gap-6">
      <Switch label="Wi-Fi" size="lg" />
      <Switch label="Bluetooth" size="lg" defaultChecked />
      <Switch label="Airplane mode" size="lg" defaultChecked disabled />
    </div>
  );
}
