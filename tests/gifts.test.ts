import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store,mockGift} from '../apps/server/src/store';
import {normalizeGift,mapGift} from '../packages/shared/gifts';
test('durable combo dedup: 3→3→5 applies exactly 5, including process restart',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hyuz-'));try{
    const path=join(dir,'state.json');let s=new Store(path);const event=mockGift();
    assert.equal(s.accept({...event,comboCount:3}),3);assert.equal(s.accept({...event,comboCount:3}),0);
    s=new Store(path);assert.equal(s.accept({...event,comboCount:5}),2);assert.equal(s.accept({...event,comboCount:2}),0);
    assert.equal(s.state.total,5);const a=s.dispatch(),b=s.dispatch();assert.equal(a?.count,3);assert.equal(b?.count,2);assert.equal(b?.seq,2);assert.equal(new Store(path).state.journal.length,2);
  }finally{rmSync(dir,{recursive:true});}
});
test('normalizer rejects malformed events; names override Jewels without multiplying combos',()=>{
  const e=mockGift();assert.throws(()=>normalizeGift({...e,comboCount:-1}));assert.throws(()=>normalizeGift({...e,jewelsAmount:'1'}));assert.throws(()=>normalizeGift({...e,timestamp:'bad'}));assert.equal(mapGift({...e,jewelsAmount:50,comboCount:10}),'G03');assert.equal(mapGift(e,{'Demo gift':'G11'}),'G11');assert.equal(mapGift({...e,giftName:'toString'}),'G01');
});
test('100-gift burst is durable; effects sorted by priority; full queue rejects without marking seen',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hyuz-'));try{const s=new Store(join(dir,'s.json'));
    for(let i=0;i<100;i++)s.accept(mockGift(),i===99?'G10':'G01');assert.equal(s.dispatch()?.effect,'G10');
    for(let i=s.state.pending.length;i<256;i++)s.accept(mockGift());const event=mockGift();assert.throws(()=>s.accept(event));s.dispatch();assert.equal(s.accept(event),1);assert.equal(s.accept(event),0);
  }finally{rmSync(dir,{recursive:true});}
});
