"""Bounded queue and on-disk cache for screenshots of catalog URLs only."""
import datetime
import json
import queue
import re
import threading
from catalog import ROOT, load

CACHE = ROOT / 'data' / 'previews'
ID = re.compile(r'^[a-f0-9]{16}$')

def cached_previews():
    result = {}
    for path in CACHE.glob('*.json'):
        if not ID.fullmatch(path.stem):
            continue
        try:
            item = json.loads(path.read_text())
            if item.get('status') == 'ready' and not (CACHE / (path.stem + '.jpg')).exists():
                continue
            result[path.stem] = item
        except (OSError, ValueError):
            continue
    return result

def capture_component(component):
    from preview_capture import Browser
    CACHE.mkdir(parents=True, exist_ok=True)
    id_ = component['id']
    if not ID.fullmatch(id_) or not component['url'].startswith('https://'):
        raise ValueError('Invalid catalog component')
    result = dict(source_url=component['url'], captured_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
    try:
        with Browser() as browser:
            temporary = CACHE / (id_ + '.tmp.jpg')
            details = browser.capture(component['url'], temporary)
            temporary.replace(CACHE / (id_ + '.jpg'))
        result.update(details, status='ready', image='/previews/'+id_+'.jpg')
    except Exception as exc:
        result.update(status='error', message='Capture indisponible. Ouvrez la démonstration officielle.')
        print('Preview '+id_+': '+str(exc), flush=True)
    temporary = CACHE / (id_ + '.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False))
    temporary.replace(CACHE / (id_ + '.json'))
    return result

class PreviewQueue:
    def __init__(self):
        self.jobs = queue.Queue(maxsize=96)
        self.pending = set()
        self.lock = threading.Lock()
        self.started = False

    def request(self, ids):
        components = {c['id']:c for s in load()['sources'] for c in s['components']}
        if any(id_ not in components for id_ in ids):
            raise ValueError('Composant inconnu')
        cache = cached_previews()
        with self.lock:
            if not self.started:
                for _ in range(2):
                    threading.Thread(target=self.work, daemon=True).start()
                self.started = True
            result = {}
            for id_ in ids:
                if id_ in cache:
                    result[id_] = cache[id_]
                elif id_ in self.pending:
                    result[id_] = dict(status='pending')
                elif self.jobs.full():
                    result[id_] = dict(status='busy')
                else:
                    self.pending.add(id_)
                    self.jobs.put_nowait(components[id_])
                    result[id_] = dict(status='pending')
        return result

    def work(self):
        while True:
            component = self.jobs.get()
            try:
                capture_component(component)
            except Exception as exc:
                print('Preview worker: '+str(exc), flush=True)
            finally:
                with self.lock:
                    self.pending.discard(component['id'])
                self.jobs.task_done()

PREVIEWS = PreviewQueue()
