import unittest
from catalog import load, ROOT
from curation import load_curation, enrich

class CurationTests(unittest.TestCase):
    def test_every_live_demo_has_original_source_and_license(self):
        records=load_curation()
        ids={c['id']:c for s in load()['sources'] for c in s['components']}
        self.assertGreaterEqual(len(records),44)
        self.assertEqual(len({c['id'] for c in records}),len(records))
        for c in records:
            self.assertIn(c['id'],ids)
            self.assertEqual(c['source_url'],ids[c['id']]['url'])
            self.assertTrue((ROOT/'demos/src/vendor'/(c['demo']+'.tsx')).is_file())
            self.assertTrue(c['reason'] and c['category'] and c['interaction'] and c['usage'])
            self.assertEqual(c['license'],'MIT')
        for name in ['magic-ui','motion-primitives']:
            self.assertIn('Permission is hereby granted',(ROOT/'demos/licenses'/(name+'.txt')).read_text(encoding='utf-8'))

    def test_unselected_catalog_items_not_misrepresented_as_live(self):
        self.assertIsNone(enrich([{'id':'unknown'}])[0]['curation'])

if __name__=='__main__':
    unittest.main()
