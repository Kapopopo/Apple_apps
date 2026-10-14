"""End-to-end validation of local demos, selection, filters, and prompt exports."""
import base64
import json
import tempfile
import time
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from preview_capture import Browser
from curation import load_curation

def wait(b,js,timeout=15):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        if b.js('Boolean('+js+')'):return
        time.sleep(.15)
    raise AssertionError(js)

with Browser() as b:
    b.call('Emulation.setDeviceMetricsOverride',dict(width=1440,height=1050,deviceScaleFactor=1,mobile=False))
    b.navigate('http://127.0.0.1:8000')
    wait(b,"document.querySelectorAll('.card').length===44")
    wait(b,"document.querySelector('iframe')?.dataset.ready==='true'")
    assert b.js("document.querySelectorAll('#results a').length")==0
    assert b.js("document.querySelectorAll('iframe').length")==44
    assert b.js("[...document.querySelectorAll('iframe')].every(f=>(f.getAttribute('src')||f.dataset.src).startsWith('/demos/'))")
    marquee="document.querySelector('iframe').contentDocument.querySelector('.animate-marquee')"
    wait(b,marquee)
    first=b.js(f"getComputedStyle({marquee}).transform")
    time.sleep(.45)
    second=b.js(f"getComputedStyle({marquee}).transform")
    assert first!=second,(first,second)
    print('PASS: real marquee animation changes over time inside the gallery',flush=True)

    b.js("[...document.querySelectorAll('.select-mini')].slice(0,5).forEach(b=>b.click())")
    assert b.js('selectedItems().length')==5
    b.js("document.querySelector('#demo-filter').value='live';document.querySelector('#category-filter').value='Indicateurs';document.querySelector('#category-filter').dispatchEvent(new Event('input'))")
    assert b.js("document.querySelectorAll('.card').length")==3
    assert b.js('selectedItems().length')==5
    b.js("document.querySelector('#effect-filter').value='Interaction';document.querySelector('#effect-filter').dispatchEvent(new Event('input'))")
    assert b.js("document.querySelectorAll('.card').length")==1
    b.js("document.querySelector('.select-mini').click()")
    assert b.js('selectedItems().length')==6
    b.js("document.querySelector('[data-detail]').click()")
    wait(b,"document.querySelector('#detail-preview iframe')?.dataset.ready==='true'")
    f="document.querySelector('#detail-preview iframe').contentDocument"
    before=b.js(f"{f}.querySelector('.counter-number').textContent")
    b.js(f"{f}.querySelector('[aria-label=\"Augmenter de 100\"]').click()")
    time.sleep(1.5)
    after=b.js(f"{f}.querySelector('.counter-number').textContent")
    assert before!=after,(before,after)
    assert b.js('location.pathname')=='/'
    b.js("document.querySelector('.close').click();resetFilters();render();document.querySelector('#open-prompt').click()")
    assert b.js("document.querySelector('#prompt-output').value.includes('COMPOSANTS À INTÉGRER (6)')")
    assert b.js("selectedItems().every(c=>document.querySelector('#prompt-output').value.includes(c.url))")
    b.js("document.querySelector('#project-brief').value='Un portfolio pour Camille';document.querySelector('#project-brief').dispatchEvent(new Event('input'));document.querySelector('[data-note]').value='Dans le hero';document.querySelector('[data-note]').dispatchEvent(new Event('input'))")
    assert b.js("document.querySelector('#prompt-output').value.includes('Dans le hero')")
    with tempfile.TemporaryDirectory(prefix='atlas-prompt-test-') as directory:
        b.call('Browser.setDownloadBehavior',{'behavior':'allow','downloadPath':directory})
        b.js("document.querySelector('#download-prompt').click()")
        output=Path(directory)/'atlas-prompt.txt'
        for _ in range(30):
            if output.exists():break
            time.sleep(.15)
        assert 'Un portfolio pour Camille' in output.read_text()
        assert 'COMPOSANTS À INTÉGRER (6)' in output.read_text()
    # The button's actual clipboard operation must preserve the edited prompt.
    b.call('Browser.grantPermissions',{'origin':'http://127.0.0.1:8000','permissions':['clipboardReadWrite','clipboardSanitizedWrite']})
    b.call('Page.bringToFront')
    b.call('Runtime.evaluate',{'expression':"document.querySelector('#copy-prompt').click()",'userGesture':True})
    time.sleep(.3)
    read=b.call('Runtime.evaluate',{'expression':'navigator.clipboard.readText()','awaitPromise':True,'returnByValue':True})
    assert 'COMPOSANTS À INTÉGRER (6)' in read['result']['value'],(read,b.js("document.querySelector('#toast').textContent"),b.js('document.hasFocus()'))
    Path('/tmp/atlas-project-prompt.png').write_bytes(base64.b64decode(b.call('Page.captureScreenshot',{'format':'png'})['data']))
    b.js("document.querySelector('[data-remove]').click()")
    assert b.js("document.querySelector('#prompt-output').value.includes('COMPOSANTS À INTÉGRER (5)')")
    b.js("document.querySelector('.close').click()")
    b.call('Page.reload')
    wait(b,"typeof data !== 'undefined' && data && document.querySelectorAll('.card').length===44")
    assert b.js('selectedItems().length')==5
    assert b.js("draft.project==='Un portfolio pour Camille'")
    print('PASS: six selections across filters, native counter interaction, full prompt, note, clipboard, download, removal, reload persistence',flush=True)

    # All curated demos render without navigation or third-party runtime resources.
    for c in load_curation():
        b.js(f"showDetail(byId({json.dumps(c['id'])}))")
        wait(b,"document.querySelector('#detail-preview iframe')?.dataset.ready==='true'")
        frame="document.querySelector('#detail-preview iframe')"
        wait(b,f"{frame}.contentDocument.querySelector('.demo-stage')?.innerText.length > 0 || {frame}.contentDocument.querySelector('svg')")
        assert b.js(f"{frame}.contentDocument.querySelector('#root').children.length")>0,c['demo']
        assert b.js(f"{frame}.contentWindow.performance.getEntriesByType('resource').every(e=>e.name.startsWith(location.origin))"),c['demo']
        css_animations={'marquee':'.animate-marquee','shimmer-button':'.animate-spin-around','orbiting-circles':'.animate-orbit','ripple':'.animate-ripple','animated-gradient-text':'.animate-gradient'}
        if c['demo'] in css_animations:
            selector=json.dumps(css_animations[c['demo']])
            name=b.js(f"(()=>{{const f={frame},el=f.contentDocument.querySelector({selector});return el?f.contentWindow.getComputedStyle(el).animationName:'none'}})()")
            assert name!='none',(c['demo'],name)
        if c['demo'] in ['rainbow-button','ripple-button','shiny-button','pulsating-button','interactive-hover-button']:
            b.js(f"{frame}.contentDocument.querySelector('button').click()")
            wait(b,f"{frame}.contentDocument.body.innerText.includes('Votre projet est prêt')")
        if c['demo'] in ['aurora-text','shine-border','neon-gradient-card','morphing-text','typing-animation']:
            snapshot=f"JSON.stringify([...{frame}.contentDocument.querySelectorAll('.demo-stage *')].map(e=>{{const w={frame}.contentWindow;return [e.textContent,...['','::before','::after'].map(p=>{{const s=w.getComputedStyle(e,p);return [s.transform,s.opacity,s.filter,s.backgroundPosition]}})]}}))"
            first=b.js(snapshot)
            time.sleep(.8)
            assert first!=b.js(snapshot),c['demo']
        if c['demo']=='accordion':
            b.js(f"{frame}.contentDocument.querySelector('.faq-trigger').click()")
            wait(b,f"{frame}.contentDocument.querySelector('.faq-trigger').getAttribute('aria-expanded')==='true'")
        if c['demo']=='animated-background':
            b.js(f"{frame}.contentDocument.querySelector('[data-id=Activité]').click()")
            wait(b,f"{frame}.contentDocument.querySelector('.tab-content').textContent.includes('à jour')")
        if c['demo']=='shimmer-button':
            b.js(f"{frame}.contentDocument.querySelector('button').click()")
            wait(b,f"{frame}.contentDocument.body.innerText.includes('C’est parti')")
        if c['demo']=='tilt':
            coords=b.js(f"(()=>{{const f={frame},r=f.getBoundingClientRect(),c=f.contentDocument.querySelector('.tilt-card').getBoundingClientRect();return {{x:r.x+c.x+c.width*.8,y:r.y+c.y+c.height*.3}}}})()")
            before=b.js(f"{frame}.contentDocument.querySelector('.tilt-card').style.transform")
            b.call('Input.dispatchMouseEvent',{'type':'mouseMoved',**coords})
            time.sleep(.3)
            after=b.js(f"{frame}.contentDocument.querySelector('.tilt-card').style.transform")
            assert before!=after,(before,after)
        b.js("document.querySelector('.close').click()")
        print('Demo OK:',c['demo'],flush=True)
    b.call('Emulation.setDeviceMetricsOverride',dict(width=390,height=844,deviceScaleFactor=1,mobile=True))
    b.js('window.scrollTo(0,0)')
    assert b.js('innerWidth')==390
    assert b.js('document.documentElement.scrollWidth<=innerWidth')
    assert b.js("getComputedStyle(document.querySelector('.hover-actions')).opacity==='1'")
    Path('/tmp/atlas-live-mobile.png').write_bytes(base64.b64decode(b.call('Page.captureScreenshot',{'format':'png'})['data']))
    b.js("document.querySelector('#open-prompt').click()")
    assert b.js("document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth")
    print('PASS: all 44 demos run locally, hover tilt, accordion, tabs, button, mobile actions and prompt layout',flush=True)
