// Irispectra / Sonic Material v4. Original synthesized ambience, droplets and
// glass-soft interaction tones. Sound is ON by default; autoplay starts only
// with a browser-permitted user gesture. No copyrighted audio files needed.
const button=document.querySelector('#audioToggle');
const status=document.querySelector('#audioStatus');
const AudioContextType=window.AudioContext||window.webkitAudioContext;
const PREF='irispectra-sonic-v4-muted';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let muted=false;try{muted=localStorage.getItem(PREF)==='1'}catch{}
let ctx=null,master=null,wet=null,delay=null,feedback=null,ambient=null,ambientURL='';
let pending=false,lastStage=null,lastZoomAt=0,lastSelectAt=0,lastMoveAt=0,depth=.07;
const voices=new Set(),sampleURLs=new Map();
let error='';
const icon=(on)=>on?
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.4 9a4 4 0 0 1 0 6"/><path d="M18.8 6.6a8 8 0 0 1 0 10.8"/></svg>':
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
function repaint(){
 const playing=!muted&&!!ambient&&!ambient.paused;
 const label=muted?'Sound off':playing?'Mute ambient sounds':'Sound on — tap to start';
 if(button){button.innerHTML=icon(playing);button.dataset.state=playing?'playing':muted?'muted':'ready';button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(playing));}
 if(status)status.textContent=error||label;
}
function makeWav(samples,sr=22050){
 const ab=new ArrayBuffer(samples.length*2+44),v=new DataView(ab);
 const write=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i))};
 write(0,'RIFF');v.setUint32(4,ab.byteLength-8,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);
 v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(clamp(samples[i],-.98,.98)*32767),true);
 return new Blob([ab],{type:'audio/wav'});
}
function ambience(){
 const sr=22050,L=8,N=sr*L,x=new Float32Array(N),chords=[146.875,196,246.875,293.625,392];
 for(let i=0;i<N;i++){
  const t=i/sr,slow=.72+.18*Math.cos(2*Math.PI*t/L);
  let y=0;
  for(let j=0;j<chords.length;j++){
   const f=chords[j],env=slow*(.88+.12*Math.cos(2*Math.PI*(j+1)*t/L));
   y+=Math.sin(2*Math.PI*f*t+.7*j)*env*[.16,.12,.07,.055,.026][j];
  }
  // Fine breathing harmonics, rounded to exact loop cycles, no distracting melody.
  y+=Math.sin(2*Math.PI*587.25*t)*.014*(.5+.5*Math.cos(2*Math.PI*t/L));
  y+=Math.sin(2*Math.PI*784*t)*.010*(.5+.5*Math.cos(4*Math.PI*t/L));
  x[i]=y;
 }
 return makeWav(x,sr);
}
function fallbackSample(f,type){
 const sr=22050,d=type==='stage'?.8:type==='select'?.5:.24,N=Math.ceil(sr*d),x=new Float32Array(N);
 for(let i=0;i<N;i++){
  const t=i/sr,env=Math.pow(1-t/d,3)*(1-Math.exp(-t*160));
  const phase=2*Math.PI*f*(t+.07*(1-Math.exp(-16*t))/16);
  x[i]=env*(.55*Math.sin(phase)+.18*Math.sin(phase*1.51+.3)+.10*Math.sin(phase*2.05))*.55;
 }
 return makeWav(x,sr);
}
function nativeFallback(type,f,vol){
 if(!ambient||ambient.paused||muted)return;
 const key=type+Math.round(f/16)*16;
 if(!sampleURLs.has(key))sampleURLs.set(key,URL.createObjectURL(fallbackSample(f,type)));
 const a=document.createElement('audio');a.src=sampleURLs.get(key);a.playsInline=true;a.volume=vol;
 voices.add(a);a.addEventListener('ended',()=>{voices.delete(a);a.removeAttribute('src');a.load()},{once:true});
 a.play().catch(()=>voices.delete(a));
 if(voices.size>6){const old=voices.values().next().value;old.pause();voices.delete(old)}
}
function setup(){
 if(!ambient){
  ambientURL=URL.createObjectURL(ambience());
  ambient=document.createElement('audio');
  ambient.src=ambientURL;ambient.preload='auto';ambient.loop=true;ambient.playsInline=true;ambient.volume=.43;
  ambient.addEventListener('playing',()=>{error='';repaint()});ambient.addEventListener('pause',repaint);
  ambient.addEventListener('error',()=>{error='Sound unavailable';repaint()});
 }
 if(!ctx&&AudioContextType){
  try{
   ctx=new AudioContextType();
   master=ctx.createGain();master.gain.value=0;
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-20;limiter.knee.value=14;limiter.ratio.value=2;limiter.attack.value=.009;limiter.release.value=.18;
   master.connect(limiter);limiter.connect(ctx.destination);
   delay=ctx.createDelay(.9);delay.delayTime.value=.152;
   feedback=ctx.createGain();feedback.gain.value=.19;
   wet=ctx.createGain();wet.gain.value=.22;
   delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
  }catch{ctx=null;master=null}
 }
}
function amplitude(to,time=.12){
 if(!ctx||!master)return;
 master.gain.setTargetAtTime(to,ctx.currentTime,Math.max(.015,time));
}
function start(){
 if(muted||document.hidden)return;
 try{setup()}catch{error='Unable to initialize sound';repaint();return}
 // Native media .play() runs directly in the gesture; no awaited work beforehand.
 const p=ambient.play();if(p?.catch)p.catch(()=>{error='Tap speaker icon to start sound';repaint()});
 if(ctx){
  try{
   const q=ctx.resume();
   if(q?.then)q.then(()=>amplitude(.70,.20)).catch(()=>{});
   else amplitude(.70,.20);
  }catch{}
 }
 repaint();
}
function stop(){
 if(ambient&&!ambient.paused)ambient.pause();
 if(ctx)amplitude(0,.035);
 for(const v of voices){v.pause();v.removeAttribute('src')}
 voices.clear();repaint();
}
function toggle(){
 if(muted){muted=false;try{localStorage.setItem(PREF,'0')}catch{};start()}
 else if(!ambient||ambient.paused)start();
 else{muted=true;try{localStorage.setItem(PREF,'1')}catch{};stop()}
 repaint();
}
function tone(freq,kind='drop',vol=.18,pan=0){
 if(muted||!ambient||ambient.paused)return;
 if(!ctx||ctx.state!=='running'||!master){nativeFallback(kind,freq,Math.min(.35,vol));return}
 const now=ctx.currentTime;
 const durations={drop:.32,select:.57,stage:1.15,move:.22};
 const d=durations[kind]||.3;
 const out=ctx.createGain(),filter=ctx.createBiquadFilter(),panner=ctx.createStereoPanner?.();
 filter.type='lowpass';filter.frequency.value=kind==='stage'?3500:kind==='drop'?4600:2900;filter.Q.value=.3;
 out.gain.setValueAtTime(.00001,now);
 out.gain.exponentialRampToValueAtTime(vol,now+.012);
 out.gain.exponentialRampToValueAtTime(.00001,now+d);
 filter.connect(out);
 if(panner){panner.pan.value=clamp(pan,-.6,.6);out.connect(panner);panner.connect(master);panner.connect(delay)}
 else {out.connect(master);out.connect(delay)}
 const ratios=kind==='stage'?[1,1.5,2.02]:kind==='select'?[1,1.37,2.20]:[1,1.48,2.66];
 const weights=kind==='stage'?[1,.29,.10]:[1,.20,.065];
 for(let j=0;j<ratios.length;j++){
  const oscillator=ctx.createOscillator(),g=ctx.createGain();
  oscillator.type='sine';
  const f=freq*ratios[j];
  oscillator.frequency.setValueAtTime(f*(kind==='drop'?1.58:1.10),now);
  oscillator.frequency.exponentialRampToValueAtTime(f,now+(kind==='drop'?.10:.065));
  g.gain.value=weights[j];oscillator.connect(g);g.connect(filter);oscillator.start(now);oscillator.stop(now+d+.01);
  oscillator.onended=()=>{oscillator.disconnect();g.disconnect()};
 }
}
function onZoom(z,delta){
 depth=clamp(z,0,1);
 const t=performance.now();if(Math.abs(delta)<.003||t-lastZoomAt<135)return;
 lastZoomAt=t;
 tone((delta>0?340:228)*(1+depth*.47),'drop',.12);
}
function onStage(s){
 if(lastStage===null){lastStage=s;return}
 if(lastStage===s)return;
 lastStage=s;
 tone([261,330,391,440,522][clamp(s,0,4)],'stage',.14);
}
function onSelect(k,x){
 const t=performance.now();if(t-lastSelectAt<165)return;lastSelectAt=t;
 const hash=[...String(k)].reduce((a,c)=>a+c.charCodeAt(0),0);
 tone(415+(hash%5)*40,'select',.14,x*2-1);
}
function onMove(amount,x){
 const t=performance.now();if(amount<5||t-lastMoveAt<290)return;lastMoveAt=t;
 tone(520+depth*240,'move',.028,x*2-1);
}
button?.addEventListener('click',e=>{e.stopPropagation();toggle()});
function unlock(e){if(!muted&&!document.hidden&&e.target!==button&&(!ambient||ambient.paused))start()}
for(const event of ['pointerdown','touchstart','keydown','wheel'])document.addEventListener(event,unlock,{passive:true,capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();repaint()});
window.addEventListener('irispectra-sound',e=>{
 const d=e.detail||{};
 if(d.type==='zoom')onZoom(d.zoom,d.delta);
 else if(d.type==='stage')onStage(d.stage);
 else if(d.type==='select')onSelect(d.kind,d.x??.5);
 else if(d.type==='move')onMove(d.amount,d.x??.5);
});
window.IrispectraSound={start,setEnabled:v=>{muted=!v;try{localStorage.setItem(PREF,muted?'1':'0')}catch{};if(muted)stop();else start()},getStatus:()=>({muted,playing:!!ambient&&!ambient.paused,context:ctx?.state??'unavailable',time:ambient?.currentTime||0})};
window.addEventListener('pagehide',()=>{stop();for(const u of sampleURLs.values())URL.revokeObjectURL(u);if(ambientURL)URL.revokeObjectURL(ambientURL)});
repaint();
