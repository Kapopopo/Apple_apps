/**
 * Landing de démonstration du thème Saas premium UI, assemblée comme un vrai site : bandeau promo + header fixés,
 * hero, vitrine sombre (onglet « automatiser », rotation automatique des onglets, sphère cliquable), étapes animées,
 * tarifs avec trame et halos, avis de même hauteur, FAQ raccordée au footer, footer à dalle de verre 3D.
 * Les CTA « Commencer » ouvrent la modale de connexion ; la page reste montée dessous (floutée par le voile) et ne
 * défile plus tant que la modale est ouverte.
 * IMAGES : vignettes et footer en placeholders. Pour le vrai rendu, passer vos photos : `photos` (vignettes 9:16)
 * à DarkShowcase et Steps, `photo` (paysage nocturne) à SiteFooter.
 */
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Hero } from '@/sections/hero';
import { DarkShowcase } from '@/sections/dark-showcase';
import { Steps } from '@/sections/steps';
import { Pricing } from '@/sections/pricing';
import { Reviews } from '@/sections/reviews';
import { Faq } from '@/sections/faq';
import { SiteFooter } from '@/sections/site-footer';
import { AuthModal } from '@/sections/auth-modal';

export interface LandingDemoProps {
  /** Photos des vignettes (vitrine, étapes) à la place des placeholders. */
  photos?: string[];
  /** Photo du footer à la place du paysage placeholder. */
  footerPhoto?: string;
  className?: string;
}

export function LandingDemo({ photos, footerPhoto, className }: LandingDemoProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const openAuth = () => setAuthOpen(true);

  // La page reste montée sous la modale (floutée par son voile) : on bloque seulement son défilement.
  useEffect(() => {
    if (!authOpen) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  }, [authOpen]);

  return (
    <>
      <main className={cn('pl-root w-full', className)}>
        <Hero onStart={openAuth} fixedChrome header={{ cta: 'glow', autoDark: true, logoMark: 'glass' }} />
        <DarkShowcase defaultTab="automatiser" autoplay={7000} interactiveSphere photos={photos} />
        <Steps onCta={openAuth} animated tall photos={photos} />
        <Pricing dots halos />
        <Reviews onCta={openAuth} equalHeight shot="stats" />
        <Faq blendBottom />
        <SiteFooter photo={footerPhoto} glass="extruded" />
      </main>
      {/* Fond vide : c'est la vraie landing, derrière le voile flouté de la modale, qui sert d'arrière-plan. */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} background={<></>} className="absolute min-h-0" />
    </>
  );
}

export default LandingDemo;
