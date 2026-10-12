import fs from 'node:fs';
import path from 'node:path';
const packages=['react','react-dom','scheduler','motion','framer-motion','motion-dom','motion-utils','next-themes','lucide-react','clsx','tailwind-merge','class-variance-authority'];
const notices=[];
for(const name of packages){
 const dir=path.join('node_modules',name);
 const file=fs.readdirSync(dir).find(f=>/^licen[cs]e(\.(md|txt))?$/i.test(f));
 if(!file)throw Error('Missing license for '+name);
 const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
 notices.push(name+' '+pkg.version+'\n\n'+fs.readFileSync(path.join(dir,file),'utf8'));
}
for(const name of ['magic-ui','motion-primitives'])notices.push(name+'\n\n'+fs.readFileSync('licenses/'+name+'.txt','utf8'));
fs.writeFileSync('../web/demos/THIRD_PARTY_LICENSES.txt',notices.join('\n\n----------------------------------------\n\n'));
