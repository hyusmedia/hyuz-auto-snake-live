import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {WebSocketServer,WebSocket} from 'ws';
import {Store,mockGift} from './store';
import {effects,isEffect,type EffectId} from '../../../packages/shared/gifts';
const production=process.argv.includes('--production');
const store=new Store(resolve('data/gifts.json'));
const wss=new WebSocketServer({noServer:true,maxPayload:1024});
let errorCount=0,lastError='';
const allowedHosts=new Set(['localhost:3001','127.0.0.1:3001','localhost:5173','127.0.0.1:5173']);
const origins=new Set([...allowedHosts].map(h=>'http://'+h));
function safe(req:IncomingMessage){return allowedHosts.has(req.headers.host??'')&&(!req.headers.origin||origins.has(req.headers.origin));}
function send(res:ServerResponse,status:number,data:unknown){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
function broadcast(data:unknown){const text=JSON.stringify(data);for(const c of wss.clients)if(c.readyState===WebSocket.OPEN){if(c.bufferedAmount>1024*1024)c.terminate();else c.send(text);}}
async function body(req:IncomingMessage){let text='';for await(const chunk of req){text+=chunk;if(text.length>16384)throw Error('Request too large');}return JSON.parse(text) as Record<string,unknown>;}
const server=createServer(async(req,res)=>{
  if(!safe(req)){send(res,403,{error:'Local access only'});return;}
  const url=new URL(req.url??'/','http://localhost');
  try{
    if(req.method==='GET'&&url.pathname==='/api/status'){const s=store.state;send(res,200,{mode:'DEMO',youtube:'NOT IMPLEMENTED',epoch:s.epoch,seq:s.seq,pending:s.pending.length,total:s.total,journal:s.journal.slice(-30),names:s.names,effects,errorCount,lastError,uptime:process.uptime()});return;}
    if(req.method==='POST'&&url.pathname.startsWith('/api/')){
      if(!req.headers.origin||!origins.has(req.headers.origin)||!req.headers['content-type']?.startsWith('application/json')){send(res,403,{error:'Local JSON requests with Origin required'});return;}
      const data=await body(req);
      if(url.pathname==='/api/mock'){
        if(data.batch===true){if(store.state.pending.length>156)throw Error('Insufficient queue capacity for a 100-gift batch');let accepted=0;for(let i=0;i<100;i++){store.accept(mockGift(),Object.keys(effects)[Math.floor(Math.random()*12)] as EffectId);accepted++;}send(res,200,{accepted});return;}
        if(data.combo===true){const event=mockGift();const counts=[3,3,5];let accepted=0;for(const count of counts)accepted+=store.accept({...event,comboCount:count},'G02');send(res,200,{accepted,expected:5});return;}
        if(!isEffect(data.effect))throw Error('Unknown effect');
        send(res,200,{accepted:store.accept(mockGift(),data.effect)});return;
      }
      if(url.pathname==='/api/control'){
        const cmds=['pause','resume','restart','autoplay','speed','resetBest','sound','difficulty','notifications'];
        if(typeof data.command!=='string'||!cmds.includes(data.command))throw Error('Unknown control');
        if(data.command==='speed'&&(!Number.isFinite(data.value)||Number(data.value)<2||Number(data.value)>20))throw Error('Speed must be 2–20');
        if(['autoplay','sound','notifications'].includes(data.command)&&typeof data.value!=='boolean')throw Error('Boolean required');
        if(data.command==='difficulty'&&!['normal','hard'].includes(String(data.value)))throw Error('Invalid difficulty');
        broadcast({type:'control',command:data.command,value:data.value});send(res,200,{ok:true,deliveredTo:wss.clients.size});return;
      }
      if(url.pathname==='/api/mappings'){
        if(!data.names||typeof data.names!=='object'||Array.isArray(data.names))throw Error('Names object required');
        const entries=Object.entries(data.names);if(entries.length>100||entries.some(([k,v])=>!k||k.length>100||!isEffect(v)))throw Error('Invalid mappings');
        store.map(Object.fromEntries(entries) as Record<string,EffectId>);send(res,200,{ok:true});return;
      }
      send(res,404,{error:'Unknown endpoint'});return;
    }
    if(production&&req.method==='GET'&&!url.pathname.startsWith('/api')){
      const root=resolve('dist/game');const pathname=['/','/overlay','/admin'].includes(url.pathname)?'/index.html':decodeURIComponent(url.pathname);
      const path=resolve(root,'.'+pathname);if(!path.startsWith(root+'/')){send(res,403,{error:'Invalid path'});return;}
      const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
      try{const content=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(content);}catch{send(res,404,{error:'Not found'});}return;
    }
    send(res,404,{error:'Not found'});
  }catch(error){send(res,400,{error:error instanceof Error?error.message:'Request failed'});}
});
server.on('upgrade',(req,socket,head)=>{
  if(!safe(req)||!req.headers.origin||!origins.has(req.headers.origin)){socket.destroy();return;}
  const url=new URL(req.url??'/','http://localhost');if(url.pathname!=='/ws'){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{
    const s=store.state;const cursor=Math.max(0,Number(url.searchParams.get('since'))||0),same=url.searchParams.get('epoch')===s.epoch;
    const replay=same?s.journal.filter(a=>a.seq>cursor):[];
    const gap=same&&s.journal.length>0&&cursor<s.journal[0].seq-1;
    ws.send(JSON.stringify({type:'hello',epoch:s.epoch,seq:s.seq,gap,actions:replay}));
    // Clients receive only. Commands require an Origin-checked local HTTP request.
    ws.on('message',()=>ws.close(1008,'Read-only socket'));
  });
});
const timer=setInterval(()=>{try{const action=store.dispatch();if(action)broadcast({type:'gift',action});}catch{errorCount++;lastError='Persistent storage write failed; queue retained';}},200);
server.listen(3001,'127.0.0.1',()=>console.log('HYUZ DEMO backend: http://localhost:3001'+(production?'/overlay':'')));
function stop(){clearInterval(timer);for(const c of wss.clients)c.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
