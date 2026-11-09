/** Shim Atlas de next/link pour les previews (navigation désactivée). */
import type { AnchorHTMLAttributes, ReactNode } from 'react';
export default function Link({ href, children, prefetch: _p, replace: _r, scroll: _s, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | { pathname?: string }; children?: ReactNode; prefetch?: boolean; replace?: boolean; scroll?: boolean }) {
  return <a href={typeof href === 'string' ? href : href.pathname ?? '#'} onClick={(e) => e.preventDefault()} {...rest}>{children}</a>;
}
