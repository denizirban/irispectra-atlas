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
 // A compact, original droplet model with an upward resonant chirp, rounded
 // transient and soft tail. Unlike a chime it has no sustained musical pitch.
 const sr=22050,d=type==='stage'?.98:type==='select'?.48:.35;
 const N=Math.ceil(sr*d),x=new Float32Array(N);
 const decay=type==='stage'?5.7:type==='select'?10:14;
 for(let i=0;i<N;i++){
  const t=i/sr,attack=1-Math.exp(-t*240);
  const phase=2*Math.PI*f*(t-.31*(1-Math.exp(-23*t))/23);
  const bubble=Math.sin(phase)*Math.exp(-decay*t);
  const overtone=.22*Math.sin(phase*1.91+.18)*Math.exp(-25*t);
  const click=.10*Math.sin(2*Math.PI*1750*t)*Math.exp(-165*t);
  const bloom=type==='stage'?.25*Math.sin(phase*.51)*Math.exp(-3.9*t):0;
  x[i]=(bubble+overtone+click+bloom)*attack*.47;
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
 const now=ctx.currentTime,durations={drop:.35,select:.56,stage:1.0,move:.18};
 const d=durations[kind]||.32;
 const output=ctx.createGain(),lowpass=ctx.createBiquadFilter();
 const stereo=ctx.createStereoPanner?.();
 lowpass.type='lowpass';lowpass.Q.value=.32;
 lowpass.frequency.setValueAtTime(kind==='stage'?3300:4200,now);
 output.gain.setValueAtTime(.00001,now);
 output.gain.exponentialRampToValueAtTime(Math.max(vol,.001),now+.009);
 output.gain.exponentialRampToValueAtTime(.00001,now+d);
 lowpass.connect(output);
 if(stereo){stereo.pan.value=clamp(pan,-.52,.52);output.connect(stereo);stereo.connect(master);stereo.connect(delay)}
 else{output.connect(master);output.connect(delay)}
 const partials=kind==='stage'?[1,1.5,2.01,.51]:kind==='select'?[1,1.92,2.8]:[1,1.9,3.15];
 const weights=kind==='stage'?[1,.11,.035,.23]:kind==='select'?[1,.18,.04]:[1,.20,.024];
 for(let j=0;j<partials.length;j++){
  const osc=ctx.createOscillator(),amp=ctx.createGain(),partial=partials[j];
  osc.type='sine';
  const base=freq*partial;
  const rise=kind==='stage'?.91:.69;
  osc.frequency.setValueAtTime(base*rise,now);
  osc.frequency.exponentialRampToValueAtTime(base,now+(kind==='stage'?.22:.085));
  amp.gain.value=weights[j];
  osc.connect(amp);amp.connect(lowpass);osc.start(now);osc.stop(now+d+.02);
  osc.onended=()=>{osc.disconnect();amp.disconnect()};
 }
 // A tiny clean water-contact transient adds tactile definition without harsh clicks.
 if(kind==='drop'||kind==='select'){
  const click=ctx.createOscillator(),cg=ctx.createGain();
  click.type='sine';click.frequency.value=1420;
  cg.gain.setValueAtTime(vol*.075,now);
  cg.gain.exponentialRampToValueAtTime(.00001,now+.026);
  click.connect(cg);cg.connect(lowpass);click.start(now);click.stop(now+.03);
  click.onended=()=>{click.disconnect();cg.disconnect()};
 }
}
function onZoom(z,delta){
 depth=clamp(z,0,1);
 const t=performance.now();if(Math.abs(delta)<.003||t-lastZoomAt<135)return;
 lastZoomAt=t;
 const fineVariation=(Math.sin(t*.021)*.5+.5)*32;
 tone((delta>0?340:255)*(1+depth*.36)+fineVariation,'drop',.125);
}
function onStage(s){
 if(lastStage===null){lastStage=s;return}
 if(lastStage===s)return;
 lastStage=s;
 tone([235,294,349,415,494][clamp(s,0,4)],'stage',.11);
}
function onSelect(k,x){
 const t=performance.now();if(t-lastSelectAt<165)return;lastSelectAt=t;
 const hash=[...String(k)].reduce((a,c)=>a+c.charCodeAt(0),0);
 tone(380+(hash%5)*32,'select',.14,x*2-1);
}
function onMove(amount,x){
 const t=performance.now();if(amount<5||t-lastMoveAt<290)return;lastMoveAt=t;
 tone(450+depth*180,'move',.014,x*2-1);
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
