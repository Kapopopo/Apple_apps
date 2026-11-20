import { Header } from '@/components/header';
import { PrimaryButton } from '@/components/primary-button';

const LINKS = ['Fonctionnalités', 'Tarifs', 'Avis', 'Questions fréquentes'].map((label) => ({ label, href: '#' }));

export default function HeaderDemo() {
  return (
    <div className="pl-root w-full max-w-5xl space-y-4">
      <div className="relative h-[480px] overflow-hidden rounded-pl-xl border border-pl-border bg-pl-page">
        <Header
          links={LINKS}
          contained
          legalLinks={[{ label: 'Mentions légales', href: '#' }]}
          menuCta={<PrimaryButton fullWidth>Commencer</PrimaryButton>}
        />
        <div className="grid h-full place-items-center px-6 text-center text-pl-fg-3">
          Header transparent au repos · burger → menu plein écran
        </div>
      </div>
      <div className="relative h-36 overflow-hidden rounded-pl-xl border border-pl-border bg-[radial-gradient(50%_80%_at_30%_50%,#cfd9ff,transparent),#F5F5F7]">
        <Header links={LINKS} contained scrolled />
        <div className="grid h-full place-items-center pt-10 text-pl-fg-3">État défilé : fond verre</div>
      </div>
    </div>
  );
}
