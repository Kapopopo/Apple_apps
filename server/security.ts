/**
 * Défenses du serveur local.
 *  - DNS rebinding : seuls les en-têtes Host 127.0.0.1, localhost et [::1] au bon port sont acceptés ;
 *    une page tierce qui fait pointer son domaine sur 127.0.0.1 est refusée (son Host reste le sien).
 *  - Écritures : Origin absente ou identique à l'hôte, jamais cross-site, et corps JSON uniquement
 *    (un formulaire HTML ne peut pas envoyer application/json).
 */
import type { IncomingMessage } from 'node:http';

export function allowedHosts(port: number): Set<string> {
  return new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
}

/** Host accepté seulement s'il désigne la boucle locale au port réellement écouté. */
export function hostAllowed(req: IncomingMessage): boolean {
  return allowedHosts(req.socket.localPort ?? 0).has(String(req.headers.host ?? '').toLowerCase());
}

export function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}`) return false;
  const site = req.headers['sec-fetch-site'];
  return site !== 'cross-site' && site !== 'same-site';
}

const FONTSHARE_CSS = 'https://api.fontshare.com';
const FONTSHARE_FONTS = 'https://cdn.fontshare.com';

/** Pages de l'application (catalogue, builder) : aucun script externe, polices Fontshare chargées à la demande. */
export const APP_POLICY = [
  "default-src 'self'", `style-src 'self' ${FONTSHARE_CSS}`, `font-src ${FONTSHARE_FONTS}`, "script-src 'self'",
  "connect-src 'self'", "img-src 'self' data:", "frame-src 'self'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'",
].join('; ');

/** Démos Atlas (code relu, compilé dans web/demos) : aucune ressource distante. */
export const DEMO_POLICY = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; img-src 'self' data:; object-src 'none'; frame-ancestors 'self'; form-action 'none'";

/**
 * Aperçus du registre (code tiers) : iframe sandboxée à origine opaque, donc l'origine du serveur est
 * nommée explicitement ; images distantes autorisées (photos de démonstration), réseau applicatif interdit.
 */
export function previewPolicy(host: string): string {
  const self = `http://${host}`;
  return [
    `default-src 'self' ${self}`, `script-src 'self' ${self}`, `style-src 'self' 'unsafe-inline' ${self}`,
    `img-src 'self' data: blob: https: ${self}`, `font-src 'self' data: ${self}`, "connect-src 'none'",
    "media-src 'self' data: blob:", "object-src 'none'", "frame-ancestors 'self'", "form-action 'none'",
  ].join('; ');
}
