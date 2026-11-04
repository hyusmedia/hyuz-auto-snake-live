import {chromium} from 'playwright';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:3001';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage({viewport:{width:1080,height:1920}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const target=window as typeof window&{audioProbe:{clicks:number;pops:number;peak:number;state:string}};
    const probe=target.audioProbe={clicks:0,pops:0,peak:0,state:'uncreated'},Native=window.AudioContext;
    window.AudioContext=class extends Native{
      analyser:AnalyserNode;
      constructor(options?:AudioContextOptions){super(options);this.analyser=super.createAnalyser();this.analyser.fftSize=256;
        const values=new Float32Array(256);setInterval(()=>{probe.state=this.state;this.analyser.getFloatTimeDomainData(values);for(const value of values)probe.peak=Math.max(probe.peak,Math.abs(value));},5);}
      createGain(){const gain=super.createGain();gain.connect(this.analyser);return gain;}
      createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(when=0,offset=0,duration?:number)=>{probe.clicks++;if(duration===undefined)start(when,offset);else start(when,offset,duration);};return source;}
      createOscillator(){const oscillator=super.createOscillator(),start=oscillator.start.bind(oscillator),set=oscillator.frequency.setValueAtTime.bind(oscillator.frequency);let initial=oscillator.frequency.value;oscillator.frequency.setValueAtTime=(value,time)=>{initial=value;return set(value,time);};oscillator.start=(when=0)=>{if(initial>=800)probe.pops++;start(when);};return oscillator;}
    };
  });
  await page.goto(base+'/overlay');await page.getByText('DEMO SERVER ONLINE',{exact:true}).waitFor();
  await page.getByRole('button',{name:'ENABLE SOUND',exact:true}).click();await page.getByRole('button',{name:'SOUND ON',exact:true}).waitFor();
  await page.waitForFunction(()=>{const p=(window as typeof window&{audioProbe:{clicks:number;pops:number;peak:number}}).audioProbe;return p.clicks>=2&&p.pops>=1&&p.peak>.001;},{},{timeout:45000});
  const read=()=>page.evaluate(()=>(window as typeof window&{audioProbe:{clicks:number;pops:number;peak:number;state:string}}).audioProbe);
  const result=await read();assert.equal(result.state,'running');
  const response=await page.request.post(base+'/api/control',{headers:{Origin:base},data:{command:'sound',value:false}});assert(response.ok());await page.waitForTimeout(500);const silent=await read();await page.waitForTimeout(1500);assert.equal((await read()).clicks,silent.clicks);assert.equal((await read()).pops,silent.pops);assert.deepEqual(errors,[]);
  mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/eyes-apples-maze.png'});writeFileSync('test-results/audio.json',JSON.stringify({passed:true,...result,mutePassed:true,errors},null,2));console.log(JSON.stringify({passed:true,...result,mutePassed:true,errors},null,2));
}finally{await browser.close();}
