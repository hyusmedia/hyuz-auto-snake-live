import {Engine,COLS,ROWS} from './engine';
import {effects,isEffect,type GiftAction} from '../../../packages/shared/gifts';
export const engine=new Engine();
export const runtime={connected:false,epoch:'',cursor:0,inbox:[] as GiftAction[],notice:'',noticeUntil:0,lastGift:'Waiting for a demo gift',notifications:true,sound:false,fps:0,recovery:'',started:Date.now(),video:''};
const notices:string[]=[];
const storageKey='hyuz-snake-v1';
const stateFields=['snake','previous','food','bombs','score','best','round','apples','growth','color','now','restartAt','reason','paused','autoplay','speed','difficulty','active','pending','lastEat','lastExplosion'] as const;
export function save(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,game:Object.fromEntries(stateFields.map(k=>[k,engine[k]])),epoch:runtime.epoch,cursor:runtime.cursor,inbox:runtime.inbox,lastGift:runtime.lastGift,sound:runtime.sound,notifications:runtime.notifications}));}catch{runtime.recovery='Storage unavailable: refresh recovery disabled';}}
try{
  const raw=localStorage.getItem(storageKey);
  if(raw){const s=JSON.parse(raw);const g=s.game;
    const validCells=(cells:unknown)=>Array.isArray(cells)&&cells.length<=COLS*ROWS&&cells.every(p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<COLS&&p.y>=0&&p.y<ROWS);
    if(s.version!==1||!validCells(g.snake)||!g.snake.length||!validCells(g.previous)||!validCells(g.food)||!validCells(g.bombs)||!Array.isArray(s.inbox)||s.inbox.length>1000)throw Error('Invalid snapshot');
    if(['score','best','round','apples','growth','speed','now','restartAt','lastEat','lastExplosion'].some(k=>!Number.isFinite(g[k]))||g.speed<2||g.speed>20||g.growth<0||g.growth>60)throw Error('Invalid snapshot counters');
    if(typeof g.paused!=='boolean'||typeof g.autoplay!=='boolean'||typeof g.color!=='string'||!g.active||typeof g.active!=='object'||!Array.isArray(g.pending)||g.pending.length>128||g.pending.some((id:unknown)=>!isEffect(id)))throw Error('Invalid snapshot effects');
    if(Object.entries(g.active).some(([id,until])=>!isEffect(id)||!Number.isFinite(until)))throw Error('Invalid effect timers');
    for(const k of stateFields)if(Object.hasOwn(g,k))Object.assign(engine,{[k]:g[k]});
    runtime.epoch=String(s.epoch);runtime.cursor=Number(s.cursor)||0;runtime.inbox=s.inbox.filter((a:GiftAction)=>isEffect(a.effect)&&Number.isInteger(a.count)&&a.count>0&&a.count<=100);runtime.lastGift=String(s.lastGift??runtime.lastGift);runtime.sound=s.sound===true;runtime.notifications=s.notifications!==false;
  }
}catch{engine.reset();runtime.recovery='Snapshot invalid: started a fresh round';}
let socket:WebSocket|undefined,stopped=false,delay=1000,retry:ReturnType<typeof setTimeout>;
function receive(action:GiftAction){
  if(!action||!Number.isSafeInteger(action.seq)||action.seq<=runtime.cursor||!isEffect(action.effect)||!Number.isInteger(action.count)||action.count<1||action.count>100||action.event?.source!=='mock')return;
  if(runtime.inbox.length>=1000){runtime.recovery='Replay queue full: reconnect to resume';socket?.close();return;}
  runtime.inbox.push(action);runtime.cursor=action.seq;save();
}
export function connect(){
  stopped=false;
  const open=()=>{if(stopped)return;socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws?epoch=${encodeURIComponent(runtime.epoch)}&since=${runtime.cursor}`);
    socket.onopen=()=>{runtime.connected=true;delay=1000;};
    socket.onmessage=event=>{try{const msg=JSON.parse(event.data);
      if(msg.type==='hello'){
        if(runtime.epoch!==msg.epoch){runtime.epoch=msg.epoch;runtime.cursor=msg.seq;runtime.inbox=[];}
        if(msg.gap)runtime.recovery='Some gifts expired from the 1,000-event replay window';
        for(const action of msg.actions??[])receive(action);save();
      }else if(msg.type==='gift')receive(msg.action);
      else if(msg.type==='control'){
        switch(msg.command){case'pause':engine.paused=true;break;case'resume':engine.paused=false;break;case'restart':engine.reset();break;case'autoplay':engine.autoplay=msg.value===true;break;case'speed':engine.speed=msg.value;break;case'resetBest':engine.best=0;break;case'sound':runtime.sound=msg.value===true;break;case'notifications':runtime.notifications=msg.value===true;break;case'difficulty':engine.difficulty=msg.value;engine.speed=msg.value==='hard'?12:8;break;}save();
      }
    }catch{runtime.recovery='Ignored invalid server message';}};
    socket.onclose=()=>{runtime.connected=false;if(!stopped){retry=setTimeout(open,delay+Math.random()*300);delay=Math.min(delay*2,30000);}};
    socket.onerror=()=>socket?.close();
  };open();return ()=>{stopped=true;clearTimeout(retry);socket?.close();};
}
let lastGiftStep=0;
export function processGifts(now:number){
  if(now-lastGiftStep<200||engine.restartAt||engine.paused||!engine.autoplay)return;
  const action=runtime.inbox[0];
  if(action){const config=effects[action.effect];if(config.duration&&!engine.active[action.effect]&&Object.keys(engine.active).length>=4)return;
    lastGiftStep=now;
    if(!Object.hasOwn(action,'announced')){const text=`DEMO · ${action.event.username} · ${config.name} ×${action.count}`;runtime.lastGift=text;notices.push(text);if(notices.length>30)notices.shift();Object.assign(action,{announced:true});}
    engine.now=now;engine.apply(action.effect);action.count--;if(action.count===0)runtime.inbox.shift();save();
  }
  if(now>runtime.noticeUntil){runtime.notice=runtime.notifications?(notices.shift()??''):'';runtime.noticeUntil=now+3500;}
}
