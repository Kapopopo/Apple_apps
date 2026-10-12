"""Local web interface. Run: python3 server.py."""
import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from catalog import ROOT, load, search
from previews import CACHE, ID, PREVIEWS, cached_previews
from curation import enrich

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/api/catalog':
            catalog = load()
            previews = cached_previews()
            components = enrich([dict(c, preview=previews.get(c['id'])) for c in search(limit=10000)])
            gallery = ROOT/'data/gallery.json'
            featured = json.loads(gallery.read_text()) if gallery.exists() else []
            body = json.dumps(dict(catalog, components=components, featured=featured), ensure_ascii=False).encode()
            content_type = 'application/json; charset=utf-8'
        elif path.startswith('/previews/') and path.endswith('.jpg'):
            id_ = path.removeprefix('/previews/').removesuffix('.jpg')
            if not ID.fullmatch(id_) or not (CACHE / (id_+'.jpg')).exists():
                self.send_error(404)
                return
            body = (CACHE / (id_+'.jpg')).read_bytes()
            content_type = 'image/jpeg'
        elif path.startswith('/demos/'):
            root = (ROOT / 'web' / 'demos').resolve()
            target = (root / path.removeprefix('/demos/')).resolve()
            if not target.is_relative_to(root) or not target.is_file():
                self.send_error(404)
                return
            body=target.read_bytes()
            content_type=mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
        elif path in ('/', '/app.js', '/prompt.js', '/style.css'):
            name = {'/': 'index.html', '/app.js': 'app.js', '/prompt.js':'prompt.js', '/style.css': 'style.css'}[path]
            body = (ROOT / 'web' / name).read_bytes()
            content_type = {'/': 'text/html', '/app.js': 'text/javascript', '/prompt.js':'text/javascript', '/style.css': 'text/css'}[path] + '; charset=utf-8'
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        if path.startswith('/demos/'):
            policy="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; img-src 'self' data:; object-src 'none'; frame-ancestors 'self'; form-action 'none'"
        else:
            policy="default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; frame-src 'self'; object-src 'none'; frame-ancestors 'none'"
        self.send_header('Content-Security-Policy', policy)
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/api/previews':
            self.send_error(404)
            return
        # Reject cross-origin requests; only catalog IDs are accepted, never URLs.
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            self.send_error(403)
            return
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            self.send_error(403)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 8192:
                raise ValueError('Taille de requête invalide')
            payload = json.loads(self.rfile.read(size))
            ids = payload.get('ids') if isinstance(payload, dict) else None
            if not isinstance(ids, list) or len(ids) > 24 or any(not isinstance(id_, str) or not ID.fullmatch(id_) for id_ in ids):
                raise ValueError('Liste de composants invalide')
            result = PREVIEWS.request(list(dict.fromkeys(ids)))
        except (ValueError, TypeError) as exc:
            self.send_error(400, str(exc))
            return
        body = json.dumps(result, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    print(f'Component Atlas → http://localhost:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
