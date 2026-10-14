"""Search scope, bilingual type labels and visual-reference selection in Chrome."""
import base64
import json
import sys
import time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from catalog import search
from preview_capture import Browser

def wait(b,expression):
    for _ in range(100):
        if b.js('Boolean('+expression+')'):return
        time.sleep(.1)
    raise AssertionError(expression)

with Browser() as b:
    b.call('Emulation.setDeviceMetricsOverride',dict(width=1440,height=1000,deviceScaleFactor=1,mobile=False))
    b.navigate('http://127.0.0.1:8000')
    wait(b,"typeof data!=='undefined'&&data&&document.querySelectorAll('.card').length===44")
    # Do not start remote screenshot work while exercising local search.
    b.js("hydratePreviews=async()=>{};document.querySelector('.select-mini').click()")
    expected=[c['id'] for c in search(query='graphique',limit=10000)]
    for query in ['graphique','graphiques','chart']:
        b.js("document.querySelector('#search').value="+json.dumps(query)+";document.querySelector('#search').dispatchEvent(new Event('input'))")
        assert b.js('view')=='components'
        assert int(b.js("document.querySelector('#result-count').textContent"))==len(expected)
        assert b.js("displayed.every(c=>category(c)==='Graphiques')")
        while not b.js("document.querySelector('#more').hidden"):
            b.js("document.querySelector('#more').click()")
        assert set(b.js('displayed.map(c=>c.id)'))==set(expected)
    b.js("document.querySelector('[data-search=carrousel]').click()")
    assert b.js("displayed.every(c=>category(c)==='Carrousels')")
    assert int(b.js("document.querySelector('#result-count').textContent"))==len(search(query='carrousel',limit=10000))
    b.js("document.querySelector('[data-source=one-prompt-design]').click()")
    assert b.js('displayed.length')==12
    assert b.js("displayed.every(c=>c.reference_only)")
    wait(b,"[...document.querySelectorAll('.preview-content img')].every(i=>i.complete&&i.naturalWidth>0)")
    assert b.js("document.querySelectorAll('.component-type').length")==12
    b.js("document.querySelector('.select-mini').click();document.querySelector('[data-detail]').click()")
    wait(b,"document.querySelector('#detail-preview img')?.complete")
    assert b.js("document.querySelector('#detail').innerText.includes('Référence visuelle')")
    assert b.js('location.pathname')=='/'
    b.js("document.querySelector('.close').click();document.querySelector('#open-prompt').click()")
    assert b.js("document.querySelector('#prompt-output').value.includes('ce n’est pas un composant React')")
    assert b.js("document.querySelector('#prompt-output').value.includes('1 fond(s) + 1 composant(s)')")
    assert b.js("document.querySelector('#prompt-output').value.includes('Rôle : FOND / ARRIÈRE-PLAN')")
    assert b.js("document.querySelector('#detail h2').textContent.includes('1 fond + 1 composant')")
    assert b.js("selectedItems().every(c=>document.querySelector('#prompt-output').value.includes(c.url))")
    assert b.js("document.querySelector('#prompt-output').value.includes('onepromptdesign.com/prompt/')")
    b.js("document.querySelector('.close').click()")
    Path('/tmp/atlas-oneprompt-desktop.png').write_bytes(base64.b64decode(b.call('Page.captureScreenshot',{'format':'png'})['data']))
    b.call('Emulation.setDeviceMetricsOverride',dict(width=390,height=844,deviceScaleFactor=1,mobile=True))
    assert b.js('innerWidth')==390
    assert b.js('document.documentElement.scrollWidth<=innerWidth')
    Path('/tmp/atlas-search-mobile.png').write_bytes(base64.b64decode(b.call('Page.captureScreenshot',{'format':'png'})['data']))
    print('PASS: all chart/carousel matches, pagination, global scope, 12 local visual previews, selection, honest prompt and mobile layout')
