import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from previews import cached_previews, capture_component, PreviewQueue

class PreviewTests(unittest.TestCase):
    def test_cache_requires_real_image(self):
        with tempfile.TemporaryDirectory() as directory, patch('previews.CACHE', Path(directory)):
            id_='a'*16
            (Path(directory)/(id_+'.json')).write_text(json.dumps({'status':'ready'}))
            self.assertEqual(cached_previews(), {})
            (Path(directory)/(id_+'.jpg')).write_bytes(b'jpeg')
            self.assertEqual(cached_previews()[id_]['status'], 'ready')

    def test_capture_metadata_and_failures(self):
        with tempfile.TemporaryDirectory() as directory, patch('previews.CACHE', Path(directory)), patch('preview_capture.Browser') as browser:
            component={'id':'b'*16,'url':'https://example.com/component'}
            def capture(url,path):
                path.write_bytes(b'jpeg')
                return {'kind':'component','width':600,'height':400,'title':'Button'}
            browser.return_value.__enter__.return_value.capture.side_effect=capture
            result=capture_component(component)
            self.assertEqual(result['status'],'ready')
            self.assertEqual(result['source_url'],component['url'])
            self.assertTrue((Path(directory)/(component['id']+'.jpg')).exists())
            browser.return_value.__enter__.return_value.capture.side_effect=RuntimeError('blocked')
            self.assertEqual(capture_component(component)['status'],'error')

    def test_queue_accepts_catalog_ids_only_and_deduplicates(self):
        component={'id':'c'*16,'url':'https://example.com/component'}
        queue=PreviewQueue()
        queue.started=True  # Keep this test offline; inspect scheduled jobs.
        with patch('previews.load',return_value={'sources':[{'components':[component]}]}),patch('previews.cached_previews',return_value={}):
            with self.assertRaises(ValueError):
                queue.request(['https://example.com'])
            with self.assertRaises(ValueError):
                queue.request(['d'*16])
            self.assertEqual(queue.request([component['id']])[component['id']]['status'],'pending')
            queue.request([component['id']])
            self.assertEqual(queue.jobs.qsize(),1)

if __name__=='__main__':
    unittest.main()
