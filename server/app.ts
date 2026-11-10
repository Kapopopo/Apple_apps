/**
 * Serveur web local de Component Atlas (remplace server.py) : pages, API du registre et des specs,
 * thèmes personnels, aperçus sandboxés, vignettes et registre au format shadcn.
 */
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ITEM_ID_PATTERN, shadcnItem, shadcnIndex } from './shadcn.js';
import { REGISTRY, ROOT, THUMBS, WEB } from '../shared/paths.js';
import { readMeta, readFiles } from '../shared/registry.js';
import { deleteSpec, getSpec, listSpecs, renameSpec, saveSpec, specHistory, specVersion } from '../shared/specs.js';
import { createTheme, deleteTheme, skinCss } from '../shared/themes.js';
import { cataloguePayload, readIndex, registryPayload } from './catalog.js';
import { HttpError, readJson, send, sendError, sendFile, sendJson, MIME } from './http.js';
import { APP_POLICY, DEMO_POLICY, hostAllowed, previewPolicy, sameOrigin } from './security.js';

const PAGES: Record<string, string> = { '/': 'index.html', '/builder': 'builder.html' };
const ASSETS = new Set(['app.js', 'builder.js', 'theme.css', 'style.css', 'builder.css', 'icons.svg', 'favicon.svg']);
const appHeaders = { 'Content-Security-Policy': APP_POLICY };

type Handler = (req: IncomingMessage, res: ServerResponse, url: URL) => Promise<void> | void;

function itemPayload(id: string) {
  const entry = readIndex().items.find((e) => e.id === id);
  if (!entry) return null;
  const dir = path.join(REGISTRY, entry.dir);
  const meta = readMeta(dir);
  return meta ? { ...meta, files: readFiles(meta, dir) } : null;
}

const specRoute = /^\/api\/specs\/([a-z0-9][a-z0-9-]{0,63})(?:\/(history)(?:\/([\w.-]+))?|\/(rename))?$/;

async function api(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  const p = url.pathname,
    method = req.method ?? 'GET';
  const preset = url.searchParams.get('preset') === '1';
  if (p === '/api/catalog' && method === 'GET') {
    sendJson(req, res, cataloguePayload());
    return true;
  }
  if (p === '/api/info' && method === 'GET') {
    // Commande d'enregistrement du MCP pour un autre projet (chemins absolus de ce dépôt).
    const loader = pathToFileURL(path.join(ROOT, 'node_modules', 'tsx', 'dist', 'loader.mjs')).href;
    sendJson(req, res, { root: ROOT, mcp: { command: 'node', args: ['--import', loader, path.join(ROOT, 'mcp', 'index.ts')] } });
    return true;
  }
  if (p === '/api/registry' && method === 'GET') {
    sendJson(req, res, registryPayload());
    return true;
  }
  if (p === '/api/registry/item' && method === 'GET') {
    const id = url.searchParams.get('id') ?? '';
    const item = ITEM_ID_PATTERN.test(id) ? itemPayload(id) : null;
    item ? sendJson(req, res, item) : sendError(req, res, 404, 'Item introuvable');
    return true;
  }
  if (p === '/api/specs' && method === 'GET') {
    sendJson(
      req,
      res,
      listSpecs().map(({ spec, preset: isPreset }) => ({
        name: spec.name,
        title: spec.title,
        preset: isPreset,
        theme: spec.theme,
        blocks: spec.blocks.length,
        updatedAt: spec.updatedAt ?? spec.createdAt ?? null,
        versions: specHistory(spec.name, isPreset).length,
      })),
    );
    return true;
  }
  if (p === '/api/specs' && method === 'POST') {
    const body = (await readJson(req)) as { spec?: unknown; overwrite?: unknown };
    const result = saveSpec(body?.spec, readIndex().items, { overwrite: body?.overwrite === true });
    result.ok
      ? sendJson(req, res, { saved: result.file, spec: result.spec })
      : sendJson(req, res, { error: result.error, exists: result.exists }, result.status);
    return true;
  }
  const m = p.match(specRoute);
  if (m) {
    const [, name, history, stamp, rename] = m;
    if (history && method === 'GET') {
      if (stamp) {
        const v = specVersion(name, stamp, preset);
        v ? sendJson(req, res, v) : sendError(req, res, 404, 'Version introuvable');
      } else sendJson(req, res, specHistory(name, preset));
      return true;
    }
    if (rename && method === 'POST') {
      const body = (await readJson(req)) as { to?: unknown };
      const result = renameSpec(name, typeof body?.to === 'string' ? body.to : '', preset);
      result.ok
        ? sendJson(req, res, { saved: result.file, spec: result.spec })
        : sendJson(req, res, { error: result.error, exists: result.exists }, result.status);
      return true;
    }
    if (!history && !rename && method === 'GET') {
      const s = getSpec(name, preset);
      s ? sendJson(req, res, s.spec) : sendError(req, res, 404, 'Spec introuvable');
      return true;
    }
    if (!history && !rename && method === 'DELETE') {
      deleteSpec(name, preset) ? sendJson(req, res, { deleted: name }) : sendError(req, res, 404, 'Spec introuvable');
      return true;
    }
  }
  if (p === '/api/themes' && method === 'POST') {
    const body = (await readJson(req)) as { theme?: unknown; overwrite?: unknown };
    const result = createTheme(body?.theme, { overwrite: body?.overwrite === true });
    result.ok ? sendJson(req, res, { id: result.meta.id, theme: result.meta }) : sendError(req, res, result.status, result.error);
    return true;
  }
  const t = p.match(/^\/api\/themes\/(perso\/[a-z0-9-]+)$/);
  if (t && method === 'DELETE') {
    deleteTheme(t[1]) ? sendJson(req, res, { deleted: t[1] }) : sendError(req, res, 404, 'Thème personnel introuvable');
    return true;
  }
  if (p === '/api/skin.css' && method === 'GET') {
    const id = url.searchParams.get('id') ?? '';
    const item = ITEM_ID_PATTERN.test(id) ? itemPayload(id) : null;
    if (!item?.tokens) {
      sendError(req, res, 404, 'Thème introuvable');
      return true;
    }
    // Lu par les aperçus sandboxés (origine opaque) : CORS ouvert sur cette feuille sans secret.
    send(req, res, skinCss(item.tokens), MIME['.css'], { headers: { 'Access-Control-Allow-Origin': '*' } });
    return true;
  }
  return false;
}

const routes: Handler = async (req, res, url) => {
  const p = decodeURIComponent(url.pathname);
  if (p.startsWith('/api/')) {
    if (await api(req, res, url)) return;
    sendError(req, res, 404, 'Route inconnue');
    return;
  }
  if (p === '/r/registry.json') {
    sendJson(req, res, shadcnIndex(`http://${req.headers.host}`));
    return;
  }
  const r = p.match(/^\/r\/([a-z0-9-]+)\/([a-z0-9-]+)\.json$/);
  if (r) {
    const item = shadcnItem(`${r[1]}/${r[2]}`, `http://${req.headers.host}`);
    item ? sendJson(req, res, item) : sendError(req, res, 404, 'Item introuvable');
    return;
  }
  if (PAGES[p]) {
    sendFile(req, res, WEB, PAGES[p], { headers: appHeaders });
    return;
  }
  if (p === '/favicon.ico') {
    sendFile(req, res, WEB, 'favicon.svg', { headers: appHeaders, cache: 'max-age=86400' });
    return;
  }
  if (ASSETS.has(p.slice(1))) {
    sendFile(req, res, WEB, p.slice(1), { headers: appHeaders });
    return;
  }
  if (p.startsWith('/lib/') && p.endsWith('.js')) {
    sendFile(req, res, path.join(WEB, 'lib'), p.slice(5), { headers: appHeaders });
    return;
  }
  if (p.startsWith('/demos/')) {
    sendFile(req, res, path.join(WEB, 'demos'), p.slice(7), { headers: { 'Content-Security-Policy': DEMO_POLICY } });
    return;
  }
  if (p.startsWith('/registry-previews/')) {
    const rel = p.slice('/registry-previews/'.length);
    sendFile(req, res, path.join(WEB, 'registry-previews'), rel, {
      cache: rel.startsWith('assets/') ? 'max-age=31536000, immutable' : 'no-cache',
      // Code tiers rendu dans des iframes sandboxées (origine opaque) : CORS ouvert sur ces seuls fichiers statiques.
      headers: { 'Content-Security-Policy': previewPolicy(String(req.headers.host)), 'Access-Control-Allow-Origin': '*' },
    });
    return;
  }
  // Captures des templates (pages de la démo officielle), stockées avec l'item dans le registre.
  const shot = p.match(/^\/template-screens\/([a-z0-9-]+)\/([\w.-]+\.(?:jpg|png|webp))$/);
  if (shot) {
    sendFile(req, res, path.join(REGISTRY, 'templates', shot[1], 'template', 'screens'), shot[2], { cache: 'max-age=3600' });
    return;
  }
  if (p.startsWith('/thumbs/') && p.endsWith('.jpg')) {
    sendFile(req, res, THUMBS, p.slice(8), { cache: url.searchParams.has('v') ? 'max-age=31536000, immutable' : 'no-cache' });
    return;
  }
  sendError(req, res, 404, 'Introuvable');
};

export function createAtlasServer() {
  return http.createServer(async (req, res) => {
    try {
      if (!hostAllowed(req)) {
        sendError(req, res, 403, 'Hôte non autorisé (protection DNS rebinding) : utilisez http://127.0.0.1 ou http://localhost');
        return;
      }
      const method = req.method ?? 'GET';
      if (!['GET', 'HEAD', 'POST', 'DELETE'].includes(method)) {
        sendError(req, res, 405, 'Méthode non autorisée');
        return;
      }
      if ((method === 'POST' || method === 'DELETE') && !sameOrigin(req)) {
        sendError(req, res, 403, 'Requête d’une autre origine refusée');
        return;
      }
      await routes(req, res, new URL(req.url ?? '/', `http://${req.headers.host}`));
    } catch (error) {
      if (error instanceof HttpError) {
        sendError(req, res, error.status, error.message);
        return;
      }
      console.error(error);
      if (!res.headersSent) sendError(req, res, 500, 'Erreur interne');
    }
  });
}

export function webReady(): string[] {
  return ['index.html', 'builder.html'].filter((f) => !fs.existsSync(path.join(WEB, f)));
}
