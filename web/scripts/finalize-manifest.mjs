import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

const dist=resolve(import.meta.dirname,'../../dist');
async function files(dir){return (await readdir(dir,{withFileTypes:true})).flatMap(entry=>entry.isDirectory()?[]:[join(dir,entry.name)]).concat(...await Promise.all((await readdir(dir,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>files(join(dir,e.name)))))}
const manifest=JSON.parse(await readFile(join(dist,'imd-deployment.json'),'utf8'));
manifest.assets=[];
for(const file of (await files(dist)).sort()) {
  const path=relative(dist,file).split(sep).join('/');
  if(path==='imd-deployment.json') continue;
  const bytes=await readFile(file);
  manifest.assets.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(join(dist,'imd-deployment.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Recorded ${manifest.assets.length} assets`);
