"""Editorial selection with concrete use cases; no invented global quality score."""
import json
from catalog import ROOT

def load_curation():
    path = ROOT / 'data' / 'curation.json'
    return json.loads(path.read_text()) if path.exists() else []

def enrich(components):
    choices={c['id']:dict(c,order=i) for i,c in enumerate(load_curation())}
    return [dict(c,curation=choices.get(c['id'])) for c in components]
