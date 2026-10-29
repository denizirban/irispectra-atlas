// Irispectra — seamless spatial micro expedition.
// Scientific illustrations are staged in adjacent spatial chapters. Camera
// world-space position and heading are never reset at a chapter boundary.
export function createMicroNavigator(T, camera) {
  const START_STAGE=2, STAGE_STRIDE=6.15;
  const MIN_DISTANCE=2.65, FAR_MARGIN=1.55;
  const position=new T.Vector3(0,0,9.3);
  const desired=position.clone();
  const forward=new T.Vector3(),look=new T.Vector3();
  let yaw=0,pitch=0,targetYaw=0,targetPitch=0;
  let stage=START_STAGE,active=false,drift=true,travel=0,lastGesture=0;
  let velocity=0,pendingEdge=null,focusPoint=null,focusUntil=0;
  const keys=new Set();
  const cap=(x,a,b)=>Math.min(b,Math.max(a,x));
  const ease=(dt,freq)=>1-Math.exp(-freq*dt);
  const mobile=()=>typeof window!=='undefined'&&window.matchMedia('(max-width: 820px)').matches;
  const entryDistance=()=>mobile()?10.5:9.3;
  const offsetForStage=s=>-(cap(s,START_STAGE,6)-START_STAGE)*STAGE_STRIDE;
  const origin=()=>offsetForStage(stage);
  const localDistance=()=>position.z-origin();
  const interrupt=()=>{drift=false;lastGesture=performance.now();focusPoint=null;};

  function reset(nextStage=START_STAGE) {
    stage=cap(nextStage,START_STAGE,6);
    position.set(0,0,origin()+entryDistance());
    desired.copy(position);
    yaw=pitch=targetYaw=targetPitch=0;
    velocity=travel=0;pendingEdge=null;focusPoint=null;
    keys.clear();camera.position.copy(position);camera.lookAt(0,0,origin());
    camera.updateMatrixWorld();
  }

  function setActive(value,nextStage=stage) {
    const wasActive=active;
    active=!!value;
    if(!active){keys.clear();pendingEdge=null;return;}
    if(!wasActive){reset(nextStage);return;}
    if(stage!==nextStage){
      // Adjacent scenes have stable offsets. Continuing forward moves the
      // viewer into the next scene without an artificial camera pullback.
      stage=cap(nextStage,START_STAGE,6);
      pendingEdge=null;focusPoint=null;
      desired.z=cap(desired.z,origin()+MIN_DISTANCE,origin()+entryDistance()+FAR_MARGIN);
      lastGesture=performance.now();
    }
  }

  function lookDelta(dx,dy) {
    if(!active)return;
    interrupt();
    targetYaw=cap(targetYaw-dx*.0035,-1.08,1.08);
    targetPitch=cap(targetPitch+dy*.0031,-.69,.69);
  }

  // Return boundary signals to the caller. Stage changes are owned by the
  // zoom/depth controller, not by a hidden second navigation state machine.
  function dolly(amount) {
    if(!active)return null;
    interrupt();
    const delta=cap(amount,-220,220)*.006;
    const next=desired.z-delta;
    const near=origin()+MIN_DISTANCE,far=origin()+entryDistance()+FAR_MARGIN;
    if(next<near){
      desired.z=near;
      return stage<6?'deeper':'end';
    }
    if(next>far){
      desired.z=far;
      return stage>START_STAGE?'shallower':'surface';
    }
    desired.z=next;
    desired.x=cap(desired.x+Math.sin(targetYaw)*delta*.09,-2.45,2.45);
    desired.y=cap(desired.y+Math.sin(targetPitch)*delta*.07,-1.9,1.9);
    travel+=Math.abs(delta);
    return null;
  }

  function shift(dx,dy) {
    if(!active)return;
    interrupt();
    desired.x=cap(desired.x+dx,-2.45,2.45);
    desired.y=cap(desired.y+dy,-1.95,1.95);
  }

  function focus(point) {
    if(!active||!point)return;
    interrupt();
    focusPoint=point.clone();
    // Hold a consistent cinematic viewing distance within this chapter.
    desired.set(cap(point.x,-2.4,2.4),cap(point.y,-1.9,1.9),
      cap(point.z+2.5,origin()+MIN_DISTANCE,origin()+entryDistance()+FAR_MARGIN));
    focusUntil=performance.now()+1800;
  }

  function pressKey(key,down) {
    if(!active)return false;
    const k=key.toLowerCase();
    if(!['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k))return false;
    if(down)keys.add(k);else keys.delete(k);
    if(down)interrupt();
    return true;
  }

  function update(dt,t) {
    if(!active)return;
    dt=cap(dt,0,.05);
    const motion=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
    const strafe=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
    if(motion){
      // Key travel uses exactly the same boundary behavior as the wheel.
      const edge=dolly(motion*dt*385);
      if(edge&&edge!=='end')pendingEdge=edge;
    }
    if(strafe)shift(strafe*dt*1.6,0);
    const p=ease(dt,5.3);
    position.lerp(desired,p);
    if(focusPoint&&performance.now()<focusUntil){
      const delta=focusPoint.clone().sub(position);
      const horizontal=Math.hypot(delta.x,delta.z);
      targetYaw=cap(Math.atan2(delta.x,-delta.z),-1.08,1.08);
      targetPitch=cap(Math.atan2(delta.y,horizontal),-.69,.69);
    }else focusPoint=null;
    yaw+=(targetYaw-yaw)*ease(dt,4.7);
    pitch+=(targetPitch-pitch)*ease(dt,4.7);
    const relaxed=drift||performance.now()-lastGesture>8500;
    const floatX=relaxed?Math.sin(t*.29)*.055:0;
    const floatY=relaxed?Math.sin(t*.37)*.037:0;
    const breathing=relaxed?Math.sin(t*.41)*.017:0;
    camera.position.set(position.x+floatX,position.y+floatY,position.z+breathing);
    const ca=Math.cos(pitch);
    forward.set(Math.sin(yaw)*ca,Math.sin(pitch),-Math.cos(yaw)*ca);
    look.copy(camera.position).add(forward);
    camera.lookAt(look);camera.updateMatrixWorld();
    velocity=Math.abs(position.z-desired.z);
  }

  function getStatus() {
    const far=entryDistance()+FAR_MARGIN;
    return {active,stage,glide:drift,distance:localDistance(),travel,velocity,
      progress:cap((far-localDistance())/(far-MIN_DISTANCE),0,1),
      worldDepth:position.z,chapterOrigin:origin()};
  }
  function consumeEdge(){const result=pendingEdge;pendingEdge=null;return result;}
  function toggleGlide(){drift=!drift;lastGesture=performance.now();return drift;}
  return {reset,setActive,lookDelta,dolly,shift,focus,pressKey,update,
    getStatus,consumeEdge,getStageOffset:offsetForStage,
    toggleGlide,isActive:()=>active,cam:camera};
}
