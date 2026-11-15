import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try{
 const {studies}=await server.ssrLoadModule('/src/data.js');
 const {buildVariableCatalog}=await server.ssrLoadModule('/src/variable-catalog.js');
 const found=[];
 function walk(value,path){if(typeof value==='string'){if(/[áéíóúñ¿¡]|\b(?:para|del|las|los|una|este|esta|son|conserva|sin|sobre|incluye|proporciona|entre)\b/i.test(value))found.push({path,value});}else if(Array.isArray(value))value.forEach((v,i)=>walk(v,path+'.'+i));else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>{if(k!=='document'&&k!=='anchor')walk(v,path+'.'+k);});}
 for(const study of studies){walk(study,study.id);walk(buildVariableCatalog(study),study.id+'.catalog');}
 const unique=[...new Map(found.map(v=>[v.value,v])).values()];
 await writeFile('copy-audit.json',JSON.stringify(unique,null,2)+'\n');
 console.log(JSON.stringify(unique));
 if(unique.length)process.exitCode=1;
}finally{await server.close();}
