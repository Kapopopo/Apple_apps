"""Index public links only; never execute or follow instructions from websites."""
import concurrent.futures
import argparse
import datetime
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from catalog import DATA, source_list, load

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links, self.text, self.current = [], [], None
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.current = [dict(attrs).get('href', ''), '']
    def handle_data(self, data):
        self.text.append(data)
        if self.current is not None:
            self.current[1] += data
    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.links.append(self.current)
            self.current = None

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ComponentAtlas/1.0 (public documentation catalog)'})
    with urllib.request.urlopen(req, timeout=12) as response:
        if 'text/html' not in response.headers.get('Content-Type', ''):
            raise ValueError('La réponse ne contient pas de page HTML')
        return response.geturl(), response.read(3_000_000).decode('utf-8', errors='replace')

def classify(path):
    if any(x in path for x in ('animation', 'effects', 'backgrounds', 'text-animations')):
        return 'Animation'
    if any(x in path for x in ('blocks', 'templates', 'examples')):
        return 'Bloc'
    return 'Composant'

def sitemap_links(base):
    """Small, same-origin sitemap fallback for client-rendered sites."""
    origin = urllib.parse.urlsplit(base)
    root = f'{origin.scheme}://{origin.netloc}'
    links = []
    queue = [root + '/sitemap.xml']
    for _ in range(3):
        if not queue:
            break
        url = queue.pop(0)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'ComponentAtlas/1.0'})
            with urllib.request.urlopen(req, timeout=12) as r:
                xml = ET.fromstring(r.read(3_000_000))
            locations = [n.text for n in xml.iter() if n.tag.split('}')[-1] == 'loc' and n.text]
            if xml.tag.split('}')[-1] == 'sitemapindex':
                queue.extend(u for u in locations if urllib.parse.urlsplit(u).hostname == origin.hostname)
            else:
                links.extend((u, '') for u in locations)
        except Exception:
            continue
    return links

def index(library):
    library = dict(library, checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
    try:
        base, html = fetch(library['url'])
        library.update(status='accessible', resolved_url=base)
        page = Page(html)
        # Follow at most two documentation entry points on the same host.
        entries = []
        for href, label in page.links:
            url = urllib.parse.urljoin(base, href)
            p = urllib.parse.urlsplit(url)
            if p.hostname == urllib.parse.urlsplit(base).hostname and re.fullmatch(r'/(?:docs|components|docs/components|react/components|react/overview|primitives/docs|primitives|material-ui|html|react)(?:/[^/]+){0,3}/?', p.path):
                if url not in entries:
                    entries.append(url)
        links = list(page.links)
        if library['id'] == 'radix-ui':
            entries.insert(0, urllib.parse.urljoin(base, '/primitives/docs/overview/introduction'))
        for entry in entries[:2]:
            try:
                actual, content = fetch(entry)
                links += [(urllib.parse.urljoin(actual, h), t) for h, t in Page(content).links]
            except Exception:
                pass
        if not library['category'].startswith('Inspiration'):
            links += sitemap_links(base)
        seen, candidates = set(), []
        for href, label in links:
            url = urllib.parse.urljoin(base, href)
            p = urllib.parse.urlsplit(url)
            url = urllib.parse.urlunsplit((p.scheme, p.netloc, p.path.rstrip('/'), '', ''))
            if p.scheme != 'https' or p.hostname != urllib.parse.urlsplit(base).hostname or url in seen:
                continue
            direct_docs = library['id'] in ('motion-primitives', 'kokonut-ui') and re.fullmatch(r'/docs/[^/]+/?', p.path)
            material = library['id'] == 'material-ui' and re.fullmatch(r'/material-ui/react-[^/]+/?', p.path)
            if not (direct_docs or material or re.search(r'/(?:components?|ui|blocks|templates|examples|text-animations|animations|backgrounds|effects|core)/[^/]+', p.path) or re.fullmatch(r'/react/[^/]+/?', p.path)):
                continue
            if library['category'].startswith('Inspiration') or re.search(r'/(?:concepts|overview|getting-started)(?:/|$)', p.path) or re.search(r'/(?:docs|components|templates|particles|neobrutalism|installation|changelog|introduction|application|marketing|application-ui|s|apps-and-games|landing-pages)/?$', p.path):
                continue
            if re.search(r'\.(?:png|svg|jpg|zip|json)$', p.path):
                continue
            seen.add(url)
            slug = re.sub(r'\.html$', '', p.path.rstrip('/').split('/')[-1])
            name = re.sub(r'\s+', ' ', label).strip()
            if not name or len(name) > 42 or re.search(r'components|new|pro|view |docs|introducing|[0-9]', name, re.I):
                name = re.sub(r'[-_]+', ' ', slug).title()
            candidates.append(dict(id=hashlib.sha256((library['id'] + ':' + url).encode()).hexdigest()[:16], name=name, url=url, kind=classify(p.path), verified=False, documented=False, accessibility=False))
        library['components'] = candidates[:160]
        # Bounded sampling per library; unvisited pages stay explicitly unverified.
        for item in library['components'][:4]:
            try:
                _, content = fetch(item['url'])
                item.update(verified=True, documented=bool(re.search(r'<(?:pre|code)[\s>]', content)), accessibility=bool(re.search(r'accessibility|keyboard navigation|WAI-ARIA', content, re.I)))
            except Exception:
                pass
        library['note'] = 'Liens publics repérés ; vérification limitée aux quatre premières fiches.' if candidates else 'Aucune fiche détectée dans le HTML public. Exploration manuelle nécessaire.'
    except Exception as error:
        library.update(status='unavailable', note=str(error)[:220])
    print(library['name'] + ': ' + library['status'] + ' / ' + str(len(library['components'])), flush=True)
    return library

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', action='append', help='Identifiant de source à actualiser (répétable)')
    args = parser.parse_args()
    selected = [s for s in source_list() if not args.source or s['id'] in args.source]
    if args.source and set(args.source) - {s['id'] for s in selected}:
        parser.error('Identifiant de source inconnu')
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        sources = list(pool.map(index, selected))
    if args.source:
        updated = {s['id']: s for s in sources}
        sources = [updated.get(s['id'], s) for s in load()['sources']]
    DATA.parent.mkdir(exist_ok=True)
    temporary = DATA.with_suffix('.tmp')
    temporary.write_text(json.dumps(dict(updated=datetime.datetime.now(datetime.timezone.utc).isoformat(), sources=sources), ensure_ascii=False, indent=2))
    temporary.replace(DATA)
