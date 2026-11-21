/**
 * Section footer : Footer sombre du thème (visuel d'ambiance pleine largeur fondu dans le fond, 3 colonnes, copyright)
 * avec les liens par défaut d'une landing. Visuel : photo nocturne (lac et montagnes) fondue en haut dans la section
 * précédente et en bas dans le footer, avec le logo en verre 3D au-dessus du lac. Remplaçable via `visual`.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Footer, type FooterColumn } from '@/components/atlas/process-like/footer/footer';
import { GlassLogo } from '@/components/atlas/process-like/site-footer/glass-logo';
import nightLake from '@/assets/footer/night-lake.jpg';

/** Photo nocturne + logo de verre. Haut fondu vers #000 (FAQ au-dessus), bas vers le fond du footer (#060608). */
export function NightLakeVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#000308]">
      <img src={nightLake} alt="" aria-hidden className="absolute inset-0 size-full object-cover object-[50%_60%]" />
      {/* Fondu haut : raccord sans couture avec la section au-dessus. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[38%] bg-[linear-gradient(180deg,#000308,rgb(0_3_8/0.75)_35%,transparent)]" />
      {/* Fondu bas : la photo se perd dans le fond du footer. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent,rgb(6_6_8/0.7)_55%,#060608)]" />
      {/* Logo de verre au-dessus de l'horizon, et son reflet sur le lac. */}
      <GlassLogo className="absolute top-[16%] left-1/2 size-[clamp(104px,14vw,196px)] -translate-x-1/2" />
      <div
        aria-hidden
        className="absolute top-[64%] left-1/2 h-[6%] w-[clamp(90px,12vw,170px)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(170_200_255/0.55),transparent)] blur-md"
      />
    </div>
  );
}

export interface SiteFooterProps {
  columns?: FooterColumn[];
  email?: string;
  visual?: ReactNode;
  className?: string;
}

const link = (label: string) => ({ label, href: `#${label.toLowerCase().replace(/\s+/g, '-')}` });

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: 'Navigation', links: ['Accueil', 'Comment ça marche', 'Tarifs', 'Avis', 'Questions fréquentes'].map(link) },
  { title: 'Informations', links: ['Mentions légales', 'Confidentialité', 'Conditions d’utilisation', 'Contact'].map(link) },
];

export function SiteFooter({ columns = DEFAULT_COLUMNS, email, visual, className }: SiteFooterProps) {
  return (
    <div className={cn('pl-root w-full bg-pl-ink-footer', className)}>
      <Footer columns={columns} email={email} visual={visual ?? <NightLakeVisual />} />
    </div>
  );
}

export default SiteFooter;
