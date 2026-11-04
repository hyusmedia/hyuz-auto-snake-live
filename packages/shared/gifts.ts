export const effects = {
  G01:{name:'CHANGE COLOR',duration:0,strength:1,priority:1},
  G02:{name:'APPLE RAIN',duration:0,strength:5,priority:1},
  G03:{name:'TURBO',duration:10000,strength:1.7,priority:2},
  G04:{name:'SLOW MOTION',duration:10000,strength:0.6,priority:2},
  G05:{name:'GROW SNAKE',duration:0,strength:5,priority:1},
  G06:{name:'SPAWN BOMB',duration:15000,strength:2,priority:2},
  G07:{name:'GOLDEN APPLE',duration:0,strength:1,priority:1},
  G08:{name:'RAINBOW',duration:10000,strength:1,priority:2},
  G09:{name:'REVERSE',duration:5000,strength:1,priority:2},
  G10:{name:'GAME OVER',duration:0,strength:1,priority:3},
  G11:{name:'SHIELD',duration:10000,strength:1,priority:2},
  G12:{name:'CHAOS MODE',duration:10000,strength:1,priority:3}
} as const;
export type EffectId = keyof typeof effects;
export type EffectConfig = Record<EffectId,{name:string;duration:number;strength:number;priority:number}>;
export interface NormalizedGiftEvent {id:string;source:'youtube'|'mock';userId:string;username:string;giftName:string;jewelsAmount:number;comboCount:number;timestamp:string;receivedAt:string}
export interface GiftAction {seq:number;event:NormalizedGiftEvent;effect:EffectId;count:number}
export const isEffect = (id:unknown):id is EffectId => typeof id==='string' && Object.hasOwn(effects,id);
export function normalizeGift(input:unknown):NormalizedGiftEvent {
  if(!input || typeof input!=='object') throw Error('Invalid gift');
  const g=input as Record<string,unknown>;
  for(const key of ['id','userId','username','giftName','timestamp','receivedAt']) {
    if(typeof g[key]!=='string'|| !g[key] || (g[key] as string).length>200) throw Error('Invalid '+key);
  }
  if(g.source!=='mock'&&g.source!=='youtube') throw Error('Invalid source');
  if(!Number.isSafeInteger(g.comboCount)||Number(g.comboCount)<1||Number(g.comboCount)>10000) throw Error('Invalid combo');
  if(!Number.isSafeInteger(g.jewelsAmount)||Number(g.jewelsAmount)<0) throw Error('Invalid jewels');
  if(!Number.isFinite(Date.parse(String(g.timestamp)))||!Number.isFinite(Date.parse(String(g.receivedAt)))) throw Error('Invalid date');
  return {id:String(g.id),source:g.source,userId:String(g.userId),username:String(g.username).slice(0,40),giftName:String(g.giftName),jewelsAmount:Number(g.jewelsAmount),comboCount:Number(g.comboCount),timestamp:String(g.timestamp),receivedAt:String(g.receivedAt)};
}
export function mapGift(g:NormalizedGiftEvent,names:Record<string,EffectId>={}):EffectId {
  if(Object.hasOwn(names,g.giftName)&&isEffect(names[g.giftName])) return names[g.giftName];
  const j=g.jewelsAmount;
  return j>=500?'G12':j>=200?'G08':j>=100?'G06':j>=50?'G03':j>=20?'G02':'G01';
}
