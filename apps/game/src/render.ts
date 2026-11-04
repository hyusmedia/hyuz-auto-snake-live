import {engine,runtime} from './runtime';
import {COLS,ROWS} from './engine';
const cell=36;
export function draw(canvas:HTMLCanvasElement,alpha:number,time:number){
  const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,720,936);ctx.fillStyle='#0a1420';ctx.fillRect(0,0,720,936);
  ctx.strokeStyle='#162333';ctx.lineWidth=1;
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,936);ctx.stroke();}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*cell);ctx.lineTo(720,y*cell);ctx.stroke();}
  for(const f of engine.food){const x=(f.x+.5)*cell,y=(f.y+.5)*cell;ctx.fillStyle=f.gold?'#ffd45e':'#ff677b';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,10+Math.sin(time/230)*1.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#a3e986';ctx.fillRect(x,y-15,3,6);}
  for(const b of engine.bombs){ctx.fillStyle='#ffb65c';ctx.shadowColor='#ff9e48';ctx.shadowBlur=16;ctx.beginPath();ctx.arc((b.x+.5)*cell,(b.y+.5)*cell,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#111a24';ctx.font='bold 23px monospace';ctx.fillText('×',b.x*cell+9,b.y*cell+26);}
  for(let i=engine.snake.length-1;i>=0;i--){const p=engine.snake[i],old=engine.previous[i]??p,x=(old.x+(p.x-old.x)*alpha)*cell+3,y=(old.y+(p.y-old.y)*alpha)*cell+3;
    ctx.fillStyle=engine.active.G08||engine.active.G12?`hsl(${(i*20+time/15)%360} 90% 65%)`:engine.color;ctx.globalAlpha=i===0?1:.7+.3*(1-i/engine.snake.length);ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=i===0?18:4;ctx.beginPath();ctx.roundRect(x,y,30,30,9);ctx.fill();ctx.shadowBlur=0;
    if(i===0){ctx.fillStyle='#0c1720';ctx.fillRect(x+7,y+8,5,6);ctx.fillRect(x+20,y+8,5,6);if(engine.active.G11){ctx.strokeStyle='#72e5ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+15,y+15,24,0,Math.PI*2);ctx.stroke();}}
  }ctx.globalAlpha=1;
  if(time-engine.lastEat<300){ctx.fillStyle=`rgba(141,255,94,${.08*(1-(time-engine.lastEat)/300)})`;ctx.fillRect(0,0,720,936);}
  if(engine.restartAt||engine.paused||!engine.autoplay){ctx.fillStyle='#06101bce';ctx.fillRect(0,0,720,936);ctx.textAlign='center';ctx.fillStyle='#edfff5';ctx.font='bold 42px sans-serif';ctx.fillText(engine.restartAt?engine.reason:'AUTOPLAY PAUSED',360,440);ctx.font='24px monospace';ctx.fillStyle='#8dff5e';ctx.fillText(engine.restartAt?`NEXT ROUND IN ${Math.max(1,Math.ceil((engine.restartAt-time)/1000))}`:'Waiting for local admin',360,490);ctx.textAlign='left';}
}
