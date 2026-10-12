import unittest
from catalog import load, ROOT
from curation import load_curation, enrich
from mcp_server import handle

class CurationTests(unittest.TestCase):
    def test_every_live_demo_has_original_source_and_license(self):
        records=load_curation()
        ids={c['id']:c for s in load()['sources'] for c in s['components']}
        self.assertEqual(len(records),18)
        self.assertEqual(len({c['id'] for c in records}),18)
        for c in records:
            self.assertIn(c['id'],ids)
            self.assertEqual(c['source_url'],ids[c['id']]['url'])
            self.assertTrue((ROOT/'demos/src/vendor'/(c['demo']+'.tsx')).is_file())
            self.assertTrue(c['reason'] and c['category'] and c['interaction'] and c['usage'])
            self.assertEqual(c['license'],'MIT')
        for name in ['magic-ui','motion-primitives']:
            self.assertIn('Permission is hereby granted',(ROOT/'demos/licenses'/(name+'.txt')).read_text())

    def test_mcp_recommendations_preserve_explicit_filters(self):
        request=dict(jsonrpc='2.0',id=1,method='tools/call',params={'name':'recommend_components','arguments':{'source':'motion-primitives','limit':4}})
        import json
        result=json.loads(handle(request)['result']['content'][0]['text'])
        self.assertEqual(len(result),4)
        self.assertTrue(all(c['source_id']=='motion-primitives' and c['curation'] for c in result))
        request['params']['arguments']['verified_only']=True
        verified=json.loads(handle(request)['result']['content'][0]['text'])
        self.assertTrue(all(c['verified'] for c in verified))

    def test_unselected_catalog_items_not_misrepresented_as_live(self):
        self.assertIsNone(enrich([{'id':'unknown'}])[0]['curation'])

if __name__=='__main__':
    unittest.main()
