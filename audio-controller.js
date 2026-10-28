// IRISPECTRA SONIC SYSTEM v3
// Original procedural tones; no remote audio files. HTMLMediaElement is primary
// on iOS Safari; Web Audio adds motion-sensitive timbre where available.
const button=document.getElementById('audioToggle');
const status=document.getElementById('audioStatus');
const AudioContextClass=window.AudioContext||window.webkitAudioContext;
const USER_PREF='irispectra-sonic-v3-muted';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||
  (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let muted=false;
try{muted=localStorage.getItem(USER_PREF)==='1'}catch{}
let ambient=null,context=null,gain=null,shimmer=null,shimmerGain=null;
let ready=false,unlockPending=false,loopUrl='',activeVoices=new Set();
let soundPosition=.10,stageIndex=null,lastZoom=0,lastMove=0,lastSelection=0;
let browserNotice='';
const symbols={
 playing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a9 9 0 0 1 0 12"/></svg>',
 off:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>'
};
function state(){
 const isPlaying=!muted&&!!ambient&&!ambient.paused;
 const txt=muted?'Sound off':isPlaying?'Sound on':'Tap for sound';
 if(button){
  button.innerHTML=symbols[isPlaying?'playing':'off'];
  button.dataset.state=isPlaying?'playing':muted?'muted':'ready';
  button.setAttribute('aria-label',txt);
  button.setAttribute('aria-pressed',String(isPlaying));
  button.title=txt;
 }
 if(status)status.textContent=browserNotice||txt;
}
function signed16(value){return Math.round(clamp(value,-.96,.96)*32767)}
function encodeWav(samples,rate){
 const buffer=new ArrayBuffer(44+samples.length*2);
 const view=new DataView(buffer);
 const write=(i,s)=>{for(let k=0;k<s.length;k++)view.setUint8(i+k,s.charCodeAt(k))};
 write(0,'RIFF');view.setUint32(4,36+samples.length*2,true);
 write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);
 write(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,signed16(samples[i]),true);
 return new Blob([buffer],{type:'audio/wav'});
}
function generatedAmbient(){
 const sr=22050,duration=4,N=sr*duration,samples=new Float32Array(N);
 // Frequencies are multiples of .25Hz for a perfectly seamless 4-second loop.
 // Upper-register warmth remains audible on phone speakers at modest volume.
 const fundamentals=[164.75,220,277.25,330];
 const phase=[0,.74,1.81,2.65];
 for(let i=0;i<N;i++){
  const t=i/sr;
  const swell=.79+.17*Math.cos(2*Math.PI*.25*t);
  const a=Math.sin(2*Math.PI*fundamentals[0]*t+phase[0])*.19;
  const b=Math.sin(2*Math.PI*fundamentals[1]*t+phase[1])*.14;
  const c=Math.sin(2*Math.PI*fundamentals[2]*t+phase[2])*.09;
  const d=Math.sin(2*Math.PI*fundamentals[3]*t+phase[3])*.065;
  const silk=Math.sin(2*Math.PI*440*t)*.021;
  samples[i]=(a+b+c+d+silk)*swell;
 }
 return encodeWav(samples,sr);
}
function generatedCue(type,frequency){
 const sr=22050,seconds=type==='stage'?1.04:type==='select'?.68:.28;
 const N=Math.round(sr*seconds),s=new Float32Array(N);
 for(let i=0;i<N;i++){
  const t=i/sr,p=i/N;
  const env=(1-Math.exp(-t*130))*Math.pow(1-p,type==='stage'?2.8:2.1);
  const base=frequency*(1+.10*Math.exp(-t*25));
  const wave=Math.sin(2*Math.PI*base*t) +.22*Math.sin(2*Math.PI*base*1.5*t+.3)+
    .08*Math.sin(2*Math.PI*base*2.02*t+.7);
  s[i]=wave*env*(type==='stage'?.43:type==='select'?.46:.31);
 }
 return encodeWav(s,sr);
}
const cueCache=new Map();
function cueURL(type,freq){
 const note=Math.round(freq/15)*15,key=type+note;
 if(!cueCache.has(key)){
  cueCache.set(key,URL.createObjectURL(generatedCue(type,note)));
 }
 return cueCache.get(key);
}
function prepare(){
 if(ready)return;
 // A native HTML audio loop is substantially easier to hear and resume on iOS
 // than a low-frequency oscillator graph on a suspended AudioContext.
 loopUrl=URL.createObjectURL(generatedAmbient());
 ambient=document.createElement('audio');
 ambient.src=loopUrl;ambient.loop=true;ambient.preload='auto';
 ambient.playsInline=true;ambient.volume=.50;
 ambient.addEventListener('play',state);
 ambient.addEventListener('pause',state);
 ambient.addEventListener('error',()=>{browserNotice='Sound unavailable';state()});
 ready=true;
}
function webAudioStart(){
 if(!AudioContextClass)return;
 try{
  if(!context){
   context=new AudioContextClass();
   gain=context.createGain();gain.gain.value=0;
   const filt=context.createBiquadFilter();filt.type='lowpass';filt.frequency.value=1200;
   gain.connect(filt);filt.connect(context.destination);
   shimmer=context.createOscillator();shimmer.type='sine';
   shimmer.frequency.value=440;shimmerGain=context.createGain();
   shimmerGain.gain.value=.021;
   shimmer.connect(shimmerGain);shimmerGain.connect(gain);shimmer.start();
  }
  if(context.state!=='running')context.resume().catch(()=>{});
  if(gain){
   gain.gain.setTargetAtTime(muted?0:.35,context.currentTime,.16);
   shimmer.frequency.setTargetAtTime(400+soundPosition*480,context.currentTime,.20);
  }
 }catch{ /* HTML audio remains the primary reliable sound path */ }
}
function start(){
 if(muted||document.hidden)return;
 try{prepare()}catch{browserNotice='Audio could not initialize';state();return}
 // Play immediately inside the gesture, *before* awaiting any promise.
 // A delayed .play() is rejected in some versions of mobile Safari.
 const result=ambient.play();
 webAudioStart();
 if(result&&typeof result.catch==='function'){
  result.then(()=>{browserNotice='';state()})
    .catch(()=>{browserNotice='Tap the sound icon to activate sound';state()});
 }
 state();
}
function stop(){
 if(ambient&&!ambient.paused)ambient.pause();
 for(const v of activeVoices){try{v.pause();v.src=''}catch{}}
 activeVoices.clear();
 if(gain&&context)gain.gain.setTargetAtTime(0,context.currentTime,.045);
 state();
}
function setMuted(value){
 muted=!!value;try{localStorage.setItem(USER_PREF,muted?'1':'0')}catch{}
 if(muted)stop();else start();
 state();
}
function fireCue(type,freq,volume=.38){
 if(muted||!ambient||ambient.paused||document.hidden)return;
 const player=document.createElement('audio');
 player.src=cueURL(type,freq);
 player.preload='auto';player.playsInline=true;player.volume=volume;
 activeVoices.add(player);
 player.addEventListener('ended',()=>{activeVoices.delete(player);player.src=''}, {once:true});
 const promise=player.play();
 if(promise?.catch)promise.catch(()=>{activeVoices.delete(player)});
 if(activeVoices.size>8){
  const old=activeVoices.values().next().value;old.pause();old.src='';activeVoices.delete(old);
 }
}
function zoom(z,delta=0){
 soundPosition=clamp(z,0,1);
 if(context&&shimmer&&context.state==='running'){
  shimmer.frequency.setTargetAtTime(380+soundPosition*530,context.currentTime,.13);
 }
 const now=performance.now();
 if(Math.abs(delta)<.004||now-lastZoom<145)return;
 lastZoom=now;
 fireCue('zoom',(delta>0?392:261)*(1+soundPosition*.36),.18);
}
function stage(next){
 if(stageIndex===null){stageIndex=next;return}
 if(stageIndex===next)return;
 stageIndex=next;
 fireCue('stage',[261,329,392,440,523][clamp(next,0,4)],.34);
}
function select(kind='surface'){
 const now=performance.now();if(now-lastSelection<175)return;
 lastSelection=now;
 const hash=[...String(kind)].reduce((s,c)=>s+c.charCodeAt(0),0);
 fireCue('select',440+(hash%7)*25,.35);
}
function motion(n){
 const now=performance.now();
 if(n<4||now-lastMove<460)return;
 lastMove=now;
 fireCue('zoom',520+soundPosition*200,.09);
}
button?.addEventListener('click',e=>{
 e.stopPropagation();
 if(muted)setMuted(false);
 else if(ambient?.paused||!ready)start();
 else setMuted(true);
});
function unlock(e){
 if(e.target===button||muted||document.hidden)return;
 if(!ambient||ambient.paused)start();
}
document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
document.addEventListener('touchstart',unlock,{capture:true,passive:true});
document.addEventListener('keydown',unlock,{capture:true,passive:true});
document.addEventListener('wheel',unlock,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)stop();
 else state();
});
window.addEventListener('irispectra-sound',e=>{
 const d=e.detail||{};
 if(d.type==='zoom')zoom(d.zoom,d.delta);
 else if(d.type==='stage')stage(d.stage);
 else if(d.type==='select')select(d.kind);
 else if(d.type==='move')motion(d.amount);
});
window.IrispectraSound={start,setEnabled:(v)=>setMuted(!v),getStatus:()=>({
 muted,ready,playing:!!ambient&&!ambient.paused,
 mediaTime:ambient?.currentTime??0,contextState:context?.state??'unavailable',
 mediaVolume:ambient?.volume??0
})};
state();
