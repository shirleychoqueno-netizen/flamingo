import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const html=await readFile('dist/index.html','utf8');
const page=await fetch('http://localhost:5173/');assert.equal(page.status,200);assert.equal(await page.text(),html);
const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(m=>m[1]);
for(const path of assets){const response=await fetch('http://localhost:5173'+path);assert.equal(response.status,200);const actual=Buffer.from(await response.arrayBuffer());const expected=await readFile('dist'+path);assert.equal(createHash('sha256').update(actual).digest('hex'),createHash('sha256').update(expected).digest('hex'));}
await writeFile('preview-verification.json',JSON.stringify({checked_utc:new Date().toISOString(),preview_url:'http://localhost:5173/',status:200,build_assets_hash_verified:assets,visual_qa:false,OpenAI_requests:0},null,2)+'\n');
console.log('PASS: local preview serves this exact build and all initial asset hashes. Browser interaction/visual QA not claimed.');
