"""Shared, dependency-free catalog and explainable recommendations."""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data' / 'catalog.json'

def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value.lower()) if unicodedata.category(c) != 'Mn')

ALIASES = {'bouton': 'button', 'boutons': 'button', 'carte': 'card', 'cartes': 'card', 'tableau': 'table', 'tableaux': 'table', 'formulaire': 'form', 'formulaires': 'form', 'fenetre': 'dialog', 'onglet': 'tab', 'onglets': 'tab', 'calendrier': 'calendar'}

def matches(query, text):
    text = normalize(text)
    return all(word in text or ALIASES.get(word, word) in text for word in normalize(query).split())

def source_list():
    result, category, previous = {}, 'Principaux', ''
    for raw in (ROOT / 'data' / 'sources.txt').read_text().splitlines():
        line = raw.strip()
        if not line or '━' in line:
            continue
        if line.startswith('https://'):
            if line not in result:
                name = re.sub(r'^\d+\.\s*', '', previous)
                result[line] = dict(id=re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'), name=name, url=line, category=category, status='pending', components=[])
        elif any(line.startswith(x) for x in ['🔥', '🎨', '🧩', '🏗', '✨', '🌐', '🤖', '⭐']):
            category = line.split(' ', 1)[1].capitalize()
        previous = line
    return list(result.values())

def load():
    if DATA.exists():
        return json.loads(DATA.read_text())
    return dict(updated=None, sources=source_list())

def rank(component, query=''):
    """Ranking measures discovery relevance, never untested quality."""
    score, reasons = 0, []
    if component.get('verified'):
        score += 40
        reasons.append('Page de documentation accessible (+40)')
    if component.get('documented'):
        score += 20
        reasons.append('Exemple de code détecté (+20)')
    if component.get('accessibility'):
        score += 10
        reasons.append('Accessibilité mentionnée dans la documentation (+10)')
    words = normalize(query).split()
    haystack = normalize(' '.join([component['name'], component.get('kind', ''), component.get('source', '')]))
    if words and matches(query, haystack):
        score += 30
        reasons.append('Correspond à tous les termes recherchés (+30)')
    return dict(component, score=score, reasons=reasons)

def search(query='', source='', kind='', verified_only=False, limit=2000):
    result = []
    for library in load()['sources']:
        if source and library['id'] != source:
            continue
        for item in library['components']:
            item = rank(dict(item, source=library['name'], source_id=library['id']), query)
            if kind and item['kind'] != kind:
                continue
            if verified_only and not item.get('verified'):
                continue
            if query and not matches(query, item['name']+' '+item['kind']+' '+item['source']):
                continue
            result.append(item)
    return sorted(result, key=lambda c: (-c['score'], c['source'].lower(), c['name'].lower()))[:limit]
