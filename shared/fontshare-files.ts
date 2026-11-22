/** TTF des polices Fontshare choisies pour une app : téléchargés au scaffold, jamais stockés dans le registre. */
import type { FontDownload } from './mobile.js';

const MAX_BYTES = 4 * 1024 * 1024;

/** URL du TTF romain d'une graisse dans la feuille CSS de Fontshare, uniquement sur cdn.fontshare.com. */
export function ttfUrl(css: string, weight: number): string | null {
  for (const block of css.split('@font-face').slice(1)) {
    if (!new RegExp(`font-weight:\\s*${weight}\\s*;`).test(block) || /font-style:\s*italic/.test(block)) continue;
    const url = block.match(/url\(['"]?(?:https:)?(\/\/cdn\.fontshare\.com\/[\w./-]+\.ttf)['"]?\)/)?.[1];
    if (url) return `https:${url}`;
  }
  return null;
}

async function get(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!res.ok) throw new Error(`${res.status} sur ${url}`);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > MAX_BYTES) throw new Error(`Fichier trop lourd : ${url}`);
  return body;
}

export async function downloadFonts(fonts: FontDownload[]): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  for (const font of fonts) {
    try {
      const css = await get(`https://api.fontshare.com/v2/css?f[]=${font.slug}@${font.weight}&display=swap`);
      const url = ttfUrl(css.toString('utf8'), font.weight);
      if (!url) throw new Error('aucun fichier TTF publié');
      const ttf = await get(url);
      if (ttf.readUInt32BE(0) !== 0x00010000 && ttf.toString('latin1', 0, 4) !== 'OTTO') throw new Error('fichier reçu illisible');
      files.set(font.path, ttf);
    } catch (error) {
      throw new Error(
        `Police ${font.family} ${font.weight} impossible à télécharger (${(error as Error).message}). Rien n’a été écrit : réessayer, ou retirer la police de la spec.`,
        { cause: error },
      );
    }
  }
  return files;
}
