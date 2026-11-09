'use client';

import { Tabs } from 'panelui-web/tabs';

const PANELS = [
  {
    value: 'overview',
    label: 'Overview',
    text: 'The autumn catalogue: 64 pages, a print run of 4,000, due at the printer on 9 November.',
  },
  {
    value: 'activity',
    label: 'Activity',
    count: 3,
    text: 'Three changes today: the cover moved to review, twelve illustrations arrived, and the print date was set.',
  },
  {
    value: 'files',
    label: 'Files',
    text: 'The brief, the fourth cover and the print schedule. Nothing has been added since Monday.',
  },
];

export default function TabsOverview() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <Tabs.List aria-label="Catalogue">
        {PANELS.map((panel) => (
          <Tabs.Trigger key={panel.value} value={panel.value}>
            {panel.label}
            {panel.count ? <Tabs.Badge>{panel.count}</Tabs.Badge> : null}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {PANELS.map((panel) => (
        <Tabs.Content key={panel.value} value={panel.value} className="text-sm leading-6 text-muted-foreground">
          {panel.text}
        </Tabs.Content>
      ))}
    </Tabs>
  );
}
