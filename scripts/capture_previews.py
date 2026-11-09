"""Prewarm real component screenshots. Chrome (ou Edge) et requirements-preview.txt requis.

python scripts/capture_previews.py                      # fiches vedettes (data/gallery.json)
python scripts/capture_previews.py --missing            # toutes les fiches sans capture
python scripts/capture_previews.py --missing --source shadcn-ui --workers 3
"""
import argparse
import concurrent.futures
import json
import sys
import threading
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.stdout.reconfigure(errors='replace')
from catalog import ROOT, load
from curation import load_curation
from previews import capture_component, cached_previews
from preview_capture import Browser, CaptureUnavailable, capture_environment

FEATURED = {
    'shadcn-ui': ['card', 'calendar', 'button', 'accordion', 'tabs', 'input-otp', 'chart', 'table'],
    'magic-ui': ['marquee', 'bento-grid', 'terminal', 'dock', 'shimmer-button', 'orbiting-circles', 'animated-list', 'magic-card'],
    'aceternity-ui': ['3d-card-effect', 'wobble-card', 'bento-grid', 'background-beams', 'floating-dock', 'infinite-moving-cards', 'animated-tooltip', 'card-hover-effect'],
    'motion-primitives': ['text-effect', 'accordion', 'image-comparison', 'animated-background'],
    'react-bits': ['gradient-text', 'rotating-text', 'shiny-text', 'blur-text'],
}

def featured():
    groups = []
    sources = {s['id']:s for s in load()['sources']}
    for source, slugs in FEATURED.items():
        by_slug = {}
        for c in sources[source]['components']:
            by_slug.setdefault(c['url'].rsplit('/', 1)[-1], c)
        groups.append([by_slug[s] for s in slugs if s in by_slug])
    return [group[i] for i in range(max(map(len, groups))) for group in groups if i < len(group)]

def missing(source=''):
    """Fiches sans capture valide, hors démos Atlas (déjà interactives) et références One Prompt Design (captures fournies)."""
    live = {c['id'] for c in load_curation()}
    cache = cached_previews()
    rows = []
    for library in load()['sources']:
        if (source and library['id'] != source) or library['id'] == 'one-prompt-design':
            continue
        for c in library['components']:
            if c['id'] in live or not c['url'].startswith('https://'):
                continue
            if cache.get(c['id'], {}).get('status') in ('ready', 'error'):
                continue
            rows.append(c)
    return rows

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=32, help='nombre de fiches vedettes (mode par défaut)')
    parser.add_argument('--missing', action='store_true', help='capturer toutes les fiches sans capture')
    parser.add_argument('--source', default='', help='limiter --missing à une bibliothèque')
    parser.add_argument('--max', type=int, default=0, help='plafond de fiches pour --missing (0 = toutes)')
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    problem = capture_environment()
    if problem:
        sys.exit('Captures impossibles : ' + problem)
    if args.missing:
        selected = missing(args.source)
        if args.max:
            selected = selected[:args.max]
    else:
        components = featured()[:args.limit]
        (ROOT/'data/gallery.json').write_text(json.dumps([c['id'] for c in components]), encoding='utf-8')
        cache = cached_previews()
        selected = [c for c in components if args.force or cache.get(c['id'], {}).get('status') != 'ready']
    total, done, ok = len(selected), 0, 0
    lock, local, started, browsers = threading.Lock(), threading.local(), time.monotonic(), []
    print(f'{total} fiches à capturer avec {args.workers} navigateurs', flush=True)

    def work(c):
        global done, ok
        if getattr(local, 'browser', None) is None:
            local.browser = Browser()
            with lock:
                browsers.append(local.browser)
        try:
            result = capture_component(c, local.browser)
        except CaptureUnavailable:
            raise
        except Exception as exc:
            result = dict(status='error')
            print('  ' + c['name'] + ' : ' + str(exc), flush=True)
        if result['status'] != 'ready':
            local.browser.close()
            local.browser = None
        with lock:
            done += 1
            ok += result['status'] == 'ready'
            if done % 25 == 0 or done == total:
                rate = done / max(time.monotonic() - started, 1)
                print(f'{done}/{total} · {ok} captures · ~{int((total - done) / rate / 60)} min restantes', flush=True)

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            list(pool.map(work, selected))
    finally:
        for browser in browsers:
            browser.close()
    print(f'Terminé : {ok} captures sur {total}.', flush=True)
