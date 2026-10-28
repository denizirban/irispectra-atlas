// Irispectra ambient soundtrack — static licensed site asset.
// Playback begins at the first permitted interaction; browsers commonly block
// unprompted audio autoplay. Mute setting persists between visits.
const player=document.querySelector('#ambientAudio');
const toggle=document.querySelector('#audioToggle');
const status=document.querySelector('#audioStatus');
const KEY='irispectra-audio-muted';
const VOLUME=.16;
const icon=(on)=>on?
'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>':
'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
let muted=false,started=false,fade=null,unavailable=false;
try{muted=localStorage.getItem(KEY)==='1'}catch{}
player.loop=true;
player.volume=VOLUME;
player.preload='metadata';
function remember(){try{localStorage.setItem(KEY,muted?'1':'0')}catch{}}
function render(){
 const isOn=!muted&&started&&!player.paused&&!unavailable;
 toggle.innerHTML=icon(isOn);
 toggle.dataset.state=unavailable?'unavailable':isOn?'playing':'muted';
 toggle.setAttribute('aria-pressed',String(isOn));
 const title=unavailable?'Soundtrack temporarily unavailable':isOn?'Mute soundtrack':'Play soundtrack';
 toggle.setAttribute('aria-label',title);toggle.title=title;
 if(status)status.textContent=title;
}
function stopFade(){if(fade!==null){cancelAnimationFrame(fade);fade=null}}
function fadeVolume(to,duration=700,whenDone=null){
 stopFade();const from=player.volume,startedAt=performance.now();
 function tick(t){
  const p=Math.min(1,(t-startedAt)/duration),ease=p*p*(3-2*p);
  player.volume=from+(to-from)*ease;
  if(p>=1){fade=null;if(whenDone)whenDone();return}
  fade=requestAnimationFrame(tick);
 }
 fade=requestAnimationFrame(tick);
}
function start(){
 if(muted||unavailable||!player.paused)return;
 stopFade();player.volume=0;
 const p=player.play(); // must run directly in an actual user interaction.
 if(p&&typeof p.then==='function'){
  p.then(()=>{started=true;fadeVolume(VOLUME,1300);render()})
   .catch(()=>{player.volume=VOLUME;render()});
 }else{started=true;fadeVolume(VOLUME,1300);render()}
}
function mute(){
 if(muted)return;
 muted=true;remember();stopFade();
 fadeVolume(0,300,()=>{player.pause();player.volume=VOLUME;render()});
 render();
}
function unmute(){muted=false;remember();start();render()}
toggle.addEventListener('click',e=>{
 e.stopPropagation();
 if(unavailable)return;
 if(muted||player.paused)unmute();else mute();
});
function unlock(e){
 if(muted||unavailable)return;
 if(e?.target===toggle)return;
 // The very first touch, click, pinch or keyboard input can unlock playback.
 start();
}
document.addEventListener('pointerdown',unlock,{passive:true});
document.addEventListener('keydown',unlock);
document.addEventListener('touchstart',unlock,{passive:true});
player.addEventListener('playing',()=>{started=true;render()});
player.addEventListener('pause',render);
player.addEventListener('error',()=>{unavailable=true;stopFade();render()});
player.addEventListener('ended',()=>{if(!muted)start()});
window.addEventListener('pagehide',()=>{stopFade();player.pause()});
render();
