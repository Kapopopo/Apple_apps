"""Render official component demos in an isolated Chrome profile via CDP."""
import base64
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

class Browser:
    def __init__(self):
        import websocket
        executable = os.environ.get('ATLAS_CHROME') or shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
        if not executable:
            raise RuntimeError('Chrome ou Chromium est nécessaire pour créer les captures.')
        self.profile = tempfile.TemporaryDirectory(prefix='atlas-preview-', ignore_cleanup_errors=True)
        flags = ['--no-sandbox'] if os.environ.get('ATLAS_CHROME_NO_SANDBOX') == '1' else []
        self.process = subprocess.Popen([executable, '--headless', *flags, '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir='+self.profile.name, 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            port_file = Path(self.profile.name)/'DevToolsActivePort'
            for _ in range(100):
                if port_file.exists():
                    break
                if self.process.poll() is not None:
                    raise RuntimeError('Chrome ne démarre pas.')
                time.sleep(.1)
            port = port_file.read_text().splitlines()[0]
            with urllib.request.urlopen('http://127.0.0.1:'+port+'/json', timeout=5) as response:
                tabs = json.load(response)
            page = next(tab for tab in tabs if tab.get('type') == 'page')
            self.ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=25)
            self.sequence = 0
            self.call('Page.enable')
            self.call('Emulation.setDeviceMetricsOverride', dict(width=1200, height=900, deviceScaleFactor=1, mobile=False))
            self.call('Emulation.setEmulatedMedia', {'features':[{'name':'prefers-color-scheme','value':'light'}]})
        except Exception:
            self.close()
            raise

    def call(self, method, params=None):
        self.sequence += 1
        self.ws.send(json.dumps(dict(id=self.sequence, method=method, params=params or {})))
        while True:
            result = json.loads(self.ws.recv())
            if result.get('id') == self.sequence:
                if 'error' in result:
                    raise RuntimeError(result['error']['message'])
                return result.get('result', {})

    def js(self, expression):
        response = self.call('Runtime.evaluate', {'expression':expression, 'returnByValue':True})
        if response.get('exceptionDetails'):
            raise RuntimeError('Erreur JavaScript pendant la capture')
        return response.get('result', {}).get('value')

    def navigate(self, url):
        result = self.call('Page.navigate', {'url':url})
        if result.get('errorText'):
            raise RuntimeError(result['errorText'])
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            time.sleep(.25)
            if self.js("document.readyState === 'complete' && location.href !== 'about:blank'"):
                break
        time.sleep(2)

    def capture(self, url, path):
        self.navigate(url)
        text = self.js("document.body?.innerText?.slice(0,2000) || ''")
        if not text.strip() or any(t in text.lower() for t in ('verify you are human', 'checking your browser', 'access denied', 'this site can’t be reached', '404: not found', 'page not found')):
            raise RuntimeError('La page officielle ne permet pas la capture.')
        selection = self.js(r'''(() => {
          const selectors = ['.preview', '[data-slot="preview"]', '[data-preview]', '[class*="demoPreview"]', '[class*="DemoPreview"]', '[class*="demo-preview"]', '[class*="Demo-root"]', '.component-preview', '.demo-container', '.Preview', '[data-slot="component-preview"]', '[role="tabpanel"][data-state="active"]'];
          const visible = e => {const r=e.getBoundingClientRect(), s=getComputedStyle(e);return r.width>180 && r.height>60 && s.visibility!=='hidden' && s.display!=='none';};
          let element, kind='component';
          for (const selector of selectors) {
            element=[...document.querySelectorAll(selector)].find(visible);
            if(element) break;
          }
          if(!element) {element=document.querySelector('main, article, [role="main"]');kind='page';}
          if(!element || !visible(element)) {element=document.body;kind='page';}
          element.setAttribute('data-atlas-capture','');
          // Keep sticky documentation navigation out of the component crop.
          for(const other of document.querySelectorAll('body *')) {
            if(other===element || element.contains(other) || other.contains(element)) continue;
            if(['fixed','sticky'].includes(getComputedStyle(other).position)) other.style.visibility='hidden';
          }
          element.scrollIntoView({block:'center'});
          return {kind, title:document.title};
        })()''')
        time.sleep(1.5)
        rect = self.js("(() => {const r=document.querySelector('[data-atlas-capture]').getBoundingClientRect();return {x:Math.max(0,r.x+scrollX),y:Math.max(0,r.y+scrollY),width:Math.min(r.width,1200),height:Math.min(r.height,900),scale:1};})()")
        if rect['width'] < 100 or rect['height'] < 60:
            raise RuntimeError('Zone de démonstration vide.')
        shot = self.call('Page.captureScreenshot', {'format':'jpeg', 'quality':85, 'clip':rect, 'captureBeyondViewport':True})
        Path(path).write_bytes(base64.b64decode(shot['data']))
        return dict(kind=selection['kind'], title=selection['title'], width=rect['width'], height=rect['height'])

    def close(self):
        if hasattr(self, 'ws'):
            self.ws.close()
        if hasattr(self, 'process'):
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        if hasattr(self, 'profile'):
            self.profile.cleanup()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
