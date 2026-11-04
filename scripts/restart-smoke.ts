import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3001';
let server:ChildProcess|undefined;
async function start(){server=spawn(process.execPath,['--import','tsx','apps/server/src/index.ts','--production'],{stdio:'pipe'});server.stderr?.on('data',b=>process.stderr.write(b));for(let i=0;i<60;i++){if(server.exitCode!==null)throw Error('Server startup failed');try{const r=await fetch(base+'/api/status');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server readiness timeout');}
async function stop(){if(server&&server.exitCode===null){const exit=once(server,'exit');server.kill('SIGTERM');await exit;}server=undefined;}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  await start();const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/overlay');await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor();await page.waitForTimeout(1500);
  const before=await (await fetch(base+'/api/status')).json();const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hyuz-snake-v1')??'{}'));
  const game=await snapshot();await stop();await page.getByText('GIFT CONNECTION OFFLINE',{exact:true}).waitFor();await page.waitForTimeout(2500);const offline=await snapshot();assert(offline.game.now>game.game.now);
  await start();await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor({timeout:35000});const after=await (await fetch(base+'/api/status')).json();assert.equal(after.epoch,before.epoch);assert.equal(after.total,before.total);assert(after.seq>=before.seq);assert.deepEqual(errors,[]);
  console.log('PASS: production build serving, backend stopped while game continued, persistent epoch/total restored, WebSocket reconnected, no page errors.');
}finally{await stop();await browser.close();}
