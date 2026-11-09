"""Bounded queue and on-disk cache for screenshots of catalog URLs only."""
import datetime
import json
import queue
import re
import threading
from catalog import ROOT, load

CACHE = ROOT / 'data' / 'previews'
ID = re.compile(r'^[a-f0-9]{16}$')
# Une page refusée aujourd'hui (anti-bot, page vide…) peut fonctionner plus tard : nouvel essai après ce délai.
RETRY_AFTER = datetime.timedelta(days=7)


def _stale_error(item):
    if item.get('status') != 'error':
        return False
    try:
        captured = datetime.datetime.fromisoformat(item.get('captured_at', ''))
    except ValueError:
        return True
    return datetime.datetime.now(datetime.timezone.utc) - captured > RETRY_AFTER


def cached_previews():
    result = {}
    for path in CACHE.glob('*.json'):
        if not ID.fullmatch(path.stem):
            continue
        try:
            item = json.loads(path.read_text(encoding='utf-8'))
            if item.get('status') == 'ready' and not (CACHE / (path.stem + '.jpg')).exists():
                continue
            if _stale_error(item):
                continue
            result[path.stem] = item
        except (OSError, ValueError):
            continue
    return result


def capture_component(component, browser=None):
    """Capture une fiche. Un problème d'environnement (CaptureUnavailable) remonte sans rien écrire dans le cache."""
    from preview_capture import Browser, CaptureUnavailable
    CACHE.mkdir(parents=True, exist_ok=True)
    id_ = component['id']
    if not ID.fullmatch(id_) or not component['url'].startswith('https://'):
        raise ValueError('Invalid catalog component')
    result = dict(source_url=component['url'], captured_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
    temporary = CACHE / (id_ + '.tmp.jpg')
    try:
        if browser is None:
            with Browser() as own:
                details = own.capture(component['url'], temporary)
        else:
            details = browser.capture(component['url'], temporary)
        temporary.replace(CACHE / (id_ + '.jpg'))
        result.update(details, status='ready', image='/previews/'+id_+'.jpg')
    except CaptureUnavailable:
        raise
    except Exception as exc:
        result.update(status='error', message='Capture indisponible. Ouvrez la démonstration officielle.')
        print('Preview '+id_+': '+str(exc), flush=True)
    finally:
        temporary.unlink(missing_ok=True)
    meta = CACHE / (id_ + '.tmp')
    meta.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    meta.replace(CACHE / (id_ + '.json'))
    return result


class PreviewQueue:
    def __init__(self, workers=2):
        self.jobs = queue.Queue(maxsize=96)
        self.pending = set()
        self.lock = threading.Lock()
        self.workers = workers
        self.started = False

    def request(self, ids):
        from preview_capture import capture_environment
        components = {c['id']:c for s in load()['sources'] for c in s['components']}
        if any(id_ not in components for id_ in ids):
            raise ValueError('Composant inconnu')
        cache = cached_previews()
        problem = capture_environment()
        with self.lock:
            if not self.started and not problem:
                for _ in range(self.workers):
                    threading.Thread(target=self.work, daemon=True).start()
                self.started = True
            result = {}
            for id_ in ids:
                if id_ in cache:
                    result[id_] = cache[id_]
                elif problem:
                    result[id_] = dict(status='unavailable', message='Captures désactivées : ' + problem)
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
        """Un navigateur par worker, réutilisé entre les captures et relancé après une erreur."""
        from preview_capture import Browser
        browser = None
        while True:
            component = self.jobs.get()
            try:
                if browser is None:
                    browser = Browser()
                result = capture_component(component, browser)
                if result['status'] == 'error':
                    browser.close()
                    browser = None
            except Exception as exc:
                print('Preview worker: '+str(exc), flush=True)
                if browser is not None:
                    browser.close()
                browser = None
            finally:
                with self.lock:
                    self.pending.discard(component['id'])
                self.jobs.task_done()

PREVIEWS = PreviewQueue()
