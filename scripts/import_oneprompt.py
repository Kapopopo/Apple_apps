"""Import selected public visual references and local thumbnail screenshots.
The site's image prompts are not executed or copied into generated project prompts.
"""
import base64
import datetime
import hashlib
import json
import sys
import time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from catalog import ROOT
from preview_capture import Browser

SLUGS = ['floating-orb-exchange','portal-in-pink-fields','neon-enter-key','glowing-credit-card','vertical-blue-grain','vintage-rust-haze','warm-sepia-haze','velvet-editorial-02','misty-london-bridge','cosmic-modernist-sculpture-hall','neon-sound-system-reverie','cypress-tennis-court']
CATEGORIES={'Images':'Illustrations','Poster':'Affiches','Mockups':'Maquettes','Gradients':'Dégradés','Backdrops':'Fonds'}

def main():
    records=[]
    with Browser() as browser:
        browser.call('Emulation.setDeviceMetricsOverride',dict(width=1200,height=900,deviceScaleFactor=1,mobile=False))
        browser.navigate('https://onepromptdesign.com/')
        links=browser.js("[...document.querySelectorAll('a[href*="+'\"/prompt/\"'+"]')].map(a=>a.href)")
        urls={url.rstrip('/').rsplit('/',1)[-1]:url for url in links}
        for slug in SLUGS:
            url=urls[slug]
            browser.navigate(url)
            for _ in range(40):
                if browser.js("[...document.images].some(i=>i.complete&&i.naturalWidth>100)"):break
                time.sleep(.2)
            title=browser.js("document.querySelector('h1')?.innerText||document.images[0]?.alt")
            if not title:raise ValueError('Missing title: '+url)
            body=browser.js('document.body.innerText').splitlines()
            def value(label):
                try:return next(x.strip() for x in body[body.index(label)+1:] if x.strip())
                except (ValueError,StopIteration):return ''
            category=value('Category')
            record=dict(id=hashlib.sha256(('one-prompt-design:'+url).encode()).hexdigest()[:16],name=title,url=url,kind='Référence visuelle',type_label=CATEGORIES.get(category,'Références visuelles'),verified=True,documented=False,accessibility=False,description='Fond de page ou de section à associer à vos composants.',tags=['fond','fonds','arrière-plan','background','visuel','inspiration','image',category],creator=value('Creator'),license='Non précisée sur la fiche consultée',reference_only=True)
            rect=browser.js("(()=>{const i=[...document.images].find(i=>i.complete&&i.naturalWidth>100);if(!i)return null;const r=i.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()")
            if not rect:raise ValueError('Missing visual: '+url)
            cache=ROOT/'data/previews';cache.mkdir(exist_ok=True)
            (cache/(record['id']+'.jpg')).write_bytes(base64.b64decode(browser.call('Page.captureScreenshot',dict(format='jpeg',quality=82,clip=rect,captureBeyondViewport=True))['data']))
            (cache/(record['id']+'.json')).write_text(json.dumps(dict(status='ready',image='/previews/'+record['id']+'.jpg',source_url=url,captured_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),kind='visual-reference'),ensure_ascii=False))
            records.append(record)
            print(title,category,flush=True)
    source=dict(id='one-prompt-design',name='One Prompt Design',url='https://onepromptdesign.com/',category='Références visuelles',status='accessible',note='Sélection de visuels et prompts d’images. Aperçus consultables ici ; références de direction artistique, sans code UI intégré.',components=records)
    (ROOT/'data/reference_sources.json').write_text(json.dumps([source],ensure_ascii=False,indent=2))

if __name__=='__main__':main()
