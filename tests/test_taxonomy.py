import json
import unittest
from catalog import ROOT, load, search
from taxonomy import classify
from mcp_server import handle

class TaxonomyTests(unittest.TestCase):
    def test_graphics_synonyms_include_every_chart_and_no_illustrations(self):
        expected={c['id'] for c in search(limit=10000) if c['type_label']=='Graphiques'}
        self.assertGreater(len(expected),20)
        for query in ['graphique','graphiques','chart','charts']:
            self.assertEqual({c['id'] for c in search(query=query,limit=10000)},expected,query)
        self.assertNotEqual(classify({'name':'Typography'})['type_label'],'Graphiques')
        self.assertNotEqual(classify({'name':'Topography'})['type_label'],'Graphiques')

    def test_carousel_aliases_not_range_controls(self):
        expected={c['id'] for c in search(limit=10000) if c['type_label']=='Carrousels'}
        self.assertGreater(len(expected),20)
        for query in ['carrousel','carrousels','caroussel','carousel']:
            self.assertEqual({c['id'] for c in search(query=query,limit=10000)},expected,query)
        self.assertEqual(classify({'name':'Images Slider'})['type_label'],'Carrousels')
        self.assertEqual(classify({'name':'Range Slider'})['type_label'],'Curseurs')
        self.assertEqual(classify({'name':'Chart Card'})['type_label'],'Graphiques')

    def test_oneprompt_visuals_have_real_local_previews_and_distinct_urls(self):
        records=search(source='one-prompt-design')
        self.assertEqual(len(records),12)
        self.assertEqual(len({r['url'] for r in records}),12)
        for r in records:
            self.assertTrue(r['reference_only'])
            self.assertEqual(r['kind'],'Référence visuelle')
            self.assertNotIn('MIT',r['license'])
            self.assertTrue((ROOT/'data/previews'/(r['id']+'.jpg')).is_file())
            self.assertTrue(r['url'].startswith('https://onepromptdesign.com/prompt/'))
        self.assertEqual(len([s for s in load()['sources'] if s['id']=='one-prompt-design']),1)

    def test_mcp_uses_same_types_and_filters(self):
        response=handle(dict(jsonrpc='2.0',id=1,method='tools/call',params=dict(name='search_components',arguments=dict(query='graphique',limit=100))))
        rows=json.loads(response['result']['content'][0]['text'])
        self.assertTrue(rows)
        self.assertTrue(all(r['type_label']=='Graphiques' for r in rows))
        self.assertEqual(search(query='graphique',source='one-prompt-design'),[])
        self.assertEqual(len(search(kind='Référence visuelle')),12)

if __name__=='__main__':unittest.main()
