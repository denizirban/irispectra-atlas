import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import {createFundusStage} from "./fundus.js";
import {createScalePaths} from "./scale-paths.js";
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
let scalePaths;
let renderer,scene,camera,eyeGroup,iris,irisMaterial,eyeWhite,cornea,pupil,lighting,texture=null,retina,opticNerve,retinalVessels,fundusStage,fundusTimer;
const current={zoom:.10,targetZoom:.10,yaw:0,targetYaw:0,pitch:0,targetPitch:0,focus:new THREE.Vector3(),focusTarget:new THREE.Vector3(),demo:true,anatomy:false,place:false,pinKind:'crypt',pinList:[],selected:null,animate:true,irisPalette:0,rear:false};
current.fundus=false;current.fundusTransition=false;current.fundusLook=new THREE.Vector3(0,0,-1.115);current.fundusTarget=new THREE.Vector3(0,0,-1.115);
let uploadImage=null, uploadUrl=null, toastTimer, pointers=new Map(),moveTotal=0;
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

const REAL_IRIS_SRC='https://upload.wikimedia.org/wikipedia/commons/1/15/Iris_of_the_Human_Eye.jpg';
let specimenMode='procedural';
function setSpecimenLabel(message,credit=false){
 $('textureStatus').textContent=message;
 const a=$('specimenCredit');if(a)a.hidden=!credit;
}

function photoToIris(img,cx=.50,cy=.49,r=.345){
 const side=Math.min(img.naturalWidth||img.width,img.naturalHeight||img.height),outer=side*r;
 const src=document.createElement('canvas');src.width=img.naturalWidth||img.width;src.height=img.naturalHeight||img.height;
 const sc=src.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0);
 const source=sc.getImageData(0,0,src.width,src.height).data,out=document.createElement('canvas');out.width=out.height=1024;
 const c=out.getContext('2d'),result=c.createImageData(1024,1024),data=result.data;
 // Preserve real iris pixels; remap pupil-to-limbus annulus, never copy dark pupil pixels.
 const inner=outer*.345,px=cx*(img.naturalWidth||img.width),py=cy*(img.naturalHeight||img.height);
 for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
  const dx=(x-512)/512,dy=(y-512)/512,rr=Math.hypot(dx,dy),index=(y*1024+x)*4;
  if(rr>.999){data[index+3]=0;continue;}
  const t=clamp((rr-.30)/.70,0,1);
  const angle=Math.atan2(dy,dx);
  const radius=inner+(outer-inner)*t;
  const sx=clamp(Math.round(px+Math.cos(angle)*radius),0,src.width-1),sy=clamp(Math.round(py+Math.sin(angle)*radius),0,src.height-1);
  const k=(sy*src.width+sx)*4;
  data[index]=source[k];data[index+1]=source[k+1];data[index+2]=source[k+2];data[index+3]=255;
 }
 c.putImageData(result,0,0);return out;
}
function setPhotographicDemo(){
 const image=new Image();image.crossOrigin='anonymous';setSpecimenLabel('LOADING / REFERENCE PHOTO');
 image.onload=()=>{
  // The reference is a CC BY-SA macro photograph, not a 3D patient scan.
  specimenMode='reference';current.demo=true;makeTexture(photoToIris(image));irisMaterial.bumpScale=.003;irisMaterial.roughness=.92;irisMaterial.clearcoat=.025;
  setSpecimenLabel('PHOTO / MCORRENS',true);
  $('modeLabel').textContent='REAL IRIS PHOTO / MODELED 3D SURFACE';setNotice('MACRO SPECIMEN LOADED · DEPTH ILLUSTRATIVE');
 };
 image.onerror=()=>{specimenMode='procedural';setSpecimenLabel('SYNTHETIC / FALLBACK');setNotice('REFERENCE PHOTO UNAVAILABLE · PROCEDURAL IRIS ACTIVE')};
 image.src=REAL_IRIS_SRC;
}
function switchToSynthetic(){
 specimenMode='procedural';current.demo=true;makeTexture(sampleIris());setSpecimenLabel('SYNTHETIC / 3D DEMO');
 $('modeLabel').textContent='PROCEDURAL IRIS / ILLUSTRATIVE DEPTH';
}

function makeTexture(source){
 if(texture)texture.dispose();texture=new THREE.CanvasTexture(source);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());texture.needsUpdate=true;
 if(irisMaterial){irisMaterial.map=texture;irisMaterial.bumpMap=current.demo?texture:null;irisMaterial.bumpScale=current.demo ? 0.015 : 0;irisMaterial.roughness=current.demo?.88:.93;irisMaterial.clearcoat=.025;irisMaterial.needsUpdate=true;}
}

let lightIntensity=.38,targetLight=.38,simPupil=.195;
function updateLightSimulation(){
 lightIntensity=lerp(lightIntensity,targetLight,.035);
 const desired=lerp(.255,.13,lightIntensity);
 simPupil=lerp(simPupil,desired,.045);
 // Mesh geometry resampling alters iris inner opening while retaining outer limbus.
 if(!iris||Math.abs(simPupil-(iris.userData.lastPupil??0))<.0007)return;
 iris.userData.lastPupil=simPupil;
 const a=iris.geometry.attributes.position,uv=iris.geometry.attributes.uv,segments=300,rings=103;
 for(let j=0;j<=rings;j++){
  const r=simPupil+(.63-simPupil)*j/rings;
  for(let i=0;i<=segments;i++){
   const index=j*(segments+1)+i,angle=i/segments*Math.PI*2,x=Math.cos(angle)*r,y=Math.sin(angle)*r;
   a.setXYZ(index,x,y,zIris(r,angle));
   uv.setXY(index,.5+x/1.26,.5+y/1.26);
  }
 }
 a.needsUpdate=true;uv.needsUpdate=true;iris.geometry.computeVertexNormals();
 if(pupil){pupil.scale.setScalar(simPupil/.189)}
 // Pupil edge rings are tagged when built.
 eyeGroup.children.forEach(m=>{if(m.userData.pupilEdge)m.scale.setScalar(simPupil/.195)});
 if(lighting)lighting.intensity=lerp(1.1,4.0,lightIntensity);
 renderer.toneMappingExposure=lerp(1.12,1.68,lightIntensity);
 $('lightValue')&&($('lightValue').textContent=Math.round(lightIntensity*100)+'%');
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
function makeCornea(){
 const segments=96,rows=25,verts=[],uv=[],idx=[];for(let j=0;j<=rows;j++){let r=.68*j/rows;for(let i=0;i<=segments;i++){let a=i/segments*Math.PI*2;verts.push(r*Math.cos(a),r*Math.sin(a),1.225+.105*(1-(r/.68)**2));uv.push(i/segments,j/rows);if(j<rows&&i<segments){let n=j*(segments+1)+i;idx.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1)}}}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(idx);geom.computeVertexNormals();
 const mat=new THREE.MeshPhysicalMaterial({color:0xe2faf7,transparent:true,opacity:.022,roughness:.025,metalness:0,clearcoat:1,clearcoatRoughness:.012,ior:1.376,depthWrite:false,side:THREE.DoubleSide});
 cornea=new THREE.Mesh(geom,mat);cornea.renderOrder=9;eyeGroup.add(cornea);
 // restrained studio softbox reflected in the wet corneal surface
 const glintGeo=new THREE.CircleGeometry(.081,64),glintMat=new THREE.MeshBasicMaterial({color:0xe8f6e7,transparent:true,opacity:.075,depthWrite:false});
 let glint=new THREE.Mesh(glintGeo,glintMat);glint.scale.set(.68,1.8,1);glint.rotation.z=-.32;glint.position.set(-.24,.23,1.303);glint.renderOrder=10;eyeGroup.add(glint);
 const tiny=new THREE.Mesh(new THREE.CircleGeometry(.021,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.33,depthWrite:false}));tiny.position.set(.23,-.13,1.296);tiny.renderOrder=10;eyeGroup.add(tiny);
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
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.48;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.007,100);eyeGroup=new THREE.Group();scene.add(eyeGroup);
 scene.add(new THREE.AmbientLight(0xc8d2c9,1.2));
 const lightA=new THREE.DirectionalLight(0xffdfbf,2.45);lightA.position.set(-3,4,6);scene.add(lightA);lighting=lightA;
 const lightB=new THREE.DirectionalLight(0xbadcd8,.85);lightB.position.set(4,-1,5);scene.add(lightB);
 const lightC=new THREE.PointLight(0xffffff,.7);lightC.position.set(-1,0,4);scene.add(lightC);
 const scleraGeo=new THREE.BufferGeometry(),verts=[],indices=[],steps=160,levels=110,R=1.23,t0=Math.asin(.645/R);
 for(let j=0;j<=levels;j++){let theta=t0+(Math.PI-t0)*j/levels;for(let i=0;i<=steps;i++){let phi=i/steps*2*Math.PI,rr=R*Math.sin(theta);verts.push(rr*Math.cos(phi),rr*Math.sin(phi),R*Math.cos(theta));if(j<levels&&i<steps){let n=j*(steps+1)+i;indices.push(n,n+1,n+steps+1,n+1,n+steps+2,n+steps+1)}}}
 scleraGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));scleraGeo.setIndex(indices);scleraGeo.computeVertexNormals();
 eyeWhite=new THREE.Mesh(scleraGeo,new THREE.MeshPhysicalMaterial({color:0xe2ded6,roughness:.45,clearcoat:.46,clearcoatRoughness:.16,side:THREE.DoubleSide}));eyeWhite.renderOrder=0;eyeGroup.add(eyeWhite);
 addScleralVessels();
 // recess in which the pupil sits
 const hole=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.13,128,1,true),new THREE.MeshStandardMaterial({color:0x090a09,roughness:1,side:THREE.DoubleSide}));hole.rotation.x=Math.PI/2;hole.position.z=1.19;hole.renderOrder=2;eyeGroup.add(hole);
 pupil=new THREE.Mesh(new THREE.CircleGeometry(.189,128),new THREE.MeshBasicMaterial({color:0x030504}));pupil.position.z=1.13;pupil.renderOrder=2;eyeGroup.add(pupil);
 makeIris();const pupilRim=rim(.195,1.215,0x181c14,.013);pupilRim.userData.pupilEdge=true;rim(.623,1.116,0x151e1c,.019);makeCornea();makePosteriorAnatomy();fundusStage=createFundusStage();scene.add(fundusStage.group); // clean eye-only frame
 drawDots();resize();window.addEventListener('resize',resize);setPhotographicDemo();
 $('loading').classList.add('hidden');animate();
}
function resize(){const w=innerWidth,h=innerHeight;if(!renderer)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function renderCamera(){
 if(current.fundus){
  current.zoom=lerp(current.zoom,current.targetZoom,.08);
  camera.position.lerp(new THREE.Vector3(0,0,.17-.66*current.zoom),.075);
  const t=current.selected?current.fundusTarget:new THREE.Vector3(Math.sin(current.targetYaw)*.59,Math.sin(current.targetPitch)*.43,-1.115);
  current.fundusLook.lerp(t,.08);camera.lookAt(current.fundusLook);camera.updateMatrixWorld();
  $('zoomDisplay').textContent='RETINA / '+(1+current.zoom*2.4).toFixed(1)+'×';
  $('zoomRange').value=Math.round(current.targetZoom*100);return;
 }
 current.zoom=lerp(current.zoom,current.targetZoom,.08);current.yaw=lerp(current.yaw,current.targetYaw,.07);current.pitch=lerp(current.pitch,current.targetPitch,.07);current.focus.lerp(current.focusTarget,.08);
 const d=Math.exp(lerp(Math.log(5.9),Math.log(.36),current.zoom));
 const nX=Math.sin(current.yaw)*Math.cos(current.pitch),nY=Math.sin(current.pitch),nZ=Math.cos(current.yaw)*Math.cos(current.pitch)*(current.rear?-1:1);
 camera.position.set(current.focus.x+d*nX,current.focus.y+d*nY,current.focus.z+d*nZ);camera.lookAt(current.focus);camera.updateMatrixWorld();
 $('zoomDisplay').textContent='MAG / '+(4.7/d).toFixed(1)+'×';
 $('zoomRange').value=Math.round(current.targetZoom*100);
 if(!current.selected&&current.targetZoom<.64&&!current.rear){
 let dFocus=smooth(.16,.63,current.targetZoom);
 current.focusTarget.set(0,0,lerp(0,1.13,dFocus));
 }
}

const ZOOM_DEPTH=[
 ['WHOLE EYE','MACRO / CORNEA · IRIS · SCLERA'],
 ['IRIS SURFACE','PIGMENT · RADIAL STROMAL TEXTURE'],
 ['CRYPT MORPHOLOGY','CRYPTS OF FUCHS · COLLARETTE · FURROWS'],
 ['STROMA','EDUCATIONAL TISSUE RECONSTRUCTION'],
 ['CELLULAR SCALE','MELANOCYTES · FIBROBLASTS · COLLAGEN'],
 ['MOLECULAR CONTEXT','MELANIN · COLLAGEN · NEUROTRANSMISSION']
];
let lastDepth=-1;
function updatePassiveDepth(){
  scalePaths?.update(current.zoom);
 if(current.rear||current.fundus)return;
 const z=current.zoom,stage=z<.2?0:z<.49?1:z<.71?2:z<.84?3:z<.94?4:5;
 if(stage===lastDepth)return;lastDepth=stage;
 $('depthTitle').textContent=ZOOM_DEPTH[stage][0];
 $('depthExplainer').textContent=ZOOM_DEPTH[stage][1]+(stage>=3?' / CONCEPTUAL NOT MEASURED':'');
 $('depthHint').classList.toggle('micro',stage>=3);
 // The depth map follows zoom passively; never invokes a scene-changing menu.
 window.IrispectraScience?.indicate?.(stage===0?0:stage===1||stage===2?1:stage);
}

function animate(){requestAnimationFrame(animate);renderCamera();updateLightSimulation();updatePassiveDepth();if(current.demo&&current.animate&&current.targetZoom<.19&&!pointers.size){let t=performance.now()*.00018;eyeGroup.rotation.y=Math.sin(t)*.018;eyeGroup.rotation.x=Math.cos(t*.73)*.009}else{eyeGroup.rotation.x=lerp(eyeGroup.rotation.x,0,.03);eyeGroup.rotation.y=lerp(eyeGroup.rotation.y,0,.03)}
 updateDots();renderer.render(scene,camera)}
function setZoom(value){
 // Zoom is reversible and never silently changes anatomical scenes.
 if(current.fundus&&value<-.015){exitFundus();return;}
 if(current.fundusTransition&&value<current.targetZoom){clearTimeout(fundusTimer);current.fundusTransition=false;$('enterBtn').disabled=false;}
 current.targetZoom=clamp(value,0,1);if(current.fundus)return;if(current.targetZoom<.60){current.selected=null;current.focusTarget.set(0,0,current.targetZoom<.2?0:1.13);$('infoPanel').hidden=true;clearSelection()}if(current.rear)return;if(current.targetZoom>.62){$('sceneNumber').textContent='02 / THE IRIS';$('sceneTitle').innerHTML='LOOK<br>CLOSER.';$('sceneNote').textContent='Every fiber tells a story of structure.'}else{$('sceneNumber').textContent='01 / THE HUMAN EYE';$('sceneTitle').innerHTML='THE WORLD<br>WITHIN.';$('sceneNote').textContent='A closer look at what makes every iris unique.'}}
function enterFundus(){
  scalePaths?.select('retina');
 if(current.fundus||current.fundusTransition)return;
 if(current.rear)toggleRear();
 current.fundusTransition=true;current.selected=null;current.targetYaw=0;current.targetPitch=0;
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
  $('enterBtn').disabled=false;$('enterBtn').innerHTML='BACK TO IRIS <span>↩</span>';
  setNotice('RETINAL MODEL: ANATOMICAL ILLUSTRATION, NOT A RETINAL IMAGE');
 },window.matchMedia('(prefers-reduced-motion: reduce)').matches?80:650);
}
function exitFundus(){
  scalePaths?.select('iris');
 clearTimeout(fundusTimer);current.fundusTransition=false;current.fundus=false;
 eyeGroup.visible=true;fundusStage.group.visible=false;current.anatomy=false;current.selected=null;
 current.focusTarget.set(0,0,0);current.targetYaw=0;current.targetPitch=0;camera.position.set(0,0,4.7);
 $('anatomyBtn').classList.remove('active');$('fundusBtn').classList.remove('active');
 $('infoPanel').hidden=true;$('annotate').hidden=true;$('enterBtn').disabled=false;
 $('enterBtn').innerHTML='ENTER IRIS <span>↗</span>';
 $('modeLabel').textContent=current.demo?'INTERACTIVE 3D / SYNTHETIC DEMO':'YOUR PHOTO / SYNTHETIC DEPTH';
 drawDots();setZoom(.10);
}
function reset(){
 clearTimeout(fundusTimer);current.fundusTransition=false;$('enterBtn').disabled=false;
 if(current.fundus)exitFundus();if(current.rear)toggleRear();current.selected=null;current.focusTarget.set(0,0,0);current.focus.set(0,0,0);current.zoom=.10;current.targetZoom=.10;current.targetYaw=0;current.targetPitch=0;setZoom(.10);$('infoPanel').hidden=true;clearSelection()}
function approach(p){current.selected=p;if(current.fundus)current.fundusTarget.copy(p);else current.focusTarget.copy(p);setZoom(.84);$('infoPanel').hidden=true;if(!current.fundus&&p.length()>0.1){setTimeout(()=>window.IrispectraScience?.advanceFromCrypt(),900)}}
let domPins=[];
function drawDots(){
 $('hotspots').replaceChildren();domPins=[];
 const list=current.fundus?fundusStage.spots:(current.demo?initPins:current.pinList);
 list.forEach((spec,index)=>{const b=document.createElement('button');b.type='button';b.className='hotspot off';b.innerHTML='<span class="dot"></span><span class="tag"></span>';const type=spec.kind;b.querySelector('.tag').textContent=annotations[type][0].toUpperCase();b.setAttribute('aria-label','Explore '+annotations[type][0]);b.addEventListener('pointerdown',e=>e.stopPropagation());b.onclick=e=>{e.stopPropagation();showPin(spec,index,b);if(spec.kind==='crypt'&&!current.fundus){const target=pointAt(spec.radius,spec.angle);approach(target)}};$('hotspots').appendChild(b);domPins.push({el:b,spec})});
}
function clearSelection(){domPins.forEach(({el})=>el.classList.remove('current'))}
function showPin(spec,index,el){scalePaths?.select(({fundusVessels:'vessels',fundusDisc:'nerve',fundusMacula:'retina',fundusRetina:'retina'}[spec.kind])||(current.fundus?'retina':'iris'));current.selected=current.fundus?fundusStage.at(spec.u,spec.v):pointAt(spec.radius,spec.angle);if(current.fundus)current.fundusTarget.copy(current.selected);clearSelection();el.classList.add('current');const a=annotations[spec.kind];$('infoIndex').textContent='STRUCTURE / '+String(index+1).padStart(2,'0');$('infoHeading').textContent=a[0];$('infoBody').textContent=a[1];$('infoDisclosure').textContent=current.fundus?'EDUCATIONAL FUNDUS / NOT A RETINAL SCAN':(current.demo?'SYNTHETIC DEMO · ILLUSTRATIVE MARKER':'USER-PLACED MARKER · NOT AUTOMATED DETECTION');$('infoPanel').hidden=false}
function updateDots(){for(const {el,spec} of domPins){if(!current.anatomy){el.classList.add('off');continue}const v=current.fundus?fundusStage.at(spec.u,spec.v):pointAt(spec.radius,spec.angle);if(!current.fundus)v.applyMatrix4(eyeGroup.matrixWorld);v.project(camera);const x=(v.x+1)*innerWidth*.5,y=(1-v.y)*innerHeight*.5;const seen=v.z<1&&v.z>-1&&x>20&&x<innerWidth-90&&y>80&&y<innerHeight-75;el.classList.toggle('off',!seen);el.style.left=x+'px';el.style.top=y+'px'}}
function rayPin(x,y){if(current.fundus)return false;const v=new THREE.Vector2(x/innerWidth*2-1,-(y/innerHeight*2-1)),ray=new THREE.Raycaster();ray.setFromCamera(v,camera);const hits=ray.intersectObject(iris);if(!hits.length)return false;const p=hits[0].point,r=Math.hypot(p.x,p.y),a=Math.atan2(p.y,p.x);current.pinList.push({kind:current.pinKind,radius:r,angle:a});current.place=false;$('placeAnnotation').classList.remove('armed');drawDots();setNotice('MANUAL ANNOTATION PLACED');return true}
function selectSurfacePath(x,y){
 const v=new THREE.Vector2(x/innerWidth*2-1,-(y/innerHeight*2-1)),ray=new THREE.Raycaster();
 ray.setFromCamera(v,camera);
 if(current.fundus){
   const candidates=fundusStage.spots.map(s=>({spec:s,point:fundusStage.at(s.u,s.v)}));
   const target=candidates.sort((a,b)=>a.point.distanceToSquared(current.fundusLook)-b.point.distanceToSquared(current.fundusLook))[0];
   // Fundus area selection is anchored to the visible retinal surface, not a pixel-perfect vessel segmentation.
   scalePaths?.select(target?.spec?.kind==='fundusDisc'?'nerve':target?.spec?.kind==='fundusVessels'?'vessels':'retina');
   return;
 }
 if(current.rear)return;
 const candidates=ray.intersectObjects([iris,eyeWhite].filter(Boolean),false);
 if(!candidates.length)return;
 const object=candidates[0].object;
 scalePaths?.select(object===iris?'iris':'sclera');
}
function pointerSetup(){let pinchDistance=0;
 canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(current.targetZoom+(e.deltaY>0?1:-1)*Math.min(.09,Math.abs(e.deltaY)*.00045))},{passive:false});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});moveTotal=0;if(pointers.size===2){const arr=[...pointers.values()];pinchDistance=Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y)}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});moveTotal+=Math.abs(e.clientX-old.x)+Math.abs(e.clientY-old.y);if(pointers.size===2){const arr=[...pointers.values()],d=Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y);if(pinchDistance)setZoom(current.targetZoom+Math.log(d/pinchDistance)*.17);pinchDistance=d;return}
 current.targetYaw=clamp(current.targetYaw+(e.clientX-old.x)*.004,-.48,.48);current.targetPitch=clamp(current.targetPitch-(e.clientY-old.y)*.003,-.29,.29)});
 const release=e=>{let p=pointers.get(e.pointerId);if(!p)return;pointers.delete(e.pointerId);if(pointers.size<2)pinchDistance=0;if(Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<9){if(current.place)rayPin(e.clientX,e.clientY);else selectSurfacePath(e.clientX,e.clientY)}};
 ['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,release));
 document.addEventListener('keydown',e=>{
  const tag=document.activeElement?.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag)||document.activeElement?.isContentEditable)return;
  if(e.key==='+'||e.key==='='||e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();setZoom(current.targetZoom+.075)}
  else if(e.key==='-'||e.key==='_'||e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();setZoom(current.targetZoom-.075)}
  else if(e.key==='ArrowRight'&&e.altKey){e.preventDefault();window.IrispectraScience?.next()}
  else if(e.key==='ArrowLeft'&&e.altKey){e.preventDefault();window.IrispectraScience?.previous()}
  else if(e.key==='0'||e.key==='Home'){e.preventDefault();reset()}
 },{passive:false});
  canvas.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){setZoom(current.targetZoom+.08);e.preventDefault()}if(e.key==='-'){setZoom(current.targetZoom-.08);e.preventDefault()}if(e.key==='Escape'){reset()}});
 canvas.tabIndex=0;
}
function openDialog(id){$(id).hidden=false;current.animate=false}
function closeDialog(id){$(id).hidden=true;current.animate=true}
function connectUi(){
 $('lightRange')?.addEventListener('input',e=>{targetLight=Number(e.target.value)/100});
  $('zoomIn').onclick=()=>setZoom(current.targetZoom+.12);$('zoomOut').onclick=()=>setZoom(current.targetZoom-.12);$('zoomRange').oninput=e=>setZoom(Number(e.target.value)/100);
 $('enterBtn').onclick=()=>{if(current.fundus){exitFundus();return;}if(current.targetZoom>.65){enterFundus();return;}current.selected=null;current.focusTarget.set(0,0,1.13);setZoom(.78)};
  $('fundusBtn').onclick=()=>current.fundus?exitFundus():enterFundus();
 $('resetBtn').onclick=reset;$('exploreBtn').onclick=()=>{reset();setActive('exploreBtn')};
 $('anatomyBtn').onclick=()=>{current.anatomy=!current.anatomy;$('anatomyBtn').classList.toggle('active',current.anatomy);if(current.fundus){$('annotate').hidden=true;return;}if(!current.demo){$('annotate').hidden=!current.anatomy;if(current.anatomy)setNotice('MANUAL ANNOTATIONS ONLY — SELECT PLACE')}else if(current.anatomy)setZoom(.48)};
 $('rearBtn').onclick=()=>toggleRear();
 $('referenceBtn')?.addEventListener('click',()=>{if(!current.demo){setNotice('PERSONAL PHOTO ACTIVE · RESET BEFORE DEMO SWITCH');return;}if(specimenMode==='reference')switchToSynthetic();else setPhotographicDemo()});
  $('uploadBtn').onclick=()=>openDialog('uploadDialog');$('uploadClose').onclick=()=>closeDialog('uploadDialog');$('aboutBtn').onclick=()=>openDialog('aboutDialog');$('aboutClose').onclick=()=>closeDialog('aboutDialog');
 $('infoClose').onclick=()=>{$('infoPanel').hidden=true;current.selected=null;clearSelection()};$('approachBtn').onclick=()=>{if(current.selected)approach(current.selected)};
 for(const id of ['uploadDialog','aboutDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))closeDialog(id)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDialog('uploadDialog');closeDialog('aboutDialog');$('infoPanel').hidden=true}});
 $('annotationType').onchange=e=>current.pinKind=e.target.value;
 $('placeAnnotation').onclick=()=>{current.place=!current.place;$('placeAnnotation').classList.toggle('armed',current.place);setNotice(current.place?'CLICK A VISIBLE IRIS REGION':'PIN PLACEMENT OFF')};
 $('clearAnnotations').onclick=()=>{current.pinList=[];drawDots();$('infoPanel').hidden=true};
 $('eyeFile').addEventListener('change',uploadSelected);['cropX','cropY','cropRadius'].forEach(id=>$(id).addEventListener('input',drawCropPreview));$('applyUpload').onclick=applyPhoto;
}
function setActive(id){$('exploreBtn').classList.toggle('active',id==='exploreBtn');$('anatomyBtn').classList.toggle('active',id==='anatomyBtn');$('fundusBtn').classList.toggle('active',id==='fundusBtn')}
function uploadSelected(e){
 const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>17e6){setNotice('UPLOAD JPG, PNG OR WEBP UNDER 17 MB');return}
 if(uploadUrl)URL.revokeObjectURL(uploadUrl);uploadUrl=URL.createObjectURL(file);uploadImage=new Image();uploadImage.onload=()=>{$('cropArea').hidden=false;drawCropPreview()};uploadImage.onerror=()=>setNotice('COULD NOT READ THE IMAGE');uploadImage.src=uploadUrl;
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
 specimenMode='personal';$('specimenCredit')?.setAttribute('hidden','');current.demo=false;current.pinList=[];current.selected=null;current.anatomy=false;current.place=false;$('annotate').hidden=true;$('anatomyBtn').classList.remove('active');$('textureStatus').textContent='YOUR IRIS / LOCAL';$('modeLabel').textContent='YOUR PHOTO / SYNTHETIC DEPTH';makeTexture(c);drawDots();closeDialog('uploadDialog');reset();setZoom(.36);setNotice('PHOTO MAPPED · IRIS RELIEF IS ILLUSTRATIVE');
}
try{makeScene();connectUi();pointerSetup()}catch(err){console.error('IRISPECTRA_INIT',err);const text=err?.stack||String(err);$('loadingText').textContent='SCENE ERROR / '+String(err?.message||err).slice(0,180);window.__irispectraError=text; const l=$('loading');l.innerHTML='<span class="loading-symbol"></span><span id="loadingText"></span><a href="/classic.html" style="color:#d6dfc1;font:11px ui-monospace">OPEN PHOTO ATLAS ↗</a>'; $('loadingText').textContent='SCENE ERROR / '+String(err?.message||err).slice(0,180); setNotice('SCENE INITIALIZATION ERROR')}
