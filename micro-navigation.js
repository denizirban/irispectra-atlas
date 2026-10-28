// Irispectra / Micro Expedition Controller.
// The camera travels through a bounded anatomical illustration rather than
// spinning a specimen in front of a static viewer. Three.js instance is passed
// in from the parent to avoid duplicate WebGL module imports.
export function createMicroNavigator(T, camera) {
 const pos = new T.Vector3(0,0,9.5);
 const desired = pos.clone();
 const forward = new T.Vector3();
 const look = new T.Vector3();
 let yaw=0,pitch=0,targetYaw=0,targetPitch=0;
 let active=false,drift=true,stage=-1,travel=0;
 let speed=0,lastGesture=0;
 const keys=new Set();
 const cap=(x,a,b)=>Math.max(a,Math.min(b,x));
 const ease=(dt,freq)=>1-Math.exp(-freq*dt);
 const mobile=()=>window.matchMedia('(max-width: 820px)').matches;
 const initialDistance=()=>mobile()?10.5:9.3;
 function reset(nextStage=stage){
  stage=nextStage;
  const z=initialDistance();
  desired.set(0,0,z);pos.copy(desired);
  yaw=0;pitch=0;targetYaw=0;targetPitch=0;travel=0;speed=0;
  camera.position.copy(pos);
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld();
 }
 function setActive(value, nextStage=stage){
  const was=active;active=!!value;
  if(active&&(!was||stage!==nextStage)) reset(nextStage);
  if(!active)keys.clear();
 }
 function lookDelta(dx,dy){
  if(!active)return;
  drift=false;lastGesture=performance.now();
  targetYaw=cap(targetYaw-dx*.0035,-.78,.78);
  targetPitch=cap(targetPitch+dy*.0031,-.57,.57);
 }
 // Positive amount = travel forward into the tissue.
 function dolly(amount){
  if(!active)return null;
  drift=false;lastGesture=performance.now();
  const delta=cap(amount,-1.8,1.8)*.006;
  const proposed=desired.z-delta;
  // Deliberately transfer between depth scales only after reaching the edge
  // of a traversable zone. Standard +/- and the timeline always remain usable.
  if(proposed<2.65){
   if(stage<4)return 'deeper';
   desired.z=2.65;return 'end';
  }
  if(proposed>initialDistance()+1.55){
   if(stage>2)return 'shallower';
   return 'surface';
  }
  desired.z=proposed;
  const lateral=cap(delta*.10,-.07,.07);
  desired.x=cap(desired.x+Math.sin(targetYaw)*lateral,-2.45,2.45);
  desired.y=cap(desired.y+Math.sin(targetPitch)*lateral,-1.9,1.9);
  travel+=Math.abs(delta);
  return null;
 }
 function shift(dx,dy){
  if(!active)return;
  drift=false;lastGesture=performance.now();
  desired.x=cap(desired.x+dx,-2.45,2.45);
  desired.y=cap(desired.y+dy,-1.95,1.95);
 }
 function focus(point){
  if(!active||!point)return;
  drift=false;lastGesture=performance.now();
  const targetZ=cap(point.z+3.05,2.65,initialDistance()+.7);
  desired.set(cap(point.x*.92,-2.45,2.45),cap(point.y*.92,-1.9,1.9),targetZ);
  const dz=Math.max(1,desired.z-point.z);
  targetYaw=cap(Math.atan2(point.x-desired.x,dz),-.58,.58);
  targetPitch=cap(Math.atan2(point.y-desired.y,dz),-.43,.43);
 }
 function pressKey(key,down){
  if(!active)return false;
  const k=key.toLowerCase();
  if(!['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k))return false;
  if(down)keys.add(k);else keys.delete(k);
  if(down){drift=false;lastGesture=performance.now();}
  return true;
 }
 function update(dt,t){
  if(!active)return;
  dt=cap(dt,0,.05);
  const motion=(keys.has('w')||keys.has('arrowup')?1:0)-
   (keys.has('s')||keys.has('arrowdown')?1:0);
  const sidestep=(keys.has('d')||keys.has('arrowright')?1:0)-
   (keys.has('a')||keys.has('arrowleft')?1:0);
  if(motion) desired.z=cap(desired.z-motion*dt*2.3,2.65,initialDistance()+1.55);
  if(sidestep) desired.x=cap(desired.x+sidestep*dt*1.7,-2.45,2.45);
  const f=ease(dt,5.3);
  pos.lerp(desired,f);
  yaw+=(targetYaw-yaw)*ease(dt,4.7);
  pitch+=(targetPitch-pitch)*ease(dt,4.7);
  // A deliberately small continuous motion (not a specimen rotation).
  const relax=drift||performance.now()-lastGesture>8000;
  const floatX=relax?Math.sin(t*.29)*.075:0;
  const floatY=relax?Math.sin(t*.37)*.055:0;
  const breathing=relax?Math.sin(t*.41)*.036:0;
  camera.position.set(pos.x+floatX,pos.y+floatY,pos.z+breathing);
  const ca=Math.cos(pitch),sa=Math.sin(pitch);
  forward.set(Math.sin(yaw)*ca,sa,-Math.cos(yaw)*ca);
  look.copy(camera.position).add(forward);
  camera.lookAt(look);camera.updateMatrixWorld();
  speed=Math.abs(pos.z-desired.z);
 }
 function getStatus(){
  return {active,stage,glide:drift,distance:pos.z,travel,
   progress:cap((initialDistance()-pos.z)/(initialDistance()-2.65),0,1)};
 }
 function toggleGlide(){drift=!drift;lastGesture=performance.now();return drift}
 return {reset,setActive,lookDelta,dolly,shift,focus,pressKey,update,
  getStatus,toggleGlide,isActive:()=>active,cam:camera};
}
