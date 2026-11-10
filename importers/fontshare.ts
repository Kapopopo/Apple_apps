/**
 * Catalogue Fontshare via l'API publique v2. Ne stocke que le nom, les styles et le lien CSS :
 * aucun fichier de police n'est téléchargé ni redistribué.
 */
import { slugify } from './github.js';
import { Collector } from './lib/collector.js';
import type { Draft } from '../shared/registry.js';

const API = 'https://api.fontshare.com/v2/fonts';

interface ApiFont {
  name: string;
  slug: string;
  category?: string;
  license_type: string;
  font_tags?: { name: string }[];
  publisher?: { name?: string };
  designers?: { name: string }[];
  styles: { is_italic: boolean; is_variable: boolean; weight: { name: string; number: number } }[];
}

/** sil_ofl est ouverte ; itf_ffl est gratuite (usage perso et commercial) mais interdit la redistribution des fichiers. */
const LICENSES: Record<string, Pick<Draft, 'license' | 'licenseStatus' | 'licenseNotes'>> = {
  sil_ofl: { license: 'OFL-1.1', licenseStatus: 'open' },
  itf_ffl: {
    license: 'LicenseRef-ITF-FFL',
    licenseStatus: 'restricted',
    licenseNotes:
      'ITF Free Font License : usage gratuit personnel et commercial ; la police ne doit pas être revendue ni redistribuée en fichiers. Atlas ne stocke que le lien CSS Fontshare. Acceptée explicitement (import Fontshare demandé).',
  },
};

const FALLBACK: Record<string, string> = { serif: 'serif', slab: 'serif', mono: 'monospace', handwritten: 'cursive', script: 'cursive' };
const CATEGORY_FR: Record<string, string> = {
  sans: 'Sans serif',
  serif: 'Serif',
  display: 'Display',
  handwritten: 'Manuscrite',
  script: 'Manuscrite',
  mono: 'Monospace',
  slab: 'Slab serif',
};

export async function fetchFonts(fetcher: typeof fetch = fetch): Promise<ApiFont[]> {
  const fonts: ApiFont[] = [];
  for (let page = 1; page < 50; page++) {
    const response = await fetcher(`${API}?limit=100&page=${page}`, { headers: { 'User-Agent': 'component-atlas-importer' } });
    if (!response.ok) throw new Error(`Fontshare ${response.status}`);
    const body = (await response.json()) as { fonts: ApiFont[]; has_more: boolean };
    fonts.push(...body.fonts);
    if (!body.has_more || !body.fonts.length) break;
  }
  return fonts;
}

export async function importFontshare(fetcher?: typeof fetch) {
  const collector = new Collector('fontshare', 'fontshare');
  const fonts = await fetchFonts(fetcher);
  for (const font of fonts) {
    const slug = slugify(font.slug || font.name);
    const id = `fontshare/${slug}`;
    const license = LICENSES[font.license_type];
    if (!license) {
      collector.skip(id, `Licence absente ou inconnue : ${font.license_type ?? 'aucune'}`);
      continue;
    }
    const styles = font.styles
      .map((s) => ({
        name: s.weight.name + (s.is_italic && !/italic/i.test(s.weight.name) ? ' Italic' : ''),
        weight: s.weight.number,
        italic: s.is_italic,
      }))
      .sort((a, b) => a.weight - b.weight || Number(a.italic) - Number(b.italic));
    const weights = [...new Set(styles.filter((s) => !s.italic).map((s) => s.weight))].sort((a, b) => a - b);
    const cssUrl = `https://api.fontshare.com/v2/css?f[]=${font.slug}@${(weights.length ? weights : [400]).join(',')}&display=swap`;
    const key = (font.category ?? '').split(',')[0].trim().toLowerCase();
    const family = `'${font.name}', ${FALLBACK[key] ?? 'sans-serif'}`;
    const css = `/* ${font.name} — Fontshare (${license.license}). Lien CSS uniquement, aucun fichier de police stocké. */\n@import url('${cssUrl}');\n\n:root {\n  --font-${slug}: ${family};\n}\n`;
    collector.write(
      {
        id,
        name: font.name,
        type: 'font',
        category: CATEGORY_FR[key] ?? (font.category || 'Typographie'),
        tags: [
          ...new Set([
            ...(font.font_tags ?? []).map((t) => t.name.toLowerCase()),
            ...(font.styles.some((s) => s.is_variable) ? ['variable'] : []),
          ]),
        ].sort(),
        description: `${CATEGORY_FR[key] ?? font.category ?? 'Police'} · ${styles.length} style${styles.length > 1 ? 's' : ''}${font.publisher?.name ? ' · ' + font.publisher.name : ''}`,
        framework: 'agnostic',
        dependencies: [],
        registryDependencies: [],
        source: 'Fontshare',
        sourceId: 'fontshare',
        sourceUrl: `https://www.fontshare.com/fonts/${font.slug}`,
        ...license,
        ...(license.licenseStatus === 'restricted'
          ? { attribution: `${font.name} par ${font.publisher?.name ?? 'Indian Type Foundry'} via Fontshare (ITF Free Font License).` }
          : {}),
        files: [{ path: 'font.css', role: 'style' }],
        font: {
          family: font.name,
          slug: font.slug,
          category: font.category,
          styles,
          variable: font.styles.some((s) => s.is_variable),
          cssUrl,
          publisher: font.publisher?.name,
          designers: (font.designers ?? []).map((d) => d.name),
        },
        preview: { kind: 'none', reason: 'Aperçu typographique dans le builder' },
      },
      new Map([['font.css', css]]),
    );
  }
  return [collector.finish(['fontshare'])];
}
