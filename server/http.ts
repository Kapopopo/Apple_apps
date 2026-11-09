/** Petits utilitaires HTTP sans dépendance : réponses JSON, fichiers statiques compressés, corps de requête bornés. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm',
};
const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

export interface SendOptions { status?: number; headers?: Record<string, string>; cache?: string }

function acceptsGzip(req: IncomingMessage) { return /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? '')); }

export function send(req: IncomingMessage, res: ServerResponse, body: Buffer | string, type: string, options: SendOptions = {}) {
  let payload = typeof body === 'string' ? Buffer.from(body) : body;
  const headers: Record<string, string> = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': options.cache ?? 'no-cache', ...options.headers };
  if (payload.length > 1024 && COMPRESSIBLE.test(type) && acceptsGzip(req)) {
    payload = zlib.gzipSync(payload, { level: 6 });
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  }
  headers['Content-Length'] = String(payload.length);
  res.writeHead(options.status ?? 200, headers);
  res.end(req.method === 'HEAD' ? undefined : payload);
}

export function sendJson(req: IncomingMessage, res: ServerResponse, data: unknown, status = 200) {
  send(req, res, JSON.stringify(data), MIME['.json'], { status, cache: 'no-store' });
}

export function sendError(req: IncomingMessage, res: ServerResponse, status: number, message: string) {
  sendJson(req, res, { error: message }, status);
}

/** Cache des fichiers statiques compressés (clé : chemin + date de modification). */
const gzCache = new Map<string, { mtime: number; gz: Buffer }>();

/** Sert un fichier sous `root` ; refuse toute sortie du dossier. */
export function sendFile(req: IncomingMessage, res: ServerResponse, root: string, relative: string, options: SendOptions = {}) {
  const base = path.resolve(root);
  const target = path.resolve(base, relative || 'index.html');
  const inside = path.relative(base, target);
  if (inside.startsWith('..') || path.isAbsolute(inside) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    sendError(req, res, 404, 'Introuvable');
    return;
  }
  const type = MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream';
  const stat = fs.statSync(target);
  if (stat.size > 1024 && COMPRESSIBLE.test(type) && acceptsGzip(req)) {
    let entry = gzCache.get(target);
    if (!entry || entry.mtime !== stat.mtimeMs) {
      entry = { mtime: stat.mtimeMs, gz: zlib.gzipSync(fs.readFileSync(target), { level: 6 }) };
      if (gzCache.size > 400) gzCache.clear();
      gzCache.set(target, entry);
    }
    const headers: Record<string, string> = { 'Content-Type': type, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding', 'Content-Length': String(entry.gz.length), 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': options.cache ?? 'no-cache', ...options.headers };
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : entry.gz);
    return;
  }
  send(req, res, fs.readFileSync(target), type, options);
}

export class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

/** Lit un corps JSON (256 Ko maximum, Content-Type application/json obligatoire). */
export async function readJson(req: IncomingMessage, limit = 256 * 1024): Promise<unknown> {
  if (!/^application\/json\b/.test(String(req.headers['content-type'] ?? ''))) throw new HttpError(415, 'Content-Type application/json attendu');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new HttpError(413, 'Requête trop volumineuse');
    chunks.push(chunk as Buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'JSON invalide'); }
}
