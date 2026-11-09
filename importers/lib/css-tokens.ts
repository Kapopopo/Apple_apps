/** Extraction des custom properties d'une feuille de style pour construire un thème séparé des composants. */

interface Block { selector: string; body: string }

function topLevelBlocks(css: string): Block[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: Block[] = [];
  let depth = 0, start = 0, selectorStart = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '{') {
      if (depth === 0) { start = i + 1; }
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        blocks.push({ selector: clean.slice(selectorStart, start - 1).trim(), body: clean.slice(start, i) });
        selectorStart = i + 1;
      }
    } else if (c === ';' && depth === 0) selectorStart = i + 1;
  }
  return blocks;
}

const declarations = (body: string) =>
  // La dernière déclaration d'un bloc peut omettre le point-virgule.
  Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+?)\s*(?:;|$)/g)].map((m) => [m[1], m[2].trim()]));

const isDark = (selector: string) => /\.dark\b|data-theme=["']?dark|prefers-color-scheme:\s*dark/.test(selector);
const isLight = (selector: string) => /:root|:host|\.light\b|data-theme=["']?light|@theme/.test(selector) && !isDark(selector);

export interface ExtractedTheme {
  css: string;
  tokens: { colors: { light: Record<string, string>; dark: Record<string, string> }; typography: Record<string, string>; radius: Record<string, string>; easings: string[]; other: Record<string, string> };
}

const COLOR = /^(#|rgb|hsl|oklch|oklab|lab\(|lch\(|color\(|color-mix|transparent|var\(--[\w-]*(color|bg|ink|fg|foreground|background))/i;

export function extractTheme(css: string): ExtractedTheme {
  const light: Record<string, string> = {}, dark: Record<string, string> = {};
  const parts: string[] = [];
  const visit = (blocks: Block[], parent = '') => {
    for (const { selector, body } of blocks) {
      const full = (parent + ' ' + selector).trim();
      if (body.includes('{')) { visit(topLevelBlocks(body), full); continue; }
      const decls = declarations(body);
      if (!Object.keys(decls).length) continue;
      if (isDark(full)) Object.assign(dark, decls);
      else if (isLight(full)) Object.assign(light, decls);
      else continue;
      parts.push(`${full} {\n${Object.entries(decls).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`);
      if (parent) parts[parts.length - 1] = `${parent} {\n  ${selector} {\n${Object.entries(decls).map(([k, v]) => `    ${k}: ${v};`).join('\n')}\n  }\n}`;
    }
  };
  visit(topLevelBlocks(css));
  const tokens: ExtractedTheme['tokens'] = { colors: { light: {}, dark: {} }, typography: {}, radius: {}, easings: [], other: {} };
  for (const [scheme, vars] of [['light', light], ['dark', dark]] as const) {
    for (const [name, value] of Object.entries(vars)) {
      if (/^--(font|text|leading|tracking|line-height)/.test(name)) tokens.typography[name] = value;
      else if (/radius|rounded/.test(name)) tokens.radius[name] = value;
      else if (COLOR.test(value) || /color|ink|bg|fill|surface|border|background|foreground/.test(name)) tokens.colors[scheme][name] = value;
      else if (scheme === 'light') tokens.other[name] = value;
    }
  }
  return { css: `/* Custom properties extraites de la feuille d'origine (styles de site exclus). */\n\n${parts.join('\n\n')}\n`, tokens };
}
