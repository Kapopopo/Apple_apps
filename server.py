"""Local web interface. Run: python3 server.py."""
import argparse
import json
import mimetypes
import re
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
from catalog import ROOT, normalize, search
from previews import CACHE, ID, PREVIEWS, cached_previews
from curation import enrich
from taxonomy import VOCAB

REGISTRY = ROOT / 'registry'
SPECS = ROOT / 'specs'
PRESETS = SPECS / 'presets'
ITEM_ID = re.compile(r'^[a-z0-9-]+/[a-z0-9-]+$')
SPEC_NAME = re.compile(r'^[a-z0-9][a-z0-9-]{0,63}$')
STATIC = {'/': 'index.html', '/app.js': 'app.js', '/prompt.js': 'prompt.js', '/style.css': 'style.css', '/builder': 'builder.html', '/builder.js': 'builder.js', '/builder.css': 'builder.css', '/theme.css': 'theme.css', '/icons.svg': 'icons.svg'}
TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'}
APP_POLICY = "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; frame-src 'self'; object-src 'none'; frame-ancestors 'none'"
# Le builder affiche les polices Fontshare : feuilles CSS et fichiers servis par Fontshare, chargés à la demande.
BUILDER_POLICY = "default-src 'self'; style-src 'self' https://api.fontshare.com; font-src https://cdn.fontshare.com; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src 'self'; object-src 'none'; frame-ancestors 'none'"
DEMO_POLICY = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; img-src 'self' data:; object-src 'none'; frame-ancestors 'self'; form-action 'none'"


def registry_index():
    path = REGISTRY / 'index.json'
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else dict(generatedAt=None, count=0, items=[])


def previews_built():
    return (ROOT / 'web' / 'registry-previews' / 'index.html').is_file()


def preview_audit():
    """Résultat de `npm --prefix previews run audit` : {id: {status: ok|empty|error}} (vide si l'audit n'a pas tourné)."""
    path = REGISTRY / '_previews.json'
    try:
        return json.loads(path.read_text(encoding='utf-8')).get('results', {}) if path.exists() else {}
    except ValueError:
        return {}


def is_interactive(entry, audit, built):
    """Démo Atlas, ou aperçu live compilé et validé par l'audit (sans audit : supposé valide)."""
    kind = entry.get('preview', {}).get('kind')
    if kind == 'atlas-demo':
        return True
    return kind == 'live' and built and audit.get(entry['id'], {}).get('status', 'ok') == 'ok'


def gallery():
    """Catalogue interactif : les 44 démos Atlas (fiches éditoriales) puis chaque aperçu live validé du registre."""
    curated = [c for c in enrich(search(limit=10000)) if c['curation']]
    audit, built = preview_audit(), previews_built()
    entries = registry_index()['items']
    atlas_ids = {e['catalogId']: e['id'] for e in entries if e.get('catalogId')}
    for c in curated:
        c['registry_id'] = atlas_ids.get(c['id'])
    cards = []
    for e in entries:
        if e['type'] not in ('component', 'section', 'screen') or e.get('catalogId') or not is_interactive(e, audit, built):
            continue
        terms = ' '.join([e['name'], e['source'], e['category'], VOCAB.get(e['category'], ''), e['description'], ' '.join(e['tags']), e['type']])
        cards.append(dict(id=e['id'], registry=True, registry_id=e['id'], name=e['name'], source=e['source'], source_id=e['sourceId'], kind='Composant', item_type=e['type'], type_label=e['category'], url=e['sourceUrl'], description=e['description'], tags=e['tags'], license=e['license'], license_status=e['licenseStatus'], attribution=e.get('attribution'), dependencies=e['dependencies'], search_terms=normalize(terms), score=0, curation=None))
    sources = {}
    for c in curated + cards:
        sources.setdefault(c['source_id'], dict(id=c['source_id'], name=c['source'], components=0))['components'] += 1
    return dict(components=curated + cards, sources=sorted(sources.values(), key=lambda s: s['name'].lower()), previewsBuilt=built, audited=bool(audit))


def registry_item(id_):
    entry = next((e for e in registry_index()['items'] if e['id'] == id_), None)
    if not entry:
        return None
    base = (REGISTRY / entry['dir']).resolve()
    if not base.is_relative_to(REGISTRY.resolve()):
        return None
    meta = json.loads((base / 'meta.json').read_text(encoding='utf-8'))
    files = []
    for f in meta['files']:
        target = (base / 'files' / f['path']).resolve()
        if target.is_relative_to(base / 'files') and target.is_file():
            files.append(dict(f, content=target.read_text(encoding='utf-8', errors='replace')))
    return dict(meta, files=files)


def stored_specs():
    rows = []
    for folder, preset in ((SPECS, False), (PRESETS, True)):
        if not folder.exists():
            continue
        for path in sorted(folder.glob('*.json')):
            try:
                spec = json.loads(path.read_text(encoding='utf-8'))
                rows.append(dict(name=spec['name'], title=spec.get('title', ''), preset=preset, theme=spec.get('theme'), blocks=len(spec.get('blocks', [])), updatedAt=spec.get('updatedAt') or spec.get('createdAt')))
            except (ValueError, KeyError, TypeError):
                continue
    return rows


def validate_spec(raw):
    """Même contrat que le schéma zod Spec (shared/schema.ts) ; les ids doivent exister dans le registre."""
    if not isinstance(raw, dict):
        raise ValueError('Spec invalide')
    allowed = {'name', 'title', 'brief', 'stack', 'style', 'theme', 'fonts', 'easings', 'blocks', 'preset', 'createdAt', 'updatedAt'}
    unknown = set(raw) - allowed
    if unknown:
        raise ValueError('Champs inconnus : ' + ', '.join(sorted(unknown)))
    name = raw.get('name')
    if not isinstance(name, str) or not SPEC_NAME.fullmatch(name):
        raise ValueError('Nom de spec invalide : minuscules, chiffres et tirets (ex. dashboard-padel)')
    spec = dict(name=name)
    for key, limit in (('title', 120), ('brief', 5000), ('stack', 300), ('style', 1000)):
        value = raw.get(key, '')
        if not isinstance(value, str) or len(value) > limit:
            raise ValueError(f'Champ {key} invalide ({limit} caractères maximum)')
        spec[key] = value
    types = {e['id']: e['type'] for e in registry_index()['items']}
    theme = raw.get('theme')
    if theme is not None and (not isinstance(theme, str) or types.get(theme) != 'theme'):
        raise ValueError('Thème inconnu : ' + str(theme))
    spec['theme'] = theme
    for key, kind in (('fonts', 'font'), ('easings', 'easing')):
        values = raw.get(key, [])
        if not isinstance(values, list) or len(values) > 20 or any(not isinstance(v, str) or types.get(v) != kind for v in values):
            raise ValueError(f'Liste {key} invalide')
        spec[key] = list(dict.fromkeys(values))
    blocks = raw.get('blocks', [])
    if not isinstance(blocks, list) or len(blocks) > 200:
        raise ValueError('Liste de blocs invalide')
    spec['blocks'] = []
    for block in blocks:
        if not isinstance(block, dict) or set(block) - {'id', 'note'}:
            raise ValueError('Bloc invalide')
        id_, note = block.get('id'), block.get('note', '')
        if not isinstance(id_, str) or types.get(id_) not in ('component', 'section', 'screen', 'lib'):
            raise ValueError('Bloc inconnu : ' + str(id_))
        if not isinstance(note, str) or len(note) > 2000:
            raise ValueError('Note trop longue pour ' + id_)
        spec['blocks'].append(dict(id=id_, note=note))
    spec['preset'] = raw.get('preset') is True
    return spec


class Handler(BaseHTTPRequestHandler):
    def send_body(self, body, content_type, policy=APP_POLICY, cache='no-cache', extra=None):
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', cache)
        if policy:
            self.send_header('Content-Security-Policy', policy)
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def static_from(self, folder, relative, policy, extra=None):
        root = (ROOT / 'web' / folder).resolve()
        target = (root / (relative or 'index.html')).resolve()
        if not target.is_relative_to(root) or not target.is_file():
            self.send_error(404)
            return
        self.send_body(target.read_bytes(), mimetypes.guess_type(target.name)[0] or 'application/octet-stream', policy, extra=extra)

    def do_GET(self):
        url = urlsplit(self.path)
        path, query = url.path, parse_qs(url.query)
        if path == '/api/catalog':
            # Catalogue de la page d'accueil : uniquement ce qui est interactif (les fiches lien + capture restent dans data/).
            self.send_body(json.dumps(gallery(), ensure_ascii=False).encode(), 'application/json; charset=utf-8')
        elif path == '/api/registry':
            data = registry_index()
            audit, built = preview_audit(), previews_built()
            data['previewsBuilt'], data['audited'] = built, bool(audit)
            for e in data['items']:
                e['interactive'] = is_interactive(e, audit, built)
            self.send_json(data)
        elif path == '/api/registry/item':
            id_ = (query.get('id') or [''])[0]
            item = registry_item(id_) if ITEM_ID.fullmatch(id_) else None
            self.send_json(item) if item else self.send_json(dict(error='Item introuvable'), 404)
        elif path == '/api/specs':
            self.send_json(stored_specs())
        elif path.startswith('/api/specs/'):
            name = path.removeprefix('/api/specs/')
            folder = PRESETS if query.get('preset') == ['1'] else SPECS
            target = folder / (name + '.json')
            if not SPEC_NAME.fullmatch(name) or not target.is_file():
                self.send_json(dict(error='Spec introuvable'), 404)
            else:
                self.send_json(json.loads(target.read_text(encoding='utf-8')))
        elif path.startswith('/previews/') and path.endswith('.jpg'):
            id_ = path.removeprefix('/previews/').removesuffix('.jpg')
            if not ID.fullmatch(id_) or not (CACHE / (id_+'.jpg')).exists():
                self.send_error(404)
                return
            self.send_body((CACHE / (id_+'.jpg')).read_bytes(), 'image/jpeg')
        elif path.startswith('/demos/'):
            self.static_from('demos', path.removeprefix('/demos/'), DEMO_POLICY)
        elif path.startswith('/registry-previews/'):
            # Code tiers importé : rendu dans des iframes sandboxées (origine opaque), d'où le CORS ouvert
            # sur ces seuls fichiers statiques et l'origine explicite dans la CSP.
            host = 'http://' + self.headers.get('Host', '127.0.0.1')
            policy = f"default-src 'self' {host}; script-src 'self' {host}; style-src 'self' 'unsafe-inline' {host}; img-src 'self' data: blob: {host}; font-src 'self' data: {host}; connect-src 'none'; media-src 'self' data: blob:; object-src 'none'; frame-ancestors 'self'; form-action 'none'"
            self.static_from('registry-previews', path.removeprefix('/registry-previews/'), policy, extra={'Access-Control-Allow-Origin': '*'})
        elif path in STATIC:
            name = STATIC[path]
            policy = BUILDER_POLICY if name.startswith('builder') else APP_POLICY
            self.send_body((ROOT / 'web' / name).read_bytes(), TYPES[name[name.rindex('.'):]] + '; charset=utf-8', policy)
        else:
            self.send_error(404)

    def same_origin(self):
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return False
        return self.headers.get('Sec-Fetch-Site') != 'cross-site'

    def read_json(self, limit):
        size = int(self.headers.get('Content-Length', '0'))
        if not 0 < size <= limit:
            raise ValueError('Taille de requête invalide')
        return json.loads(self.rfile.read(size))

    def do_POST(self):
        if self.path not in ('/api/previews', '/api/specs'):
            self.send_error(404)
            return
        # Reject cross-origin requests; only catalog IDs are accepted, never URLs.
        if not self.same_origin():
            self.send_error(403)
            return
        if self.path == '/api/specs':
            self.save_spec()
            return
        try:
            payload = self.read_json(8192)
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

    def save_spec(self):
        try:
            payload = self.read_json(262144)
            if not isinstance(payload, dict):
                raise ValueError('Requête invalide')
            spec = validate_spec(payload.get('spec'))
        except (ValueError, TypeError) as exc:
            self.send_json(dict(error=str(exc)), 400)
            return
        folder = PRESETS if spec['preset'] else SPECS
        target = folder / (spec['name'] + '.json')
        now = datetime.now(timezone.utc).isoformat(timespec='seconds')
        previous = json.loads(target.read_text(encoding='utf-8')) if target.is_file() else None
        if previous and payload.get('overwrite') is not True:
            self.send_json(dict(error='Une spec porte déjà ce nom', exists=True), 409)
            return
        spec['createdAt'] = (previous or {}).get('createdAt') or now
        spec['updatedAt'] = now
        folder.mkdir(parents=True, exist_ok=True)
        tmp = target.with_suffix('.tmp')
        tmp.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        tmp.replace(target)
        self.send_json(dict(saved=str(target.relative_to(ROOT)).replace('\\', '/'), spec=spec))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    sys.stdout.reconfigure(errors='replace')  # consoles Windows en cp1252
    print(f'Component Atlas → http://localhost:{args.port}  ·  Builder → http://localhost:{args.port}/builder', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
