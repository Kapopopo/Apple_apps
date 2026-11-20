/**
 * Header : transparent au repos, verre léger (blanc 72 %, flou 18 px) dès qu'on défile.
 * Bureau (≥ 1024 px) : logo à gauche, liens au centre en mono majuscules gris séparés par « · », CTA pill noir à droite.
 * Mobile : logo + burger à 2 traits qui se croisent en × et ouvre le FullscreenMenu.
 * Props : logo (ReactNode, wordmark générique par défaut), links, legalLinks, ctaLabel, onCta, menuCta, sticky,
 * top (décalage, ex. sous une PromoBar), contained (aperçu dans un cadre), scrolled (forcer l'état défilé).
 */
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FullscreenMenu, type MenuLink } from '@/components/fullscreen-menu';
import { PrimaryButton } from '@/components/primary-button';
import { GlassMark } from '@/components/glass-logo';
import { RING } from '@/components/glow-button';

export interface HeaderProps {
  logo?: ReactNode;
  links: MenuLink[];
  legalLinks?: MenuLink[];
  ctaLabel?: string;
  onCta?: () => void;
  menuCta?: ReactNode;
  sticky?: boolean;
  top?: number;
  contained?: boolean;
  scrolled?: boolean;
  /** Style du CTA : pill noir (défaut, bureau seulement) ou bordure lumineuse tournante + halo, visible aussi sur mobile. */
  cta?: 'solid' | 'glow';
  /** Bascule en verre sombre et texte blanc quand le header survole une section .pl-dark. */
  autoDark?: boolean;
  /** Pastille du logo générique : tuile noire (défaut) ou logo de verre (GlassMark). */
  logoMark?: 'tile' | 'glass';
  className?: string;
}

/** Wordmark générique : tuile noire ou logo de verre + nom en mono majuscules (header) ou sans gras (footer). */
export function Wordmark({
  name = 'Marque',
  tone = 'light',
  variant = 'mono',
  mark = 'tile',
}: {
  name?: string;
  tone?: 'light' | 'dark';
  mark?: 'tile' | 'glass';
  /** mono : majuscules mono (header) ; brand : sans gras 20 px (footer). */
  variant?: 'mono' | 'brand';
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-2.5',
        variant === 'brand'
          ? 'text-[20px] font-bold tracking-[-0.03em]'
          : 'font-pl-mono text-[15px] font-medium tracking-[0.02em] uppercase',
        tone === 'dark' ? 'text-white' : 'text-pl-fg',
      )}
    >
      {mark === 'glass' ? (
        // Logo de verre (même tuile que le footer en version compacte, identique sur fond clair et sombre).
        <GlassMark size={32} />
      ) : (
        <span
          aria-hidden
          className={cn(
            'size-8 rounded-[9px] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]',
            tone === 'dark' ? 'bg-white' : 'bg-[linear-gradient(160deg,#2a2a31,#0b0b0f)]',
          )}
        />
      )}
      {name}
    </span>
  );
}

export function Header({
  logo,
  links,
  legalLinks,
  ctaLabel = 'Commencer',
  onCta,
  menuCta,
  sticky = true,
  top = 0,
  contained = false,
  scrolled: forced,
  cta = 'solid',
  autoDark = false,
  logoMark = 'tile',
  className,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Le header survole une zone sombre (.pl-dark) : verre sombre et texte blanc au lieu du verre blanc. */
  const [overDark, setOverDark] = useState(false);
  const height = 66;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Ce qui se trouve juste sous le header (le header lui-même est ignoré par elementsFromPoint filtré).
      const y = top + height / 2;
      const under = document.elementsFromPoint(window.innerWidth / 2, y).find((el) => !el.closest('header, [aria-label="Annonce"]'));
      setOverDark(autoDark && !!under?.closest('.pl-dark'));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [top, autoDark]);

  const glass = forced ?? (scrolled || open);
  const dark = overDark && !open;

  return (
    <>
      <header
        className={cn(
          'z-50 w-full transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-pl-out-soft',
          sticky && (contained ? 'absolute inset-x-0' : 'fixed inset-x-0'),
          !glass
            ? 'bg-transparent'
            : dark
              ? 'bg-black/55 shadow-[0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-[18px] backdrop-saturate-[1.4]'
              : 'bg-white/72 shadow-[0_1px_0_var(--pl-border)] backdrop-blur-[18px] backdrop-saturate-[1.7]',
          className,
        )}
        style={{ top }}
      >
        <div className="flex h-[66px] items-center justify-between gap-6 px-5 sm:px-7">
          <a href="#" aria-label="Accueil" className="group shrink-0 outline-none focus-visible:shadow-pl-ring">
            {logo ?? <Wordmark tone={dark ? 'dark' : 'light'} mark={logoMark} />}
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-3 lg:flex">
            {links.map((l, i) => (
              <Fragment key={l.href + l.label}>
                {i > 0 && (
                  <span aria-hidden className="text-pl-fg-3">
                    ·
                  </span>
                )}
                <a
                  href={l.href}
                  className={cn(
                    'font-pl-mono text-[13px] tracking-[0.02em] uppercase transition-colors duration-200',
                    dark ? 'text-white/60 hover:text-white' : 'text-pl-fg-2 hover:text-pl-fg',
                  )}
                >
                  {l.label}
                </a>
              </Fragment>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {cta === 'solid' ? (
              <PrimaryButton size="md" onClick={onCta} className="hidden h-11 px-5 lg:inline-flex">
                {ctaLabel}
              </PrimaryButton>
            ) : (
              /* CTA à bordure lumineuse tournante (même anneau que GlowButton) + halo bleu ; visible aussi sur mobile. */
              <span className="group/cta relative isolate inline-flex rounded-pl-pill p-[1.5px]">
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-1.5 top-2 -z-10 rounded-pl-pill bg-[#2f7bff]/45 opacity-70 blur-lg transition-opacity duration-300 group-hover/cta:opacity-100"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 animate-pl-spin-border rounded-pl-pill bg-[#16233f]"
                  style={{ backgroundImage: RING }}
                />
                <PrimaryButton size="md" onClick={onCta} className="relative h-9 px-4 text-[14px] lg:h-11 lg:px-5 lg:text-[15px]">
                  {ctaLabel}
                </PrimaryButton>
              </span>
            )}
            <button
              type="button"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className={cn(
                'relative grid size-10 place-items-center rounded-full outline-none focus-visible:shadow-pl-ring lg:hidden',
                dark ? 'hover:bg-white/10' : 'hover:bg-pl-card-2',
              )}
            >
              <span
                className={cn(
                  'absolute h-[2px] w-5 rounded-full transition-transform duration-400 ease-pl-spring-sm',
                  dark ? 'bg-white' : 'bg-pl-fg',
                  open ? 'rotate-45' : '-translate-y-[4px]',
                )}
              />
              <span
                className={cn(
                  'absolute h-[2px] w-5 rounded-full transition-transform duration-400 ease-pl-spring-sm',
                  dark ? 'bg-white' : 'bg-pl-fg',
                  open ? '-rotate-45' : 'translate-y-[4px]',
                )}
              />
            </button>
          </div>
        </div>
      </header>
      <FullscreenMenu
        open={open}
        onClose={() => setOpen(false)}
        links={links}
        legalLinks={legalLinks}
        cta={menuCta}
        contained={contained}
        top={top + height}
      />
    </>
  );
}

export default Header;
