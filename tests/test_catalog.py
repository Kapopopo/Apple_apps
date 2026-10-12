import json
import subprocess
import sys
import unittest
from unittest.mock import patch
from catalog import ROOT, load, rank, search, source_list, matches
from mcp_server import handle

class CatalogTests(unittest.TestCase):
    def test_every_input_url_preserved_once(self):
        original = {line.strip() for line in (ROOT/'data/sources.txt').read_text().splitlines() if line.strip().startswith('https://')}
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

    def test_mcp_validation(self):
        for arguments in [{'limit': True}, {'limit': -1}, {'query': []}, {'verified_only':'yes'}, {'unknown':1}, {'kind':'script'}]:
            response=handle(dict(jsonrpc='2.0', id=1, method='tools/call', params={'name':'search_components','arguments':arguments}))
            self.assertEqual(response['error']['code'], -32602)
        self.assertIsNone(handle(dict(jsonrpc='2.0', method='notifications/initialized')))
        self.assertEqual(handle([])['error']['code'], -32600)

    def test_real_stdio_lifecycle_and_tools(self):
        messages=[dict(jsonrpc='2.0',id=1,method='initialize',params={'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'test','version':'1'}}),dict(jsonrpc='2.0',method='notifications/initialized'),dict(jsonrpc='2.0',id=2,method='tools/list'),dict(jsonrpc='2.0',id=3,method='tools/call',params={'name':'recommend_components','arguments':{'limit':3}})]
        p=subprocess.run([sys.executable,str(ROOT/'mcp_server.py')],input='\n'.join(json.dumps(m) for m in messages)+'\n',capture_output=True,text=True,check=True)
        responses=[json.loads(line) for line in p.stdout.splitlines()]
        self.assertEqual(len(responses),3)
        self.assertEqual(responses[0]['result']['protocolVersion'],'2025-06-18')
        self.assertEqual(len(responses[1]['result']['tools']),3)
        recommendations=json.loads(responses[2]['result']['content'][0]['text'])
        self.assertTrue(all(c['curation'] and c['curation']['reason'] for c in recommendations))
        self.assertLessEqual(len(recommendations),3)

if __name__ == '__main__':
    unittest.main()
