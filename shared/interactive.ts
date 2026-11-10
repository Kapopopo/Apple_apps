/**
 * « Interactif » = démo Atlas, ou aperçu live compilé ET validé par l'audit pour la version actuelle du code.
 * Un item modifié depuis l'audit (hash différent) ou jamais audité est « en attente » : il n'est pas affiché.
 */
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY, WEB } from './paths.js';
import type { IndexEntry } from './schema.js';

export interface AuditResult {
  status: 'ok' | 'empty' | 'error';
  message?: string;
  hash?: string;
  chunk?: string;
  thumb?: boolean;
  brokenImages?: number;
  at?: string;
}
export type PreviewState = 'interactive' | 'pending' | 'broken' | 'none';

const AUDIT_FILE = path.join(REGISTRY, '_previews.json');
let cache: { mtime: number; results: Record<string, AuditResult> | null } | null = null;

/** Résultats de `npm --prefix previews run audit`, ou null si l'audit n'a jamais tourné. */
export function loadAudit(): Record<string, AuditResult> | null {
  if (!fs.existsSync(AUDIT_FILE)) return null;
  const mtime = fs.statSync(AUDIT_FILE).mtimeMs;
  if (!cache || cache.mtime !== mtime) {
    try {
      cache = { mtime, results: JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8')).results ?? {} };
    } catch {
      cache = { mtime, results: null };
    }
  }
  return cache.results;
}

export const previewsBuilt = () => fs.existsSync(path.join(WEB, 'registry-previews', 'index.html'));

export function previewState(
  entry: Pick<IndexEntry, 'id' | 'preview' | 'framework' | 'contentHash'>,
  audit: Record<string, AuditResult> | null,
  built: boolean,
): PreviewState {
  if (entry.preview.kind === 'atlas-demo') return 'interactive';
  if (entry.preview.kind !== 'live' || entry.framework !== 'react') return 'none';
  if (!built) return 'pending';
  if (!audit) return 'interactive'; // aucun audit : on fait confiance au build
  const result = audit[entry.id];
  if (!result || (result.hash && result.hash !== entry.contentHash)) return 'pending';
  return result.status === 'ok' ? 'interactive' : 'broken';
}

/** URL de la vignette capturée par l'audit (versionnée par la date de capture pour le cache navigateur). */
export function thumbUrl(entry: Pick<IndexEntry, 'id' | 'contentHash'>, audit: Record<string, AuditResult> | null): string | undefined {
  const result = audit?.[entry.id];
  if (!result?.thumb || (result.hash && result.hash !== entry.contentHash)) return undefined;
  const at = result.at ? Date.parse(result.at) : NaN;
  return `/thumbs/${entry.id}.jpg?v=${Number.isNaN(at) ? (result.hash ?? '0') : at.toString(36)}`;
}
