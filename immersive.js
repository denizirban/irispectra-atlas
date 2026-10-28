import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import {createFundusStage} from "./fundus.js";
import {MORPHOLOGY,polarRegion} from "./morphology-data.js";
import {zoneForEyePoint} from "./chart-zones.js";
import {populateMicroScene} from "./micro-models.js";
import {BIO_ROUTES,BIO_STAGES,BIO_TARGETS,bioInfo} from "./micro-biology.js";
import {animateMicroAtmosphere} from "./micro-atmosphere.js";
import {createMicroNavigator} from "./micro-navigation.js";
import {nodesAt,describeMicroRole} from "./micro-discovery.js";
import {getDepthInfo,ATLAS_DEPTH,MORPH_DETAILS} from "./depth-knowledge.js";
import {SPECIMENS,makeAnnularSpecimen} from "./specimen-pipeline.js";
const $=x=>document.getElementById(x),canvas=$('scene'),experience=$('experience');
const annotations={
 pupil:['Pupil','The dark central opening that admits light. Its appearance in a still photograph cannot measure the pupil light reflex.'],
 collarette:['Collarette','The irregular circular ridge distinguishing the pupillary and ciliary zones of the iris.'],
 crypt:['Crypt-like region','An opening or depression in the anterior iris stroma. Demo annotations are illustrative; an uploaded image is not automatically classified.'],
 radial:['Radial stromal fibers','Iris connective tissue forms radial patterns around the pupil. Fine textures in the demo are procedurally modeled, not microscope measurements.'],
 furrow:['Contraction furrows','Concentric folds near the outer iris, related to the way the iris folds during pupil size changes.'],
 limbal:['Peripheral iris boundary','The junction between the colored iris and the surrounding ocular structures as seen through the cornea.'],
 fundusDisc:['Optic disc','Where retinal nerve fibers leave as the optic nerve; the central retinal vessels converge here.'],
 fundusMacula:['Macula and fovea','The macula supports sharp central vision. Its fovea is densely populated by cones. This is an illustration.'],
 fundusVessels:['Retinal vessels','Arteries and veins branch across the inner retina. These paths are illustrative, not medical imaging.'],
 fundusRetina:['Neural retina','Light-sensitive tissue lining the rear of the eye. Its cellular layers cannot be measured from an iris photo.']
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}};
const rand=seeded(9348);
let renderer,scene,camera,eyeGroup,iris,irisMaterial,eyeWhite,cornea,pupil,lighting,texture=null,retina,opticNerve,retinalVessels,fundusStage,fundusTimer;
const current={zoom:.07,targetZoom:.07,yaw:0,targetYaw:0,pitch:0,targetPitch:0,focus:new THREE.Vector3(),focusTarget:new THREE.Vector3(),demo:true,anatomy:false,place:false,pinKind:'crypt',pinList:[],selected:null,selection:null,animate:true,irisPalette:0,rear:false};
current.fundus=false;current.fundusTransition=false;current.fundusLook=new THREE.Vector3(0,0,-1.115);current.fundusTarget=new THREE.Vector3(0,0,-1.115);
let uploadImage=null, uploadUrl=null, toastTimer, pointers=new Map(),moveTotal=0,eyeGazeX=0,eyeGazeY=0;
const initPins=[
 {kind:'collarette',radius:.26,angle:.72},
 {kind:'crypt',radius:.43,angle:2.38},
 {kind:'radial',radius:.48,angle:4.02},
 {kind:'furrow',radius:.57,angle:5.63},
 {kind:'limbal',radius:.61,angle:3.48},
 {kind:'pupil',radius:.10,angle:1.18}
];
const P=()=>new THREE.Vector3();
function zIris(r,a){const band=Math.exp(-Math.pow((r-.285)/.055,2));return 1.108+.088*(1-r*r/.39)+.016*band+.007*Math.sin(a*42+r*98)*Math.sin(r*81-a*17)+.0035*Math.cos(a*127+r*166)+.004*Math.sin(a*9+r*32)}
function pointAt(r,a,offset=.017){return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,zIris(r,a)+offset)}
function setNotice(text){const t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000)}
function skinTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#94715c';ctx.fillRect(0,0,512,512);
 for(let i=0;i<36000;i++){let x=rand()*512,y=rand()*512,s=rand()*.9+.12;ctx.fillStyle=rand()>.55?'rgba(255,220,191,.10)':'rgba(51,31,23,.10)';ctx.beginPath();ctx.ellipse(x,y,s,s*.7,rand()*Math.PI,0,Math.PI*2);ctx.fill()}
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(2,2);return tx;
}
function sampleIris(size=2048){
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),m=size/2,R=size*.485;const grad=ctx.createRadialGradient(m,m,R*.16,m,m,R);
 grad.addColorStop(0,'#121d19');grad.addColorStop(.31,'#675f36');grad.addColorStop(.48,'#ad8b4b');grad.addColorStop(.7,'#64705c');grad.addColorStop(.86,'#3d5750');grad.addColorStop(.98,'#152326');grad.addColorStop(1,'#070d12');ctx.fillStyle=grad;ctx.fillRect(0,0,size,size);
 const colors=['rgba(226,200,139,.41)','rgba(60,84,76,.56)','rgba(195,157,96,.44)','rgba(26,49,48,.54)','rgba(240,206,141,.21)','rgba(109,143,123,.40)','rgba(29,29,21,.32)'];
 for(let i=0;i<17000;i++){
   const a=rand()*Math.PI*2,rad=(.28+rand()*.61)*R,length=(.09+rand()*.45)*R;let curr=rad;ctx.strokeStyle=colors[(rand()*colors.length)|0];ctx.lineWidth=.45+rand()*2.7;ctx.globalAlpha=.35+rand()*.55;ctx.beginPath();
   const phases=2+((rand()*3)|0);for(let j=0;j<=phases;j++){
    let f=j/phases;curr=rad+length*f;
    let swirl=.009*Math.sin((a*39)+(curr/R)*19)+.008*Math.sin(a*137+f*7);
    let x=m+curr*Math.cos(a+swirl),y=m+curr*Math.sin(a+swirl);
    if(!j)ctx.moveTo(x,y);else ctx.lineTo(x,y)
   }ctx.stroke()
 }
 ctx.globalAlpha=1;
 // asymmetric stromal openings and natural irregular pigment breaks
 for(let k=0;k<110;k++){
  const a=rand()*Math.PI*2,r=R*(.31+rand()*.6),w=(.006+rand()*.022)*R,h=(.004+rand()*.018)*R;
  ctx.save();ctx.translate(m+Math.cos(a)*r,m+Math.sin(a)*r);ctx.rotate(a);
  const shade=ctx.createRadialGradient(0,0,1,0,0,w*1.45);shade.addColorStop(0,'rgba(6,17,13,.43)');shade.addColorStop(.55,'rgba(24,32,24,.26)');shade.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shade;ctx.beginPath();ctx.ellipse(0,0,w*1.5,h*1.4,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(218,192,139,.18)';ctx.lineWidth=1.1+rand()*1.6;ctx.beginPath();ctx.ellipse(0,h*.26,w*1.1,h*.74,0,0,Math.PI);ctx.stroke();ctx.restore();
 }
 for(let k=0;k<44;k++){
   const a=rand()*Math.PI*2,r=R*(.40+rand()*.42),w=(.013+rand()*.03)*R,h=(.008+rand()*.023)*R;
   ctx.save();ctx.translate(m+Math.cos(a)*r,m+Math.sin(a)*r);ctx.rotate(a);ctx.fillStyle='rgba(13,27,24,.29)';ctx.beginPath();ctx.ellipse(0,0,w,h,0,0,7);ctx.fill();ctx.strokeStyle='rgba(235,204,145,.23)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-w*.18,-h*.23,w*1.08,h*.75,0,2.6,5.5);ctx.stroke();ctx.restore();
 }
 for(let k=0;k<4;k++){ctx.beginPath();ctx.lineWidth=R*(.002+rand()*.004);ctx.strokeStyle=k%2?'rgba(7,22,20,.25)':'rgba(226,218,182,.20)';let r=R*(.76+k*.059);
 for(let i=0;i<=260;i++){let a=i/260*Math.PI*2,rr=r+Math.sin(a*22+k*3)*R*.009+Math.sin(a*55)*R*.004;let x=m+rr*Math.cos(a),y=m+rr*Math.sin(a);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}
 const inward=ctx.createRadialGradient(m,m,R*.18,m,m,R*.41);inward.addColorStop(0,'rgba(9,10,8,.95)');inward.addColorStop(.67,'rgba(26,20,12,.59)');inward.addColorStop(1,'rgba(25,20,17,0)');ctx.fillStyle=inward;ctx.fillRect(m-R*.43,m-R*.43,R*.86,R*.86);
 return c;
}


let specimenIndex=0,specimenToken=0,specimenMode='procedural';
function setSpecimenLabel(message,credit=false){
 $('textureStatus').textContent=message;
 const a=$('specimenCredit');if(a)a.hidden=!credit;
}
function photoToIris(img,spec){
 return makeAnnularSpecimen(img,spec,{size:window.matchMedia('(max-width: 720px)').matches?1536:2048});
}
function setPhotographicDemo(index=specimenIndex){
 specimenIndex=((index%SPECIMENS.length)+SPECIMENS.length)%SPECIMENS.length;
 const sample=SPECIMENS[specimenIndex],token=++specimenToken;
 const image=new Image();image.crossOrigin='anonymous';image.decoding='async';
 setSpecimenLabel('LOADING / '+sample.title);
 image.onload=()=>{
  if(token!==specimenToken)return;
  try{
   const mapped=photoToIris(image,sample);
   specimenMode='reference';current.demo=true;makeTexture(mapped);
   irisMaterial.bumpScale=0;irisMaterial.roughness=.78;irisMaterial.clearcoat=.055;
   setSpecimenLabel('PHOTO / '+sample.title,true);
   const link=$('specimenCredit');link.href=sample.credit;
   link.textContent='PHOTO: '+sample.creator.toUpperCase()+' · '+sample.license+' ↗';
   $('modeLabel').textContent='MACRO SPECIMEN / REAL PHOTO / 3D SURFACE';
   
   setNotice(sample.title+' / HIGH-RES SPECIMEN READY');
  }catch(error){console.warn('SPECIMEN_TEXTURE',error);fallbackSpecimen(token);}
 };
 image.onerror=()=>fallbackSpecimen(token);
 image.src=sample.url;
}
function fallbackSpecimen(token){
 if(token!==specimenToken)return;
 if(specimenIndex<SPECIMENS.length-1){setPhotographicDemo(specimenIndex+1);return;}
 specimenMode='procedural';current.demo=true;makeTexture(sampleIris());
 setSpecimenLabel('PROCEDURAL / OFFLINE');
 setNotice('REFERENCE PHOTO UNAVAILABLE · OFFLINE TEXTURE');
}
function switchToSynthetic(){
 specimenMode='procedural';current.demo=true;makeTexture(sampleIris());setSpecimenLabel('SYNTHETIC / 3D DEMO');
 $('modeLabel').textContent='PROCEDURAL IRIS / ILLUSTRATIVE DEPTH';
}



function sampledRelief(r,a){
 if(!iris?.userData?.relief)return 0;
 const {data,size}=iris.userData.relief;
 const x=Math.min(size-1,Math.max(0,Math.round((.5+Math.cos(a)*r/1.26)*(size-1))));
 const y=Math.min(size-1,Math.max(0,Math.round((.5-Math.sin(a)*r/1.26)*(size-1))));
 const k=(y*size+x)*4;
 const brightness=(data[k]*.2126+data[k+1]*.7152+data[k+2]*.0722)/255;
 const depression=Math.max(0,Math.min(1,(.34-brightness)*2.2));
 const radialWeight=Math.max(0,Math.min(1,(r-.20)/.13));
 return .007*(brightness-.48)-.007*depression*radialWeight;
}
function refreshIrisRelief(source){
 if(!iris||!source)return;
 const size=384,c=document.createElement('canvas');c.width=c.height=size;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,size,size);
 iris.userData.relief={data:ctx.getImageData(0,0,size,size).data,size};
 // Recalculate at next frame using the same pupil diameter as the current shape.
 iris.userData.lastPupil=-1;
}
const DEEP_ROUTES={
 iris:['IRIS SURFACE','CRYPT / COLLARETTE','STROMAL COLLAGEN','MELANOCYTES & FIBROBLASTS','MELANIN / COLLAGEN'],
 sclera:['SCLERA / EPISCLERA','SUPERFICIAL VESSELS','COLLAGEN TISSUE','FIBROBLASTS','TYPE I COLLAGEN'],
 retina:['RETINAL FUNDUS','NERVE FIBER LAYER','RETINAL LAMINAE','GANGLION / PHOTORECEPTORS','OPSIN / SIGNALING'],
 vessel:['RETINAL VESSELS','VASCULAR WALL','BASEMENT MEMBRANE','ENDOTHELIUM / PERICYTES','JUNCTION PROTEINS'],
 nerve:['OPTIC DISC','RETINAL AXON BUNDLES','LAMINA CRIBROSA','GANGLION AXONS / GLIA','AXONAL TRANSPORT']
};
let deepRoute='iris',deepStage=-1,deepGroup=null;
let activeBioRoute='crypt',bioGuided=false;
function buildDeepWorld(){
 deepGroup=new THREE.Group();scene.add(deepGroup);deepGroup.visible=false;
 const m=(col)=>new THREE.MeshStandardMaterial({color:col,roughness:.7,side:THREE.DoubleSide});
 const balls=[[0x9e7956,0xc4a078,0x5a5149],[0xcbbba5,0x938c8f,0xe1ceb5],[0x865b61,0xb5837f,0xd9b19b]];
 const pal=deepRoute==='iris'?balls[0]:deepRoute==='sclera'?balls[1]:balls[2];
 const sphere=new THREE.SphereGeometry(1,18,12);
 const ball=(x,y,z,r,col)=>{let ob=new THREE.Mesh(sphere,m(col));ob.position.set(x,y,z);ob.scale.setScalar(r);deepGroup.add(ob)};
 const fibre=(a,b,r,col)=>{const points=[new THREE.Vector3(...a),new THREE.Vector3(...b)],geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,r,5);deepGroup.add(new THREE.Mesh(geo,m(col)))};
 for(let i=0;i<32;i++){
  let x=(i%8-3.5)*.44,y=(Math.floor(i/8)-1.5)*.64,z=.1*Math.sin(i*2.4);
  if(deepStage===2){fibre([x-1,y,z],[x+1,y+.13*Math.cos(i),z+.3],.027,pal[i%3]);if(i%5===0)ball(x,y,.25,.19,0x625364)}
  else if(deepStage===3){if(i<16){ball(x,y,z,.15+(i%3)*.04,pal[i%3]);ball(x+.03,y,z+.12,.055,0x454353);}}
  else if(deepStage===4){let t=i*.7;ball(Math.sin(t)*.6,t*.075-1.1,Math.cos(t)*.6,.09,pal[i%3]);if(i>0)fibre([Math.sin((i-1)*.7)*.6,(i-1)*.075-1.1,Math.cos((i-1)*.7)*.6],[Math.sin(t)*.6,t*.075-1.1,Math.cos(t)*.6],.028,0xddd2bc)}
 }
}
// Continuous, reversible macro-to-micro handoff with actual 3D scene cross-fading.
let activeMicro=null,previousMicro=null,microStage=-1,microRoute='',microTransitionStart=0;
let microMotionTime=0,lastMicroFrame=0;
function disposeMicroGroup(group){
 if(!group)return;
 const geometries=new Set(),materials=new Set();
 group.traverse(obj=>{if(obj.isMesh||obj.isPoints||obj.isLine){
  if(obj.geometry)geometries.add(obj.geometry);
  if(Array.isArray(obj.material))obj.material.forEach(m=>materials.add(m));
  else if(obj.material)materials.add(obj.material);
 }});
 group.parent?.remove(group);
 geometries.forEach(geo=>geo.dispose());
 materials.forEach(mat=>{if(mat.map)mat.map.dispose();mat.dispose()});
}
function setMicroGroupOpacity(group,factor){
 if(!group)return;
 group.traverse(obj=>{if(!obj.isMesh)return;
  const mats=Array.isArray(obj.material)?obj.material:[obj.material];
  for(const m of mats){
   if(m.userData.macroOriginalOpacity===undefined)m.userData.macroOriginalOpacity=m.opacity??1;
   const original=m.userData.macroOriginalOpacity;
   m.opacity=original*factor;
   m.transparent=m.opacity<.99;
   m.depthWrite=m.opacity>.975;
  }
 });
}
function updateDeepWorld(){
 if(!deepGroup||!microScene)return;
 const now=performance.now(),dt=lastMicroFrame?Math.min(.05,(now-lastMicroFrame)/1000):1/60;
 lastMicroFrame=now;
 const stage=selectionStage(),zoom=current.zoom;
 const deep=stage>=2&&!current.rear;
 const baseRoute=current.fundus?(deepRoute==='iris'?'retina':deepRoute):deepRoute;
 const route=activeBioRoute;
 const targetBlend=deep?smooth(.635,.79,zoom):0;
 const follow=1-Math.exp(-10*dt);
 microBlend=lerp(microBlend,targetBlend,follow);
 const changing=deep&&(stage!==microStage||route!==microRoute||!activeMicro);
 const navigationActive=deep&&microBlend>.035;
 if(changing){
  disposeMicroGroup(previousMicro);
  previousMicro=activeMicro;
  activeMicro=new THREE.Group();deepGroup.add(activeMicro);
  populateMicroScene(THREE,activeMicro,route,stage);
  microStage=stage;microRoute=route;microTransitionStart=now;
  microNav?.setActive(true,stage);
  setMicroGroupOpacity(activeMicro,0);
 }
 const cross=clamp((now-microTransitionStart)/620,0,1);
 if(previousMicro&&cross>=1){disposeMicroGroup(previousMicro);previousMicro=null;}
 deepGroup.visible=microBlend>.002;
 if(deepGroup.visible){
  microMotionTime+=dt;
  deepGroup.position.set(0,0,0);
  // Keep structures stationary in world-space: the viewpoint travels.
  deepGroup.rotation.set(0,0,0);
  deepGroup.scale.setScalar(1);
  microNav?.setActive(navigationActive,stage);
  microNav?.update(dt,microMotionTime);
  setMicroGroupOpacity(activeMicro,microBlend*cross);
  setMicroGroupOpacity(previousMicro,microBlend*(1-cross));
  // A viewer travelling toward the cell passes the bilayer. Fade only its
  // foreground membrane geometry after the camera crosses the focal plane.
  if(stage===4&&(route==='crypt'||route==='pigment')&&activeMicro){
   const distance=microNav?.getStatus()?.distance??9;
   const reveal=clamp((distance-3.12)/1.35,.045,1);
   activeMicro.traverse(obj=>{
    if(!obj.isMesh||obj.userData.depthBand!=='membrane')return;
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const material of materials){
     material.opacity*=reveal;
     material.transparent=true;
     material.depthWrite=false;
    }
   });
  }
  animateMicroAtmosphere(activeMicro,microMotionTime,microBlend*cross);
  animateMicroAtmosphere(previousMicro,microMotionTime,microBlend*(1-cross));
 }
 updateMicroExplorerHUD(navigationActive,now);
 if(!deep&&microBlend<.004&&microStage>=2){
  disposeMicroGroup(previousMicro);disposeMicroGroup(activeMicro);
  previousMicro=null;activeMicro=null;microStage=-1;microRoute='';
  microNav?.setActive(false);
 }
 eyeGroup.visible=!current.fundus;
 fundusStage.group.visible=!!current.fundus;
 const d=$('depthExplainer');
 if(d)d.textContent=stage>=2?bioInfo(activeBioRoute,stage).title:
  (ATLAS_DEPTH[baseRoute]||ATLAS_DEPTH.iris)[Math.min(stage,4)].title;
}
function makeTexture(source){
 if(texture)texture.dispose();texture=new THREE.CanvasTexture(source);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());texture.needsUpdate=true;
 if(irisMaterial){
  irisMaterial.map=texture;
  // Do not use the pigment/color photo as a high-amplitude height map:
  // pigment darkness is not a physical measurement of depth.
  irisMaterial.bumpMap=null;irisMaterial.bumpScale=0;
  irisMaterial.roughness=.78;irisMaterial.clearcoat=.055;irisMaterial.clearcoatRoughness=.20;
  irisMaterial.needsUpdate=true;refreshIrisRelief(source);
 }
}

let lightIntensity=.38,targetLight=.38,simPupil=.195;
let plrMode='baseline',plrFlashTimer=null,plrFlashRestore=null,plrDisplayFrame=0;
function setPlrMode(mode){
 plrMode=mode;
 $('plrResponse').textContent=mode==='flash'?'CONSTRICTING':mode==='dark'?'DILATING':'RESPONDING';
 $('plrLab')?.classList.toggle('is-flashing',mode==='flash');
}
function changeSimulatedLight(next,mode){
 targetLight=Math.max(0,Math.min(1,next));
 $('lightRange').value=Math.round(targetLight*100);
 if(plrFlashTimer){clearTimeout(plrFlashTimer);plrFlashTimer=null}
 if(plrFlashRestore){clearTimeout(plrFlashRestore);plrFlashRestore=null}
 setPlrMode(mode);
}
function flashPlr(){
 const baseline=targetLight;
 changeSimulatedLight(1,'flash');
 // A controlled demonstration pulse; visual kinetics are not calibrated physiology.
 plrFlashTimer=setTimeout(()=>{
  plrFlashTimer=null;targetLight=baseline;
  $('lightRange').value=Math.round(baseline*100);
  setPlrMode('baseline');
 },1250);
}
function updatePlrReadout(){
 if(!$('plrPupil'))return;
 const relative=(simPupil/.235)*100;
 $('plrPupil').style.width=(relative*.50)+'%';
 $('plrPupil').style.height=(relative*.50)+'%';
 $('plrDiameter').textContent='RELATIVE APERTURE · '+Math.round(relative)+'%';
 $('plrBeam').style.opacity=(.1+lightIntensity*.8).toFixed(2);
 const moving=Math.abs(simPupil-(.235-.085*lightIntensity))>.0025;
 if(plrMode==='baseline')$('plrResponse').textContent=moving?(targetLight>lightIntensity?'CONSTRICTING':'ADAPTING'):'STABLE';
}
function updateLightSimulation(){
 lightIntensity=lerp(lightIntensity,targetLight,.035);
 const desired=lerp(.235,.15,lightIntensity);
 simPupil=lerp(simPupil,desired,.045);
 // Mesh geometry resampling alters iris inner opening while retaining outer limbus.
 if(!iris||Math.abs(simPupil-(iris.userData.lastPupil??0))<.0007)return;
 iris.userData.lastPupil=simPupil;
 const a=iris.geometry.attributes.position,uv=iris.geometry.attributes.uv,segments=300,rings=103;
 for(let j=0;j<=rings;j++){
  const r=simPupil+(.63-simPupil)*j/rings;
  for(let i=0;i<=segments;i++){
   const index=j*(segments+1)+i,angle=i/segments*Math.PI*2,x=Math.cos(angle)*r,y=Math.sin(angle)*r;
   a.setXYZ(index,x,y,zIris(r,angle)+sampledRelief(r,angle));
   uv.setXY(index,.5+x/1.26,.5+y/1.26);
  }
 }
 a.needsUpdate=true;uv.needsUpdate=true;iris.geometry.computeVertexNormals();
 if(pupil){pupil.scale.setScalar(simPupil/.189)}
 // Pupil edge rings are tagged when built.
 eyeGroup.children.forEach(m=>{if(m.userData.pupilEdge)m.scale.setScalar(simPupil/.195)});
 if(lighting)lighting.intensity=lerp(2.05,2.75,lightIntensity);
 renderer.toneMappingExposure=lerp(1.12,1.32,lightIntensity);
 $('lightValue')&&($('lightValue').textContent=Math.round(lightIntensity*100)+'%');
 if(++plrDisplayFrame%3===0)updatePlrReadout();
}

function makeIris(){
 const segments=300, rings=103,verts=[],uv=[],indices=[];for(let j=0;j<=rings;j++){const r=.195+(.63-.195)*j/rings;for(let i=0;i<=segments;i++){let a=i/segments*Math.PI*2,xx=Math.cos(a)*r,yy=Math.sin(a)*r;verts.push(xx,yy,zIris(r,a));uv.push(.5+xx/1.26,.5+yy/1.26);if(j<rings&&i<segments){let n=j*(segments+1)+i;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1)}}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 irisMaterial=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.77,metalness:0,clearcoat:.12,clearcoatRoughness:.25,side:THREE.DoubleSide,bumpScale:.009});
 iris=new THREE.Mesh(geo,irisMaterial);iris.name='iris';iris.renderOrder=3;eyeGroup.add(iris);
 makeTexture(sampleIris());
}
function rim(r,z,color,thick=.015){const geo=new THREE.TorusGeometry(r,thick,8,192),mat=new THREE.MeshStandardMaterial({color,roughness:.56,metalness:.0});const mesh=new THREE.Mesh(geo,mat);mesh.position.z=z;eyeGroup.add(mesh);return mesh}
function skinSurface(upper,tx){
 const N=104,M=26,verts=[],uv=[],faces=[];
 for(let i=0;i<=N;i++){const x=-1.34+2.68*i/N,fx=clamp(x/1.26,-1,1),envelope=Math.sqrt(Math.max(0,1-fx*fx)),edge=upper?.48*envelope+.018:-.47*envelope-.015;
 for(let j=0;j<=M;j++){let t=j/M,eased=t*t*(3-2*t),y=lerp(edge,upper?1.53:-1.54,t),rr=x*x+edge*edge,zEdge=Math.sqrt(Math.max(.12,1.23**2-rr))+.055,z=lerp(zEdge,.29-.045*(x/1.34)**2,eased);
 z+=Math.cos(t*Math.PI)*.01;verts.push(x,y,z);uv.push(i/N*2,j/M*1.4);if(i<N&&j<M){let n=i*(M+1)+j;faces.push(n,n+M+1,n+1,n+1,n+M+1,n+M+2)}}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(faces);geo.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.96,side:THREE.DoubleSide,metalness:0,color:0xffffff});
 const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=5;eyeGroup.add(mesh);
 const edgePts=[];for(let i=0;i<=100;i++){let x=-1.30+2.6*i/100,fx=clamp(x/1.26,-1,1),env=Math.sqrt(Math.max(0,1-fx*fx)),y=upper?.48*env+.018:-.47*env-.015;let z=Math.sqrt(Math.max(.12,1.23*1.23-x*x-y*y))+.065;edgePts.push(new THREE.Vector3(x,y,z))}
 const edgeCurve=new THREE.CatmullRomCurve3(edgePts),edgeGeo=new THREE.TubeGeometry(edgeCurve,180,upper?.026:.018,5,false);
 const edgeMesh=new THREE.Mesh(edgeGeo,new THREE.MeshStandardMaterial({color:upper?0x4d2b22:0x725244,roughness:.71}));edgeMesh.renderOrder=7;eyeGroup.add(edgeMesh);
 const lashMat=new THREE.MeshBasicMaterial({color:0x16100e});
 for(let j=0;j<(upper?64:36);j++){let f=.05+j/(upper?69:40)+rand()*.007;if(f>=.98)continue;const p=edgeCurve.getPointAt(f);let x=p.x,outer=x>0?1:-1,length=(upper?.19:.08)*(.65+rand()*.85)*(1-.4*Math.abs(x));const curve=new THREE.CatmullRomCurve3([p.clone(),p.clone().add(new THREE.Vector3(x*.04,upper?length*.43:-length*.37,.065)),p.clone().add(new THREE.Vector3(x*.1+(rand()-.5)*.03,upper?length:-length*.9,.11))]);
 const line=new THREE.Mesh(new THREE.TubeGeometry(curve,6,.0025+rand()*.0025,3,false),lashMat);line.renderOrder=8;eyeGroup.add(line)}
}
function makeCornealReflectionTexture(){
 const size=768,c=document.createElement('canvas');c.width=c.height=size;
 const ctx=c.getContext('2d'),mid=size/2;
 // Reflected photographic studio light panels, feathered and gently curved;
 // projected onto the corneal dome rather than floating in front of the eye.
 function oval(x,y,rx,ry,rotation,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(rx,ry);
  const g=ctx.createRadialGradient(0,0,.05,0,0,1);
  g.addColorStop(0,'rgba(244,252,250,'+alpha+')');
  g.addColorStop(.60,'rgba(239,251,250,'+(alpha*.70)+')');
  g.addColorStop(.86,'rgba(237,250,249,'+(alpha*.18)+')');
  g.addColorStop(1,'rgba(236,250,249,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 oval(mid-155,mid-110,65,123,-.38,.53);
 oval(mid-120,mid-123,28,61,-.38,.47);
 oval(mid+173,mid+55,18,38,.23,.23);
 oval(mid-207,mid+158,8,11,0,.50);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return tex;
}
function makeCornea(){
 const segments=160,rows=42,verts=[],uv=[],idx=[];
 for(let j=0;j<=rows;j++){
  const r=.674*j/rows;
  for(let i=0;i<=segments;i++){
   const a=i/segments*Math.PI*2,xx=r*Math.cos(a),yy=r*Math.sin(a);
   // Convex anterior cornea with its highlights following the physical dome.
   const z=1.225+.108*(1-Math.pow(r/.674,2));
   verts.push(xx,yy,z+.0008);
   uv.push(.5+xx/1.36,.5-yy/1.36);
   if(j<rows&&i<segments){
    const n=j*(segments+1)+i;idx.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);
   }
  }
 }
 const geom=new THREE.BufferGeometry();
 geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geom.setIndex(idx);geom.computeVertexNormals();
 const lens=new THREE.MeshPhysicalMaterial({
  color:0xe8f9f7,transparent:true,opacity:.043,roughness:.025,
  clearcoat:1,clearcoatRoughness:.008,ior:1.376,depthWrite:false,
  metalness:0,side:THREE.DoubleSide
 });
 cornea=new THREE.Mesh(geom,lens);cornea.renderOrder=9;eyeGroup.add(cornea);
 const reflection=new THREE.Mesh(geom.clone(),new THREE.MeshBasicMaterial({
  map:makeCornealReflectionTexture(),transparent:true,opacity:.56,
  depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending
 }));
 const a=reflection.geometry.attributes.position;
 for(let i=0;i<a.count;i++)a.setZ(i,a.getZ(i)+.002);
 a.needsUpdate=true;reflection.renderOrder=10;
 reflection.userData.studioReflection=true;eyeGroup.add(reflection);
}
function makePosteriorAnatomy(){
 // Anatomical exploration (educational reconstruction, not a measured scan).
 const material=new THREE.MeshStandardMaterial({color:0x8e493b,roughness:.84,side:THREE.DoubleSide});
 retina=new THREE.Mesh(new THREE.SphereGeometry(1.175,96,64),material);
 retina.scale.set(.997,.997,.99);retina.visible=false;retina.name='retina';retina.renderOrder=0;eyeGroup.add(retina);
 const nerveMat=new THREE.MeshStandardMaterial({color:0xddc6a3,roughness:.82});
 opticNerve=new THREE.Group();
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.23,1.25,32,1),nerveMat);
 trunk.rotation.x=Math.PI/2;trunk.position.set(.13,-.015,-1.67);opticNerve.add(trunk);
 const sheath=new THREE.Mesh(new THREE.TorusGeometry(.205,.046,10,64),new THREE.MeshStandardMaterial({color:0x9b755d,roughness:.78}));sheath.position.set(.13,-.015,-1.19);opticNerve.add(sheath);
 opticNerve.visible=false;eyeGroup.add(opticNerve);
 retinalVessels=new THREE.Group();
 let vesselMat=new THREE.MeshStandardMaterial({color:0x6c1d20,roughness:.72,emissive:0x280908,emissiveIntensity:.22});
 for(let branch=0;branch<26;branch++){
   let a=branch/26*Math.PI*2,pts=[];
   for(let k=0;k<=25;k++){
     let t=k/25,spread=t*1.0,ang=a+.06*Math.sin(t*7+branch),x=.13+Math.cos(ang)*spread,y=-.015+Math.sin(ang)*spread;
     const rr=Math.hypot(x,y),z=-Math.sqrt(Math.max(.08,1.17*1.17-rr*rr))-.008;
     pts.push(new THREE.Vector3(x,y,z));
   }
   const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),45,.006+(branch%4)*.0018,5,false),vesselMat);retinalVessels.add(tube);
 }
 retinalVessels.visible=false;eyeGroup.add(retinalVessels);
}
function toggleRear(){
 if(current.fundus)exitFundus();current.rear=!current.rear;
 current.selected=null;$('infoPanel').hidden=true;clearSelection();
 current.anatomy=!current.rear&&current.anatomy;
 $('anatomyBtn').classList.toggle('active',current.anatomy);
 retina.visible=current.rear;opticNerve.visible=current.rear;retinalVessels.visible=current.rear;
 eyeWhite.material.transparent=current.rear;eyeWhite.material.opacity=current.rear?.12:1;eyeWhite.material.depthWrite=!current.rear;eyeWhite.material.needsUpdate=true;
 iris.visible=!current.rear;cornea.visible=!current.rear;pupil.visible=!current.rear;
 current.targetYaw=0;current.targetPitch=0;current.selected=null;
 current.focusTarget.set(0,0,current.rear?-.78:0);
 setZoom(current.rear?.32:.13);
 $('rearBtn').classList.toggle('active',current.rear);
 $('rearBtn').textContent=current.rear?'FRONT OF EYE ↩':'RETINA / NERVE ↗';
 $('sceneNumber').textContent=current.rear?'03 / POSTERIOR EYE':'01 / THE HUMAN EYE';
 $('sceneTitle').innerHTML=current.rear?'BEYOND<br>THE IRIS.':'THE WORLD<br>WITHIN.';
 $('sceneNote').textContent=current.rear?'Explore modeled retina, fundus vessels, and the optic nerve.':'A closer look at what makes every iris unique.';
 $('modeLabel').textContent=current.rear?'EDUCATIONAL MODEL / RETINA & OPTIC NERVE':current.demo?'INTERACTIVE 3D / SYNTHETIC DEMO':'YOUR PHOTO / SYNTHETIC DEPTH';
 setNotice(current.rear?'POSTERIOR ANATOMY IS ILLUSTRATIVE · NOT A RETINAL SCAN':'ANTERIOR EYE VIEW');
}


function addScleralVessels(){
 // Subtle curved episcleral vessel paths, respecting the 3D scleral sphere.
 const mat=new THREE.MeshBasicMaterial({color:0x9b6063,transparent:true,opacity:.15,depthWrite:false});
 const R=1.236;
 for(let n=0;n<42;n++){
  const a=rand()*Math.PI*2,start=.68+rand()*.10,end=.82+rand()*.27,points=[];
  for(let k=0;k<=18;k++){
   const t=k/18,r=lerp(start,end,t),phase=a+.035*Math.sin(t*6+n)*t;
   const x=Math.cos(phase)*r,y=Math.sin(phase)*r,z=Math.sqrt(Math.max(.01,R*R-r*r));
   points.push(new THREE.Vector3(x,y,z+.002));
  }
  const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),30,.0011+rand()*.0014,3,false);
  const vein=new THREE.Mesh(geo,mat);vein.renderOrder=1;eyeGroup.add(vein);
 }
}

function makeScene(){
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.007,100);eyeGroup=new THREE.Group();scene.add(eyeGroup);
 scene.add(new THREE.AmbientLight(0xc8d2c9,.8));
 const lightA=new THREE.DirectionalLight(0xffead5,2.85);lightA.position.set(-3,4,6);scene.add(lightA);lighting=lightA;
 const lightB=new THREE.DirectionalLight(0xbadcd8,1.15);lightB.position.set(4,-1,5);scene.add(lightB);
 const lightC=new THREE.PointLight(0xffffff,.7);lightC.position.set(-1,0,4);scene.add(lightC);
 const scleraGeo=new THREE.BufferGeometry(),verts=[],indices=[],steps=160,levels=110,R=1.23,t0=Math.asin(.645/R);
 for(let j=0;j<=levels;j++){let theta=t0+(Math.PI-t0)*j/levels;for(let i=0;i<=steps;i++){let phi=i/steps*2*Math.PI,rr=R*Math.sin(theta);verts.push(rr*Math.cos(phi),rr*Math.sin(phi),R*Math.cos(theta));if(j<levels&&i<steps){let n=j*(steps+1)+i;indices.push(n,n+1,n+steps+1,n+1,n+steps+2,n+steps+1)}}}
 scleraGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));scleraGeo.setIndex(indices);scleraGeo.computeVertexNormals();
 eyeWhite=new THREE.Mesh(scleraGeo,new THREE.MeshPhysicalMaterial({color:0xe9e8e1,roughness:.31,clearcoat:.68,clearcoatRoughness:.11,side:THREE.DoubleSide}));eyeWhite.renderOrder=0;eyeGroup.add(eyeWhite);
 addScleralVessels();
 // recess in which the pupil sits
 const hole=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.13,128,1,true),new THREE.MeshStandardMaterial({color:0x090a09,roughness:1,side:THREE.DoubleSide}));hole.rotation.x=Math.PI/2;hole.position.z=1.19;hole.renderOrder=2;eyeGroup.add(hole);
 pupil=new THREE.Mesh(new THREE.CircleGeometry(.189,128),new THREE.MeshBasicMaterial({color:0x030504}));pupil.position.z=1.13;pupil.renderOrder=2;eyeGroup.add(pupil);
 makeIris();const pupilRim=rim(.195,1.215,0x181c14,.013);pupilRim.userData.pupilEdge=true;rim(.623,1.116,0x151e1c,.019);makeCornea();makePosteriorAnatomy();fundusStage=createFundusStage();scene.add(fundusStage.group); // clean eye-only frame
 drawDots();resize();window.addEventListener('resize',resize);setPhotographicDemo();initializeMicroWorld();
 $('loading').classList.add('hidden');animate();
}
let microScene=null,microCamera=null,microBackdrop=null,microBlend=0,microNav=null;
let microFrameHud=0,microLabelTimeout=null,lastMicroNodes='',lastJourneyStep=-1;
function initializeMicroWorld(){
 microScene=new THREE.Scene();
 microCamera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.025,100);
 microCamera.position.set(0,0,9.3);microCamera.lookAt(0,0,0);
 microNav=createMicroNavigator(THREE,microCamera);
 microNav.reset(2);
 microScene.add(new THREE.HemisphereLight(0xe4f5ea,0x26342f,1.20));
 const key=new THREE.DirectionalLight(0xffebd0,2.2);key.position.set(-2.5,3.5,6);microScene.add(key);
 const rim=new THREE.DirectionalLight(0xc4e9ef,1.15);rim.position.set(3,-2,3);microScene.add(rim);
 // This matte fades the macro photograph away while the real 3D scene fades in.
 microBackdrop=new THREE.Mesh(new THREE.PlaneGeometry(1,1),
  new THREE.MeshBasicMaterial({color:0x07100f,transparent:true,opacity:0,depthWrite:false,
   side:THREE.DoubleSide,toneMapped:false}));
 microBackdrop.position.set(0,0,-4.4);
 microBackdrop.renderOrder=-100;
 microScene.add(microBackdrop);
 deepGroup=new THREE.Group();microScene.add(deepGroup);
 resize();
}
function renderAtlasLayers(){
 renderer.autoClear=false;
 renderer.clear(true,true,true);
 renderer.render(scene,camera);
 if(microScene&&microBlend>.005){
  renderer.clearDepth();
  microBackdrop.material.opacity=microBlend;
  renderer.render(microScene,microCamera);
 }
 renderer.autoClear=true;
}
function resize(){
 const w=innerWidth,h=innerHeight;if(!renderer)return;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 if(microCamera){
  microCamera.aspect=w/h;microCamera.fov=w<821?46:37;
  // Micro camera movement is owned by the expedition navigator.
  microCamera.updateProjectionMatrix();
  // Full-frame micro-world matte lives behind the fibers and cells.
  const depth=18.5;
  const visibleHeight=2*depth*Math.tan(microCamera.fov*Math.PI/360);
  microBackdrop.scale.set(visibleHeight*(w/h)*2.6,visibleHeight*2.6,1);
 }
}
let cameraLastTime=0,zoomSpringVelocity=0;
function stepCameraZoom(dt){
 // Critically-damped second-order motion, frame-rate independent and reversible.
 const omega=15.5,delta=current.zoom-current.targetZoom;
 const t=(zoomSpringVelocity+omega*delta)*dt,k=Math.exp(-omega*dt);
 current.zoom=current.targetZoom+(delta+t)*k;
 zoomSpringVelocity=(zoomSpringVelocity-omega*t)*k;
 if(Math.abs(current.zoom-current.targetZoom)<.00004&&Math.abs(zoomSpringVelocity)<.0002){
  current.zoom=current.targetZoom;zoomSpringVelocity=0;
 }
}
function renderCamera(){
 const now=performance.now(),dt=cameraLastTime?Math.min(.052,(now-cameraLastTime)/1000):1/60;
 cameraLastTime=now;stepCameraZoom(dt);
 const smoothing=1-Math.exp(-9*dt);
 if(current.fundus){
  camera.position.lerp(new THREE.Vector3(0,0,.17-.66*current.zoom),smoothing);
  const t=current.selected?current.fundusTarget:new THREE.Vector3(Math.sin(current.targetYaw)*.59,Math.sin(current.targetPitch)*.43,-1.115);
  current.fundusLook.lerp(t,smoothing);camera.lookAt(current.fundusLook);camera.updateMatrixWorld();
  $('zoomDisplay').textContent=(1+current.zoom*2.4).toFixed(1)+'×';
  $('zoomRange').value=Math.round(current.targetZoom*100);return;
 }
 current.yaw=lerp(current.yaw,current.targetYaw,smoothing);
 current.pitch=lerp(current.pitch,current.targetPitch,smoothing);
 current.focus.lerp(current.focusTarget,smoothing);
 // Logarithmic zoom covers large distances without a sudden speed change.
 const mobileView=window.matchMedia('(max-width: 820px)').matches;
 const baseDistance=mobileView?8.8:5.9;
 const distance=Math.exp(lerp(Math.log(baseDistance),Math.log(.36),current.zoom));
 const nX=Math.sin(current.yaw)*Math.cos(current.pitch),nY=Math.sin(current.pitch),
 nZ=Math.cos(current.yaw)*Math.cos(current.pitch)*(current.rear?-1:1);
 camera.position.set(current.focus.x+distance*nX,current.focus.y+distance*nY,current.focus.z+distance*nZ);
 camera.lookAt(current.focus);camera.updateMatrixWorld();
 $('zoomDisplay').textContent=(4.7/distance).toFixed(1)+'×';
 $('zoomRange').value=Math.round(current.targetZoom*100);
 if(!current.selected&&current.targetZoom<.64&&!current.rear){
  const f=smooth(.16,.63,current.targetZoom);
  current.focusTarget.set(0,0,lerp(0,1.13,f));
 }
}

const SCALE_NAMES=BIO_STAGES;
let lastDepth=-1;
function selectionStage(){
 const z=current.zoom;
 return z<.25?0:z<.66?1:z<.79?2:z<.885?3:z<.945?4:z<.98?5:6;
}
function updatePassiveDepth(){
 if(current.rear)return;
 const stage=selectionStage();
 if(stage!==lastDepth){
  const previousDepth=lastDepth;
  lastDepth=stage;
  window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
   type:'stage',stage,previous:previousDepth
  }}));
  $('depthTitle').textContent=current.fundus&&stage===0?'RETINA':SCALE_NAMES[stage];
  $('depthHint').classList.toggle('micro',stage>=2);
  document.querySelectorAll('.scale-marker').forEach((node,i)=>{
   node.classList.toggle('active',i===stage);node.classList.toggle('passed',i<stage);
   node.setAttribute('aria-current',i===stage?'step':'false');
  });
  if(stage>=2){$('infoPanel').hidden=true;}
  else if(current.selection)updateSelectionCard(stage);
  window.IrispectraScience?.indicate?.(stage===0?0:stage===1?1:stage+1);
 }
 $('scaleProgress').style.width=(clamp(current.zoom,0,1)*100).toFixed(1)+'%';
}

function animate(){
 requestAnimationFrame(animate);
 renderCamera();updateLightSimulation();updatePassiveDepth();updateDeepWorld();
 const idle=!current.selected&&!current.fundus&&!current.rear&&current.zoom<.32&&!pointers.size;
 const t=performance.now()*.001;
 const targetX=idle?eyeGazeY+Math.sin(t*.47)*.008:0;
 const targetY=idle?eyeGazeX+Math.cos(t*.39)*.010:0;
 eyeGroup.rotation.x=lerp(eyeGroup.rotation.x,targetX,.06);
 eyeGroup.rotation.y=lerp(eyeGroup.rotation.y,targetY,.06);
 updateDots();renderAtlasLayers();
}
function setZoom(value){
 const previousZoom=current.targetZoom;
 // Zoom is reversible and never silently changes anatomical scenes.
 if(current.fundus&&value<=0){exitFundus();return;}
 if(current.fundusTransition&&value<current.targetZoom){clearTimeout(fundusTimer);current.fundusTransition=false;$('enterBtn').disabled=false;}
 current.targetZoom=clamp(value,0,1);
 // Even an uninterrupted scroll without an earlier hotspot must enter the real micro-scene.
 if(current.targetZoom>=.66&&!current.selected&&!current.rear&&!current.fundus){
  const feature=BIO_ROUTES[activeBioRoute].anchor;
  current.selected=pointAt(feature.radius,feature.angle);
  current.focusTarget.copy(current.selected);
  deepRoute='iris';setIrisSelection(feature,1);
 }
 if(Math.abs(current.targetZoom-previousZoom)>.0008){
  window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
   type:'zoom',zoom:current.targetZoom,delta:current.targetZoom-previousZoom,x:.5
  }}));
 }
 if(current.fundus)return;
 // Continuous central zoom switches to an anatomically separate posterior scene only at the threshold.
 if(value>=.995&&!current.selected&&!current.rear&&!current.fundusTransition){enterFundus();return;}if(current.targetZoom<.24){current.selected=null;current.focusTarget.set(0,0,current.targetZoom<.2?0:1.13);current.selection=null;$('infoPanel').hidden=true;clearSelection()}if(current.rear)return;if(current.targetZoom>.62){$('sceneNumber').textContent='02 / THE IRIS';$('sceneTitle').innerHTML='LOOK<br>CLOSER.';$('sceneNote').textContent='Every fiber tells a story of structure.'}else{$('sceneNumber').textContent='01 / THE HUMAN EYE';$('sceneTitle').innerHTML='THE WORLD<br>WITHIN.';$('sceneNote').textContent='A closer look at what makes every iris unique.'}}
function enterFundus(){
 if(current.fundus||current.fundusTransition)return;
 activeBioRoute='neural';
 if(current.rear)toggleRear();
 current.fundusTransition=true;current.selected=null;current.selection=null;current.targetYaw=0;current.targetPitch=0;
 current.focusTarget.set(0,0,1.13);setZoom(.95);$('infoPanel').hidden=true;$('enterBtn').disabled=true;
 fundusTimer=setTimeout(()=>{
  current.fundus=true;current.fundusTransition=false;current.zoom=.10;current.targetZoom=.10;
  camera.position.set(0,0,.20);current.fundusLook.set(0,0,-1.115);current.fundusTarget.set(0,0,-1.115);
  eyeGroup.visible=false;fundusStage.group.visible=true;current.anatomy=true;drawDots();
  $('fundusBtn').classList.add('active');$('anatomyBtn').classList.add('active');
  $('sceneNumber').textContent='04 / INSIDE THE FUNDUS';
  $('sceneTitle').innerHTML='INSIDE<br>THE EYE.';
  $('sceneNote').textContent='The retinal surface, vessels, macula, fovea and optic disc.';
  $('modeLabel').textContent='EDUCATIONAL RETINA SIMULATION / NOT A PATIENT SCAN';
  $('enterBtn').disabled=false;$('enterBtn').innerHTML='ZOOM OUT TO RETURN <span>↩</span>';
  setNotice('RETINAL MODEL: ANATOMICAL ILLUSTRATION, NOT A RETINAL IMAGE');
 },window.matchMedia('(prefers-reduced-motion: reduce)').matches?80:650);
}
function exitFundus(){
 clearTimeout(fundusTimer);current.fundusTransition=false;current.fundus=false;
 eyeGroup.visible=true;fundusStage.group.visible=false;current.anatomy=false;current.selected=null;
 current.focusTarget.set(0,0,0);current.targetYaw=0;current.targetPitch=0;current.selection=null;camera.position.set(0,0,4.7);
 $('anatomyBtn').classList.remove('active');$('fundusBtn').classList.remove('active');
 $('infoPanel').hidden=true;$('annotate').hidden=true;$('enterBtn').disabled=false;
 $('enterBtn').innerHTML='ENTER IRIS <span>↗</span>';
 $('modeLabel').textContent=current.demo?'INTERACTIVE 3D / SYNTHETIC DEMO':'YOUR PHOTO / SYNTHETIC DEPTH';
 drawDots();setZoom(.10);
}
function reset(){
 activeBioRoute='crypt';bioGuided=false;
 clearTimeout(fundusTimer);current.fundusTransition=false;$('enterBtn').disabled=false;
 if(current.fundus)exitFundus();if(current.rear)toggleRear();current.selected=null;current.selection=null;current.focusTarget.set(0,0,0);current.focus.set(0,0,0);current.zoom=.07;current.targetZoom=.07;current.targetYaw=0;current.targetPitch=0;setZoom(.07);$('infoPanel').hidden=true;clearSelection()}
function approach(p){current.selected=p;if(current.fundus&&deepRoute==='iris')deepRoute='retina';if(current.fundus)current.fundusTarget.copy(p);else current.focusTarget.copy(p);setZoom(.84);updateSelectionCard();}
let domPins=[];
const DEEP_INFO={
 iris:['Visible iris and pupil','Crypts, collarette and radial stromal texture','Iris stroma / collagen fiber bundles','Melanocytes and fibroblasts','Collagen and melanin / molecular context'],
 sclera:['Sclera / episclera','Superficial connective tissue','Dense stromal collagen','Scleral fibroblast','Type I collagen motif'],
 retina:['Retinal surface','Retinal anatomy and vessels','Retinal tissue layers','Photoreceptor and ganglion cell','Phototransduction components'],
 vessel:['Retinal blood vessel','Artery / vein surface','Vessel wall and basement membrane','Endothelium and pericytes','Cell-junction molecular context'],
 nerve:['Optic disc','Retinal nerve fiber layer','Optic nerve bundles','Ganglion cell axons / glia','Axonal transport molecules']
};
function classifySelection(){
 const sel=current.selection;if(!sel)return;
 const d=MORPHOLOGY[sel.kind];
 const picker=$('infoPatternSelect');
 const selectable=!!d&&['crypt','lacuna','furrow','pigment','collarette'].includes(sel.kind);
 if(picker.dataset.kind!==sel.kind){
  picker.replaceChildren();
  const none=document.createElement('option');none.value='';none.textContent='Choose appearance';picker.appendChild(none);
  for(const p of d?.patterns||[]){const option=document.createElement('option');option.value=p;option.textContent=p;picker.appendChild(option)}
  picker.dataset.kind=sel.kind;
 }
 picker.hidden=!selectable;
 picker.value=sel.pattern||'';
 $('infoPattern').textContent=sel.pattern||(d?.name||sel.kind);
}
let lastBiologySelection=null;
function updateSelectionCard(stage=selectionStage()){
 const sel=current.selection;if(!sel)return;
 // New selection automatically exposes its full science content; subsequent zoom
 // updates replace only the facts, preserving whether the user expanded/collapsed it.
 if(sel!==lastBiologySelection){
  lastBiologySelection=sel;
  const biology=$('microFacts');
  if(biology)biology.open=!window.matchMedia('(max-width: 820px)').matches;
 }
 const d=MORPHOLOGY[sel.kind],layer=stage>=2?
  {...bioInfo(activeBioRoute,stage),kicker:BIO_STAGES[stage]}:
  getDepthInfo(deepRoute,stage,sel.kind);
 $('infoIndex').textContent=sel.origin==='map'?'MORPHOLOGY / '+sel.side:sel.origin==='fundus'?'POSTERIOR EYE':'SELECTED STRUCTURE';
 $('infoHeading').textContent=stage>=2?(sel.microRole||layer.title):(sel.zone||d?.name||layer.title);
 $('infoZone').textContent=stage>=2?
  BIO_ROUTES[activeBioRoute].name:
  (sel.origin==='fundus'?sel.zone:(sel.anatomicalZone||'Iris surface'));
 $('infoStage').textContent=layer.kicker+' · '+layer.title;
 classifySelection();
 $('infoBody').textContent=stage>=2?
  (sel.microRole?'Selected '+sel.microRole.toLowerCase()+'. ':'' )+layer.short:
  (MORPH_DETAILS[sel.kind]?.short||d?.note||sel.description||layer.short);
 const list=$('microFactList');list.replaceChildren();
 if(stage<2&&sel.microRole)delete sel.microRole;
 const entries=stage<=1&&MORPH_DETAILS[sel.kind]?
  [...layer.facts,['Observed features',MORPH_DETAILS[sel.kind].features.join(' · ')]]:layer.facts;
 for(const [name,value] of entries){
  const row=document.createElement('div');row.className='fact-entry';
  const label=document.createElement('span');label.textContent=name;
  const detail=document.createElement('strong');detail.textContent=value;
  row.append(label,detail);list.appendChild(row);
 }
 $('infoSource').textContent=stage>=2?'Representative educational anatomy':
  sel.origin==='map'?'Andrews positional chart (2011)':
  d?'Morphology terminology: Andrews (2008)':'Anatomical teaching model';
 $('infoDisclosure').hidden=true;
 $('infoPanel').hidden=false;
}

function setIrisSelection(spec,index=-1,origin='eye',zoneOverride=null){
 if(spec.kind==='pupil')activeBioRoute='muscle';
 else if(spec.kind==='crypt'||spec.kind==='collarette')activeBioRoute='crypt';
 else if(spec.kind==='radial'||spec.kind==='pigment')activeBioRoute='pigment';
 else if(spec.kind==='furrow')activeBioRoute='muscle';
 window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
  type:'select',kind:spec.kind||'iris',x:(1+Math.cos(spec.angle??0))/2
 }}));
 const kind=spec.kind&&MORPHOLOGY[spec.kind]?spec.kind:'radial';
 const radius=spec.radius??.42,angle=spec.angle??Math.PI/2;
 const anatomical=polarRegion(radius,angle);
 const chart=zoneForEyePoint(window.IrispectraMorphology?.side||'Rx',radius,angle);
 current.selection={kind,origin,side:window.IrispectraMorphology?.side||'Rx',
   zone:zoneOverride||chart.zone?.name||anatomical.zone,anatomicalZone:anatomical.zone,
   index,pattern:spec.pattern||'',radius,angle};
 updateSelectionCard();
}
function appendMorphology(spec,index){if(!current.fundus)setIrisSelection(spec,index);}
$('infoPatternSelect')?.addEventListener('change',e=>{
 if(!current.selection)return;current.selection.pattern=e.target.value;updateSelectionCard();
});
window.addEventListener('irispectra-map-select',e=>{
 if(!iris||current.fundus||current.rear)return;
 const {minute,rho,feature,name,side}=e.detail;
 const theta=minute/60*Math.PI*2;
 const angle=Math.atan2(Math.cos(theta),Math.sin(theta));
 const radius=clamp(.195+((rho-.34)/.60)*(.63-.195),.205,.62);
 current.selected=pointAt(radius,angle);current.focusTarget.copy(current.selected);
 deepRoute=feature==='limbal'?'sclera':'iris';clearSelection();
 setIrisSelection({kind:feature,radius,angle},-1,'map',name);current.selection.side=side;
 updateSelectionCard();
 if(window.matchMedia('(max-width:820px)').matches){
  const panel=$('morphChart');panel.hidden=true;$('morphToggle').setAttribute('aria-expanded','false');
 }
 setZoom(Math.max(.48,current.targetZoom));
});
function drawDots(){
 $('hotspots').replaceChildren();domPins=[];
 const list=current.fundus?fundusStage.spots:(current.demo?initPins:current.pinList);
 list.forEach((spec,index)=>{const b=document.createElement('button');b.type='button';b.className='hotspot off';b.innerHTML='<span class="dot"></span><span class="tag"></span>';const type=spec.kind;b.querySelector('.tag').textContent=annotations[type][0].toUpperCase();b.setAttribute('aria-label','Explore '+annotations[type][0]);b.addEventListener('pointerdown',e=>e.stopPropagation());b.onclick=e=>{e.stopPropagation();showPin(spec,index,b);if(current.fundus){deepRoute=String(spec.kind).includes('vessel')?'vessel':String(spec.kind).includes('disc')?'nerve':'retina';setZoom(Math.max(.50,current.targetZoom));}else{deepRoute=spec.kind==='limbal'?'sclera':'iris';current.focusTarget.copy(current.selected);setZoom(Math.max(.5,current.targetZoom));}};$('hotspots').appendChild(b);domPins.push({el:b,spec})});
}
function clearSelection(){domPins.forEach(({el})=>el.classList.remove('current'))}
function showPin(spec,index,el){
 window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
  type:'select',kind:spec.kind||'iris',x:(1+Math.cos(spec.angle??0))/2
 }}));
 current.selected=current.fundus?fundusStage.at(spec.u,spec.v):pointAt(spec.radius,spec.angle);
 if(current.fundus){current.fundusTarget.copy(current.selected);
  activeBioRoute='neural';
  deepRoute=spec.kind==='fundusVessels'?'vessel':spec.kind==='fundusDisc'?'nerve':'retina';
  current.selection={kind:'retina',zone:annotations[spec.kind]?.[0]||'Retinal structure',
   origin:'fundus',description:annotations[spec.kind]?.[1]||'Posterior eye anatomy',
   anatomicalZone:'Retina',pattern:''};
 }else{
  current.focusTarget.copy(current.selected);
  appendMorphology(spec,index);
  window.IrispectraMorphology?.focus?.(spec);
 }
 clearSelection();el.classList.add('current');updateSelectionCard();
}
function updateDots(){for(const {el,spec} of domPins){if(!current.anatomy){el.classList.add('off');continue}const v=current.fundus?fundusStage.at(spec.u,spec.v):pointAt(spec.radius,spec.angle);if(!current.fundus)v.applyMatrix4(eyeGroup.matrixWorld);v.project(camera);const x=(v.x+1)*innerWidth*.5,y=(1-v.y)*innerHeight*.5;const seen=v.z<1&&v.z>-1&&x>20&&x<innerWidth-90&&y>80&&y<innerHeight-75;el.classList.toggle('off',!seen);el.style.left=x+'px';el.style.top=y+'px'}}
function rayPin(x,y){if(current.fundus)return false;const v=new THREE.Vector2(x/innerWidth*2-1,-(y/innerHeight*2-1)),ray=new THREE.Raycaster();ray.setFromCamera(v,camera);const hits=ray.intersectObject(iris);if(!hits.length)return false;const p=hits[0].point,r=Math.hypot(p.x,p.y),a=Math.atan2(p.y,p.x);current.pinList.push({kind:current.pinKind,radius:r,angle:a});current.place=false;$('placeAnnotation').classList.remove('armed');drawDots();setNotice('MANUAL ANNOTATION PLACED');return true}
function inferIrisEntry(radius,angle,onPupil){
 if(onPupil||radius<.20)return 'pupil';
 // Nearest known reference hotspot in the synthetic demo; this is NOT
 // automated crypt detection on a user's photograph.
 if(current.demo){
  const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius;
  const nearest=initPins.filter(p=>['crypt','collarette','furrow','radial'].includes(p.kind))
   .map(p=>({kind:p.kind,distance:Math.hypot(px-p.radius*Math.cos(p.angle),py-p.radius*Math.sin(p.angle))}))
   .sort((a,b)=>a.distance-b.distance)[0];
  if(nearest&&nearest.distance<.085)return nearest.kind;
 }
 if(radius>.53)return 'furrow';
 if(radius<.31)return 'collarette';
 return 'radial';
}
function selectByTap(x,y,{preserveZoom=false}={}){
 if(current.place||current.rear||current.fundusTransition)return false;
 // A click at a meaningful surface makes a soft glass selection sound.
 // If a marker already emits a cue, event throttling avoids doubling it.
 const soundX=Math.max(0,Math.min(1,x/innerWidth));
 const v=new THREE.Vector2(x/innerWidth*2-1,-(y/innerHeight*2-1)),ray=new THREE.Raycaster();
 if(deepGroup?.visible&&microNav?.isActive()){
  ray.setFromCamera(v,microCamera);
  deepGroup.updateMatrixWorld(true);
  const hits=ray.intersectObject(deepGroup,true).filter(h=>
   h.object.isMesh&&!h.object.userData.decorative&&!h.object.parent?.userData.decorative
  );
  if(!hits.length){$('microLabel').hidden=true;return false;}
  const hit=hits[0],role=hit.object.userData.role||hit.object.parent?.userData.role||
    (deepRoute==='iris'?'Iris microstructure':deepRoute+' microstructure');
  microNav.focus(hit.point);
  if(!current.selection)current.selection={
   kind:deepRoute==='iris'?'radial':deepRoute,zone:'Microscopic environment',
   anatomicalZone:deepRoute==='iris'?'Iris stroma':'Ocular microanatomy',origin:'micro'
  };
  current.selection.microRole=role;
  updateSelectionCard(selectionStage());
  showMicroLabel(role,x,y);
  showMicroDiscovery(role);
  window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{type:'select',kind:role,x:soundX}}));
  return true;
 }
 ray.setFromCamera(v,camera);
 if(current.fundus){
  const hits=ray.intersectObject(fundusStage.group,true);if(!hits.length)return false;
  current.selected=hits[0].point.clone();current.fundusTarget.copy(current.selected);deepRoute='retina';
  current.selection={kind:'retina',zone:'Retinal surface',anatomicalZone:'Posterior retina',origin:'fundus',pattern:'',description:'Selected surface within the fundus model.'};
 }else{
  const hits=ray.intersectObjects([iris,eyeWhite,pupil],false);if(!hits.length)return false;
  const hit=hits[0];
  const local=hit.point.clone();eyeGroup.worldToLocal(local);
  const radius=Math.hypot(local.x,local.y),angle=Math.atan2(local.y,local.x);
  const onSclera=hit.object===eyeWhite,onPupil=hit.object===pupil;
  if(onPupil&&preserveZoom)return false;
  current.selected=hit.point.clone();current.focusTarget.copy(current.selected);
  deepRoute=onSclera?'sclera':'iris';
  if(onSclera)current.selection={kind:'sclera',zone:'Sclera',anatomicalZone:'Outer eye coat',origin:'eye',pattern:'',description:'Dense fibrous tunic'};
  else {
   const kind=inferIrisEntry(radius,angle,onPupil);
   setIrisSelection({kind,radius,angle});
  }
  if(!onSclera)window.IrispectraMorphology?.focus?.({
   kind:inferIrisEntry(radius,angle,onPupil),radius,angle});
 }
 window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
  type:'select',kind:current.selection?.kind||'surface',x:soundX
 }}));
 updateSelectionCard();
 if(!preserveZoom)setZoom(Math.max(current.targetZoom,.46));
 return true;
}
function pointerSetup(){
 let pinchDistance=0,pinchGesture=false;
 canvas.addEventListener('wheel',e=>{
  if(tourActive)stopDiscoveryTour();
  e.preventDefault();
  const dy=e.deltaY*(e.deltaMode===1?12:e.deltaMode===2?innerHeight:1);
  if(microNav?.isActive()&&current.zoom>=.66&&!e.shiftKey){
   const edge=microNav.dolly(-dy*.85);
   if(edge==='deeper')setZoom(BIO_TARGETS[Math.min(6,selectionStage()+1)]);
   else if(edge==='shallower')setZoom(BIO_TARGETS[Math.max(2,selectionStage()-1)]);
   else if(edge==='surface')setZoom(.49);
   else window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
    type:'zoom',zoom:current.zoom,delta:-dy*.00021
   }}));
   return;
  }
  if(!current.selected&&dy<0&&current.targetZoom<.68)selectByTap(e.clientX,e.clientY,{preserveZoom:true});
  const change=-(Math.sign(dy))*Math.min(.095,Math.abs(dy)*.00062);
  if(change)setZoom(current.targetZoom+change);
 },{passive:false});
 canvas.addEventListener('pointerdown',e=>{
  if(tourActive)stopDiscoveryTour();
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
  if(pointers.size===2){
   pinchGesture=true;
   const v=[...pointers.values()];
   pinchDistance=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);
   if(!current.selected){
    const cx=(v[0].x+v[1].x)/2,cy=(v[0].y+v[1].y)/2;
    selectByTap(cx,cy,{preserveZoom:true});
   }
  }
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)){
   if(e.pointerType==='mouse'&&!current.selected){
    const rect=canvas.getBoundingClientRect();
    eyeGazeX=clamp((e.clientX-(rect.left+rect.width/2))/(rect.width/2)*.10,-.10,.10);
    eyeGazeY=clamp((e.clientY-(rect.top+rect.height/2))/(rect.height/2)*-.065,-.065,.065);
   }
   return;
  }
  const old=pointers.get(e.pointerId);
  pointers.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});
  if(pointers.size===2){
   pinchGesture=true;
   const v=[...pointers.values()],dist=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);
   if(pinchDistance>0)setZoom(current.targetZoom+Math.log(Math.max(.01,dist/pinchDistance))*.26);
   pinchDistance=dist;return;
  }
  if(microNav?.isActive()){
   microNav.lookDelta(e.clientX-old.x,e.clientY-old.y);
  }else{
   // Surface orbit stays distinct from micro free-look.
   current.targetYaw=clamp(current.targetYaw+(e.clientX-old.x)*.004,-.48,.48);
   current.targetPitch=clamp(current.targetPitch-(e.clientY-old.y)*.003,-.29,.29);
  }
  window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{
   type:'move',amount:Math.hypot(e.clientX-old.x,e.clientY-old.y),x:e.clientX/innerWidth
  }}));
 });
 const release=e=>{
  const p=pointers.get(e.pointerId);
  if(!p)return;
  pointers.delete(e.pointerId);
  if(pointers.size===0)pinchDistance=0;
  if(!pinchGesture&&e.type==='pointerup'&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<10){
   if(current.place)rayPin(e.clientX,e.clientY);else selectByTap(e.clientX,e.clientY);
  }
  if(pointers.size===0)pinchGesture=false;
 };
 ['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,release));
 document.addEventListener('keydown',e=>{
  const tag=document.activeElement?.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag)||document.activeElement?.isContentEditable)return;
  if(microNav?.isActive()&&microNav.pressKey(e.key,true)){e.preventDefault();return;}
  if(e.key==='+'||e.key==='='||e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();stopDiscoveryTour();setZoom(current.targetZoom+.075)}
  else if(e.key==='-'||e.key==='_'||e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();stopDiscoveryTour();setZoom(current.targetZoom-.075)}
  else if(e.key==='0'||e.key==='Home'){e.preventDefault();stopDiscoveryTour();reset()}
 },{passive:false});
 document.addEventListener('keyup',e=>{
  if(microNav?.isActive()&&microNav.pressKey(e.key,false))e.preventDefault();
 },{passive:false});
 canvas.addEventListener('pointerleave',()=>{eyeGazeX=0;eyeGazeY=0});
 canvas.tabIndex=0;
}
let tourActive=false,tourTimers=[];
function stopDiscoveryTour(){
 tourTimers.forEach(clearTimeout);tourTimers=[];tourActive=false;
 const btn=$('tourBtn');
 if(btn){btn.setAttribute('aria-pressed','false');btn.innerHTML='<span class="tour-dot"></span> START DISCOVERY';}
 if($('tourCaption'))$('tourCaption').hidden=true;
}
function discoveryStep(ms,n,label,fn){
 tourTimers.push(setTimeout(()=>{if(!tourActive)return;
  $('tourCount').textContent=String(n).padStart(2,'0')+' / 05';
  $('tourText').textContent=label;fn();
 },ms));
}
function startDiscoveryTour(){
 stopDiscoveryTour();reset();tourActive=true;
 $('tourBtn').setAttribute('aria-pressed','true');
 $('tourBtn').innerHTML='<span class="tour-dot"></span> STOP TOUR';
 $('tourCaption').hidden=false;
 discoveryStep(40,1,'A living three-dimensional eye',()=>setZoom(.20));
 discoveryStep(1600,2,'Find an iris crypt-like opening',()=>{
  const spec={kind:'crypt',radius:.43,angle:2.38};
  current.selected=pointAt(spec.radius,spec.angle);current.focusTarget.copy(current.selected);
  deepRoute='iris';setIrisSelection(spec,1);setZoom(.55);
 });
 discoveryStep(4250,3,'Travel into the iris stroma',()=>setZoom(.77));
 discoveryStep(6900,4,'Meet the cells within',()=>setZoom(.88));
 discoveryStep(9400,5,'See the collagen molecular motif',()=>setZoom(.975));
 discoveryStep(12900,5,'Continue exploring',()=>{stopDiscoveryTour();setZoom(.56)});
}

function selectBioRoute(route){
 if(!BIO_ROUTES[route])return;
 if(route==='neural'&&!current.fundus&&!current.fundusTransition){
  // Retina is anatomically posterior: transition via the fundus instead
  // of pretending that retina lies within the anterior iris.
  enterFundus();
  setTimeout(()=>{
   if(current.fundus&&activeBioRoute==='neural')selectBioRoute('neural');
  },window.matchMedia('(prefers-reduced-motion: reduce)').matches?140:760);
  return;
 }
 activeBioRoute=route;
 if(route==='neural')deepRoute='retina';
 else deepRoute='iris';
 // This changes a representative route, not the original photographed specimen.
 const a=BIO_ROUTES[route].anchor;
 if(!current.fundus){
  current.selected=pointAt(a.radius,a.angle);
  current.focusTarget.copy(current.selected);
  if(route==='neural'){
   current.selection={kind:'retina',origin:'micro',zone:'Neural retina',
    anatomicalZone:'Posterior ocular anatomy',pattern:''};
  }else setIrisSelection(a,0,'eye');
 }else{
  current.selection={kind:'retina',origin:'fundus',
   zone:'Neural retina',anatomicalZone:'Posterior eye'};
 }
 $('infoPanel').hidden=true;
 microFrameHud=0;lastMicroNodes='';
 if(current.targetZoom<.66)setZoom(BIO_TARGETS[2]);
 window.dispatchEvent(new CustomEvent('irispectra-sound',{
  detail:{type:'select',kind:route,x:.5}
 }));
}
function showMicroDiscovery(role){
 const fact=describeMicroRole(role,activeBioRoute,selectionStage());
 $('microSelectedTitle').textContent=fact.role;
 $('microSelectedRole').textContent=fact.roleText;
 $('microSelectedClue').textContent=fact.visible;
 $('microDeeper').textContent=selectionStage()===6?'RETURN TO IRIS ↗':'GO DEEPER ↗';
 $('microSelected').hidden=false;
 $('microNodes').querySelectorAll('button').forEach(b=>
  b.setAttribute('aria-pressed',String(b.dataset.role===role)));
}
function focusMicroRole(role){
 if(!activeMicro||!microNav)return;
 let found=null;
 activeMicro.traverse(node=>{
  if(found||!node.isMesh)return;
  const r=String(node.userData.role||'');if(r===role||r.startsWith(role))found=node;
 });
 if(found){const point=new THREE.Vector3();found.getWorldPosition(point);microNav.focus(point);}
 current.selection={kind:activeBioRoute==='neural'?'retina':'radial',
  zone:BIO_ROUTES[activeBioRoute].name,anatomicalZone:BIO_STAGES[selectionStage()],
  origin:'micro',microRole:role};
 updateSelectionCard(selectionStage());showMicroDiscovery(role);
 showMicroLabel(role,innerWidth*.5,innerHeight*.46);
 window.dispatchEvent(new CustomEvent('irispectra-sound',{detail:{type:'select',kind:role,x:.5}}));
}
function showMicroLabel(role,x,y){
 const el=$('microLabel');if(!el)return;
 el.textContent=role;el.style.left=clamp(x,75,innerWidth-75)+'px';
 el.style.top=clamp(y-40,80,innerHeight-100)+'px';
 el.hidden=false;
 if(microLabelTimeout)clearTimeout(microLabelTimeout);
 microLabelTimeout=setTimeout(()=>{el.hidden=true},2500);
}
function updateMicroExplorerHUD(active,now){
 const hud=$('microExplorer');
 if(!hud)return;
 if(hud.hidden===active)hud.hidden=!active;
 if(!active){$('microLabel').hidden=true;return}
 if(now-microFrameHud<100)return;
 microFrameHud=now;
 const data=microNav?.getStatus();if(!data)return;
 $('microTravel').style.width=Math.round(data.progress*100)+'%';
 $('microDistance').textContent=Math.round(data.progress*100)+'% DEPTH';
 $('microGlide').textContent=data.glide?'DRIFT ON':'DRIFT OFF';
 $('microStageName').textContent=BIO_STAGES[data.stage]||'MICRO';
 const chapter=bioInfo(activeBioRoute,Math.max(2,data.stage));
 $('microChapter').textContent=(bioGuided?BIO_ROUTES[activeBioRoute].name+' / ':'')+chapter.short;
 const steps=['THE HUMAN EYE','IRIS MORPHOLOGY','STROMAL ARCHITECTURE','CELLULAR WORLD','INSIDE THE CELL','MOLECULAR STRUCTURE','CHEMICAL FOUNDATIONS'];
 const names=activeBioRoute==='crypt'?['THE HUMAN EYE','IRIS CRYPT','INSIDE THE STROMA','MEET THE FIBROBLAST','MITOCHONDRIAL CRISTAE','COLLAGEN TRIPLE HELIX','PEPTIDE CHEMISTRY']:steps;
 $('microJourneyStep').textContent=String(data.stage+1).padStart(2,'0')+' / 07';
 $('microJourneyTitle').textContent=names[data.stage]||'MICRO EXPEDITION';
 $('microJourneyScale').textContent=data.stage===4&&activeBioRoute==='crypt'?'ORGANELLE CUTAWAY · SCHEMATIC':data.stage>=5?'SCHEMATIC MOLECULAR MODEL':'ILLUSTRATIVE BIOLOGY';
 $('microJourneyNext').textContent=data.stage>=6?'RETURN TO IRIS ↗':'GO DEEPER →';
 $('microMobileNext').textContent=data.stage>=6?'RETURN TO IRIS ↗':'GO DEEPER →';
 const nodeKey=activeBioRoute+':'+data.stage+':'+String(bioGuided);
 if(nodeKey!==lastMicroNodes){
  lastMicroNodes=nodeKey;
  $('microSelected').hidden=true;
  const list=$('microNodes');list.replaceChildren();
  const nodes=nodesAt(activeBioRoute,data.stage);
  for(const node of nodes){
   const b=document.createElement('button');b.type='button';
   b.dataset.role=node.role;b.setAttribute('aria-pressed','false');
   b.textContent=node.role.toUpperCase();b.title=node.roleText;
   b.onclick=()=>focusMicroRole(node.role);list.appendChild(b);
  }
  if(bioGuided&&nodes.length)showMicroDiscovery(nodes[0].role);
 }
 document.querySelectorAll('[data-bio-route]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.bioRoute===activeBioRoute));
 });
 $('microNext').hidden=!bioGuided||data.stage>=6;
 $('microGuide').setAttribute('aria-pressed',String(bioGuided));
 $('microGuide').textContent=bioGuided?'FREE EXPLORE':'GUIDED TOUR';
}
function connectMicroExplorer(){
 const dismiss=$('microPanelDismiss'),reopen=$('microPanelReopen'),panel=$('microExplorer');
 dismiss?.addEventListener('click',()=>{
  panel.classList.add('mobile-dismissed');
  reopen.hidden=false;reopen.setAttribute('aria-expanded','false');
 });
 reopen?.addEventListener('click',()=>{
  panel.classList.remove('mobile-dismissed');
  reopen.hidden=true;reopen.setAttribute('aria-expanded','true');
 });
 $('microPanelToggle')?.addEventListener('click',()=>{
  const open=$('microExplorer').classList.toggle('expanded');
  $('microPanelToggle').setAttribute('aria-expanded',String(open));
  $('microPanelToggle').textContent=open?'CLOSE −':'DETAILS +';
 });
 document.querySelectorAll('[data-bio-route]').forEach(button=>{
  button.addEventListener('click',()=>selectBioRoute(button.dataset.bioRoute));
 });
 $('microGuide').onclick=()=>{
  bioGuided=!bioGuided;lastMicroNodes='';microFrameHud=0;
  updateMicroExplorerHUD(microNav?.isActive(),performance.now());
  if(bioGuided){const first=nodesAt(activeBioRoute,selectionStage())[0];if(first)focusMicroRole(first.role);}
 };
 $('microMobileNext').onclick=()=>{
  stopDiscoveryTour();const stage=selectionStage();
  setZoom(stage>=6?BIO_TARGETS[1]:BIO_TARGETS[stage+1]);
 };
  $('microJourneyNext').onclick=()=>{
  stopDiscoveryTour();const stage=selectionStage();
  setZoom(stage>=6?BIO_TARGETS[1]:BIO_TARGETS[stage+1]);
 };
 $('microDeeper').onclick=()=>{
  stopDiscoveryTour();const stage=selectionStage();
  setZoom(stage===6?BIO_TARGETS[1]:BIO_TARGETS[stage+1]);
 };
 $('microNext').onclick=()=>{
  stopDiscoveryTour();
  const step=Math.min(6,selectionStage()+1);
  setZoom(BIO_TARGETS[step]);
 };
 const stepBack=()=>setZoom(BIO_TARGETS[Math.max(1,selectionStage()-1)]);
 $('microBack').onclick=stepBack;
 $('microGlide').onclick=()=>{microNav?.toggleGlide()};
 const bind=(id,direction)=>{
  const btn=$(id);if(!btn)return;
  let raf=null,last=0,pressed=false,pointerTriggered=false;
  btn.addEventListener('pointerdown',e=>{
   e.preventDefault();pressed=true;pointerTriggered=true;btn.setPointerCapture?.(e.pointerId);
   microNav?.dolly(direction*190);
   last=performance.now();
   const tick=t=>{
    if(!pressed)return;
    const dt=Math.min(.05,(t-last)/1000);last=t;
    microNav?.dolly(direction*dt*400);
    raf=requestAnimationFrame(tick);
   };raf=requestAnimationFrame(tick);
  });
  const stop=()=>{pressed=false;if(raf!==null)cancelAnimationFrame(raf);raf=null};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,stop);
  btn.addEventListener('click',()=>{
   // A pointer tap already moved on pointerdown; click is only for keyboard activation.
   if(pointerTriggered){pointerTriggered=false;return;}
   microNav?.dolly(direction*190);
  });
 };
 bind('microForward',1);bind('microBackward',-1);
}

function connectUi(){
 connectMicroExplorer();
 // Each scale is a real destination; selecting deep tissue from the overview
 // anchors the camera to a representative iris feature automatically.
 const destinations=BIO_TARGETS;
 const markers=[...document.querySelectorAll('#scaleJourney .scale-marker')];
 for(const marker of markers){
  marker.addEventListener('click',()=>{
   stopDiscoveryTour();
   const i=Number(marker.dataset.scale);
   if(i>=2&&!current.selected&&!current.fundus&&!current.rear){
    const feature=BIO_ROUTES[activeBioRoute].anchor;
    current.selected=pointAt(feature.radius,feature.angle);
    current.focusTarget.copy(current.selected);deepRoute='iris';
    setIrisSelection(feature,0);
   }
   setZoom(destinations[Math.min(6,Math.max(0,i))]);
   if(i===0){
    current.selected=null;current.selection=null;$('infoPanel').hidden=true;
    current.focusTarget.set(0,0,0);clearSelection();
   }
  });
 }
 // Small increments on tap; holding a zoom control glides continuously.
 for(const [id,sign] of [['zoomIn',1],['zoomOut',-1]]){
  const el=$(id);let pressTimer=null,holdFrame=null,holding=false,nextTick=0;
  el.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   pressTimer=setTimeout(()=>{
    holding=true;nextTick=0;el.classList.add('zoom-holding');
    const tick=t=>{
     if(!holding)return;
     if(t>=nextTick){stopDiscoveryTour();setZoom(current.targetZoom+sign*.018);nextTick=t+55}
     holdFrame=requestAnimationFrame(tick);
    };
    holdFrame=requestAnimationFrame(tick);
   },320);
  });
  const release=()=>{if(pressTimer){clearTimeout(pressTimer);pressTimer=null}
   if(holdFrame!==null){cancelAnimationFrame(holdFrame);holdFrame=null}
   el.classList.remove('zoom-holding');
   if(holding){setTimeout(()=>{holding=false},0)}
  };
  el.addEventListener('pointerup',release);
  el.addEventListener('pointercancel',release);
  el.addEventListener('pointerleave',release);
  el.addEventListener('click',e=>{
   if(holding){e.preventDefault();e.stopImmediatePropagation();holding=false}
  },true);
 }
 $('tourBtn')?.addEventListener('click',()=>tourActive?stopDiscoveryTour():startDiscoveryTour());
 $('tourSkip')?.addEventListener('click',stopDiscoveryTour);
 $('lightRange')?.addEventListener('input',e=>changeSimulatedLight(Number(e.target.value)/100,'baseline'));
 $('plrFlash')?.addEventListener('click',flashPlr);
 $('plrDark')?.addEventListener('click',()=>changeSimulatedLight(0,'dark'));
 $('plrExplore')?.addEventListener('click',()=>{
  stopDiscoveryTour();selectBioRoute('muscle');setZoom(BIO_TARGETS[2]);
  $('plrLab')?.classList.add('pathway-open');
 });
  $('zoomIn').onclick=()=>{stopDiscoveryTour();setZoom(current.targetZoom+.12)};$('zoomOut').onclick=()=>{stopDiscoveryTour();setZoom(current.targetZoom-.12)};$('zoomRange').oninput=e=>{stopDiscoveryTour();setZoom(Number(e.target.value)/100)};
 $('enterBtn').onclick=()=>{if(current.fundus){setZoom(0);return;}if(current.selected){setZoom(Math.min(1,current.targetZoom+.2));return;}current.focusTarget.set(0,0,1.13);setZoom(Math.min(1,current.targetZoom+.24))};
  $('fundusBtn').onclick=()=>current.fundus?exitFundus():enterFundus();
 $('resetBtn').onclick=()=>{stopDiscoveryTour();reset()};$('exploreBtn').onclick=()=>{reset();setActive('exploreBtn')};
 $('anatomyBtn').onclick=()=>{current.anatomy=!current.anatomy;$('anatomyBtn').classList.toggle('active',current.anatomy);if(current.fundus){$('annotate').hidden=true;return;}if(!current.demo){$('annotate').hidden=!current.anatomy;if(current.anatomy)setNotice('MANUAL ANNOTATIONS ONLY — SELECT PLACE')}else if(current.anatomy)setZoom(.48)};
 $('rearBtn').onclick=()=>toggleRear();
 
  $('uploadBtn').onclick=()=>openDialog('uploadDialog');
 $('mobileUploadBtn')?.addEventListener('click',()=>openDialog('uploadDialog'));
 $('uploadClose').onclick=()=>closeDialog('uploadDialog');
 $('infoClose').onclick=()=>{$('infoPanel').hidden=true;current.selected=null;current.selection=null;clearSelection()};$('approachBtn').onclick=()=>{if(current.selected)approach(current.selected)};
 for(const id of ['uploadDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))closeDialog(id)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){
  closeDialog('uploadDialog');$('infoPanel').hidden=true;
  $('microLabel').hidden=true;
 }});
 $('annotationType').onchange=e=>current.pinKind=e.target.value;
 $('placeAnnotation').onclick=()=>{current.place=!current.place;$('placeAnnotation').classList.toggle('armed',current.place);setNotice(current.place?'CLICK A VISIBLE IRIS REGION':'PIN PLACEMENT OFF')};
 $('clearAnnotations').onclick=()=>{current.pinList=[];drawDots();$('infoPanel').hidden=true};
 $('atlasPhotoConsent').addEventListener('change',updatePhotoSend);
 $('atlasSenderEmail').addEventListener('input',updatePhotoSend);
 $('atlasPhotoSend').addEventListener('click',sendAtlasPhoto);
 $('eyeFile').addEventListener('change',uploadSelected);['cropX','cropY','cropRadius'].forEach(id=>$(id).addEventListener('input',drawCropPreview));$('applyUpload').onclick=applyPhoto;
}
function setActive(id){$('exploreBtn').classList.toggle('active',id==='exploreBtn');$('anatomyBtn').classList.toggle('active',id==='anatomyBtn');$('fundusBtn').classList.toggle('active',id==='fundusBtn')}
function updatePhotoSend(){
 const file=$('eyeFile').files?.[0];
 const email=$('atlasSenderEmail').value.trim();
 $('atlasPhotoSend').disabled=!(file&&$('atlasPhotoConsent').checked&&/^\S+@\S+\.\S+$/.test(email));
}
async function sendAtlasPhoto(){
 const file=$('eyeFile').files?.[0],email=$('atlasSenderEmail').value.trim();
 if(!file||!$('atlasPhotoConsent').checked||!/^\S+@\S+\.\S+$/.test(email))return;
 const button=$('atlasPhotoSend'),status=$('atlasPhotoStatus');
 button.disabled=true;button.textContent='SENDING…';status.textContent='Sending your photo securely over HTTPS…';
 try{
  const form=new FormData();form.set('image',file);form.set('email',email);form.set('consent','yes');
  const response=await fetch('https://irispectra.com/api/atlas-photo',{method:'POST',body:form});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'Email delivery failed');
  status.textContent='Photo emailed successfully. Thank you.';
  button.textContent='SENT ✓';
 }catch(error){
  status.textContent=String(error.message||'Unable to send photo.');
  button.textContent='RETRY SEND ↗';updatePhotoSend();
 }
}
function uploadSelected(e){
 const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>17e6){setNotice('UPLOAD JPG, PNG OR WEBP UNDER 17 MB');return}
 if(uploadUrl)URL.revokeObjectURL(uploadUrl);uploadUrl=URL.createObjectURL(file);uploadImage=new Image();uploadImage.onload=()=>{$('cropArea').hidden=false;drawCropPreview()};uploadImage.onerror=()=>setNotice('COULD NOT READ THE IMAGE');uploadImage.src=uploadUrl;updatePhotoSend();$('atlasPhotoStatus').textContent='The photo remains local until you explicitly send it.';
}
function drawCropPreview(){
 if(!uploadImage)return;const c=$('cropCanvas'),cx=c.getContext('2d'),w=c.width,h=c.height;cx.clearRect(0,0,w,h);cx.fillStyle='#020404';cx.fillRect(0,0,w,h);
 const s=Math.min(w/uploadImage.width,h/uploadImage.height),dx=(w-uploadImage.width*s)/2,dy=(h-uploadImage.height*s)/2;cx.drawImage(uploadImage,dx,dy,uploadImage.width*s,uploadImage.height*s);
 const px=dx+uploadImage.width*s*Number($('cropX').value)/100,py=dy+uploadImage.height*s*Number($('cropY').value)/100,rr=Math.min(uploadImage.width,uploadImage.height)*s*Number($('cropRadius').value)/100;
 cx.save();cx.strokeStyle='#e6edca';cx.lineWidth=1.3;cx.setLineDash([5,4]);cx.beginPath();cx.arc(px,py,rr,0,Math.PI*2);cx.stroke();cx.setLineDash([]);cx.beginPath();cx.moveTo(px-9,py);cx.lineTo(px+9,py);cx.moveTo(px,py-9);cx.lineTo(px,py+9);cx.stroke();cx.restore();
}
function applyPhoto(){
 if(!uploadImage)return;const n=2048,c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d'),r=Math.min(uploadImage.width,uploadImage.height)*Number($('cropRadius').value)/100,x=uploadImage.width*Number($('cropX').value)/100,y=uploadImage.height*Number($('cropY').value)/100;
 ctx.fillStyle='#080a08';ctx.fillRect(0,0,n,n);ctx.drawImage(uploadImage,x-r,y-r,r*2,r*2,0,0,n,n);
 specimenToken++;specimenMode='personal';$('specimenCredit')?.setAttribute('hidden','');current.demo=false;current.pinList=[];current.selected=null;current.anatomy=false;current.place=false;$('annotate').hidden=true;$('anatomyBtn').classList.remove('active');$('textureStatus').textContent='YOUR IRIS / LOCAL';$('modeLabel').textContent='YOUR PHOTO / SYNTHETIC DEPTH';makeTexture(c);drawDots();closeDialog('uploadDialog');reset();setZoom(.36);setNotice('PHOTO MAPPED · IRIS RELIEF IS ILLUSTRATIVE');
}
try{makeScene();connectUi();pointerSetup()}catch(err){console.error('IRISPECTRA_INIT',err);const text=err?.stack||String(err);$('loadingText').textContent='SCENE ERROR / '+String(err?.message||err).slice(0,180);window.__irispectraError=text; const l=$('loading');l.innerHTML='<span class="loading-symbol"></span><span id="loadingText"></span><a href="/classic.html" style="color:#d6dfc1;font:11px ui-monospace">OPEN PHOTO ATLAS ↗</a>'; $('loadingText').textContent='SCENE ERROR / '+String(err?.message||err).slice(0,180); setNotice('SCENE INITIALIZATION ERROR')}
