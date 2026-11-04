import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Engine,COLS,ROWS,key} from '../apps/game/src/engine';
import {effects,type EffectId} from '../packages/shared/gifts';
function seeded(){let seed=761;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function valid(e:Engine){assert.equal(new Set(e.snake.map(key)).size,e.snake.length);assert(e.snake.every(p=>p.x>=0&&p.x<COLS&&p.y>=0&&p.y<ROWS));assert(e.food.length<=40);assert(e.bombs.length<=24);assert(e.pending.length<=128);assert(Number.isFinite(e.score));}
test('Phase 1: 30 simulated minutes of autonomous play, food, scoring and repeated rounds',()=>{
  const e=new Engine(seeded());let time=1000,totalApples=0,previousApples=0;
  for(let i=0;i<14400;i++){time+=125;e.step(time);valid(e);if(e.apples>previousApples)totalApples+=e.apples-previousApples;previousApples=e.apples;}
  assert(totalApples>30);assert(e.round>1);assert(e.best>0);
});
test('round game over restarts at 2.5s without touching pause or best score',()=>{const e=new Engine();e.now=1000;e.score=40;e.triggerGameOver();e.step(3499);assert.equal(e.round,1);e.step(3500);assert.equal(e.round,2);assert.equal(e.best,40);assert.equal(e.score,0);});
test('growth keeps tail occupied; AI never chooses a colliding cell',()=>{const e=new Engine();e.growth=5;const n=e.choose();assert(n);assert(!e.snake.some(p=>key(p)===key(n)));});
test('maze steering makes varied bends while still reaching apples without collisions',()=>{
  const e=new Engine(seeded());e.food=[{x:18,y:13,gold:false}];let turns=0,eaten=0,lastApples=0;
  for(let i=0;i<400;i++){
    const h={...e.snake[0]},neck={...e.snake[1]},round=e.round;e.step(1000+i*125);valid(e);
    const n=e.snake[0];if(round===e.round&&(n.x!==h.x||n.y!==h.y)&&(n.x-h.x!==h.x-neck.x||n.y-h.y!==h.y-neck.y))turns++;
    if(e.apples>lastApples)eaten+=e.apples-lastApples;lastApples=e.apples;
  }
  assert(turns>=50,`Expected winding movement, got ${turns} turns`);assert(eaten>=2,`Expected food progress, got ${eaten}`);
});
test('all 12 effects execute, timers expire, speed precedence restores normal play',()=>{
  for(const id of Object.keys(effects) as EffectId[]){const e=new Engine(seeded());e.now=100;e.apply(id);valid(e);if(id==='G10')assert(e.restartAt);e.step(20000);e.step(20125);valid(e);assert(!e.active[id]);}
  const e=new Engine();e.activateTurbo(10000);const turbo=e.interval;e.activateSlowMotion(10000);assert(e.interval>turbo);assert(!e.active.G03);e.step(11000);assert.equal(e.interval,125);
});
test('Phase 2: one simulated hour of dense effects stays bounded and autonomous',()=>{
  const random=seeded(),e=new Engine(random),ids=Object.keys(effects) as EffectId[];
  for(let i=0;i<28800;i++){if(i%8===0)e.apply(ids[Math.floor(random()*ids.length)]);e.step(i*125+1000);valid(e);}assert(e.round>10);
});
test('pause and autoplay OFF stop movement; bomb and apple capacity stay bounded',()=>{const e=new Engine(),head={...e.snake[0]};e.paused=true;e.step(1000);assert.deepEqual(e.snake[0],head);e.paused=false;e.autoplay=false;e.step(2000);assert.deepEqual(e.snake[0],head);for(let i=0;i<20;i++){e.spawnApples(1000);e.spawnBomb(1000);}valid(e);});
