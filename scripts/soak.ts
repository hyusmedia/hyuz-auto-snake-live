import {chromium} from 'playwright';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const duration=Number(process.env.SOAK_MS??1800000),base=process.env.TEST_BASE_URL??'http://127.0.0.1:5173';
if(!Number.isFinite(duration)||duration<1000)throw Error('SOAK_MS must be >= 1000');
const executablePath=process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const start=Date.now(),errors:string[]=[],samples:unknown[]=[];
try{
  const context=await browser.newContext({viewport:{width:1080,height:1920}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/overlay');await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor();
  let ticks=0,previous=0;
  while(Date.now()-start<duration){await page.waitForTimeout(1000);ticks++;
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hyuz-snake-v1')??'{}'));
    assert(state.game?.now>=previous);previous=state.game.now;
    assert(state.game.snake.length>0);assert(state.inbox.length<=1000);
    if(process.env.SOAK_GIFTS==='1'&&ticks%10===0){const response=await context.request.post(base+'/api/mock',{headers:{Origin:base},data:{effect:ticks%60===0?'G10':'G02'}});assert(response.ok());}
    if(ticks%10===0)samples.push({elapsedMs:Date.now()-start,round:state.game.round,score:state.game.score,inbox:state.inbox.length});
  }
  assert.deepEqual(errors,[]);mkdirSync('test-results',{recursive:true});const result={passed:true,realElapsedMs:Date.now()-start,gifts:process.env.SOAK_GIFTS==='1',errors,samples};writeFileSync('test-results/soak.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
