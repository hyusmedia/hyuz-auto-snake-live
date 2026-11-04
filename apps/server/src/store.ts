import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {normalizeGift,mapGift,effects,type EffectId,type GiftAction,type NormalizedGiftEvent} from '../../../packages/shared/gifts';
interface State{epoch:string;seq:number;seen:Record<string,number>;pending:Omit<GiftAction,'seq'>[];journal:GiftAction[];total:number;names:Record<string,EffectId>}
export class Store {
  state:State;
  constructor(private file:string){
    mkdirSync(dirname(file),{recursive:true});
    this.state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')) as State:{epoch:randomUUID(),seq:0,seen:{},pending:[],journal:[],total:0,names:{}};
    if(!this.state.epoch||!Array.isArray(this.state.journal)||!Array.isArray(this.state.pending))throw Error('Invalid store; preserve data file and restore a backup');
  }
  commit(next:State){writeFileSync(this.file+'.tmp',JSON.stringify(next),{mode:0o600});renameSync(this.file+'.tmp',this.file);this.state=next;}
  accept(raw:unknown,override?:EffectId){
    const event=normalizeGift(raw),s=this.state,k=JSON.stringify([event.source,event.id]);
    const previous=Object.hasOwn(s.seen,k)?s.seen[k]:0,delta=Math.max(0,event.comboCount-previous);
    if(!delta)return 0;
    if(!previous&&Object.keys(s.seen).length>=10000)throw Error('Dedup capacity reached; archive data before starting a new demo session');
    if(s.pending.length>=256)throw Error('Gift queue full; retry later');
    if(delta>100)throw Error('Combo delta exceeds 100; rejected without changing history');
    const pending=[...s.pending,{event,effect:override??mapGift(event,s.names),count:delta}];
    pending.sort((a,b)=>effects[b.effect].priority-effects[a.effect].priority);
    this.commit({...s,seen:{...s.seen,[k]:event.comboCount},pending,total:s.total+delta});return delta;
  }
  dispatch():GiftAction|undefined{const s=this.state;if(!s.pending.length)return;const [first,...rest]=s.pending;const action={...first,seq:s.seq+1};this.commit({...s,seq:action.seq,pending:rest,journal:[...s.journal,action].slice(-1000)});return action;}
  map(names:Record<string,EffectId>){this.commit({...this.state,names});}
}
export function mockGift(id=randomUUID(),comboCount=1):NormalizedGiftEvent{const now=new Date().toISOString();return {id,source:'mock',userId:'demo-viewer',username:'Demo Viewer',giftName:'Demo gift',jewelsAmount:0,comboCount,timestamp:now,receivedAt:now};}
