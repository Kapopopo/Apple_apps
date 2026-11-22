/**
 * Cibles d'un item (`platforms` dans l'index), déduites de son code et de sa licence.
 * Calculé à l'indexation plutôt qu'écrit dans chaque meta.json : cela changerait les contentHash, donc l'audit.
 */
import { nativeColors } from './native-theme.js';
import type { Meta, Platform } from './schema.js';

/** Items qui dépendent d'Uniwind, directement ou par leurs dépendances de registre : hors stack NativeWind. */
export function uniwindItems(metas: Meta[]): Set<string> {
  const found = new Set(metas.filter((m) => m.dependencies.some((d) => /^uniwind(@|$)/.test(d))).map((m) => m.id));
  for (let grew = true; grew;) {
    grew = false;
    for (const m of metas)
      if (!found.has(m.id) && m.registryDependencies.some((d) => found.has(d))) {
        found.add(m.id);
        grew = true;
      }
  }
  return found;
}

export function platformsOf(meta: Meta, uniwind: ReadonlySet<string> = new Set()): Platform[] {
  if (meta.type === 'theme') {
    const native = !!meta.tokens && !!nativeColors(meta.tokens);
    if (meta.framework === 'react-native') return native ? ['mobile'] : [];
    return native ? ['web', 'mobile'] : ['web'];
  }
  if (meta.framework === 'react-native') return uniwind.has(meta.id) ? [] : ['mobile'];
  if (meta.framework === 'react') return ['web'];
  // Embarquer les fichiers d'une police dans une app n'est vérifié que pour les licences ouvertes.
  if (meta.type === 'font') return meta.licenseStatus === 'open' ? ['web', 'mobile'] : ['web'];
  return ['web', 'mobile'];
}
