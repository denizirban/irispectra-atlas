// IRISPECTRA — Cinematic Sound Engine v8.
// No perpetual chimes, pitched UI pings, fake "bloop" notes or musical stingers.
// Original environmental synthesis: diffuse currents, low pressure, wide space.
// Sound is illustrative: not measured cellular motion or diagnostic information.
import {createCinematicMaterials} from './cinematic-acoustics.js';
const button=document.querySelector('#audioToggle');
const status=document.querySelector('#audioStatus');
const AudioCtor=window.AudioContext||window.webkitAudioContext;
const PREF='irispectra-sonic-v4-muted'; // honor existing setting
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const STEMS=['pressure','flow','life','space'];
const MIX=[
 [.57,.17,.07,.23], // eye
 [.58,.25,.11,.26], // surface
 [.63,.44,.30,.26], // stroma
 [.66,.46,.45,.22], // cell
 [.78,.52,.57,.15], // organelle
 [.66,.36,.40,.33], // molecular
 [.50,.26,.34,.48]  // atomic conceptual structures
];
const ROUTES={
 crypt:{filter:1700,gain:[1,1,.90,.95],pan:0},
 pigment:{filter:1490,gain:[1.03,.83,1.17,.89],pan:-.06},
 muscle:{filter:1120,gain:[1.16,.76,1.03,.77],pan:.02},
 neural:{filter:2150,gain:[.85,.89,.83,1.17],pan:.08}
};
let muted=false;try{muted=localStorage.getItem(PREF)==='1'}catch{}
let ctx=null,materials=null,master=null,mixBus=null,effectsBus=null,compressor=null;
let room=null,roomGain=null,roomFilter=null,subFilter=null,upperFilter=null;
let tracks=[],activeSources=new Set(),currentRoute='crypt',stage=0,depth=.07;
let playing=false,ready=false,building=false,previousStage=null,lastTransition=0,lastContact=0,lastMotion=0;
let soundLevel=.64,stopTimer=0,environmentTimer=0,nextAccent=0,variation=0,error='';
const icon=(on)=>on?
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.4 9a4 4 0 0 1 0 6"/><path d="M18.8 6.6a8 8 0 0 1 0 10.8"/></svg>':
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
function repaint(){
 const on=playing&&!muted&&ctx?.state==='running';
 const message=error||(muted?'Sound off':on?'Cinematic ambience on':'Tap to hear the Atlas');
 if(button){
  button.innerHTML=icon(on);
  button.dataset.state=on?'playing':muted?'muted':'ready';
  button.title=message;
  button.setAttribute('aria-label',on?'Mute Atlas ambience':'Enable Atlas ambience');
  button.setAttribute('aria-pressed',String(on));
 }
 if(status)status.textContent=message;
}
function makeRoom(){
 const duration=1.05,n=Math.round(ctx.sampleRate*duration);
 const impulse=ctx.createBuffer(2,n,ctx.sampleRate);
 for(let side=0;side<2;side++){
  const dst=impulse.getChannelData(side);let state=0,seed=(side+1)*1711;
  for(let i=0;i<n;i++){
   seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
   const w=(seed>>>0)/4294967295*2-1;
   state=.84*state+.16*w;
   const t=i/ctx.sampleRate,fade=Math.pow(1-t/duration,2.15);
   const first=i===Math.round((side?.039:.029)*ctx.sampleRate)?.24:0;
   const second=i===Math.round((side?.087:.073)*ctx.sampleRate)?.13:0;
   dst[i]=state*fade*.11+first+second;
  }
 }
 return impulse;
}
function prepare(){
 if(ctx)return;
 if(!AudioCtor)throw Error('Audio not supported on this browser');
 ctx=new AudioCtor({latencyHint:'playback'});
 master=ctx.createGain();master.gain.value=0;
 mixBus=ctx.createGain();mixBus.gain.value=1;mixBus.connect(master);
 effectsBus=ctx.createGain();effectsBus.gain.value=.72;effectsBus.connect(master);
 subFilter=ctx.createBiquadFilter();subFilter.type='highpass';subFilter.frequency.value=29;
 upperFilter=ctx.createBiquadFilter();upperFilter.type='lowpass';upperFilter.frequency.value=6800;upperFilter.Q.value=.6;
 compressor=ctx.createDynamicsCompressor();
 compressor.threshold.value=-17;compressor.knee.value=12;compressor.ratio.value=2.1;
 compressor.attack.value=.018;compressor.release.value=.34;
 master.connect(subFilter);subFilter.connect(upperFilter);
 upperFilter.connect(compressor);compressor.connect(ctx.destination);
 room=ctx.createConvolver();room.buffer=makeRoom();
 roomFilter=ctx.createBiquadFilter();roomFilter.type='lowpass';roomFilter.frequency.value=1900;
 roomGain=ctx.createGain();roomGain.gain.value=.085;
 room.connect(roomFilter);roomFilter.connect(roomGain);roomGain.connect(master);
}
function construct(){
 if(ready||building||!ctx)return;
 building=true;
 try{
  materials=createCinematicMaterials(ctx,window.matchMedia?.('(max-width:820px)').matches??false);
  const at=ctx.currentTime+.06;
  tracks=STEMS.map((name,i)=>{
   const source=ctx.createBufferSource();
   source.buffer=materials.stems[name];source.loop=true;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.45;
   const gain=ctx.createGain();gain.gain.value=0;
   const pan=ctx.createStereoPanner?.()||null;
   source.connect(filter);
   if(pan){filter.connect(pan);pan.connect(gain)}
   else filter.connect(gain);
   gain.connect(mixBus);
   if(i===1||i===3){const send=ctx.createGain();send.gain.value=i===1?.075:.13;gain.connect(send);send.connect(room)}
   source.start(at);
   return {source,filter,gain,pan,name};
  });
  ready=true;
  setWorld(currentRoute,stage,depth,true);
 }catch(e){
  error='Atlas sound unavailable';
  console.warn('Irispectra audio:',e);
  for(const n of tracks)try{n.source.stop()}catch{}
  tracks=[];materials=null;ready=false;
 }finally{building=false}
}
function setWorld(route=currentRoute,nextStage=stage,nextDepth=depth,instant=false){
 if(ROUTES[route])currentRoute=route;
 stage=clamp(Number.isFinite(Number(nextStage))?Math.round(Number(nextStage)):stage,0,6);
 depth=clamp(Number.isFinite(Number(nextDepth))?Number(nextDepth):depth,0,1);
 if(!ctx||!ready)return;
 const now=ctx.currentTime,character=ROUTES[currentRoute];
 const smooth=instant?.09:1.15;
 for(let i=0;i<tracks.length;i++){
  const track=tracks[i],gain=MIX[stage][i]*character.gain[i];
  track.gain.gain.setTargetAtTime(gain*.70,now,smooth);
  const movement=i===0?.60:i===1?1:i===2?1.12:1.6;
  const cutoff=clamp(character.filter*movement*(1+.20*(depth-.5)),120,4600);
  track.filter.frequency.setTargetAtTime(cutoff,now,smooth);
  if(track.pan)track.pan.pan.setTargetAtTime((i%2?.07:-.06)+character.pan,now,smooth);
 }
 // Inside the object: darker and less diffuse. Outside: more open and airy.
 const amount=stage/6;
 if(roomGain)roomGain.gain.setTargetAtTime(.105-.062*amount,now,1.6);
 if(roomFilter)roomFilter.frequency.setTargetAtTime(1950-790*amount,now,1.7);
 if(upperFilter)upperFilter.frequency.setTargetAtTime(6200-2150*amount,now,2.1);
}
function fade(to){
 if(!ctx||!master)return;
 const t=ctx.currentTime;
 master.gain.cancelScheduledValues(t);
 master.gain.setTargetAtTime(to?soundLevel:0,t,to?.56:.09);
}
function scheduleAccent(){
 if(environmentTimer)return;
 nextAccent=(ctx?.currentTime||0)+38;
 environmentTimer=setInterval(()=>{
  if(!playing||muted||document.hidden||!ctx||!ready)return;
  if(ctx.currentTime<nextAccent)return;
  // Very rare non-tonal movement. The music should breathe, not beep.
  nextAccent=ctx.currentTime+38+(variation++%4)*8;
  playContact(.2,'ambient');
 },2400);
}
function stopAccents(){if(environmentTimer){clearInterval(environmentTimer);environmentTimer=0}}
function start(){
 if(muted||document.hidden)return;
 if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
 try{prepare()}catch(e){error=e.message;repaint();return}
 const resumed=ctx.resume();
 if(!ready&&!building){
  building=true;
  Promise.resolve().then(()=>{
   building=false;
   if(muted||document.hidden)return;
   construct();
   playing=ready;
   if(playing){fade(true);scheduleAccent()}
   repaint();
  });
 }else if(ready){playing=true;fade(true);scheduleAccent()}
 if(resumed?.catch)resumed.catch(()=>{error='Tap speaker to start';playing=false;repaint()});
 error='';repaint();
}
function stop(){
 stopAccents();
 playing=false;fade(false);
 for(const source of activeSources)try{source.stop()}catch{}
 activeSources.clear();
 if(stopTimer)clearTimeout(stopTimer);
 if(ctx)stopTimer=setTimeout(()=>{
  stopTimer=0;
  if(!playing&&ctx.state==='running')ctx.suspend().catch(()=>{});
 },450);
 repaint();
}
function toggle(){
 if(muted){muted=false;save();start()}
 else if(!playing)start();
 else{muted=true;save();stop()}
}
function save(){try{localStorage.setItem(PREF,muted?'1':'0')}catch{}}
// All foley is soft, texture-based. No pitched note on every click.
function playContact(pan=.5,kind='select'){
 if(!playing||muted||!ready||ctx?.state!=='running'||activeSources.size>=4)return;
 const now=ctx.currentTime,index=(variation+++(stage%3))%3;
 const source=ctx.createBufferSource();source.buffer=materials.contacts[index];
 const gain=ctx.createGain(),filter=ctx.createBiquadFilter();
 filter.type='lowpass';filter.Q.value=.3;
 filter.frequency.value=kind==='ambient'?680:stage>3?1000:1550;
 gain.gain.value=kind==='ambient'?.14:.26;
 const stereo=ctx.createStereoPanner?.();
 source.connect(filter);filter.connect(gain);
 if(stereo){stereo.pan.value=clamp(pan,-.7,.7);gain.connect(stereo);stereo.connect(effectsBus)}
 else gain.connect(effectsBus);
 gain.connect(room);
 activeSources.add(source);
 source.onended=()=>{
  activeSources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();stereo?.disconnect();
 };
 source.start(now);
}
// Zoom in/out is intentionally silent as an event. Existing ambient layers
// morph through lowpass, room response and level: no one-shot chime, riser,
// whoosh or pressure transient competes with exploration.
function onStage(value,route){
 setWorld(route||currentRoute,value,depth);
 previousStage=stage;
}
function onSelect(role,x){
 const now=performance.now();
 if(now-lastContact<650)return;
 lastContact=now;
 // User explicitly selected a structure: understated material contact.
 const xNorm=Number.isFinite(Number(x))?Number(x):.5;
 playContact(clamp(xNorm*2-1,-1,1),String(role||'structure'));
}
function onMove(amount,x){
 if(!ready||!playing||amount<3)return;
 const now=performance.now();
 if(now-lastMotion<180)return;
 lastMotion=now;
 const flow=tracks[1];
 const xNorm=Number.isFinite(Number(x))?Number(x):.5;
 if(flow?.pan)flow.pan.pan.setTargetAtTime(clamp(xNorm*2-1,-.45,.45)*.36,ctx.currentTime,.45);
 const v=clamp(amount/55,0,1);
 flow?.filter.frequency.setTargetAtTime(
  clamp(ROUTES[currentRoute].filter*(.73+.28*v),360,2900),
  ctx.currentTime,.3);
}
button?.addEventListener('click',e=>{e.stopPropagation();toggle()});
function unlock(e){
 if(muted||playing||document.hidden||button?.contains(e.target))return;
 if(e.type==='keydown'&&['Tab','Shift','Alt','Control','Meta'].includes(e.key))return;
 start();
}
for(const event of ['pointerdown','keydown','touchstart']){
 document.addEventListener(event,unlock,{passive:true,capture:true});
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(playing)stop()}
 // Restart only on a new gesture: prevents surprise audio on tab return.
});
window.addEventListener('irispectra-sound',e=>{
 const d=e.detail||{};
 if(d.type==='route')setWorld(d.route,stage,depth);
 else if(d.type==='stage')onStage(d.stage,d.route);
 else if(d.type==='zoom')setWorld(currentRoute,stage,d.zoom);
 else if(d.type==='select')onSelect(d.kind,d.x);
 else if(d.type==='move')onMove(d.amount,d.x);
});
window.IrispectraSound={
 start,
 setEnabled(on){muted=!on;save();if(muted)stop();else start()},
 setWorld,
 setVolume(v){soundLevel=clamp(Number(v)||0,0,1);if(playing)fade(true)},
 getStatus:()=>({
  version:'Cinematic Acoustics v8',playing:playing&&!muted,muted,
  stage,route:currentRoute,depth,
  stems:tracks.length,context:ctx?.state||'not-started',error
 })
};
window.addEventListener('pagehide',()=>{
 stopAccents();
 if(stopTimer)clearTimeout(stopTimer);
 for(const node of tracks)try{node.source.stop()}catch{}
 for(const node of activeSources)try{node.stop()}catch{}
 activeSources.clear();tracks=[];materials=null;ready=false;playing=false;
 try{ctx?.close()}catch{}
});
window.addEventListener('pageshow',e=>{
 if(!e.persisted)return;
 ctx=null;master=null;mixBus=null;effectsBus=null;room=null;roomGain=null;
 roomFilter=null;subFilter=null;upperFilter=null;compressor=null;
 tracks=[];activeSources.clear();materials=null;ready=false;building=false;
 playing=false;repaint();
});
repaint();
