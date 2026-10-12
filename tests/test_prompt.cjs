const assert=require('node:assert/strict');
const fs=require('node:fs');
const {buildPrompt}=require('../web/prompt.js');
const catalog=JSON.parse(fs.readFileSync('data/catalog.json','utf8'));
const curation=JSON.parse(fs.readFileSync('data/curation.json','utf8'));
const components=curation.map(choice=>{
  const source=catalog.sources.find(s=>s.components.some(c=>c.id===choice.id));
  return {...source.components.find(c=>c.id===choice.id),source:source.name,curation:choice};
});
const prompt=buildPrompt([...components,components[0]],{project:'Un portfolio pour Camille',style:'Vert sauge et ivoire',notes:{[components[0].id]:'Dans la section témoignages'}});
assert.ok(prompt.includes('COMPOSANTS À INTÉGRER (18)'));
for(const c of components){assert.ok(prompt.includes(c.url));assert.equal(prompt.split('Identifiant : '+c.id).length,2);assert.ok(prompt.includes(c.curation.interaction));}
assert.ok(prompt.includes('Un portfolio pour Camille'));
assert.ok(prompt.includes('Dans la section témoignages'));
assert.ok(prompt.includes('sans redirection'));
assert.ok(prompt.includes('prefers-reduced-motion'));
assert.equal(buildPrompt([]),'');
const staticPrompt=buildPrompt([{id:'one',name:'Static',source:'Example',url:'https://example.com/component',kind:'Composant'}]);
assert.ok(staticPrompt.includes('n’a pas de démonstration locale validée'));
assert.ok(!staticPrompt.includes('undefined'));
console.log('PASS: all 18 components, deduplication, sources, custom brief and notes, static fallback, empty selection');
