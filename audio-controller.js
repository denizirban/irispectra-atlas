// IRISPECTRA / LIVING SOUNDSCAPE v5
// Four original procedural, phase-aligned ambient stems. No licensed music,
// external samples, audio downloads, third-party trackers or MIDI playback.
// Browsers require a user gesture before AudioContext can produce sound.
const button=document.querySelector('#audioToggle');
const status=document.querySelector('#audioStatus');
const AudioCtor=window.AudioContext||window.webkitAudioContext;
const PREF='irispectra-sonic-v4-muted'; // Respect existing saved preference.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a),0,1);return x*x*(3-2*x)};
const mobile=window.matchMedia?.('(max-width:820px)').matches??false;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
const LOOP_LENGTH=mobile?16:24;
const STEMS=['bed','texture','pulse','details'];
const ROUTES={
 crypt:{gain:[1,.95,.80,.72],cut:2250,pan:0},
 pigment:{gain:[.93,.83,.66,1.04],cut:1950,pan:-.08},
 muscle:{gain:[1.06,.76,1.02,.63],cut:1480,pan:.04},
 neural:{gain:[.83,.72,.58,1.10],cut:2920,pan:.10}
};
// Stage levels sum to a deliberately conservative amount; user volume and
// compressor cap the result. No dramatic "reward" stingers in scientific UI.
const DEPTH_MIX=[
 [.65,.10,.03,.02],
 [.68,.21,.05,.04],
 [.56,.39,.12,.09],
 [.53,.49,.27,.13],
 [.60,.48,.39,.18],
 [.37,.29,.17,.46],
 [.24,.20,.12,.49]
];
const CHORD=[110,146.8324,164.8138,220,261.6256,293.6648];
// A-minor pentatonic: gentle, cohesive interactions across all pathways.
const NOTE=[164.8138,220,261.6256,293.6648,329.6276,392,440];
let ctx=null,master=null,limiter=null,reverb=null,wet=null;
let musicBus=null,subsonic=null,bassShelf=null,airShelf=null,roomTone=null;
let soundNodes=[],routeVoices={},fxInput=null,fxDelay=null,fxFeedback=null,fxSend=null;
let muted=false,unlocked=false,live=false,building=false,level=.62,error='';
let activeRoute='crypt',stage=0,depth=.07,lastStage=null;
let lastSelect=0,lastStageSound=0,lastMove=0,lastZoom=0;
let stopTimer=0,gesturePending=false,sourceReady=false;
let momentTimer=0,nextMomentAt=0,randomSeed=2417;
const activeEffects=new Set();
try{muted=localStorage.getItem(PREF)==='1'}catch{}
const icon=(on)=>on?
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.4 9a4 4 0 0 1 0 6"/><path d="M18.8 6.6a8 8 0 0 0 0 10.8"/></svg>':
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
function repaint(){
 const playing=live&&!muted&&ctx?.state==='running';
 const message=error||(muted?'Sound off':playing?'Sound on · Living Soundscape':'Sound ready · Tap to listen');
 if(button){
  button.innerHTML=icon(playing);
  button.dataset.state=playing?'playing':muted?'muted':'ready';
  button.title=message;
  button.setAttribute('aria-label',muted?'Enable Atlas sound':playing?'Mute Atlas sound':'Play Atlas sound');
  button.setAttribute('aria-pressed',String(playing));
 }
 if(status)status.textContent=message;
}
function persist(){try{localStorage.setItem(PREF,muted?'1':'0')}catch{}}
function hash(n,seed){
 let z=(n+seed*1129)|0;
 z^=z>>>16;z=Math.imul(z,0x7feb352d);z^=z>>>15;
 z=Math.imul(z,0x846ca68b);z^=z>>>16;
 return (z>>>0)/4294967295*2-1;
}
function cyclicNoise(t,points,seed){
 const x=t*points/LOOP_LENGTH;
 const i=Math.floor(x),f=x-i,v=f*f*(3-2*f);
 return hash(i%points,seed)*(1-v)+hash((i+1)%points,seed)*v;
}
const quantize=(f)=>Math.round(f*LOOP_LENGTH)/LOOP_LENGTH;
function oscillator(f,t,phase=0){return Math.sin(2*Math.PI*quantize(f)*t+phase)}
// All partial frequencies are quantized to exact loop periods. Bass stays
// phase-coherent in the center while upper textures are decorrelated in stereo.
// 24 kHz internal sample rate reduces iOS memory without audible loss for this
// intentionally dark, low-bandwidth atmospheric composition.
function buildStem(name){
 const sr=Math.min(ctx.sampleRate,24000),frames=Math.round(sr*LOOP_LENGTH);
 const buffer=ctx.createBuffer(2,frames,sr);
 const low=CHORD.map(quantize);
 const channels=[buffer.getChannelData(0),buffer.getChannelData(1)];
 for(let side=0;side<2;side++){
  const target=channels[side],width=side?1:-1,seed=side?13:7;
  for(let i=0;i<frames;i++){
   const t=i/sr,u=t/LOOP_LENGTH;
   const breath=.78+.22*Math.cos(2*Math.PI*u);
   let v=0;
   if(name==='bed'){
    // Mono-compatible foundations with softly divergent upper harmonics.
    const foundation=.34*oscillator(low[0],t)+.21*oscillator(low[1],t,.51)
     +.14*oscillator(low[2],t,1.27);
    const halo=.082*oscillator(low[3],t,.72+width*.13)
     +.056*oscillator(low[4],t,.88+width*.34)
     +.025*oscillator(low[5],t,.3+width*.53);
    v=(foundation+halo)*breath;
   }else if(name==='texture'){
    // Periodic micro-granular noise: no loop-edge mismatch or hard clicks.
    const broad=cyclicNoise(t,73,seed),fine=cyclicNoise(t,233,seed+3);
    const motion=.56+.19*Math.cos(2*Math.PI*(u*3+side*.08));
    v=(broad*.22+fine*.083
      +oscillator(quantize(73.4162),t,side*.24)*.026)*motion;
   }else if(name==='pulse'){
    // Four slow swells per cycle; never a kick drum or heartbeat imitation.
    const swell=Math.pow(.5-.5*Math.cos(2*Math.PI*(u*4+side*.014)),2.8);
    v=swell*(oscillator(low[0]*.5,t)*.25
      +oscillator(low[1],t,1.52+side*.12)*.095);
   }else{
    // Upper-register micro highlights, restrained so they remain listenable.
    const shimmer=Math.pow(.5+.5*Math.cos(2*Math.PI*(u*5+side*.05)),3)*.5;
    v=shimmer*(oscillator(low[2]*2,t,side*.28)*.13
      +oscillator(low[4]*2,t,1.1+side*.4)*.075
      +oscillator(low[3]*3,t,1.3-side*.15)*.027);
    v+=cyclicNoise(t,149,seed+11)*.014;
   }
   target[i]=v*.83;
  }
 }
 return buffer;
}
// A dark, diffuse short room: first reflections give proximity; the later
// exponential tail avoids the bright, metallic response of raw white noise.
function makeRoom(){
 const sr=ctx.sampleRate,duration=1.48,n=Math.round(sr*duration);
 const response=ctx.createBuffer(2,n,sr);
 for(let side=0;side<2;side++){
  const data=response.getChannelData(side),seed=side?37:19;
  let filtered=0;
  for(let i=0;i<n;i++){
   const t=i/sr;
   filtered=filtered*.84+hash(i,seed)*.16;
   const tail=Math.pow(Math.max(0,1-t/duration),2.35)*.11;
   const early=
    (Math.abs(t-(side?.027:.021))<1/sr?.17:0)+
    (Math.abs(t-(side?.059:.067))<1/sr?.12:0)+
    (Math.abs(t-(side?.119:.104))<1/sr?.06:0);
   data[i]=filtered*tail+early;
  }
 }
 return response;
}
// Mastering chain: coherent low end, a restrained midrange and soft top end.
// No artificial loudness target is claimed; actual LUFS requires device renders.
function graph(){
 if(ctx)return;
 if(!AudioCtor)throw Error('Web Audio unavailable.');
 ctx=new AudioCtor({latencyHint:'playback'});
 master=ctx.createGain();master.gain.value=0;
 musicBus=ctx.createGain();musicBus.gain.value=1;
 musicBus.connect(master);
 fxInput=ctx.createGain();fxInput.gain.value=.54;fxInput.connect(master);
 subsonic=ctx.createBiquadFilter();subsonic.type='highpass';subsonic.frequency.value=29;
 subsonic.Q.value=.62;
 bassShelf=ctx.createBiquadFilter();bassShelf.type='lowshelf';
 bassShelf.frequency.value=175;bassShelf.gain.value=-1.8;
 airShelf=ctx.createBiquadFilter();airShelf.type='highshelf';
 airShelf.frequency.value=6900;airShelf.gain.value=-1.5;
 limiter=ctx.createDynamicsCompressor();
 limiter.threshold.value=-16;limiter.knee.value=9;limiter.ratio.value=2.4;
 limiter.attack.value=.009;limiter.release.value=.27;
 master.connect(subsonic);subsonic.connect(bassShelf);
 bassShelf.connect(airShelf);airShelf.connect(limiter);
 limiter.connect(ctx.destination);
 fxDelay=ctx.createDelay(.8);fxDelay.delayTime.value=.187;
 fxFeedback=ctx.createGain();fxFeedback.gain.value=.115;
 fxSend=ctx.createGain();fxSend.gain.value=.10;
 fxDelay.connect(fxFeedback);fxFeedback.connect(fxDelay);
 fxDelay.connect(fxSend);fxSend.connect(fxInput);
 reverb=ctx.createConvolver();reverb.normalize=false;reverb.buffer=makeRoom();
 roomTone=ctx.createBiquadFilter();roomTone.type='lowpass';roomTone.frequency.value=2350;
 wet=ctx.createGain();wet.gain.value=.12;
 reverb.connect(roomTone);roomTone.connect(wet);wet.connect(master);
}
// Distinct but harmonically compatible living tonal identities. Voices stay
// phase-continuous; only a quiet route bus is crossfaded when the user travels.
const ROUTE_HARMONICS={
 crypt:[[146.8324,'sine',.32],[220,'sine',.17],[293.6648,'sine',.08]],
 pigment:[[110,'sine',.37],[164.8138,'triangle',.07],[261.6256,'sine',.055]],
 muscle:[[55,'sine',.20],[110,'sine',.26],[220,'triangle',.036]],
 neural:[[220,'sine',.17],[329.6276,'sine',.15],[392,'sine',.09]]
};
function buildRouteVoices(at){
 for(const [route,notes] of Object.entries(ROUTE_HARMONICS)){
  const gain=ctx.createGain();gain.gain.value=0;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';
  filter.frequency.value=route==='neural'?1720:route==='muscle'?720:1220;
  filter.Q.value=.48;
  const pan=ctx.createStereoPanner?.();
  if(pan){pan.pan.value=route==='pigment'?-.08:route==='neural'?.08:0;
   filter.connect(pan);pan.connect(gain)}
  else filter.connect(gain);
  gain.connect(musicBus);
  const sources=[];
  for(const [hz,type,amp] of notes){
   const osc=ctx.createOscillator(),partial=ctx.createGain();
   osc.type=type;osc.frequency.value=hz;partial.gain.value=amp;
   osc.connect(partial);partial.connect(filter);osc.start(at);
   sources.push(osc);
  }
  routeVoices[route]={gain,filter,pan,sources};
 }
}
function construct(){
 if(sourceReady||building)return;
 building=true;
 try{
  const startAt=ctx.currentTime+.065;
  const buffers=STEMS.map(buildStem);
  buildRouteVoices(startAt);
  soundNodes=STEMS.map((stem,i)=>{
   const source=ctx.createBufferSource();source.buffer=buffers[i];source.loop=true;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.28;
   const pan=ctx.createStereoPanner?.()||null;
   const gain=ctx.createGain();gain.gain.value=0;
   source.connect(filter);
   if(pan){filter.connect(pan);pan.connect(gain)}
   else filter.connect(gain);
   gain.connect(musicBus);
   // Slow independent filter LFOs subtly evolve each stem across repeated
   // loops (periods about 60–140 seconds), without introducing extra notes.
   const lfo=ctx.createOscillator(),lfoDepth=ctx.createGain();
   lfo.type='sine';lfo.frequency.value=.007+.003*i;
   lfoDepth.gain.value=95+i*48;
   lfo.connect(lfoDepth);lfoDepth.connect(filter.frequency);
   lfo.start(startAt);
   // Send very little of the ambient mix into a quiet synthetic room.
   if(i===1||i===3)gain.connect(reverb);
   source.start(startAt);
   return {stem,source,filter,pan,gain,lfo,lfoDepth};
  });
  sourceReady=true;
  setWorld(activeRoute,stage,depth,true);
 }catch(e){
  error='Audio unavailable';
  console.warn('IRISPECTRA_AUDIO',e);
  for(const node of soundNodes){try{node.source.stop()}catch{}try{node.lfo?.stop()}catch{}}
  soundNodes=[];
  sourceReady=false;
 }finally{building=false}
}
function setWorld(route=activeRoute,nextStage=stage,nextDepth=depth,immediate=false){
 if(ROUTES[route])activeRoute=route;
 stage=clamp(Number.isFinite(nextStage)?Math.round(nextStage):stage,0,6);
 depth=clamp(Number.isFinite(nextDepth)?nextDepth:depth,0,1);
 if(!ctx||!sourceReady)return;
 const character=ROUTES[activeRoute],mix=DEPTH_MIX[stage];
 const now=ctx.currentTime,tau=immediate?.10:activeRoute==='neural'?1.15:.86;
 for(let i=0;i<soundNodes.length;i++){
  const node=soundNodes[i],base=mix[i]*character.gain[i];
  const slowShift=stage>3&&i===3?1+.10*(depth-.75):1;
  node.gain.gain.setTargetAtTime(base*slowShift*.42,now,tau);
  const cutoff=character.cut*(i===0?.62:i===1?1:i===2?.55:1.45)*
   (1+.11*(depth-.5));
  node.filter.frequency.setTargetAtTime(clamp(cutoff,210,4800),now,tau);
  if(node.pan)node.pan.pan.setTargetAtTime((i%2?.10:-.09)+character.pan,now,tau);
 }
 // The simulated acoustic space becomes closer and less bright at small scales.
 for(const [name,voice] of Object.entries(routeVoices)){
  const chosen=name===activeRoute;
  const strength=chosen?(.12-(stage>=5?.035:0)):0;
  voice.gain.gain.setTargetAtTime(strength,now,immediate?.12:1.65);
 }
 if(wet)wet.gain.setTargetAtTime(.085+.045*(stage/6),now,1.35);
 if(roomTone)roomTone.frequency.setTargetAtTime(2650-stage*125,now,1.8);
 if(fxDelay)fxDelay.delayTime.setTargetAtTime(.176+stage*.006,now,2.0);
}
function ramp(on){
 if(!ctx||!master)return;
 const t=ctx.currentTime;
 master.gain.cancelScheduledValues(t);
 master.gain.setTargetAtTime(on?level:0,t,on?.55:.085);
}
function activate(){
 if(muted||document.hidden)return;
 if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
 try{graph()}catch(e){error=e.message;repaint();return}
 try{
  const promise=ctx.resume();
  // resume() is invoked synchronously inside the user's gesture; creation
  // is deferred to a microtask so the initial click is not blocked by DSP.
  if(!sourceReady&&!building){
   building=true;
   Promise.resolve().then(()=>{
    building=false;
    if(!muted&&!document.hidden)construct();
    if(sourceReady&&!muted)ramp(true);
    live=sourceReady&&!muted;
    unlocked=sourceReady||unlocked;
    if(live)beginLongForm();
    repaint();
   });
  }else{ramp(true);live=true;beginLongForm()}
  if(promise?.catch)promise.catch(()=>{error='Tap sound to enable audio';live=false;repaint()});
 }catch(e){error='Tap sound to enable audio';repaint();return}
 error='';repaint();
}
function deactivate(){
 haltLongForm();
 live=false;
 if(!ctx){repaint();return}
 ramp(false);
 if(stopTimer)clearTimeout(stopTimer);
 stopTimer=setTimeout(()=>{
  stopTimer=0;
  if(!live&&ctx?.state==='running')ctx.suspend().catch(()=>{});
 },450);
 for(const node of activeEffects){try{node.stop()}catch{}}
 activeEffects.clear();
 repaint();
}
function toggle(){
 if(muted){muted=false;persist();activate()}
 else if(!live){activate()}
 else{muted=true;persist();deactivate()}
 repaint();
}
// Low-intensity, route-aware original sounds. No claim of literal cell audio.
function tone(freq,type='select',volume=.045,pan=0,role=''){
 if(!live||muted||!ctx||ctx.state!=='running'||activeEffects.size>=14)return;
 const now=ctx.currentTime,duration=type==='glimmer'?2.4:type==='stage'?.88:.34;
 const attack=type==='glimmer'?.24:type==='stage'?.055:.018;
 const low=ctx.createBiquadFilter(),output=ctx.createGain();
 low.type='lowpass';low.Q.value=.4;
 low.frequency.value=type==='glimmer'?1450:type==='stage'?1720:2100;
 output.gain.setValueAtTime(.00001,now);
 output.gain.linearRampToValueAtTime(Math.max(.0003,volume),now+attack);
 output.gain.exponentialRampToValueAtTime(.00001,now+duration);
 low.connect(output);
 const stereo=ctx.createStereoPanner?.();
 if(stereo){stereo.pan.value=clamp(pan,-.58,.58);output.connect(stereo);stereo.connect(fxInput)}
 else output.connect(fxInput);
 output.connect(fxDelay);
 const molecular=/molecul|atom|bond|tyros|protein|enzyme|melanin/i.test(role);
 const tissue=/collagen|fiber|stroma|crypt|membrane/i.test(role);
 const ratios=type==='glimmer'?[1,2.003,3.012]:type==='stage'?[1,1.5,2.01]:
  molecular?[1,2.002,3.985]:tissue?[1,1.496,2.01]:[1,1.91];
 const weights=type==='glimmer'?[1,.16,.04]:type==='stage'?[1,.15,.04]:[1,.16,.035];
 let remaining=ratios.length;
 for(let j=0;j<ratios.length;j++){
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  const hz=Math.max(55,Math.min(2600,freq*ratios[j]));
  osc.type='sine';osc.frequency.setValueAtTime(hz*(type==='glimmer'?.998:.976),now);
  osc.frequency.exponentialRampToValueAtTime(hz,now+(type==='glimmer'?.7:.12));
  amp.gain.value=weights[j];osc.connect(amp);amp.connect(low);
  activeEffects.add(osc);
  osc.onended=()=>{
   activeEffects.delete(osc);osc.disconnect();amp.disconnect();
   if(--remaining===0){low.disconnect();output.disconnect();stereo?.disconnect()}
  };
  osc.start(now);osc.stop(now+duration+.025);
 }
 if(type!=='glimmer'&&musicBus){
  musicBus.gain.setTargetAtTime(.84,now,.07);
  musicBus.gain.setTargetAtTime(1,now+duration*.65,.40);
 }
}
function random01(){
 randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;
 return randomSeed/4294967296;
}
// Long-form variation without a repeating melody or heavy sound-file downloads.
function advanceLongForm(){
 if(!live||muted||!ctx||document.hidden||ctx.state!=='running')return;
 const now=ctx.currentTime;
 if(now<nextMomentAt)return;
 const stretch=stage<2?1.25:stage>4?.82:1;
 nextMomentAt=now+(18+random01()*23)*stretch*(reducedMotion?1.35:1);
 tone(NOTE[Math.floor(random01()*NOTE.length)]*
  (stage<=2?.5:stage>=5?1:.75),'glimmer',.008+random01()*.006,
  random01()*.68-.34,'molecule');
}
function beginLongForm(){
 if(!ctx||momentTimer)return;
 nextMomentAt=ctx.currentTime+18+random01()*12;
 momentTimer=setInterval(advanceLongForm,1900);
}
function haltLongForm(){
 if(momentTimer){clearInterval(momentTimer);momentTimer=0}
}
function stageEvent(value,route){
 const previous=stage;
 setWorld(route||activeRoute,value,depth);
 if(lastStage===null){lastStage=stage;return}
 if(previous===stage||lastStage===stage)return;
 lastStage=stage;
 const t=performance.now();
 if(t-lastStageSound<1300)return;
 lastStageSound=t;
 tone(NOTE[stage], 'stage',.035);
}
function selectEvent(kind,x){
 const t=performance.now();
 if(t-lastSelect<320)return;
 lastSelect=t;
 const n=String(kind||'structure');
 const hashCode=[...n].reduce((sum,ch)=>(sum+ch.charCodeAt(0)*7)%97,0);
 tone(NOTE[hashCode%NOTE.length]*(stage>4?1.12:1),'select',.043,
  clamp((Number(x)||.5)*2-1,-1,1),n);
}
function zoomEvent(z){
 depth=clamp(Number(z)||0,0,1);
 if(!sourceReady)return;
 const t=performance.now();
 if(t-lastZoom<130)return;
 lastZoom=t;setWorld(activeRoute,stage,depth);
}
function moveEvent(amount,x){
 if(!sourceReady||!live||amount<3)return;
 const t=performance.now();
 if(t-lastMove<140)return;
 lastMove=t;
 // Movement changes space, not a new note every time a pointer moves.
 const pan=clamp(((Number(x)||.5)*2-1)*.18,-.23,.23);
 const node=soundNodes[1];
 node?.pan?.pan.setTargetAtTime(pan,ctx.currentTime,.30);
 // Transient spectral opening while travelling through connective tissue.
 const speed=clamp(amount/48,0,1);
 const cutoff=ROUTES[activeRoute].cut*(.80+.27*speed);
 node?.filter?.frequency.setTargetAtTime(clamp(cutoff,450,3500),ctx.currentTime,.20);
}
button?.addEventListener('click',e=>{e.stopPropagation();toggle()});
function gesture(e){
 if(muted||live||document.hidden)return;
 if(button?.contains(e.target))return;
 if(e.type==='keydown'&&['Tab','Shift','Control','Alt','Meta'].includes(e.key))return;
 if(gesturePending)return;
 gesturePending=true;activate();
 Promise.resolve().then(()=>{gesturePending=false});
}
for(const type of ['pointerdown','keydown','touchstart','wheel']){
 document.addEventListener(type,gesture,{passive:true,capture:true});
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(live)deactivate()}
 else if(unlocked&&!muted){activate()}
});
window.addEventListener('irispectra-sound',e=>{
 const detail=e.detail||{};
 if(detail.type==='route')setWorld(detail.route,stage,depth);
 else if(detail.type==='stage')stageEvent(detail.stage,detail.route);
 else if(detail.type==='zoom')zoomEvent(detail.zoom);
 else if(detail.type==='select')selectEvent(detail.kind,detail.x);
 else if(detail.type==='move')moveEvent(detail.amount,detail.x);
});
window.IrispectraSound={
 start:activate,
 setEnabled(value){muted=!value;persist();if(muted)deactivate();else activate()},
 setWorld, 
 setVolume(v){level=clamp(Number(v)||0,0,1);if(live)ramp(true)},
 getStatus:()=>({muted,playing:live&&!muted,context:ctx?.state||'not-started',
  stage,route:activeRoute,depth,stems:soundNodes.length,length:LOOP_LENGTH,error})
};
window.addEventListener('pagehide',()=>{
 haltLongForm();
 if(stopTimer)clearTimeout(stopTimer);
 for(const node of soundNodes){
  try{node.source.stop()}catch{}
  try{node.lfo?.stop()}catch{}
 }
 for(const voice of Object.values(routeVoices)){
  for(const source of voice.sources){try{source.stop()}catch{}}
 }
 for(const node of activeEffects){try{node.stop()}catch{}}
 soundNodes=[];activeEffects.clear();live=false;
 try{ctx?.close()}catch{}
});
repaint();
