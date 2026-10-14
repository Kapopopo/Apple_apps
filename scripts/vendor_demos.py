"""Download explicitly selected, MIT-licensed components from official sources."""
import json
import re
import sys
import urllib.request
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from catalog import ROOT, load

SELECTION = [
    ('magic-ui','marquee','Témoignages','Défilement','Landing page','Présenter des avis ou des logos sans monopoliser la page.'),
    ('motion-primitives','tilt','Cartes','Survol','Portfolio','Donner du relief à un projet avec une interaction qui suit le pointeur.'),
    ('magic-ui','shimmer-button','Boutons','Boucle','Landing page','Mettre en avant un appel à l’action unique avec un reflet discret.'),
    ('motion-primitives','accordion','FAQ','Interaction','Application','Révéler des réponses progressivement tout en conservant une page lisible.'),
    ('magic-ui','dock','Navigation','Survol','Application','Rassembler les actions principales dans une navigation compacte.'),
    ('motion-primitives','spotlight','Cartes','Survol','Portfolio','Mettre en lumière une carte avec un halo qui suit le pointeur.'),
    ('magic-ui','number-ticker','Chiffres','Entrée','Dashboard','Attirer l’attention sur un indicateur clé avec un compteur animé.'),
    ('magic-ui','border-beam','Cartes','Boucle','Landing page','Distinguer une offre ou une carte prioritaire avec un contour animé.'),
    ('motion-primitives','text-effect','Texte','Entrée','Landing page','Introduire un titre avec une animation courte, mot par mot.'),
    ('magic-ui','magic-card','Cartes','Survol','Application','Souligner l’élément exploré avec une lumière qui suit le pointeur.'),
    ('magic-ui','animated-list','Notifications','Entrée','Dashboard','Présenter un flux d’activité avec une apparition progressive des événements.'),
    ('motion-primitives','animated-background','Navigation','Interaction','Application','Rendre les changements d’onglet lisibles avec un indicateur qui glisse entre les options.'),
    ('magic-ui','orbiting-circles','Illustrations','Boucle','Landing page','Illustrer un ensemble d’intégrations avec des orbites animées.'),
    ('magic-ui','animated-gradient-text','Texte','Boucle','Landing page','Accentuer quelques mots sans animer tout le contenu.'),
    ('motion-primitives','animated-number','Chiffres','Interaction','Dashboard','Animer les changements de valeurs dans un indicateur interactif.'),
    ('magic-ui','ripple','Fonds','Boucle','Landing page','Créer un fond de section doux autour d’un point focal.'),
    ('magic-ui','retro-grid','Fonds','Défilement','Portfolio','Donner une identité visuelle à une section d’accueil technologique.'),
    ('magic-ui','word-rotate','Texte','Boucle','Landing page','Présenter plusieurs bénéfices dans un même titre, avec une pause lisible.'),
    ('magic-ui', 'aurora-text', 'Texte', 'Boucle', 'Landing page', 'Donner du rythme à un titre ou mettre en valeur un message.'),
    ('magic-ui', 'animated-shiny-text', 'Texte', 'Boucle', 'Landing page', 'Donner du rythme à un titre ou mettre en valeur un message.'),
    ('magic-ui', 'hyper-text', 'Texte', 'Survol', 'Landing page', 'Décoder un titre au survol avec un effet de caractères aléatoires.'),
    ('magic-ui', 'sparkles-text', 'Texte', 'Boucle', 'Landing page', 'Donner du rythme à un titre ou mettre en valeur un message.'),
    ('magic-ui', 'morphing-text', 'Texte', 'Boucle', 'Landing page', 'Donner du rythme à un titre ou mettre en valeur un message.'),
    ('magic-ui', 'spinning-text', 'Texte', 'Boucle', 'Landing page', 'Donner du rythme à un titre ou mettre en valeur un message.'),
    ('magic-ui', 'typing-animation', 'Texte', 'Boucle', 'Landing page', 'Présenter plusieurs messages avec une saisie et un effacement animés.'),
    ('magic-ui', 'line-shadow-text', 'Texte', 'Boucle', 'Landing page', 'Donner du rythme à un titre ou mettre en valeur un message.'),
    ('magic-ui', 'text-animate', 'Texte', 'Entrée', 'Landing page', 'Révéler un titre mot par mot avec une transition floue.'),
    ('magic-ui', 'rainbow-button', 'Boutons', 'Boucle', 'Application', 'Distinguer une action avec une bordure multicolore animée.'),
    ('magic-ui', 'ripple-button', 'Boutons', 'Interaction', 'Application', 'Rendre une action visible avec un retour animé.'),
    ('magic-ui', 'shiny-button', 'Boutons', 'Boucle', 'Application', 'Attirer l’attention sur une action avec un reflet lumineux.'),
    ('magic-ui', 'pulsating-button', 'Boutons', 'Boucle', 'Application', 'Signaler une action principale avec une pulsation douce.'),
    ('magic-ui', 'interactive-hover-button', 'Boutons', 'Survol', 'Application', 'Révéler une flèche et un fond coloré au survol du bouton.'),
    ('magic-ui', 'meteors', 'Fonds', 'Boucle', 'Portfolio', 'Créer une ambiance animée derrière un contenu lisible.'),
    ('magic-ui', 'flickering-grid', 'Fonds', 'Boucle', 'Portfolio', 'Créer une ambiance animée derrière un contenu lisible.'),
    ('magic-ui', 'animated-grid-pattern', 'Fonds', 'Boucle', 'Portfolio', 'Créer une ambiance animée derrière un contenu lisible.'),
    ('magic-ui', 'interactive-grid-pattern', 'Fonds', 'Survol', 'Portfolio', 'Éclairer les cases parcourues par le pointeur dans une grille.'),
    ('magic-ui', 'light-rays', 'Fonds', 'Boucle', 'Portfolio', 'Créer une ambiance animée derrière un contenu lisible.'),
    ('magic-ui', 'warp-background', 'Fonds', 'Boucle', 'Portfolio', 'Créer une ambiance animée derrière un contenu lisible.'),
    ('magic-ui', 'shine-border', 'Cartes', 'Boucle', 'Landing page', 'Animer un reflet coloré le long du contour d’une carte.'),
    ('magic-ui', 'glare-hover', 'Cartes', 'Survol', 'Landing page', 'Mettre en valeur un contenu avec un effet de lumière ou de profondeur.'),
    ('magic-ui', 'neon-gradient-card', 'Cartes', 'Boucle', 'Landing page', 'Mettre en valeur une carte avec un halo néon animé.'),
    ('magic-ui', 'lens', 'Cartes', 'Survol', 'Landing page', 'Explorer les détails d’une affiche avec une loupe interactive.'),
    ('magic-ui', 'animated-circular-progress-bar', 'Chiffres', 'Boucle', 'Dashboard', 'Visualiser la progression vers un objectif.'),
    ('magic-ui', 'blur-fade', 'Illustrations', 'Entrée', 'Portfolio', 'Révéler un contenu avec une transition douce.'),
]

def fetch(url):
    with urllib.request.urlopen(url,timeout=30) as response:
        return response.read().decode()

def css_rule(selector, values):
    body=[]
    for key,value in values.items():
        body.append(css_rule(key,value) if isinstance(value,dict) else re.sub(r'[A-Z]',lambda m:'-'+m.group().lower(),key)+':'+str(value)+';')
    return selector+'{'+''.join(body)+'}'

if __name__=='__main__':
    sources={s['id']:s for s in load()['sources']}
    records=[]; themes={}; css={}; deps=set()
    for source,slug,category,interaction,usage,reason in SELECTION:
        component=next(c for c in sources[source]['components'] if c['url'].rsplit('/',1)[-1]==slug)
        key=slug
        if source=='motion-primitives':
            url=f'https://raw.githubusercontent.com/ibelick/motion-primitives/main/components/core/{key}.tsx'
            content=fetch(url)
            deps.add('motion')
        else:
            if source!='magic-ui':
                raise ValueError('Source non prise en charge : vérifier sa licence avant intégration')
            url=f'https://magicui.design/r/{key}.json'
            registry=json.loads(fetch(url))
            files=[f for f in registry['files'] if f['path'].endswith('/'+key+'.tsx')]
            if len(files)!=1:
                raise ValueError('Unexpected registry files: '+url)
            content=files[0]['content']
            deps.update(registry.get('dependencies',[]))
            themes.update(registry.get('cssVars',{}).get('theme',{}))
            css.update(registry.get('css',{}))
        if key=='accordion':
            content=content.replace('React.isValidElement(child)', 'React.isValidElement<Record<string, unknown>>(child)')
        (ROOT/'demos/src/vendor'/f'{key}.tsx').write_text(content)
        records.append(dict(id=component['id'],demo=key,category=category,interaction=interaction,usage=usage,reason=reason,source_url=component['url'],code_source=url,license='MIT',integration='Composant original ; contenu de démonstration adapté pour Atlas.'))
        print(source,key,flush=True)
    (ROOT/'data/curation.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
    (ROOT/'demos/src/registry.css').write_text('@theme inline {\n'+''.join('--'+k+':'+v+';\n' for k,v in themes.items())+'}\n'+''.join(css_rule(k,v) for k,v in css.items()))
    print('Dependencies:',sorted(deps))
    for name,url in {
        'magic-ui':'https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md',
        'motion-primitives':'https://raw.githubusercontent.com/ibelick/motion-primitives/main/LICENCE.md',
    }.items():
        try:
            (ROOT/'demos/licenses'/f'{name}.txt').write_text(fetch(url))
        except Exception as exc:
            print('License retrieval failed:',name,str(exc))
