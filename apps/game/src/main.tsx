import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {engine,runtime,connect,processGifts,save} from './runtime';
import {draw} from './render';
import {effects,type EffectId} from '../../../packages/shared/gifts';
import './style.css';
function useTick(){const [,set]=useState(0);useEffect(()=>{const t=setInterval(()=>set(n=>n+1),250);return()=>clearInterval(t);},[]);}
function Game(){
  useTick();const canvas=useRef<HTMLCanvasElement>(null);const audio=useRef<AudioContext|null>(null);
  const [video,setVideo]=useState('');const [muted,setMuted]=useState(true);const [loop,setLoop]=useState(true);const [videoHeight,setVideoHeight]=useState(130);
  const [audioState,setAudioState]=useState('SOUND OFF');
  useEffect(()=>{
    const disconnect=connect();let frame=0,lastStep=Date.now(),lastSave=Date.now(),fpsAt=performance.now(),frames=0,lastApple=engine.apples,lastRound=engine.round,lastGift=runtime.lastGift;
    const update=()=>{const now=Date.now();try{
      processGifts(now);
      if(now-lastStep>=engine.interval){engine.step(now);lastStep=now;}
      if(runtime.sound&&(engine.apples!==lastApple||engine.round!==lastRound||runtime.lastGift!==lastGift)){
        if(audio.current?.state==='running'){const oscillator=audio.current.createOscillator(),gain=audio.current.createGain();oscillator.connect(gain);gain.connect(audio.current.destination);oscillator.frequency.value=runtime.lastGift!==lastGift?440+Object.keys(effects).findIndex(id=>runtime.lastGift.includes(effects[id as EffectId].name))*45:engine.round!==lastRound?260:660;gain.gain.setValueAtTime(.04,audio.current.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.current.currentTime+.12);oscillator.start();oscillator.stop(audio.current.currentTime+.12);}
      }
      lastApple=engine.apples;lastRound=engine.round;lastGift=runtime.lastGift;
      if(now-lastSave>1000){save();lastSave=now;}
    }catch{runtime.recovery='Game error recovered with a fresh round';engine.reset();lastStep=now;}};
    const tick=setInterval(update,25);
    const render=()=>{const now=Date.now();try{if(canvas.current)draw(canvas.current,Math.min(1,(now-lastStep)/engine.interval),now);}catch{runtime.recovery='Renderer error; restarting round';engine.reset();}frames++;if(performance.now()-fpsAt>=1000){runtime.fps=Math.round(frames*1000/(performance.now()-fpsAt));frames=0;fpsAt=performance.now();}frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);
    const persist=()=>save();window.addEventListener('pagehide',persist);return()=>{clearInterval(tick);cancelAnimationFrame(frame);disconnect();save();window.removeEventListener('pagehide',persist);};
  },[]);
  useEffect(()=>()=>{if(video)URL.revokeObjectURL(video);},[video]);
  const active=Object.keys(engine.active) as EffectId[];
  return <main className="broadcast"><header><div className="brand"><span className="brand-icon">H</span><div><h1>HYUZ<span> / AUTO SNAKE</span></h1><p>THE NEVER-ENDING ARCADE</p></div></div><div className="live"><i/>LIVE GAME</div></header>
    <div className="eyebrow"><span>SEASON 01 · NEON GARDEN</span><b>DEMO MODE</b></div>
    <section className="scoreboard"><div><label>CURRENT SCORE</label><strong>{String(engine.score).padStart(3,'0')}</strong></div><div><label>BEST SCORE</label><strong>{String(engine.best).padStart(3,'0')}</strong></div><div><label>ROUND</label><strong>{String(engine.round).padStart(2,'0')}</strong></div></section>
    <section className="guide"><div><span>✦</span><b>GIFTS CHANGE THE GAME</b><small>Development effects · not gift prices</small></div><ul><li>🎨 COLOR</li><li>🍎 APPLE RAIN</li><li>⚡ TURBO</li><li>💣 BOMBS</li><li>🌈 RAINBOW</li><li>🛡 SHIELD</li></ul></section>
    <div className={'notification '+(runtime.notice?'show':'')}><span>✦</span>{runtime.notice||'AUTOPLAY IS ON · EVERY ROUND IS A NEW STORY'}</div>
    {video&&<section className="video" style={{height:videoHeight}}><video src={video} autoPlay loop={loop} muted={muted} controls/><b>RECORDED VIDEO</b></section>}
    <section className="arena"><div className="arena-label"><span><i/>{engine.paused||!engine.autoplay?'PAUSED':'AUTOPLAY ACTIVE'}</span><span>{engine.apples} APPLES EATEN</span></div><canvas ref={canvas} width={720} height={936} aria-label="Automatically playing neon snake game"/><div className="arena-bottom"><span>NO HANDS. JUST INSTINCT.</span><span>{engine.snake.length} SEGMENTS</span></div></section>
    <section className="effect"><span>CURRENT EFFECT</span><strong>{active.length?active.map(id=>`${effects[id].name} ${Math.max(0,Math.ceil((engine.active[id]!-Date.now())/1000))}s`).join(' / '):'CLASSIC AUTOPLAY'}</strong></section>
    <section className="supporter"><div className="avatar">✦</div><div><label>LAST GIFT · SIMULATED</label><p>{runtime.lastGift}</p></div><span>DEMO</span></section>
    <div className="goal"><div><span>NEXT GOAL</span><b>{engine.score} / {Math.ceil((engine.score+1)/100)*100}</b></div><progress value={engine.score%100} max={100}/></div>
    <footer><b>WATCH. CHEER. CHANGE THE GAME.</b><p>Independent auto-play · Mock gifts only · YouTube not connected</p><div><span className={runtime.connected?'online':'offline'}>{runtime.connected?'DEMO SERVER ONLINE':'GIFT CONNECTION OFFLINE'}</span><span>{runtime.fps} FPS</span><span>OBS STATUS: UNKNOWN</span></div>{runtime.recovery&&<p className="warning">{runtime.recovery}</p>}</footer>
    <details className="local-settings"><summary>Local screen settings</summary><button onClick={async()=>{audio.current??=new AudioContext();await audio.current.resume();runtime.sound=audio.current.state==='running';setAudioState(runtime.sound?'SOUND ON':'SOUND BLOCKED');save();}}>{audioState}</button><label>Recorded MP4 <input type="file" accept="video/mp4" onChange={e=>{const f=e.target.files?.[0];if(f)setVideo(URL.createObjectURL(f));}}/></label><button onClick={()=>setVideo('')}>Hide video</button><label><input type="checkbox" checked={muted} onChange={e=>setMuted(e.target.checked)}/>Muted</label><label><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/>Loop</label><label>Video height<input type="range" min="80" max="240" value={videoHeight} onChange={e=>setVideoHeight(Number(e.target.value))}/></label></details>
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
  useEffect(()=>{const update=()=>{if(!ref.current)return;const height=ref.current.scrollHeight,scale=Math.min(innerWidth/608,innerHeight/height);setFit({scale,top:Math.max(0,(innerHeight-height*scale)/2)});};const observer=new ResizeObserver(update);if(ref.current)observer.observe(ref.current);window.addEventListener('resize',update);update();return()=>{observer.disconnect();window.removeEventListener('resize',update);};},[]);
  return <div className="screen"><div className="fit-screen" ref={ref} style={{transform:`translateX(-50%) scale(${fit.scale})`,top:fit.top}}><Game/></div></div>;
}
createRoot(document.getElementById('root')!).render(location.pathname==='/admin'?<Admin/>:<GameScreen/>);
