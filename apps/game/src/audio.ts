/** Original synthesized sounds: no external samples, downloads, or audio assets. */
export class GameAudio {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private noise:AudioBuffer|null=null;
  private voices=0;
  get running(){return this.context?.state==='running';}
  async enable(){
    if(!this.context||this.context.state==='closed'){this.context=new AudioContext();this.master=null;}
    if(!this.master){
      this.master=this.context.createGain();this.master.gain.value=.55;this.master.connect(this.context.destination);
      this.noise=this.context.createBuffer(1,Math.ceil(this.context.sampleRate*.045),this.context.sampleRate);
      const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(data.length*.2));
    }
    await this.context.resume();return this.running;
  }
  turn(){
    const ctx=this.context;if(!ctx||!this.running||!this.master||!this.noise||this.voices>=8)return;
    this.voices++;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=this.noise;source.playbackRate.value=.92+Math.random()*.16;filter.type='bandpass';filter.frequency.value=1900;filter.Q.value=.65;
    gain.gain.setValueAtTime(.32,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.04);
    source.connect(filter);filter.connect(gain);gain.connect(this.master);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.voices--;};source.start();source.stop(ctx.currentTime+.045);
  }
  apple(){this.tone(850,170,.12,.3);}
  gift(){this.tone(480,720,.10,.10);}
  round(){this.tone(300,120,.16,.12);}
  private tone(start:number,end:number,duration:number,volume:number){
    const ctx=this.context;if(!ctx||!this.running||!this.master||this.voices>=8)return;
    this.voices++;const oscillator=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
    oscillator.type='sine';oscillator.frequency.setValueAtTime(start,now);oscillator.frequency.exponentialRampToValueAtTime(end,now+duration);
    gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.005);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    oscillator.connect(gain);gain.connect(this.master);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices--;};oscillator.start();oscillator.stop(now+duration+.01);
  }
  dispose(){void this.context?.close();}
}
