/**
 * Détection de licence à partir du TEXTE du fichier LICENSE (le champ SPDX de GitHub
 * renvoie NOASSERTION dès qu'une clause est ajoutée, ce qui ne suffit pas pour décider).
 */
export const OPEN_LICENSES = new Set([
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'OFL-1.1',
]);

export interface LicenseCheck {
  license: string;
  status: 'open' | 'restricted' | 'rejected';
  reason: string;
  notes?: string;
  attribution?: string;
}

export interface RestrictedAcceptance {
  /** Identifiant exact attendu ; si le texte change en amont, l'acceptation tombe. */
  license: string;
  attribution: string;
  notes: string;
}

const flat = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

export function detectLicense(text: string | null | undefined): string {
  if (!text) return 'NONE';
  const t = flat(text);
  if (t.includes('commons clause'))
    return t.includes('attribution requirement') ? 'LicenseRef-MIT-Commons-Clause-Attribution' : 'LicenseRef-Commons-Clause';
  if (/non-?commercial/.test(t)) return 'LicenseRef-NonCommercial';
  if (
    t.includes('permission is hereby granted, free of charge') &&
    t.includes('to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies')
  )
    return 'MIT';
  if (t.includes('apache license') && t.includes('version 2.0')) return 'Apache-2.0';
  if (t.includes('permission to use, copy, modify, and/or distribute this software for any purpose with or without fee'))
    return t.includes('above copyright notice') ? 'ISC' : '0BSD';
  if (t.includes('redistribution and use in source and binary forms'))
    return t.includes('neither the name') ? 'BSD-3-Clause' : 'BSD-2-Clause';
  if (t.includes('this is free and unencumbered software released into the public domain')) return 'Unlicense';
  if (t.includes('cc0 1.0 universal')) return 'CC0-1.0';
  if (t.includes('sil open font license')) return 'OFL-1.1';
  return 'UNKNOWN';
}

/** Exclusions annexes (marque, logo, photos) : n'affectent pas le code mais sont conservées. */
function exclusions(text: string): string | undefined {
  const match = text.match(/not covered by this licen[cs]e:([\s\S]*?)(?:\n\s*\n|$)/i);
  return match ? 'Hors licence : ' + match[1].replace(/\s+/g, ' ').trim() : undefined;
}

export function checkLicense(text: string | null | undefined, accept?: RestrictedAcceptance): LicenseCheck {
  const license = detectLicense(text);
  const notes = text ? exclusions(text) : undefined;
  if (OPEN_LICENSES.has(license)) return { license, status: 'open', reason: `Licence ouverte détectée (${license})`, notes };
  if (accept && accept.license === license)
    return {
      license,
      status: 'restricted',
      reason: `Licence non ouverte acceptée explicitement (${license})`,
      notes: accept.notes,
      attribution: accept.attribution,
    };
  if (license === 'NONE') return { license, status: 'rejected', reason: 'Aucun fichier de licence' };
  if (license === 'UNKNOWN') return { license, status: 'rejected', reason: 'Licence non reconnue ou ambiguë' };
  return { license, status: 'rejected', reason: `Licence non ouverte (${license}) sans acceptation explicite dans importers/sources.json` };
}
