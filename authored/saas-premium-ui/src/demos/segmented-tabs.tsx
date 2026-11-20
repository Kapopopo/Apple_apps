import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Boxes, Globe, LayoutGrid, Lock, Search } from 'lucide-react';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { swipeIn } from '@/lib/motion';

const TABS = [
  { id: 'catalogue', label: 'Catalogue', icon: <LayoutGrid /> },
  { id: 'explorer', label: 'Explorer', icon: <Globe /> },
  { id: 'liste', label: 'Liste', icon: <Boxes /> },
  { id: 'recherche', label: 'Recherche', icon: <Search /> },
  { id: 'prive', label: 'Privé', icon: <Lock /> },
];

export default function SegmentedTabsDemo() {
  const [tab, setTab] = useState('catalogue');
  const [dir, setDir] = useState<1 | -1>(1);
  return (
    <div className="pl-root flex w-full max-w-3xl flex-col gap-6 rounded-pl-xl p-4 sm:p-6">
      <SegmentedTabs
        tabs={TABS}
        value={tab}
        compactOnMobile
        onChange={(id, d) => {
          setDir(d);
          setTab(id);
        }}
      />
      <div className="relative h-40 overflow-hidden rounded-pl-lg bg-pl-ink-dark">
        <AnimatePresence custom={dir} mode="popLayout" initial={false}>
          <motion.div
            key={tab}
            custom={dir}
            variants={swipeIn}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 grid place-items-center text-lg font-semibold text-white"
          >
            Contenu : {TABS.find((t) => t.id === tab)?.label}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="rounded-pl-lg bg-pl-ink-dark p-4">
        <SegmentedTabs
          tone="dark"
          size="sm"
          fullWidth={false}
          tabs={[
            { id: 'a', label: 'Mensuel' },
            { id: 'b', label: 'Annuel' },
          ]}
        />
      </div>
    </div>
  );
}
