import datetime
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
        with patch('previews.load',return_value={'sources':[{'components':[component]}]}),patch('previews.cached_previews',return_value={}),patch('preview_capture.capture_environment',return_value=None):
            with self.assertRaises(ValueError):
                queue.request(['https://example.com'])
            with self.assertRaises(ValueError):
                queue.request(['d'*16])
            self.assertEqual(queue.request([component['id']])[component['id']]['status'],'pending')
            queue.request([component['id']])
            self.assertEqual(queue.jobs.qsize(),1)

    def test_old_errors_are_retried(self):
        with tempfile.TemporaryDirectory() as directory, patch('previews.CACHE', Path(directory)):
            now=datetime.datetime.now(datetime.timezone.utc)
            for id_,age in (('e'*16,1),('f'*16,30)):
                (Path(directory)/(id_+'.json')).write_text(json.dumps({'status':'error','captured_at':(now-datetime.timedelta(days=age)).isoformat()}))
            self.assertEqual(set(cached_previews()),{'e'*16})

    def test_missing_browser_is_never_cached_as_a_failure(self):
        from preview_capture import CaptureUnavailable
        component={'id':'a1'*8,'url':'https://example.com/component'}
        with tempfile.TemporaryDirectory() as directory, patch('previews.CACHE', Path(directory)), patch('preview_capture.Browser', side_effect=CaptureUnavailable('Chrome introuvable')):
            with self.assertRaises(CaptureUnavailable):
                capture_component(component)
            self.assertEqual(list(Path(directory).iterdir()),[])
        queue=PreviewQueue()
        with patch('previews.load',return_value={'sources':[{'components':[component]}]}),patch('previews.cached_previews',return_value={}),patch('preview_capture.capture_environment',return_value='Chrome introuvable'):
            state=queue.request([component['id']])[component['id']]
            self.assertEqual(state['status'],'unavailable')
            self.assertIn('Chrome introuvable',state['message'])
            self.assertEqual(queue.jobs.qsize(),0)
            self.assertFalse(queue.started)

if __name__=='__main__':
    unittest.main()
