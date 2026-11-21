/**
 * FullscreenMenu : overlay plein écran clair semi-transparent et flouté (même sur bureau), liste de liens
 * 18 px avec chevrons et séparateurs fins, entrée en cascade, liens légaux en petit en bas.
 * Échap ferme, le focus va au premier lien, le défilement de la page est bloqué pendant l'ouverture.
 * Props : open, onClose, links, legalLinks, cta (ReactNode affiché sous la liste), `contained` (position absolute pour
 * un aperçu dans un cadre au lieu de fixed).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ease } from '@/components/atlas/process-like/lib/motion';

export interface MenuLink {
  label: string;
  href: string;
}

export interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
  links: MenuLink[];
  legalLinks?: MenuLink[];
  cta?: ReactNode;
  contained?: boolean;
  /** Décalage haut (hauteur du header au-dessus). */
  top?: number;
  className?: string;
}

export function FullscreenMenu({
  open,
  onClose,
  links,
  legalLinks = [],
  cta,
  contained = false,
  top = 64,
  className,
}: FullscreenMenuProps) {
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    if (!contained) document.body.style.overflow = 'hidden';
    const t = setTimeout(() => first.current?.focus({ preventScroll: true }), 120);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      clearTimeout(t);
    };
  }, [open, onClose, contained]);

  return (
    <AnimatePresence>
      {open && (
        <motion.nav
          aria-label="Menu principal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, ease: ease.ios }}
          className={cn(
            'inset-x-0 bottom-0 z-40 flex flex-col overflow-y-auto bg-white/92 px-6 pb-8 backdrop-blur-[18px] backdrop-saturate-[1.7] sm:px-10',
            contained ? 'absolute' : 'fixed',
            className,
          )}
          style={{ top }}
        >
          <motion.ul
            className="mx-auto w-full max-w-2xl pt-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } } }}
          >
            {links.map((link, i) => (
              <motion.li
                key={link.href + link.label}
                variants={{
                  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
                  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: ease.outSoft } },
                }}
                className="border-b border-pl-border"
              >
                <a
                  ref={i === 0 ? first : undefined}
                  href={link.href}
                  onClick={onClose}
                  className="group flex items-center justify-between py-[18px] text-[17px] font-normal tracking-[-0.01em] text-pl-fg outline-none focus-visible:text-pl-accent"
                >
                  {link.label}
                  <ChevronRight
                    className="size-5 text-pl-fg transition-transform duration-300 ease-pl-spring-sm group-hover:translate-x-1"
                    strokeWidth={2.2}
                  />
                </a>
              </motion.li>
            ))}
          </motion.ul>
          {cta && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + links.length * 0.045, duration: 0.45, ease: ease.outSoft } }}
              className="mx-auto mt-8 w-full max-w-2xl"
            >
              {cta}
            </motion.div>
          )}
          {legalLinks.length > 0 && (
            <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-3 pt-10 text-sm text-pl-fg-2">
              {legalLinks.map((l) => (
                <a key={l.href + l.label} href={l.href} className="hover:text-pl-fg">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default FullscreenMenu;
