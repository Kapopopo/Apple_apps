"""Prewarm real component screenshots. Chrome and requirements-preview.txt required."""
import argparse
import concurrent.futures
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from catalog import ROOT, load
from previews import capture_component, cached_previews

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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=32)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    components = featured()[:args.limit]
    (ROOT/'data/gallery.json').write_text(json.dumps([c['id'] for c in components]))
    cache = cached_previews()
    selected = [c for c in components if args.force or cache.get(c['id'], {}).get('status') != 'ready']
    def work(c):
        result = capture_component(c)
        print(c['name']+': '+result['status']+' / '+result.get('kind',''), flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(work, selected))
