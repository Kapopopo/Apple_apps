"""Catalogue interactif : vues, recherche bilingue, licences, aperçus sandboxés, prompt et envoi au builder."""
import json
import os
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from preview_capture import Browser


def wait(b, expression, timeout=20):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if b.js('Boolean(' + expression + ')'):
            return
        time.sleep(.15)
    raise AssertionError(expression)


with Browser() as b:
    b.call('Emulation.setDeviceMetricsOverride', dict(width=1440, height=1000, deviceScaleFactor=1, mobile=False))
    b.navigate(os.environ.get('ATLAS_URL', 'http://127.0.0.1:8000'))
    wait(b, "typeof data!=='undefined'&&data&&document.querySelectorAll('.card').length===44")
    # Uniquement de l'interactif : démos Atlas ou aperçus du registre, jamais de capture ni de lien seul.
    assert b.js("data.components.every(c=>c.curation?.demo||c.registry)")
    assert b.js("document.querySelectorAll('#results img').length") == 0
    total = b.js("data.components.length")
    assert total > 500, total
    assert b.js("!document.querySelector('[data-view=sources]')")

    b.js("document.querySelector('[data-view=components]').click()")
    assert int(b.js("document.querySelector('#result-count').textContent")) == total
    assert b.js("[...document.querySelectorAll('#results iframe')].every(f=>(f.getAttribute('src')||f.dataset.src).startsWith('/demos/')||(f.getAttribute('sandbox')==='allow-scripts'&&(f.getAttribute('src')||f.dataset.src).startsWith('/registry-previews/')))")

    for query in ['graphique', 'chart']:
        b.js("document.querySelector('#search').value=" + json.dumps(query) + ";document.querySelector('#search').dispatchEvent(new Event('input'))")
        count = int(b.js("document.querySelector('#result-count').textContent"))
        assert count > 5, (query, count)
        assert b.js("displayed.filter(c=>category(c)==='Graphiques').length>=displayed.length/2"), query

    b.js("document.querySelector('#reset-filters').click()")
    b.js("document.querySelector('#license-filter').value='restricted';document.querySelector('#license-filter').dispatchEvent(new Event('input'))")
    assert b.js("displayed.length>0&&displayed.every(c=>c.license_status==='restricted')")
    assert b.js("document.querySelectorAll('.lic.restricted').length") == b.js("document.querySelectorAll('.card').length")
    registry_id = b.js("displayed[0].id")
    b.js("document.querySelector('.select-mini').click()")

    b.js("document.querySelector('#reset-filters').click();document.querySelector('[data-view=recommend]').click()")
    b.js("document.querySelector('.select-mini').click()")
    assert b.js("selectedItems().length") == 2

    b.js("document.querySelector('[data-view=selected]').click()")
    wait(b, "document.querySelectorAll('.card').length===2")
    b.js("[...document.querySelectorAll('[data-detail]')].find(x=>x.closest('.card').querySelector('.is-registry')).click()")
    wait(b, "document.querySelector('#detail-preview iframe')")
    assert b.js("document.querySelector('#detail-preview iframe').getAttribute('sandbox')") == 'allow-scripts'
    assert b.js("document.querySelector('#detail').innerText.includes('get_component')||document.querySelector('#detail').innerText.includes('registre')")
    b.js("document.querySelector('.close').click();document.querySelector('#open-prompt').click()")
    prompt = b.js("document.querySelector('#prompt-output').value")
    assert registry_id in prompt and 'get_component' in prompt, prompt[:400]
    assert b.js("document.querySelector('#detail h2').textContent.includes('2 composants')")
    b.js("document.querySelector('.close').click()")
    assert b.js("document.querySelector('#to-builder').getAttribute('href')") == '/builder?import=atlas'

    b.call('Emulation.setDeviceMetricsOverride', dict(width=390, height=844, deviceScaleFactor=1, mobile=True))
    assert b.js('innerWidth') == 390
    assert b.js('document.documentElement.scrollWidth<=innerWidth')
    print('PASS: interactive-only catalogue, bilingual search, license filter, sandboxed registry previews, prompt with registry code and mobile layout')
