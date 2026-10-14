const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const aliases={bouton:'button',boutons:'button',carte:'card',cartes:'card',tableau:'table',formulaire:'form',fenetre:'dialog',onglet:'tab',onglets:'tab',calendrier:'calendar',texte:'text',fond:'background',fonds:'background'};
const matches=(words,text)=>words.every(w=>norm(text).includes(w)||norm(text).includes(aliases[w]||w));
const safeURL=v=>{try{const u=new URL(v);return u.protocol==='https:'?esc(u.href):'#';}catch{return '#';}};
function stored(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback;}catch{return fallback;}}
function readSet(key){const v=stored(key,[]);return new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'):[]);}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('Stockage indisponible : vos choix restent conservés pour cette session.');}}
let data,view='recommend',visible=18,displayed=[],generation=0,pollTimer,detailId=null,modalMode=null,paused=false;
const selected=readSet('atlas-selection'),favorites=readSet('atlas-favorites');
let draft=stored('atlas-prompt-draft',{});
if(!draft||typeof draft!=='object'||Array.isArray(draft))draft={};
for(const key of ['project','stack','style'])if(typeof draft[key]!=='string')draft[key]='';
if(!draft.notes||typeof draft.notes!=='object'||Array.isArray(draft.notes))draft.notes={};
for(const key of Object.keys(draft.notes))if(typeof draft.notes[key]!=='string')delete draft.notes[key];
const titles={recommend:'La sélection Atlas',components:'Tout le catalogue',selected:'Ma sélection',favorites:'Mes favoris',sources:'Toutes les sources'};
const hasPreview=c=>c.preview?.status==='ready';
const isLive=c=>!!c.curation?.demo;
const byId=id=>data?.components.find(c=>c.id===id);
const selectedItems=()=>[...selected].map(byId).filter(Boolean);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
function modal(html,mode='detail',wide=false){modalMode=mode;$('#detail').classList.toggle('wide',wide);$('#detail').classList.toggle('prompt-dialog',mode==='prompt');$('#detail-body').innerHTML=html;if(!$('#detail').open)$('#detail').showModal();}
$('.close').onclick=()=>$('#detail').close();
$('#detail').addEventListener('close',()=>{if($('#detail').open)return;detailId=null;modalMode=null;$('#detail-body').replaceChildren();});
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function category(c){return c.type_label||c.curation?.category||'Autres composants';}
const isReference=c=>c.kind==='Référence visuelle';
const isBackground=c=>AtlasPrompt.isBackground(c);
function selectionSummary(items){const n=items.filter(isBackground).length,m=items.length-n;return [n?`${n} fond${n>1?'s':''}`:'',m?`${m} composant${m>1?'s':''}`:''].filter(Boolean).join(' + ');}
function demoFrame(c,large=false){return `<iframe class="live-demo" ${large?'src':'data-src'}="/demos/index.html?demo=${encodeURIComponent(c.curation.demo)}" title="Démonstration interactive : ${esc(c.name)}" data-demo-id="${c.id}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer"></iframe>`;}
function previewMarkup(c,large=false){
 if(isLive(c))return demoFrame(c,large);
 if(hasPreview(c)){const src=/^\/previews\/[a-f0-9]{16}\.jpg$/.test(c.preview.image)?c.preview.image:'';return `<img src="${src}" alt="Capture de ${esc(c.name)} — ${esc(c.source)}" loading="${large?'eager':'lazy'}" decoding="async"><span class="capture-label">${isReference(c)?'Fond · One Prompt Design':'Aperçu statique · animation non intégrée'}</span>`;}
 const failed=c.preview?.status==='error';return `<span class="preview-state">${failed?'<span class="preview-symbol">◫</span>':'<span class="spinner"></span>'}<strong>${failed?'Aperçu indisponible':'Préparation de la capture…'}</strong><small>Cette fiche n’a pas encore de démonstration intégrée.</small></span>`;
}
const demoObserver=new IntersectionObserver(entries=>{
 for(const entry of entries){const frame=entry.target;frame.dataset.visible=String(entry.isIntersecting);if(entry.isIntersecting&&frame.dataset.src){frame.src=frame.dataset.src;delete frame.dataset.src;}if(frame.getAttribute('src'))frame.contentWindow?.postMessage({type:'atlas-playback',playing:entry.isIntersecting&&!paused},location.origin);}
},{rootMargin:'180px'});
function mountDemos(){document.querySelectorAll('#results iframe.live-demo').forEach(f=>demoObserver.observe(f));}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.type!=='atlas-demo-ready')return;
 const frame=[...document.querySelectorAll('iframe.live-demo')].find(f=>f.contentWindow===event.source);
 if(frame){frame.dataset.ready='true';frame.contentWindow.postMessage({type:'atlas-playback',playing:!paused&&frame.dataset.visible!=='false'},location.origin);}
});
$('#pause-all').onclick=()=>{paused=!paused;$('#pause-all').textContent=paused?'▶ Reprendre':'Ⅱ Pause';$('#pause-all').setAttribute('aria-pressed',String(paused));document.querySelectorAll('iframe.live-demo').forEach(f=>f.contentWindow?.postMessage({type:'atlas-playback',playing:!paused},location.origin));};
async function hydratePreviews(token){
 if(token!==generation||view==='sources')return;
 const needed=displayed.filter(c=>!isLive(c)&&!hasPreview(c)&&c.preview?.status!=='error').slice(0,24);if(!needed.length)return;
 try{const r=await fetch('/api/previews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:needed.map(c=>c.id)})});if(!r.ok)throw Error();const states=await r.json();
 for(const[id,state]of Object.entries(states)){const c=byId(id);if(!c)continue;c.preview=state;if(token!==generation)continue;const box=document.querySelector(`[data-preview="${id}"] .preview-content`);if(box)box.innerHTML=previewMarkup(c);if(detailId===id&&modalMode==='detail')$('#detail-preview').innerHTML=previewMarkup(c,true);}
 if(token===generation)pollTimer=setTimeout(()=>hydratePreviews(token),2500);
 }catch{if(token!==generation)return;for(const c of needed){c.preview={status:'error'};const box=document.querySelector(`[data-preview="${c.id}"] .preview-content`);if(box)box.innerHTML=previewMarkup(c);}toast('Le service de captures ne répond pas. Les démonstrations locales restent disponibles.');}
}
const filterIds=['search','source-filter','demo-filter','category-filter','effect-filter','usage-filter'];
function resetFilters(){for(const id of filterIds)$('#'+id).value='';visible=18;}
function changeView(next){view=next;visible=18;$('#breadcrumb').textContent=titles[view];document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});$('#section-title').innerHTML=esc(titles[view])+' <span id="result-count"></span>';for(const selector of ['.advanced-filters','#source-filter','#demo-filter','#gallery-note','#pause-all'])$(selector).hidden=view==='sources';render();}
for(const id of filterIds)$('#'+id).addEventListener('input',()=>{visible=18;if(view==='recommend'&&['search','source-filter','category-filter'].includes(id)&&$('#'+id).value){changeView('components');}else render();});
$('#reset-filters').onclick=()=>{resetFilters();render();};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{resetFilters();changeView(b.dataset.view);});
$('#sort').onchange=()=>render();$('#more').onclick=()=>{visible+=18;render();};
function render(){
 if(!data)return;generation++;clearTimeout(pollTimer);demoObserver.disconnect();
 const q=norm($('#search').value.trim()).split(/\s+/).filter(Boolean),source=$('#source-filter').value,cat=$('#category-filter').value,effect=$('#effect-filter').value,usage=$('#usage-filter').value,demo=$('#demo-filter').value;
 let items;
 if(view==='sources'){items=data.sources.filter(s=>matches(q,s.name+' '+s.category));items.sort((a,b)=>a.name.localeCompare(b.name));}
 else{items=data.components.filter(c=>(view!=='recommend'||isLive(c))&&(view!=='selected'||selected.has(c.id))&&(view!=='favorites'||favorites.has(c.id))&&(!source||c.source_id===source)&&(!cat||category(c)===cat)&&(!effect||c.curation?.interaction===effect)&&(!usage||c.curation?.usage===usage)&&(!demo||(demo==='live'?isLive(c):!isLive(c)&&hasPreview(c)))&&matches(q,[c.search_terms||'',c.name,c.source,category(c),c.curation?.interaction||'',c.curation?.usage||''].join(' ')));
 items.sort((a,b)=>{switch($('#sort').value){case'name':return a.name.localeCompare(b.name);case'source':return a.source.localeCompare(b.source)||a.name.localeCompare(b.name);case'score':return b.score-a.score||a.name.localeCompare(b.name);default:return (a.curation?.order??9999)-(b.curation?.order??9999)||Number(hasPreview(b))-Number(hasPreview(a))||b.score-a.score;}});}
 if(view==='recommend')visible=items.length;
 $('#search-scope').textContent=view==='selected'?'Recherche dans votre sélection':view==='favorites'?'Recherche dans vos favoris':view==='sources'?'Recherche de sources':view==='recommend'?'Saisir un type explore tout le catalogue.':'Recherche dans tout le catalogue · les filtres restent appliqués';
 $('#result-count').textContent=items.length;$('#more').hidden=items.length<=visible;
 const active=filterIds.filter(id=>$('#'+id).value).length;$('#filter-count').textContent=active?'('+active+')':'';
 displayed=view==='sources'?[]:items.slice(0,visible);
 if(!items.length){$('#results').innerHTML=`<div class="empty"><strong>${view==='selected'?'Votre sélection commence ici.':'Aucun composant pour ces critères.'}</strong><p>${view==='selected'?'Survolez une carte puis cliquez sur « Sélectionner ». Vos choix restent disponibles entre les recherches.':'Essayez une autre catégorie ou réinitialisez les filtres.'}</p><button id="empty-reset">${view==='selected'?'Explorer la sélection Atlas':'Réinitialiser les filtres'}</button></div>`;$('#empty-reset').onclick=()=>{resetFilters();if(view==='selected')changeView('recommend');else render();};syncSelection();return;}
 $('#results').innerHTML=items.slice(0,visible).map(c=>view==='sources'?sourceCard(c):componentCard(c)).join('');mountDemos();hydratePreviews(generation);syncSelection();
}
function componentCard(c){const live=isLive(c);return `<article class="card ${selected.has(c.id)?'is-selected':''}" data-card="${c.id}"><div class="visual-box ${live?'is-live':''}" data-preview="${c.id}"><div class="preview-content">${previewMarkup(c)}</div><div class="hover-actions"><button data-detail="${c.id}" aria-label="Agrandir ${esc(c.name)}">⤢ Agrandir</button><button data-select="${c.id}" aria-pressed="${selected.has(c.id)}">${selected.has(c.id)?'✓ Sélectionné':'+ Sélectionner'}</button></div><span class="live-badge ${live?'':'static-badge'}">${live?'● En direct':isReference(c)?'◈ Fond':'◫ Statique'}</span></div><div class="card-body"><div class="card-meta"><span class="source-mark">${esc(c.source[0])}</span>${esc(c.source)}<button class="favorite-inline" data-favorite="${c.id}" aria-label="${favorites.has(c.id)?'Retirer des':'Ajouter aux'} favoris : ${esc(c.name)}" aria-pressed="${favorites.has(c.id)}">${favorites.has(c.id)?'♥':'♡'}</button></div><h3><button data-detail="${c.id}">${esc(c.name)}</button></h3><div class="component-type">${isBackground(c)?'Fond / arrière-plan · ':'Type : '}${esc(category(c))}</div><p class="choice-reason">${esc(c.curation?.reason||c.description||'Fiche du catalogue. Démonstration locale non intégrée.')}</p><div class="card-bottom"><div class="tags"><button class="tag" data-category="${esc(category(c))}">${esc(category(c))}</button>${live?`<button class="tag" data-effect="${esc(c.curation.interaction)}">${esc(c.curation.interaction)}</button>`:''}</div><button class="select-mini" data-select="${c.id}" aria-pressed="${selected.has(c.id)}" aria-label="Sélectionner ${esc(c.name)}">${selected.has(c.id)?'✓ Sélectionné':'+ Sélectionner'}</button></div></div></article>`;}
function sourceCard(c){return `<article class="card source-card"><span class="source-mark">${esc(c.name[0])}</span><h3>${esc(c.name)}</h3><span class="badge">${esc(c.category)}</span><p>${c.components.length} fiches · ${data.components.filter(x=>x.source_id===c.id&&isLive(x)).length} démonstrations locales</p><div class="source-status">${c.status==='accessible'?'● Source consultée':'○ Accès non abouti'}</div><p>${esc(c.note||'Indexation à lancer.')}</p><button class="detail-button" data-source="${esc(c.id)}" ${c.components.length?'':'disabled'}>Explorer les composants →</button></article>`;}
function syncSelection(){
 const count=selectedItems().length;
 $('#selected-count').textContent=count;$('#prompt-count').textContent=count;$('#open-prompt').disabled=!count;$('#selection-bar').hidden=!count;document.body.classList.toggle('has-selection',!!count);$('#selection-total').textContent=selectionSummary(selectedItems())+' sélectionné'+(count>1?'s':'');$('#fav-count').textContent=data.components.filter(c=>favorites.has(c.id)).length;
 document.querySelectorAll('[data-select]').forEach(b=>{const yes=selected.has(b.dataset.select);b.textContent=yes?'✓ Sélectionné':'+ Sélectionner';b.setAttribute('aria-pressed',String(yes));});
 document.querySelectorAll('[data-card]').forEach(card=>card.classList.toggle('is-selected',selected.has(card.dataset.card)));
}
function toggleSelection(id){if(!byId(id))return;selected.has(id)?selected.delete(id):selected.add(id);save('atlas-selection',[...selected]);syncSelection();if(view==='selected')render();}
function showDetail(c){
 detailId=c.id;const live=isLive(c);
 modal(`<div class="detail-heading"><div><span class="eyebrow">${esc(c.source)} · ${esc(category(c))}</span><h2>${esc(c.name)}</h2></div><button class="primary" data-select="${c.id}" aria-pressed="${selected.has(c.id)}">${selected.has(c.id)?'✓ Sélectionné':'+ Sélectionner'}</button></div><div class="demo-toolbar"><span>${live?'● Démonstration locale — essayez les clics et le survol':isReference(c)?'◈ Référence visuelle — à utiliser en fond / arrière-plan avec vos composants':'Aperçu statique — démonstration locale non intégrée'}</span>${live?`<button id="replay-demo">↻ Rejouer</button>`:''}</div><div class="detail-preview ${live?'detail-live':''}" id="detail-preview">${previewMarkup(c,true)}</div><div class="detail-caption">${esc((isBackground(c)?'À utiliser en fond de page ou de section, avec vos composants au premier plan.':c.curation?.reason||c.description)||'Vous pouvez inclure cette référence dans votre prompt. Son comportement devra être vérifié lors de l’intégration.')}</div>${live?`<div class="detail-facts"><span><b>Usage</b>${esc(c.curation.usage)}</span><span><b>Animation</b>${esc(c.curation.interaction)}</span><span><b>Licence du code intégré</b>${esc(c.curation.license)}</span></div>`:''}<details class="technical-details"><summary>Référence et documentation</summary><p>${live?'Composant original, contenu de démonstration adapté pour Atlas.':'Référence conservée pour votre projet.'}</p><p>${esc(c.url)}</p>${isReference(c)?`<p>Auteur : ${esc(c.creator||'Non indiqué')} · Droits : ${esc(c.license)}</p>`:''}<p>Indice documentaire : ${c.score} points. Ce score ne constitue pas un classement qualité absolu.</p></details>`,'detail',true);
 if(live)$('#replay-demo').onclick=()=>$('#detail-preview iframe').contentWindow.postMessage({type:'atlas-replay'},location.origin);
}
document.body.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.search){resetFilters();$('#search').value=button.dataset.search;changeView('components');return;}
 if(button.dataset.select){toggleSelection(button.dataset.select);return;}
 if(button.dataset.detail){showDetail(byId(button.dataset.detail));return;}
 if(button.dataset.favorite){const id=button.dataset.favorite;favorites.has(id)?favorites.delete(id):favorites.add(id);save('atlas-favorites',[...favorites]);button.textContent=favorites.has(id)?'♥':'♡';button.setAttribute('aria-pressed',String(favorites.has(id)));if(view==='favorites')render();else syncSelection();return;}
 if(button.dataset.source){resetFilters();$('#source-filter').value=button.dataset.source;changeView('components');return;}
 if(button.dataset.category){$('#category-filter').value=button.dataset.category;if(view==='recommend')changeView('components');else render();return;}
 if(button.dataset.effect){$('#effect-filter').value=button.dataset.effect;render();return;}
 if(button.dataset.remove){selected.delete(button.dataset.remove);save('atlas-selection',[...selected]);syncSelection();if(view==='selected')render();if(selectedItems().length)showPrompt();else{$('#detail').close();toast('Votre sélection est vide.');}return;}
});
$('#review-selection').onclick=()=>{resetFilters();changeView('selected');};
$('#clear-selection').onclick=()=>{selected.clear();save('atlas-selection',[]);syncSelection();if(view==='selected')render();};
function generatePrompt(){return AtlasPrompt.buildPrompt(selectedItems(),draft);}
function showPrompt(){
 const items=selectedItems();if(!items.length){toast('Sélectionnez au moins un composant.');return;}detailId=null;
 const stacks=['React + TypeScript + Tailwind CSS + Motion','Next.js + React + TypeScript + Tailwind CSS + Motion','Stack existante du projet (adapter les composants React si nécessaire)'];
 modal(`<div class="prompt-heading"><span class="eyebrow">VOTRE SÉLECTION DEVIENT UN PROJET</span><h2>Un prompt. ${esc(selectionSummary(items))}.</h2><p>Précisez votre idée, puis copiez le prompt dans votre assistant de création.</p></div><div class="prompt-layout"><div class="prompt-options"><label class="field-label" for="project-brief">Votre projet</label><textarea id="project-brief" rows="3" placeholder="Ex. Une landing page pour mon studio de design, avec un hero, des projets et des témoignages…">${esc(draft.project||'')}</textarea><label class="field-label" for="project-stack">Technologies</label><select id="project-stack">${stacks.map(s=>`<option ${s===(draft.stack||stacks[0])?'selected':''}>${esc(s)}</option>`).join('')}</select><label class="field-label" for="project-style">Direction visuelle</label><input id="project-style" value="${esc(draft.style||'')}" placeholder="Ex. Minimaliste, vert sauge, fond clair"><h3>Fonds et composants inclus <span>${items.length}</span></h3><div class="prompt-components">${items.map((c,i)=>`<div class="prompt-component"><div><span class="component-number">${i+1}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.source)} · ${isBackground(c)?'Fond / arrière-plan':esc(category(c))}</small></div><button data-remove="${c.id}" aria-label="Retirer ${esc(c.name)} de la sélection">×</button></div><input data-note="${c.id}" value="${esc(draft.notes[c.id]||'')}" aria-label="Consigne pour ${esc(c.name)}" placeholder="${isBackground(c)?'Ex. Fond du hero, voile sombre pour les titres':'Ex. Dans le hero, au-dessus du fond choisi'}"></div>`).join('')}</div></div><div class="prompt-result"><div class="prompt-result-title"><label for="prompt-output">Prompt prêt à utiliser</label><span>Éditable · sans appel à une IA</span></div><textarea id="prompt-output" spellcheck="false" aria-label="Prompt généré">${esc(generatePrompt())}</textarea><p class="prompt-hint">Modifier le brief ou une consigne régénère le texte. Vos fonds et composants sont réunis dans ce prompt. Précisez leur section pour les associer.</p><div class="prompt-buttons"><button id="download-prompt">↓ Télécharger .txt</button><button class="primary" id="copy-prompt">Copier le prompt</button></div></div></div>`,'prompt',true);
 const update=()=>{draft.project=$('#project-brief').value;draft.stack=$('#project-stack').value;draft.style=$('#project-style').value;document.querySelectorAll('[data-note]').forEach(input=>draft.notes[input.dataset.note]=input.value);save('atlas-prompt-draft',draft);$('#prompt-output').value=generatePrompt();};
 for(const el of document.querySelectorAll('#project-brief,#project-stack,#project-style,[data-note]'))el.addEventListener('input',update);
 $('#copy-prompt').onclick=async()=>{const text=$('#prompt-output').value;try{await navigator.clipboard.writeText(text);toast('Prompt copié avec tous vos fonds et composants.');}catch{$('#prompt-output').focus();$('#prompt-output').select();try{if(document.execCommand('copy'))toast('Prompt copié.');else toast('Texte sélectionné : utilisez Ctrl+C.');}catch{toast('Texte sélectionné : utilisez Ctrl+C.');}}};
 $('#download-prompt').onclick=()=>{const url=URL.createObjectURL(new Blob([$('#prompt-output').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='atlas-prompt.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
$('#open-prompt').onclick=showPrompt;$('#generate-prompt').onclick=showPrompt;
function method(){detailId=null;modal('<h2>Pourquoi ces composants ?</h2><p>Atlas retient des composants de Magic UI et Motion Primitives pour leur utilité concrète, leurs comportements complémentaires et la disponibilité de leur code sous licence MIT. Chaque carte explique son intérêt : appel à l’action, navigation, FAQ, témoignages, chiffres ou mise en valeur du contenu.</p><p>Il s’agit d’une sélection éditoriale, pas d’un classement universel. Les démonstrations utilisent les composants originaux, intégrés localement avec un contenu adapté. Les animations ne dépendent pas de sites externes.</p><p>Le catalogue complet conserve les autres références ; celles qui ne sont pas intégrées portent la mention « Statique ». Le score documentaire historique mesure seulement les indices relevés dans la documentation.</p>','method');}
$('#method-button').onclick=method;$('#footer-method').onclick=method;
$('#mcp-button').onclick=()=>{detailId=null;modal('<h2>Connecter votre assistant</h2><p>Le serveur MCP expose le catalogue via <code>list_sources</code>, <code>search_components</code> et <code>recommend_components</code>. La sélection et le prompt sont conservés dans ce navigateur.</p><pre>{\n  "mcpServers": {\n    "component-atlas": {\n      "command": "python3",\n      "args": ["/chemin/vers/Apple_apps/mcp_server.py"]\n    }\n  }\n}</pre>','mcp');};
fetch('/api/catalog').then(r=>{if(!r.ok)throw Error();return r.json();}).then(catalog=>{
 data=catalog;$('#source-count').textContent=data.sources.length;$('#component-count').textContent=data.components.length;$('#nav-count').textContent=data.components.length;$('#live-count').textContent=data.components.filter(isLive).length;$('#live-nav').textContent=data.components.filter(isLive).length;
 $('#source-filter').innerHTML+=[...data.sources].sort((a,b)=>a.name.localeCompare(b.name)).map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
 for(const[id,values]of [['category-filter',data.components.map(category)],['effect-filter',data.components.filter(isLive).map(c=>c.curation.interaction)],['usage-filter',data.components.filter(isLive).map(c=>c.curation.usage)]])$('#'+id).innerHTML+=[...new Set(values)].sort((a,b)=>a.localeCompare(b)).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
 render();
}).catch(()=>{$('#results').innerHTML='<div class="empty">Impossible de charger le catalogue. Redémarrez le serveur Python puis rechargez la page.</div>';});
