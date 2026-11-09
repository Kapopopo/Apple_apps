import json
import unittest
from unittest.mock import patch
from catalog import ROOT, load, rank, search, source_list, matches

class CatalogTests(unittest.TestCase):
    def test_every_input_url_preserved_once(self):
        original = {line.strip() for line in (ROOT/'data/sources.txt').read_text(encoding='utf-8').splitlines() if line.strip().startswith('https://')}
        self.assertEqual(original, {s['url'] for s in source_list()})
        self.assertEqual(len(original), len(source_list()))
        self.assertEqual(original, {s['url'] for s in load()['sources']})
        ids = [c['id'] for s in load()['sources'] for c in s['components']]
        self.assertEqual(len(ids), len(set(ids)))

    def test_ranking(self):
        c = dict(name='Button', kind='Composant', source='Example')
        self.assertEqual(rank(c)['score'], 0)
        self.assertEqual(rank(dict(c, verified=True, documented=True, accessibility=True), 'button')['score'], 100)

    def test_french_search(self):
        self.assertTrue(matches('bouton', 'Button'))
        self.assertTrue(matches('carte', 'Card'))
        self.assertFalse(matches('bouton', 'Calendar'))

    def test_search_filters_and_order(self):
        data = {'sources': [{'name': 'Exemple', 'id': 'ex', 'components': [dict(id='a', name='Bouton', kind='Composant', verified=False), dict(id='b', name='Bouton animé', kind='Composant', verified=True)]}]}
        with patch('catalog.load', return_value=data):
            self.assertEqual([c['id'] for c in search(query='bouton')], ['b', 'a'])
            self.assertEqual([c['id'] for c in search(query='anime', verified_only=True)], ['b'])
            self.assertEqual(search(source='missing'), [])
            self.assertEqual(search(kind='Bloc'), [])
            self.assertEqual(len(search(limit=1)), 1)

if __name__ == '__main__':
    unittest.main()
