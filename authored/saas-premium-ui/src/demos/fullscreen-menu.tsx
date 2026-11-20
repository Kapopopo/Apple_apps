import { useState } from 'react';
import { FullscreenMenu } from '@/components/fullscreen-menu';
import { PrimaryButton } from '@/components/primary-button';

const LINKS = ['Fonctionnalités', 'Tarifs', 'Avis', 'Questions fréquentes', 'Contact'].map((label) => ({ label, href: '#' }));
const LEGAL = ['Mentions légales', 'Confidentialité', 'Conditions'].map((label) => ({ label, href: '#' }));

export default function FullscreenMenuDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="pl-root relative h-[560px] w-full max-w-3xl overflow-hidden rounded-pl-xl border border-pl-border bg-[radial-gradient(60%_60%_at_30%_30%,#cfd9ff,transparent),#F5F5F7]">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="font-bold tracking-[-0.04em]">Marque</span>
        <PrimaryButton size="sm" arrow={false} onClick={() => setOpen((o) => !o)}>
          {open ? 'Fermer' : 'Menu'}
        </PrimaryButton>
      </div>
      <FullscreenMenu
        open={open}
        onClose={() => setOpen(false)}
        links={LINKS}
        legalLinks={LEGAL}
        contained
        cta={
          <PrimaryButton fullWidth size="lg">
            Commencer
          </PrimaryButton>
        }
      />
    </div>
  );
}
