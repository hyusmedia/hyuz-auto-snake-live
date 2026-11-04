import {effects,type EffectConfig,type EffectId} from '../../../packages/shared/gifts';
export const COLS=20, ROWS=26;
export interface Cell{x:number;y:number}
export interface Food extends Cell{gold:boolean}
export interface Bomb extends Cell{until:number}
export const key=(p:Cell)=>p.y*COLS+p.x;
const inside=(p:Cell)=>p.x>=0&&p.x<COLS&&p.y>=0&&p.y<ROWS;
const around=(p:Cell):Cell[]=>[{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}].filter(inside);
export class Engine {
  snake:Cell[]=[]; previous:Cell[]=[]; food:Food[]=[]; bombs:Bomb[]=[];
  score=0;best=0;round=0;apples=0;growth=0;color='#8dff5e';
  now=0;restartAt=0;reason='';paused=false;autoplay=true;speed=8;difficulty='normal';
  active:Partial<Record<EffectId,number>>={};pending:EffectId[]=[];lastEat=-10000;lastExplosion=-10000;
  constructor(public random:()=>number=Math.random){this.reset();}
  reset(){this.round++;this.snake=[{x:5,y:13},{x:4,y:13},{x:3,y:13},{x:2,y:13}];this.previous=this.snake.map(p=>({...p}));this.food=[];this.bombs=[];this.score=0;this.apples=0;this.growth=0;this.active={};this.pending=[];this.restartAt=0;this.spawnApples(1);}
  free():Cell|undefined {
    const occupied=new Set([...this.snake,...this.food,...this.bombs].map(key));
    const cells:Cell[]=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!occupied.has(y*COLS+x))cells.push({x,y});
    return cells[Math.floor(this.random()*cells.length)];
  }
  spawnApples(count:number,gold=false){for(let i=0;i<Math.min(count,40);i++){if(this.food.length>=40)break;const p=this.free();if(!p)break;this.food.push({...p,gold});}}
  changeSnakeColor(){const colors=['#8dff5e','#41ddff','#ff65ce','#b18bff','#ffd459'];this.color=colors[Math.floor(this.random()*colors.length)];}
  activateTurbo(duration:number){delete this.active.G04;this.active.G03=this.now+duration;}
  activateSlowMotion(duration:number){delete this.active.G03;this.active.G04=this.now+duration;}
  growSnake(amount:number){this.growth=Math.min(60,this.growth+amount);}
  spawnBomb(count:number,duration=15000){for(let i=0;i<Math.min(count,10)&&this.bombs.length<24;i++){const p=this.free();if(p)this.bombs.push({...p,until:this.now+duration});}}
  spawnGoldenApple(){this.spawnApples(1,true);}
  activateRainbow(duration:number){this.active.G08=this.now+duration;}
  activateReverse(duration:number){this.snake.reverse();this.previous=this.snake.map(p=>({...p}));this.active.G09=this.now+duration;}
  triggerGameOver(reason='GIFT GAME OVER'){if(!this.restartAt){this.reason=reason;this.restartAt=this.now+2500;this.best=Math.max(this.best,this.score);}}
  activateShield(duration:number){this.active.G11=this.now+duration;}
  activateChaosMode(duration:number){this.active.G12=this.now+duration;this.changeSnakeColor();this.spawnApples(5);this.spawnBomb(3,duration);}
  apply(id:EffectId,config:EffectConfig=effects){
    if(this.restartAt){if(this.pending.length<128)this.pending.push(id);return;}
    const c=config[id];
    if(c.duration>0&&!this.active[id]&&Object.keys(this.active).length>=4){if(this.pending.length<128)this.pending.push(id);return;}
    switch(id){case'G01':this.changeSnakeColor();break;case'G02':this.spawnApples(c.strength);break;case'G03':this.activateTurbo(c.duration);break;case'G04':this.activateSlowMotion(c.duration);break;case'G05':this.growSnake(c.strength);break;case'G06':this.spawnBomb(c.strength,c.duration);break;case'G07':this.spawnGoldenApple();break;case'G08':this.activateRainbow(c.duration);break;case'G09':this.activateReverse(c.duration);break;case'G10':this.triggerGameOver();break;case'G11':this.activateShield(c.duration);break;case'G12':this.activateChaosMode(c.duration);}
  }
  get interval(){return 1000/(this.speed*(this.active.G03?effects.G03.strength:this.active.G04?effects.G04.strength:1));}
  pathToFood():Cell|undefined {
    const blocked=new Set([...this.snake.slice(1,-1),...this.bombs].map(key));
    const goals=new Set(this.food.map(key)),queue=[this.snake[0]],seen=new Set([key(this.snake[0])]);
    const first=new Map<number,Cell>();
    for(let i=0;i<queue.length;i++)for(const n of around(queue[i])){const k=key(n);if(blocked.has(k)||seen.has(k))continue;seen.add(k);const step=i===0?n:first.get(key(queue[i]))!;first.set(k,step);if(goals.has(k))return step;queue.push(n);}
  }
  space(start:Cell,blocked:Set<number>){const queue=[start],seen=new Set([key(start)]);for(let i=0;i<queue.length;i++)for(const n of around(queue[i]))if(!blocked.has(key(n))&&!seen.has(key(n))){seen.add(key(n));queue.push(n);}return seen.size;}
  choose():Cell|undefined {
    const target=this.pathToFood();
    const candidates=around(this.snake[0]).filter(n=>{
      const eating=this.food.some(f=>key(f)===key(n));
      const body=this.snake.slice(0,this.growth||eating?undefined:-1);
      return !body.some(p=>key(p)===key(n))&&!this.bombs.some(p=>key(p)===key(n));
    });
    let best:Cell|undefined,bestValue=-Infinity;
    for(const n of candidates){const eating=this.food.some(f=>key(f)===key(n));const future=[n,...this.snake];if(!eating&&!this.growth)future.pop();const blocked=new Set([...future.slice(1),...this.bombs].map(key));const space=this.space(n,blocked);const value=space+(target&&key(n)===key(target)&&space>Math.min(this.snake.length+5,100)?1000:0);if(value>bestValue){bestValue=value;best=n;}}
    return best;
  }
  step(now:number){
    this.now=now;
    for(const [id,end]of Object.entries(this.active))if(end!<=now)delete this.active[id as EffectId];
    this.bombs=this.bombs.filter(b=>b.until>now);
    if(this.restartAt){if(now>=this.restartAt){const pending=this.pending.splice(0);this.reset();this.pending=pending;}return;}
    if(this.paused||!this.autoplay)return;
    if(this.pending.length&&Object.keys(this.active).length<4)this.apply(this.pending.shift()!);
    if(this.restartAt)return;
    let next=this.choose();
    if(!next&&this.active.G11){delete this.active.G11;this.bombs=[];this.snake=this.snake.slice(0,1);this.growth=0;this.lastExplosion=now;next=this.choose();}
    if(!next){this.triggerGameOver('NO SAFE PATH');return;}
    this.previous=this.snake.map(p=>({...p}));this.snake.unshift(next);
    const foodIndex=this.food.findIndex(f=>key(f)===key(next));
    if(foodIndex>=0){const [f]=this.food.splice(foodIndex,1);this.score+=f.gold?50:10;this.apples++;this.lastEat=now;this.best=Math.max(this.best,this.score);}
    else if(this.growth>0)this.growth--;else this.snake.pop();
    if(!this.food.length)this.spawnApples(1);
    if(this.snake.length>=COLS*ROWS-1||this.score>=1000)this.triggerGameOver('ROUND COMPLETE');
  }
}
