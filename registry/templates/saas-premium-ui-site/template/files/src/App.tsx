import { useEffect, useState } from 'react';
import { Hero } from '@/components/atlas/process-like/hero/hero';
import { DarkShowcase } from '@/components/atlas/process-like/dark-showcase/dark-showcase';
import { Steps } from '@/components/atlas/process-like/steps/steps';
import { Pricing } from '@/components/atlas/process-like/pricing/pricing';
import { Reviews } from '@/components/atlas/process-like/reviews/reviews';
import { Faq } from '@/components/atlas/process-like/faq/faq';
import { SiteFooter } from '@/components/atlas/process-like/site-footer/site-footer';
import { AuthModal } from '@/components/atlas/process-like/auth-modal/auth-modal';

export default function App() {
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
      <main className="pl-root">
        <Hero onStart={openAuth} />
        <DarkShowcase defaultTab="automatiser" />
        <Steps onCta={openAuth} />
        <Pricing />
        <Reviews onCta={openAuth} />
        <Faq />
        <SiteFooter />
      </main>
      {/* Fond vide : c'est la vraie landing, derrière le voile flouté de la modale, qui sert d'arrière-plan. */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} background={<></>} className="absolute min-h-0" />
    </>
  );
}
