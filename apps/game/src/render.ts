import {engine} from './runtime';
import {COLS,ROWS} from './engine';
const SIZE=720;
export function draw(canvas:HTMLCanvasElement,alpha:number,time:number){
  const ctx=canvas.getContext('2d')!,cw=SIZE/COLS,ch=SIZE/ROWS,thickness=Math.min(cw,ch)*.88;
  ctx.clearRect(0,0,SIZE,SIZE);ctx.fillStyle='#000';ctx.fillRect(0,0,SIZE,SIZE);
  for(const f of engine.food){const x=(f.x+.5)*cw,y=(f.y+.5)*ch;ctx.fillStyle=f.gold?'#e6ca42':'#df343a';ctx.beginPath();ctx.ellipse(x,y,14,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff9f9f';ctx.beginPath();ctx.ellipse(x-5,y-4,3,4,.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#83a64c';ctx.beginPath();ctx.ellipse(x+4,y-13,7,3,-.6,0,Math.PI*2);ctx.fill();}
  for(const b of engine.bombs){const x=(b.x+.5)*cw,y=(b.y+.5)*ch;ctx.fillStyle='#666';ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f7a748';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+4,y-8);ctx.lineTo(x+9,y-14);ctx.stroke();}
  const points=engine.snake.map((p,i)=>{const old=engine.previous[i]??p;return{x:(old.x+(p.x-old.x)*alpha+.5)*cw,y:(old.y+(p.y-old.y)*alpha+.5)*ch};});
  if(points.length){
    const path=new Path2D();path.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))path.lineTo(p.x,p.y);
    const color=engine.active.G08||engine.active.G12?`hsl(${time/45%360} 40% 50%)`:engine.color==='#8dff5e'?'#7c9b55':engine.color;
    ctx.lineWidth=thickness;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=color;ctx.stroke(path);
    for(let i=points.length-1;i>=0;i--){const p=points[i];ctx.fillStyle=engine.active.G08||engine.active.G12?`hsl(${(i*15+time/45)%360} 40% 50%)`:color;ctx.beginPath();ctx.arc(p.x,p.y,thickness/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#10170c';for(const [dx,dy,r] of [[-6,-4,3.5],[5,5,3.3],[7,-5,2.8],[-4,7,2.7]]){ctx.beginPath();ctx.arc(p.x+dx,p.y+dy,r,0,Math.PI*2);ctx.fill();}}
    const h=points[0],neck=points[1]??{x:h.x-cw,y:h.y},angle=Math.atan2(h.y-neck.y,h.x-neck.x);ctx.save();ctx.translate(h.x,h.y);ctx.rotate(angle);
    for(const side of [-1,1]){ctx.fillStyle='#f2e95e';ctx.beginPath();ctx.ellipse(4,side*8,8,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(7,side*8,3.6,5.2,0,0,Math.PI*2);ctx.fill();}ctx.restore();
    if(engine.active.G11){ctx.strokeStyle='#9fd8ec';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,thickness,0,Math.PI*2);ctx.stroke();}
  }
  if(engine.restartAt||engine.paused||!engine.autoplay){ctx.fillStyle='#000b';ctx.fillRect(0,0,SIZE,SIZE);ctx.textAlign='center';ctx.fillStyle='#d6d6d6';ctx.font='bold 34px sans-serif';ctx.fillText(engine.restartAt?engine.reason:'AUTOPLAY PAUSED',360,340);ctx.font='22px sans-serif';ctx.fillStyle='#b7c67c';ctx.fillText(engine.restartAt?`NEXT ROUND IN ${Math.max(1,Math.ceil((engine.restartAt-time)/1000))}`:'Waiting for local admin',360,385);ctx.textAlign='left';}
}
