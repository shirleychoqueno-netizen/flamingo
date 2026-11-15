import {execFileSync} from 'node:child_process';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const files=execFileSync('git',['ls-files','--cached','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=/(^|\/)(node_modules|dist|\.wrangler|\.deploy-check)(\/|$)|(^|\/)\.env(?!\.example$)|(^|\/)\.dev\.vars(?!\.example$)/;
const credentials=/(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|gsk_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const failures=[];
const staged=path=>execFileSync('git',['show',':'+path],{maxBuffer:8*1024*1024});
for(const path of files){
 if(forbidden.test(path))failures.push({path,reason:'Generated/local/secret file is staged'});
 if(statSync(path).size>25*1024*1024)failures.push({path,reason:'Unexpected file larger than 25 MiB'});
 if(!/\.(pdf|webm|gif|jpe?g|png)$/i.test(path)&&credentials.test(readFileSync(path,'utf8')))failures.push({path,reason:'Possible credential; inspect without printing it'});
}
const catalog=JSON.parse(staged('src/investigation-catalog.json').toString('utf8'));
for(const study of catalog.investigations){
 const path='public'+study.rows_url;
 if(createHash('sha256').update(staged(path)).digest('hex')!==study.rows_sha256)failures.push({path,reason:'Staged scientific snapshot bytes differ; inspect Git line-ending normalization'});
}
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}else console.log(`PASS: ${files.length} tracked files; no prohibited runtime files or recognized credential patterns.`);
