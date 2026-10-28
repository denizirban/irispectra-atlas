// Irispectra Soundscape — original, synthesized spatial UI audio.
// No external soundtrack, download, or music file. Everything is generated
// locally through Web Audio after an explicit browser interaction.
const toggle=document.getElementById('audioToggle');
const status=document.getElementById('audioStatus');
const KEY='irispectra-sound-enabled-v2';
const AC=window.AudioContext||window.webkitAudioContext;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
let enabled=true;
try{enabled=localStorage.getItem(KEY)!=='0'}catch{}
let ctx=null,master=null,drone=[],water=null,waterFilter=null,waterGain=null;
let reverb=null,reverbInput=null;
let lastZoomPing=0,lastMotionPing=0,lastSelectPing=0,stageSeen=null;
let zoomPosition=.1,launching=false,created=false,permissionNotice=false;
const svg=(on)=>on?
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.6 6.5a8 8 0 0 1 0 11"/></svg>':
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
function report(msg){if(status)status.textContent=msg}
function redraw(){
 if(!toggle)return;
 const active=enabled&&ctx?.state==='running';
 toggle.dataset.state=active?'playing':'muted';
 toggle.innerHTML=svg(active);
 toggle.title=enabled?(active?'Mute Irispectra sounds':'Activate Irispectra sounds'):'Enable Irispectra sounds';
 toggle.setAttribute('aria-label',toggle.title);
 toggle.setAttribute('aria-pressed',String(!!active));
 report(toggle.title);
}
function ambientNoise(){
 // 2 seconds of filtered, softly moving air / liquid texture.
 const length=ctx.sampleRate*2|0;
 const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
 const data=buffer.getChannelData(0);let brown=0;
 for(let i=0;i<length;i++){
  brown=(brown+(Math.random()*2-1)*.03)*.995;
  data[i]=clamp(brown,-1,1);
 }
 const node=ctx.createBufferSource();node.buffer=buffer;node.loop=true;node.start();return node;
}
function impulse(){
 const length=(ctx.sampleRate*1.3)|0;
 const buf=ctx.createBuffer(2,length,ctx.sampleRate);
 for(let ch=0;ch<2;ch++){
  const arr=buf.getChannelData(ch);
  for(let i=0;i<length;i++)arr[i]=(Math.random()*2-1)*Math.pow(1-i/length,3);
 }
 return buf;
}
function createEngine(){
 ctx=new AC({latencyHint:'interactive'});
 master=ctx.createGain();master.gain.value=0;
 const comp=ctx.createDynamicsCompressor();
 comp.threshold.value=-23;comp.ratio.value=2.2;comp.knee.value=12;
 comp.attack.value=.012;comp.release.value=.21;
 master.connect(comp);comp.connect(ctx.destination);
 // A quiet synthetic atmospheric bed; 3 tones form a slowly modulating harmonic field.
 for(const [freq,level,type] of [[87.31,.007,'sine'],[130.81,.005,'sine'],[174.61,.0025,'triangle']]){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.value=level;
  o.connect(g);g.connect(master);o.start();drone.push({o,g,freq});
 }
 water=ambientNoise();waterFilter=ctx.createBiquadFilter();
 waterFilter.type='lowpass';waterFilter.frequency.value=320;waterFilter.Q.value=.45;
 waterGain=ctx.createGain();waterGain.gain.value=.006;
 water.connect(waterFilter);waterFilter.connect(waterGain);waterGain.connect(master);
 try{reverb=ctx.createConvolver();reverb.buffer=impulse();
  reverbInput=ctx.createGain();reverbInput.gain.value=.20;
  reverbInput.connect(reverb);reverb.connect(master);
 }catch{reverb=null;reverbInput=null}
 created=true;
}
function glide(value,time=.25){
 if(!ctx||!master)return;
 const now=ctx.currentTime;
 master.gain.cancelScheduledValues(now);
 master.gain.setTargetAtTime(value,now,Math.max(.01,time));
}
function updateAtmosphere(z){
 zoomPosition=clamp(z,0,1);
 if(!ctx||!created)return;
 const t=ctx.currentTime;
 waterFilter.frequency.setTargetAtTime(250+zoomPosition*990,t,.32);
 waterGain.gain.setTargetAtTime(.005+zoomPosition*.004,t,.40);
 for(let i=0;i<drone.length;i++){
  const tone=drone[i];
  tone.o.detune.setTargetAtTime(Math.sin(zoomPosition*2.9+i)*3.1,t,.50);
 }
}
async function unlock(){
 if(!enabled||!AC||document.hidden)return false;
 if(launching)return false;
 if(!ctx){
  try{createEngine()}catch{report('Audio unavailable');return false}
 }
 if(ctx.state==='running'){glide(.53,.35);redraw();return true}
 launching=true;
 try{
  await ctx.resume();
  glide(.53,.35);
  updateAtmosphere(zoomPosition);
 }catch{permissionNotice=true;report('Tap the sound icon to enable audio')}
 finally{launching=false;redraw()}
 return ctx.state==='running';
}
function ping(freq,volume=.08,pan=0,kind='water'){
 if(!enabled||!ctx||ctx.state!=='running')return;
 const now=ctx.currentTime;
 const f=ctx.createOscillator(),g=ctx.createGain();
 const stereo=typeof ctx.createStereoPanner==='function'?ctx.createStereoPanner():ctx.createGain();
 if('pan' in stereo)stereo.pan.value=clamp(pan,-.75,.75);
 f.type=kind==='glass'?'sine':'triangle';
 f.frequency.setValueAtTime(Math.max(70,freq)*1.25,now);
 f.frequency.exponentialRampToValueAtTime(Math.max(70,freq),now+.095);
 const tail=kind==='glass'?.80:.33;
 g.gain.setValueAtTime(.0001,now);
 g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.014);
 g.gain.exponentialRampToValueAtTime(.0001,now+tail);
 f.connect(g);g.connect(stereo);stereo.connect(master);
 if(reverbInput)stereo.connect(reverbInput);
 f.start(now);f.stop(now+tail+.02);
 f.onended=()=>{try{f.disconnect();g.disconnect();stereo.disconnect()}catch{}};
}
function soundZoom(z,delta=0,pan=0){
 const t=performance.now();updateAtmosphere(z);
 if(!enabled||!ctx||ctx.state!=='running||Math.abs(delta)<.001)return;
 if(t-lastZoomPing<108)return;lastZoomPing=t;
 const pitch=(delta>0?245:174)*Math.pow(2,zoomPosition*.67);
 ping(pitch,.028+Math.min(.018,Math.abs(delta)*.13),pan,'water');
}
function soundStage(stage,previous=stage-1){
 if(stageSeen===null){stageSeen=stage;return}
 if(stage===stageSeen)return;
 const old=stageSeen;stageSeen=stage;
 if(!enabled||!ctx||ctx.state!=='running')return;
 const freqs=[174.61,196,261.63,329.63,392];
 const freq=freqs[clamp(stage,0,4)]*(stage>=old?1:.83);
 ping(freq,.085,0,'glass');
 // One faint overtone gives each layer a soft opening/closing cue.
 ping(freq*1.5,.018,.22,'glass');
}
function soundSelect(kind='',x=.5){
 if(!enabled||!ctx||ctx.state!=='running')return;
 const t=performance.now();if(t-lastSelectPing<180)return;lastSelectPing=t;
 const id=String(kind).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
 ping(300+id%160,.065,x*2-1,'glass');
}
function soundMove(amount=.1,x=.5){
 if(!enabled||!ctx||ctx.state!=='running')return;
 const t=performance.now();if(t-lastMotionPing<240)return;lastMotionPing=t;
 if(Math.abs(amount)<1.1)return;
 ping(450+zoomPosition*270,.014+clamp(amount/200,0,.013),x*2-1,'water');
}
function setEnabled(next){
 enabled=!!next;
 try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}
 if(enabled){unlock().then(ok=>{if(ok)ping(392,.047,0,'glass')})}
 else glide(0,.12);
 redraw();
}
toggle?.addEventListener('click',()=>{
 // A muted icon means audio hasn't been unlocked yet, or user turned it off.
 if(!enabled)setEnabled(true);
 else if(!ctx||ctx.state!=='running')unlock();
 else setEnabled(false);
});
function startOnGesture(e){
 if(!enabled||document.hidden||e?.target===toggle)return;
 // WebAudio must start in a gesture. Ignore noisy repeated listeners after initialization.
 if(ctx?.state!=='running')unlock();
}
document.addEventListener('pointerdown',startOnGesture,{capture:true,passive:true});
document.addEventListener('touchstart',startOnGesture,{capture:true,passive:true});
document.addEventListener('keydown',startOnGesture,{capture:true,passive:true});
document.addEventListener('wheel',startOnGesture,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
 if(!ctx)return;
 if(document.hidden){glide(0,.02);ctx.suspend().catch(()=>{})}
 // Do not unexpectedly auto-play sound when the tab becomes visible again.
 redraw();
});
window.addEventListener('irispectra-sound',e=>{
 const d=e.detail||{};
 if(d.type==='zoom')soundZoom(d.zoom,d.delta,d.x??.5);
 else if(d.type==='stage')soundStage(d.stage,d.previous);
 else if(d.type==='select')soundSelect(d.kind,d.x??.5);
 else if(d.type==='move')soundMove(d.amount,d.x??.5);
 else if(d.type==='ambient')updateAtmosphere(d.zoom);
});
window.IrispectraSound={unlock,setEnabled,soundZoom,soundStage,soundSelect,soundMove};
redraw();
