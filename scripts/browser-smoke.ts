import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,existsSync} from 'node:fs';
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const context=await browser.newContext({viewport:{width:1080,height:1920}});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  mkdirSync('test-results',{recursive:true});await page.goto(base+'/overlay');await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor();
  const snapshot=async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hyuz-snake-v1')??'{}'));
  await page.waitForTimeout(2000);const initial=await snapshot();assert(initial.game.snake.length>=4);for(const selector of ['.reserved-person','.reserved-alert','.reserved-last-gift'])assert.equal(await page.locator(selector).evaluate(el=>el.childElementCount),0);const board=await page.locator('.reference-board').boundingBox();assert(board);assert(Math.abs(board.width-board.height)<1);
  await page.screenshot({path:'test-results/initial.png',fullPage:true});const admin=await context.newPage();await admin.goto(base+'/admin');await admin.getByRole('button',{name:/TEST APPLE RAIN$/}).click();await admin.getByRole('status').filter({hasText:'accepted'}).waitFor();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hyuz-snake-v1')??'{}').lastGift?.includes('APPLE RAIN'));
  const gifted=await snapshot();assert(gifted.cursor>initial.cursor);
  await admin.getByRole('button',{name:'TEST GIFT COMBO (3 → 3 → 5)',exact:true}).click();await admin.getByRole('status').filter({hasText:'"accepted":5'}).waitFor();
  await page.waitForTimeout(1000);const before=await snapshot();await page.reload();await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor();await page.waitForTimeout(1200);const after=await snapshot();assert(after.cursor>=before.cursor);assert(after.game.round>=before.game.round);
  await admin.getByRole('button',{name:/TEST GAME OVER$/}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hyuz-snake-v1')??'{}').game.restartAt>0);const dead=await snapshot();await page.waitForTimeout(3500);const restarted=await snapshot();assert(restarted.game.round>dead.game.round);
  await context.setOffline(true);const offline=await snapshot();await page.waitForTimeout(4000);const moving=await snapshot();assert(moving.game.now>offline.game.now);assert.notDeepEqual(moving.game.snake,offline.game.snake);await context.setOffline(false);await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor({timeout:35000});
  const forbidden=await context.request.post(base+'/api/mock',{headers:{Origin:'https://evil.example'},data:{effect:'G10'}});assert.equal(forbidden.status(),403);
  await admin.getByRole('button',{name:'TEST 100 RANDOM GIFTS',exact:true}).click();await admin.getByRole('status').filter({hasText:'"accepted":100'}).waitFor();
  await page.waitForTimeout(1500);const status=await (await context.request.get(base+'/api/status')).json();assert(status.pending<=256);assert(status.mode==='DEMO');assert(status.youtube==='NOT IMPLEMENTED');assert.deepEqual(errors,[]);
  mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/overlay.png',fullPage:true});await admin.screenshot({path:'test-results/admin.png',fullPage:true});
  await page.addInitScript(()=>{const state=JSON.parse(localStorage.getItem('hyuz-snake-v1')??'{}');if(state.game){state.game.speed='corrupt';localStorage.setItem('hyuz-snake-v1',JSON.stringify(state));}});
  await page.reload();await page.getByText('Snapshot invalid: started a fresh round',{exact:true}).waitFor();await page.waitForTimeout(1200);assert.equal(typeof (await snapshot()).game.speed,'number');assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['autoplay','mock effect','combo delta 5','refresh recovery','game-over restart','offline autonomous play','reconnection','cross-origin rejection','100-gift burst','no page errors'],layout:await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})),status:{pending:status.pending,total:status.total}},null,2));
}finally{await browser.close();}
