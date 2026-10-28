// Private ambient-sound player. A local MP3 stays in this browser's IndexedDB;
// nothing is uploaded or redistributed by the atlas. A licensed public asset can
// later be configured through the data-default-track attribute.
const button=document.querySelector('#audioToggle');
const audio=document.querySelector('#ambientAudio');
const picker=document.querySelector('#ambientPicker');
const status=document.querySelector('#audioStatus');
const STORAGE_KEY='irispectra-ambient-muted';
const DB_NAME='irispectra-local-audio';
const RECORD_KEY='user-ambient';
let sourceUrl=null,configured=false,busy=false;
const readMuted=()=>{try{return localStorage.getItem(STORAGE_KEY)==='1'}catch{return false}};
let muted=readMuted();
audio.volume=.16;
audio.loop=true;
audio.playsInline=true;
audio.preload='none';
function storeMuted(value){try{localStorage.setItem(STORAGE_KEY,value?'1':'0')}catch{}}
function putStatus(message){if(status)status.textContent=message}
function icon(name){
 if(name==='playing')return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
 if(name==='muted')return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/></svg>';
}
function draw(){
 const playing=configured&&!audio.paused;
 button.dataset.state=!configured?'empty':playing?'playing':'muted';
 button.setAttribute('aria-pressed',String(playing));
 button.setAttribute('aria-label',!configured?'Select ambient soundtrack':playing?'Mute ambient sound':'Play ambient sound');
 button.title=!configured?'Choose a local soundtrack':playing?'Mute ambient music':'Turn on ambient music';
 button.innerHTML=icon(!configured?'empty':playing?'playing':'muted');
 if(!configured)putStatus('Soundtrack: choose an audio file');
 else if(playing)putStatus('Ambient music playing');
 else putStatus('Ambient music paused');
}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('Storage unavailable'));return}
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('tracks'))request.result.createObjectStore('tracks')};
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>resolve(request.result);
 });
}
async function saveAudio(blob){
 const db=await openDB();
 try{
  await new Promise((resolve,reject)=>{
   const tr=db.transaction('tracks','readwrite');
   tr.objectStore('tracks').put(blob,RECORD_KEY);
   tr.oncomplete=resolve;tr.onerror=()=>reject(tr.error);
  });
 }finally{db.close()}
}
async function readAudio(){
 const db=await openDB();
 try{
  return await new Promise((resolve,reject)=>{
   const tr=db.transaction('tracks','readonly');
   const req=tr.objectStore('tracks').get(RECORD_KEY);
   req.onsuccess=()=>resolve(req.result||null);
   req.onerror=()=>reject(req.error);
  });
 }finally{db.close()}
}
function setSource(blob){
 if(sourceUrl){URL.revokeObjectURL(sourceUrl);sourceUrl=null}
 audio.pause();
 sourceUrl=URL.createObjectURL(blob);
 audio.src=sourceUrl;
 audio.load();
 configured=true;draw();
}
async function play(){
 if(!configured||muted)return;
 try{await audio.play()}catch{ /* autoplay blocked; the play button remains available */ }
 draw();
}
async function toggle(){
 if(busy)return;
 if(!configured){picker.click();return}
 if(!audio.paused){
  muted=true;storeMuted(true);audio.pause();draw();
 }else{
  muted=false;storeMuted(false);
  await play();
 }
}
button?.addEventListener('click',toggle);
picker?.addEventListener('change',async event=>{
 const file=event.target.files?.[0];
 if(!file)return;
 if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg)$/i.test(file.name)){
  putStatus('Please choose an audio file');return;
 }
 if(file.size>40*1024*1024){putStatus('Audio file exceeds the 40 MB local limit');return}
 busy=true;setSource(file);muted=false;storeMuted(false);
 try{await saveAudio(file)}catch{ /* use the current-tab audio even if local storage is blocked */ }
 busy=false;await play();
 picker.value='';
});
audio?.addEventListener('play',draw);
audio?.addEventListener('pause',draw);
audio?.addEventListener('error',()=>{putStatus('Audio unavailable. Select another file.');});
const publicTrack=audio.dataset.defaultTrack;
(async()=>{
 let saved=null;
 try{saved=await readAudio()}catch{}
 if(saved instanceof Blob){
  setSource(saved);
 }else if(publicTrack){
  audio.src=publicTrack;audio.preload='metadata';configured=true;
 }
 draw();
 // Browsers may allow sound only after direct user interaction.
 if(configured&&!muted){
  const unlock=()=>{play();document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock)};
  document.addEventListener('pointerdown',unlock);
  document.addEventListener('keydown',unlock);
 }
})();
window.addEventListener('pagehide',()=>{if(sourceUrl)URL.revokeObjectURL(sourceUrl)});
draw();
