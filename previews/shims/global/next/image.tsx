/** Shim Atlas de next/image : simple <img>. */
import type { ImgHTMLAttributes } from 'react';
export default function Image({ src, fill: _f, priority: _p, quality: _q, placeholder: _ph, blurDataURL: _b, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string | { src: string }; fill?: boolean; priority?: boolean; quality?: number; placeholder?: string; blurDataURL?: string }) {
  return <img src={typeof src === 'string' ? src : src.src} {...rest} />;
}
