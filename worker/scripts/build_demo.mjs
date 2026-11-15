import { readFile, writeFile, mkdir } from 'node:fs/promises';
const assets = {};
for (const [route, file, type] of [['/demo','index.html','text/html'],['/demo.js','app.js','text/javascript'],['/demo.css','style.css','text/css'],['/demo-evaluation.json','verified-evaluation.json','application/json']]) {
  assets[route] = { body: await readFile(new URL('../demo/' + file, import.meta.url), 'utf8'), type: type + '; charset=utf-8' };
}
await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/generated/demo-assets.mjs', import.meta.url), 'export default ' + JSON.stringify(assets) + ';\n');
console.log('Built English evidence workbench assets.');
