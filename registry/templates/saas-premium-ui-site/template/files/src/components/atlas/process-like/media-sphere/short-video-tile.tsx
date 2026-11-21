/**
 * ShortVideoTile : vignette de contenu court vertical (9:16) pour MediaSphere — photo libre (Unsplash, voir
 * CREDITS.md) + habillage de réseau social générique (ni logo ni nom de marque) :
 *  - format : vidéo (barre de progression, vues) ou carrousel (compteur « 1/5 », points de pagination) ;
 *  - réseau A : onglets centrés en haut, colonne avatar « + » / cœur / commentaire / favori / partage / disque ;
 *    réseau B : titre à gauche + caméra, colonne cœur / commentaire / envoi / « ⋯ » / vignette audio carrée,
 *    avatar à côté du pseudo.
 * Format et réseau dépendent de la photo (`shortVideoMeta`), pour filtrer la sphère de façon cohérente.
 * Perf : un seul élément par vignette, l'habillage est un SVG partagé posé en background-image (net à toute échelle).
 */
import type { CSSProperties } from 'react';

const PHOTOS = Object.values(
  import.meta.glob<string>('@/assets/short-videos/*.webp', { eager: true, import: 'default' }),
);
/** À passer en `variety` de MediaSphere, pour répartir les photos sans doublons voisins. */
export const SHORT_VIDEO_COUNT = PHOTOS.length;

/** Pseudo-aléatoire déterministe (même tirage à chaque montage). */
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export type ShortFormat = 'video' | 'carousel';
export type ShortNetwork = 'a' | 'b';

/** Format et réseau d'une photo (≈ 40 % de carrousels, réseaux à parts égales). */
export function shortVideoMeta(photo: number): { format: ShortFormat; network: ShortNetwork } {
  return { format: rand(photo + 71) < 0.4 ? 'carousel' : 'video', network: rand(photo + 131) < 0.5 ? 'a' : 'b' };
}

const RED = '#FE2C55';

function overlay(format: ShortFormat, network: ShortNetwork, liked: boolean, views: boolean) {
  const icon = (y: number, d: string, fill = '#fff') =>
    `<path transform="translate(73 ${y})" d="${d}" fill="${fill}"/>` +
    `<rect x="74.5" y="${y + 11.5}" width="9" height="2" rx="1" fill="#fff" opacity=".85"/>`;
  const heart = 'M6 11 C2 8 0 6 0 3.4 C0 1.4 1.5 0 3.3 0 C4.5 0 5.4.6 6 1.5 C6.6.6 7.5 0 8.7 0 C10.5 0 12 1.4 12 3.4 C12 6 10 8 6 11Z';
  const bubble = 'M6 0 C9.4 0 12 2.2 12 5 C12 7.8 9.4 10 6 10 C5.2 10 4.5 9.9 3.8 9.7 L1 11 L1.8 8.6 C.7 7.7 0 6.4 0 5 C0 2.2 2.6 0 6 0Z';
  const mark = 'M2 0 H10 C10.6 0 11 .4 11 1 V11 L6 8 L1 11 V1 C1 .4 1.4 0 2 0Z';
  const share = 'M7 0 L12 5 L7 10 V7 C3.5 7 1.4 8 0 10.5 C.6 6.4 2.8 3.8 7 3.3Z';
  const send = 'M0 5 L12 0 L7.5 12 L5.6 6.6Z';
  const carousel = format === 'carousel';
  const a = network === 'a';
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 160" preserveAspectRatio="none">',
    '<defs><linearGradient id="t" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>',
    '<linearGradient id="b" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient></defs>',
    '<rect width="90" height="34" fill="url(#t)"/><rect y="96" width="90" height="64" fill="url(#b)"/>',
    // En-tête : onglets centrés (A) ou titre à gauche + caméra (B).
    a
      ? '<rect x="22" y="9" width="18" height="2.6" rx="1.3" fill="#fff" opacity=".6"/><rect x="45" y="9" width="22" height="2.6" rx="1.3" fill="#fff"/><rect x="51" y="13.6" width="10" height="1.4" rx=".7" fill="#fff"/>'
      : '<rect x="5" y="8" width="24" height="4" rx="2" fill="#fff"/><rect x="74" y="7" width="11" height="8" rx="2.2" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="79.5" cy="11" r="2" fill="none" stroke="#fff" stroke-width="1.1"/>',
    // Badge : vues (vidéo) ou compteur de pages (carrousel).
    carousel
      ? '<rect x="62" y="20" width="23" height="10" rx="5" fill="#000" opacity=".55"/><text x="66.5" y="27.6" font-family="Arial,sans-serif" font-size="7" font-weight="700" fill="#fff">1/5</text>'
      : views
        ? '<rect x="4" y="20" width="27" height="10" rx="5" fill="#000" opacity=".55"/><path d="M8 22.4 L12.5 25 L8 27.6Z" fill="#fff"/>' +
          '<text x="14.5" y="27.8" font-family="Arial,sans-serif" font-size="7" font-weight="700" fill="#fff">1,2M</text>'
        : '',
    // Colonne d'actions.
    a
      ? `<circle cx="79" cy="64" r="6.5" fill="#d9d9de" stroke="#fff" stroke-width="1.2"/>` +
        `<circle cx="79" cy="71" r="2.8" fill="${RED}"/><path d="M77.6 71 H80.4 M79 69.6 V72.4" stroke="#fff" stroke-width=".9"/>` +
        icon(79, heart, liked ? RED : '#fff') +
        icon(97, bubble) +
        icon(115, mark) +
        icon(133, share) +
        '<circle cx="79" cy="153" r="5.5" fill="#161616" stroke="#3a3a3a" stroke-width="2.4"/><circle cx="79" cy="153" r="1.8" fill="#d9d9de"/>'
      : icon(84, heart, liked ? RED : '#fff') +
        icon(102, bubble) +
        icon(120, send) +
        '<circle cx="75.5" cy="140" r="1.1" fill="#fff"/><circle cx="79" cy="140" r="1.1" fill="#fff"/><circle cx="82.5" cy="140" r="1.1" fill="#fff"/>' +
        '<rect x="73.5" y="147" width="11" height="11" rx="2.5" fill="#9aa0ae" stroke="#fff" stroke-width="1.2"/>',
    // Pagination du carrousel.
    carousel
      ? [0, 1, 2, 3, 4].map((k) => `<circle cx="${37 + k * 4}" cy="118" r="1.3" fill="#fff" opacity="${k ? 0.45 : 1}"/>`).join('')
      : '',
    // Pseudo (avec avatar pour B), légende, son.
    a
      ? '<rect x="5" y="125" width="30" height="4.4" rx="2.2" fill="#fff"/>'
      : '<circle cx="8.5" cy="127.2" r="3.6" fill="#d9d9de" stroke="#fff" stroke-width=".8"/><rect x="15" y="125" width="26" height="4.4" rx="2.2" fill="#fff"/><rect x="44" y="124.4" width="13" height="5.6" rx="1.6" fill="none" stroke="#fff" stroke-width=".7"/>',
    '<rect x="5" y="133" width="56" height="3" rx="1.5" fill="#fff" opacity=".85"/>',
    '<rect x="5" y="139" width="40" height="3" rx="1.5" fill="#fff" opacity=".85"/>',
    '<path d="M6 146 V151 M6 146 L9.5 145 V150" stroke="#fff" stroke-width="1" fill="none"/><circle cx="5.2" cy="151.3" r="1.3" fill="#fff"/><circle cx="8.7" cy="150.3" r="1.3" fill="#fff"/>',
    '<rect x="13" y="146.5" width="34" height="2.6" rx="1.3" fill="#fff" opacity=".85"/>',
    // Progression (vidéo seulement).
    carousel
      ? ''
      : `<rect y="158.4" width="90" height="1.6" fill="#fff" opacity=".25"/><rect y="158.4" width="${views ? 58 : 31}" height="1.6" fill="#fff" opacity=".9"/>`,
    '</svg>',
  ].join('');
}

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
/** 16 variantes partagées par toutes les vignettes (format × réseau × aimée × vues), créées à la demande. */
const OVERLAYS = new Map<string, string>();
function overlayUrl(format: ShortFormat, network: ShortNetwork, liked: boolean, views: boolean) {
  const key = `${format}${network}${+liked}${+views}`;
  let u = OVERLAYS.get(key);
  if (!u) OVERLAYS.set(key, (u = url(overlay(format, network, liked, views))));
  return u;
}

/**
 * `photo` : indice de photo (le `variant` de MediaSphere) ; sinon tirage pseudo-aléatoire depuis `index`.
 * `bare` : photo seule (recadrée en cover) + petit badge lecture/carrousel dans un coin — pour remplir une case de
 * format quelconque sans étirer l'habillage, qui est dessiné pour du 9:16.
 */
export function ShortVideoTile({ index, photo: p, bare = false }: { index: number; photo?: number; bare?: boolean }) {
  const n = (p ?? Math.floor(rand(index + 3) * PHOTOS.length)) % PHOTOS.length;
  if (bare) {
    const carousel = shortVideoMeta(n).format === 'carousel';
    return (
      <span
        className="relative block h-full w-full overflow-hidden rounded-[inherit] bg-[#1d1f26] bg-cover bg-center"
        style={{ backgroundImage: `url("${PHOTOS[n]}")` }}
      >
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgb(0_0_0/0.55))]" />
        <span className="absolute right-1 bottom-1 grid size-3.5 place-items-center rounded-[4px] bg-black/55">
          {carousel ? (
            <span className="block size-1.5 rounded-[1.5px] border border-white" />
          ) : (
            <span className="ml-px block size-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white" />
          )}
        </span>
      </span>
    );
  }
  const { format, network } = shortVideoMeta(n);
  const liked = rand(index + 11) < 0.25;
  const views = rand(index + 17) < 0.33;
  const style: CSSProperties = {
    backgroundImage: `${overlayUrl(format, network, liked, views)}, url("${PHOTOS[n]}")`,
    backgroundSize: '100% 100%, cover',
    backgroundPosition: 'center',
    backgroundColor: '#1d1f26',
  };
  return <span className="block h-full w-full overflow-hidden rounded-[3px]" style={style} />;
}

export default ShortVideoTile;
