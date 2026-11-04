import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {engine,runtime,connect,processGifts,save} from './runtime';
import {draw} from './render';
import {GameAudio} from './audio';
import {effects,type EffectId} from '../../../packages/shared/gifts';
import './style.css';
function useTick(){const [,set]=useState(0);useEffect(()=>{const t=setInterval(()=>set(n=>n+1),250);return()=>clearInterval(t);},[]);}
function Game(){
  useTick();const canvas=useRef<HTMLCanvasElement>(null);const audio=useRef<GameAudio|null>(null);
  const [video,setVideo]=useState('');const [muted,setMuted]=useState(true);const [loop,setLoop]=useState(true);const [videoHeight,setVideoHeight]=useState(130);
  const [audioState,setAudioState]=useState('ENABLE SOUND');
  const enableSound=async()=>{try{audio.current??=new GameAudio();runtime.sound=await audio.current.enable();setAudioState(runtime.sound?'SOUND ON':'ENABLE SOUND');save();}catch{setAudioState('RETRY SOUND');}};
  useEffect(()=>{
    const disconnect=connect();let frame=0,lastStep=Date.now(),lastSave=Date.now(),fpsAt=performance.now(),frames=0,lastApple=engine.apples,lastRound=engine.round,lastGift=runtime.lastGift;
    const update=()=>{const now=Date.now();try{
      processGifts(now);
      if(now-lastStep>=engine.interval){
        const head={...engine.snake[0]},neck=engine.snake[1]?{...engine.snake[1]}:null,round=engine.round;
        engine.step(now);lastStep=now;
        const next=engine.snake[0],moved=next.x!==head.x||next.y!==head.y;
        if(runtime.sound&&round===engine.round&&moved&&neck&&(next.x-head.x!==head.x-neck.x||next.y-head.y!==head.y-neck.y))audio.current?.turn();
      }
      if(runtime.sound){if(engine.apples>lastApple)audio.current?.apple();if(engine.round!==lastRound)audio.current?.round();if(runtime.lastGift!==lastGift)audio.current?.gift();}
      lastApple=engine.apples;lastRound=engine.round;lastGift=runtime.lastGift;
      if(now-lastSave>1000){save();lastSave=now;}
    }catch{runtime.recovery='Game error recovered with a fresh round';engine.reset();lastStep=now;}};
    const tick=setInterval(update,25);
    const render=()=>{const now=Date.now();try{if(canvas.current)draw(canvas.current,Math.min(1,(now-lastStep)/engine.interval),now);}catch{runtime.recovery='Renderer error; restarting round';engine.reset();}frames++;if(performance.now()-fpsAt>=1000){runtime.fps=Math.round(frames*1000/(performance.now()-fpsAt));frames=0;fpsAt=performance.now();}frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);
    const persist=()=>save();window.addEventListener('pagehide',persist);return()=>{clearInterval(tick);cancelAnimationFrame(frame);disconnect();audio.current?.dispose();save();window.removeEventListener('pagehide',persist);};
  },[]);
  useEffect(()=>()=>{if(video)URL.revokeObjectURL(video);},[video]);
  const active=Object.keys(engine.active) as EffectId[];
  const soundLabel=runtime.sound&&audio.current?.running?'SOUND ON':audioState==='SOUND ON'?'ENABLE SOUND':audioState;
  const giftGuide=[
    {icon:'★',name:'STAR',effect:'CHANGE COLOR',detail:'SNAKE',tone:'star'},
    {icon:'🦴',name:'TREAT',effect:'APPLE RAIN',detail:'+5 APPLES',tone:'treat'},
    {icon:'◉',name:'GOLD',effect:'GOLDEN',detail:'APPLE',tone:'gold'},
    {icon:'⚡',name:'BOOST',effect:'TURBO',detail:'10 SECONDS',tone:'boost'},
    {icon:'🎉',name:'PARTY',effect:'RAINBOW',detail:'SNAKE',tone:'party'},
    {icon:'💣',name:'BOMB',effect:'SPAWN',detail:'BOMBS',tone:'bomb'},
    {icon:'🛡',name:'GUARD',effect:'SHIELD',detail:'10 SECONDS',tone:'shield'},
    {icon:'☠',name:'CHAOS',effect:'GAME OVER',detail:'ROUND ONLY',tone:'chaos'}
  ];
  return <main className="reference-stage">
    <section className="reserved-person" aria-label="Reserved space for person video">
      {video&&<><video src={video} autoPlay loop={loop} muted={muted} style={{height:videoHeight}}/><small>RECORDED VIDEO</small></>}
    </section>
    <section className="reserved-alert" aria-label="Reserved space for gift alert"/>
    <div className="round-badge">LEVEL {engine.round}</div>
    <div className="gift-heading"><h1>Game play gifts:</h1><div className="apple-meter"><div style={{width:`${engine.score%100}%`}}/><span>🍎 {engine.apples} APPLES · NEXT {Math.ceil((engine.score+1)/100)*100}</span></div></div>
    <section className="gift-strip" aria-label="Demo gift effect guide">
      {giftGuide.map(g=><div className="gift-column" key={g.name}><div className={'gift-tile '+g.tone}><span className="gift-icon">{g.icon}</span><small>{g.name}</small><span className="demo-token">✦ DEMO</span></div><b>{g.effect}</b><em>{g.detail}</em></div>)}
    </section>
    <section className="reference-board"><canvas ref={canvas} width={720} height={720} aria-label="Automatically playing spotted snake game"/></section>
    <div className="reference-score" aria-label="Current score">{engine.score}<span>=score</span></div>
    <section className="reserved-last-gift" aria-label="Reserved space for last gift sender"/>
    <button className="audio-toggle" onClick={enableSound}>{soundLabel}</button>
    <div className="minimal-status"><span>HYUZ · DEMO · AUTOPLAY {engine.paused||!engine.autoplay?'PAUSED':'ON'}</span><span className={runtime.connected?'online':'offline'}>{runtime.connected?'DEMO SERVER ONLINE':'GIFT CONNECTION OFFLINE'}</span><span>{runtime.fps} FPS{active.length?' · '+active.map(id=>effects[id].name).join(' / '):''}</span>{runtime.recovery&&<span className="warning">{runtime.recovery}</span>}</div>
    {location.pathname!=='/overlay'&&<details className="screen-options"><summary>Screen settings</summary><button onClick={enableSound}>{soundLabel}</button><label>Recorded MP4<input type="file" accept="video/mp4" onChange={e=>{const f=e.target.files?.[0];if(f)setVideo(URL.createObjectURL(f));}}/></label><button onClick={()=>setVideo('')}>Clear person area</button><label><input type="checkbox" checked={muted} onChange={e=>setMuted(e.target.checked)}/>Muted</label><label><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/>Loop</label><label>Video height<input type="range" min="80" max="150" value={videoHeight} onChange={e=>setVideoHeight(Number(e.target.value))}/></label></details>}
  </main>;

}
type Status={pending:number;total:number;uptime:number;youtube:string;journal:{seq:number;effect:EffectId;count:number;event:{username:string;source:string}}[];errorCount:number;lastError:string;names:Record<string,EffectId>};
function Admin(){
  const [status,setStatus]=useState<Status|null>(null),[message,setMessage]=useState(''),[name,setName]=useState(''),[mapping,setMapping]=useState<EffectId>('G01');
  useEffect(()=>{let active=true;const read=()=>fetch('/api/status').then(r=>r.json()).then(s=>{if(active)setStatus(s);}).catch(()=>{if(active)setStatus(null);});void read();const t=setInterval(read,1000);return()=>{active=false;clearInterval(t);};},[]);
  const post=async(path:string,data:unknown)=>{try{const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const b=await r.json();if(!r.ok)throw Error(b.error);setMessage(JSON.stringify(b));}catch(e){setMessage(String(e));}};
  const control=(command:string,value?:unknown)=>post('control',{command,value});
  return <main className="admin"><a href="/overlay" target="_blank" rel="noreferrer">↗ Open game / OBS screen</a><h1>HYUZ <span>CONTROL ROOM</span></h1><p className="warning">DEMO ONLY · All gifts are simulated. Keep one game screen open. YouTube receiver and OAuth are not implemented.</p>
    <section><h2>System status</h2><div className="metrics"><b>{status?'SERVER ONLINE':'SERVER OFFLINE'}</b><span>YouTube: NOT CONNECTED</span><span>OBS: UNKNOWN</span><span>Queue: {status?.pending??'—'}</span><span>Demo gift units: {status?.total??0}</span><span>Server uptime: {Math.floor(status?.uptime??0)}s</span></div><p>Game FPS, round and effects are shown on the game screen. Admin does not run a second game.</p></section>
    <section><h2>Game controls</h2><div className="buttons">{['resume','pause','restart','resetBest'].map(c=><button key={c} onClick={()=>control(c)}>{c.toUpperCase()}</button>)}<button onClick={()=>control('autoplay',true)}>AUTOPLAY ON</button><button onClick={()=>control('autoplay',false)}>AUTOPLAY OFF</button><button onClick={()=>control('sound',false)}>SOUND OFF</button><button onClick={()=>control('notifications',true)}>NOTICES ON</button><button onClick={()=>control('notifications',false)}>NOTICES OFF</button></div><label>Speed <input type="range" min="2" max="20" defaultValue="8" onChange={e=>control('speed',Number(e.target.value))}/></label><label>Difficulty <select onChange={e=>control('difficulty',e.target.value)}><option value="normal">Normal</option><option value="hard">Fast</option></select></label><p>Enable sound directly on the game screen to satisfy browser audio permissions.</p></section>
    <section><h2>Mock gift simulator</h2><p>Every action travels through the server, persistent deduplication store and WebSocket.</p><div className="buttons gifts">{Object.entries(effects).map(([id,e])=><button key={id} onClick={()=>post('mock',{effect:id})}><small>{id} · DEMO</small>{'TEST '+e.name}</button>)}<button onClick={()=>post('mock',{combo:true})}>TEST GIFT COMBO (3 → 3 → 5)</button><button onClick={()=>post('mock',{batch:true})}>TEST 100 RANDOM GIFTS</button></div><output role="status">{message}</output></section>
    <section><h2>Gift name mapping</h2><p>Names take priority over temporary Jewels ranges. No money is collected here.</p><input placeholder="Gift name" value={name} onChange={e=>setName(e.target.value)}/><select value={mapping} onChange={e=>setMapping(e.target.value as EffectId)}>{Object.entries(effects).map(([id,e])=><option key={id} value={id}>{e.name}</option>)}</select><button disabled={!name.trim()||!status} onClick={()=>post('mappings',{names:{...status?.names,[name.trim()]:mapping}})}>SAVE MAPPING</button><pre>{JSON.stringify(status?.names??{},null,2)}</pre></section>
    <section><h2>Recent delivery journal</h2><p>Errors: {status?.errorCount??0} {status?.lastError}</p><ol>{status?.journal.slice().reverse().map(a=><li key={a.seq}>#{a.seq} · DEMO · {a.event.username} · {effects[a.effect].name} ×{a.count}</li>)}</ol></section>
  </main>;
}
function GameScreen(){
  const ref=useRef<HTMLDivElement>(null);const [fit,setFit]=useState({scale:1,top:0});
  useEffect(()=>{const update=()=>{if(!ref.current)return;const height=1920,scale=Math.min(innerWidth/1080,innerHeight/height);setFit({scale,top:Math.max(0,(innerHeight-height*scale)/2)});};const observer=new ResizeObserver(update);if(ref.current)observer.observe(ref.current);window.addEventListener('resize',update);update();return()=>{observer.disconnect();window.removeEventListener('resize',update);};},[]);
  return <div className="screen"><div className="fit-screen" ref={ref} style={{transform:`translateX(-50%) scale(${fit.scale})`,top:fit.top}}><Game/></div></div>;
}
createRoot(document.getElementById('root')!).render(location.pathname==='/admin'?<Admin/>:<GameScreen/>);
