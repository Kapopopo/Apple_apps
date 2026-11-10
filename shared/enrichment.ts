/**
 * Enrichissement en français (npm run enrich) : description courte, cas d'usage et mots-clés de
 * recherche par item, stockés dans registry/_enrichment.json. Une entrée ne vaut que pour la version
 * du code qu'elle décrit (contentHash) : un item modifié retombe sur sa description d'origine.
 */
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY } from './paths.js';

export interface Enrichment {
  hash: string;
  description: string;
  usages: string[];
  keywords: string[];
  model: string;
  at: string;
}

export const ENRICHMENT_FILE = path.join(REGISTRY, '_enrichment.json');
let cache: { mtime: number; items: Record<string, Enrichment> } | null = null;

export function loadEnrichment(): Record<string, Enrichment> {
  if (!fs.existsSync(ENRICHMENT_FILE)) return {};
  const mtime = fs.statSync(ENRICHMENT_FILE).mtimeMs;
  if (!cache || cache.mtime !== mtime) {
    try {
      cache = { mtime, items: JSON.parse(fs.readFileSync(ENRICHMENT_FILE, 'utf8')).items ?? {} };
    } catch {
      cache = { mtime, items: {} };
    }
  }
  return cache.items;
}

/** Enrichissement valable pour la version actuelle de l'item, sinon undefined. */
export function enrichmentFor(entry: { id: string; contentHash: string }, all = loadEnrichment()): Enrichment | undefined {
  const e = all[entry.id];
  return e && e.hash === entry.contentHash ? e : undefined;
}
