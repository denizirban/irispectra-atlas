// Subtle microscopy-inspired optical depth. Lightweight WebGL geometry generated
// for every active layer; no photographic scan / patient-specific representation.
export function addMicroAtmosphere(T,group,route,stage){
 const iris=['iris','crypt','pigment','muscle'].includes(route);
 const sclera=route==='sclera',retina=route==='retina'||route==='neural';
 const hue=route==='pigment'?0xc6aa83:route==='muscle'?0xc8a29f:
  route==='crypt'?0xdac5a5:iris?0xc4d0ab:sclera?0xd8cdb6:
  retina?0x9cb0b5:route==='vessel'?0xc7a3ac:0xbac4d4;
 const c=new T.Color(hue);
 const aura=document.createElement('canvas');aura.width=aura.height=128;
 const paint=aura.getContext('2d'),g=paint.createRadialGradient(64,64,2,64,64,64);
 g.addColorStop(0,'rgba(243,249,232,.18)');
 g.addColorStop(.36,'rgba(211,234,213,.09)');
 g.addColorStop(1,'rgba(208,232,214,0)');
 paint.fillStyle=g;paint.fillRect(0,0,128,128);
 const tex=new T.CanvasTexture(aura);
 const halo=new T.Mesh(new T.PlaneGeometry(8.8,8.8),new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));
 halo.position.z=-1.55;halo.userData.role='ambient illumination';halo.userData.decorative=true;group.add(halo);
 const mobile=window.matchMedia('(max-width: 820px)').matches;
 const count=mobile?95:stage===2?210:stage===3?250:280;
 const xyz=new Float32Array(count*3),cols=new Float32Array(count*3),sizes=new Float32Array(count);
 for(let i=0;i<count;i++){
  const a=i*2.399963229728653,rad=Math.sqrt((i+.5)/count)*4.1;
  const z=-2.9+((i*37)%113)/113*5.75;
  xyz[3*i]=Math.cos(a)*rad;
  xyz[3*i+1]=Math.sin(a)*rad*.75;
  xyz[3*i+2]=z;
  const cc=c.clone().lerp(new T.Color(0xffffff),(i%7)/15);
  cols[3*i]=cc.r;cols[3*i+1]=cc.g;cols[3*i+2]=cc.b;
  sizes[i]=.04+(i%5)*.005;
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(xyz,3));
 geometry.setAttribute('color',new T.BufferAttribute(cols,3));
 const particles=new T.Points(geometry,new T.PointsMaterial({vertexColors:true,size:.035,transparent:true,opacity:.25,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
 particles.userData.decorative=true;particles.userData.role='floating micro-particles';group.add(particles);
 // Two highly subdued depth rings give a little spatial parallax at micro scale.
 for(let i=0;i<2;i++){
  const radius=3.45+i*.79;
  const ring=new T.Mesh(new T.TorusGeometry(radius,.005,4,80),
   new T.MeshBasicMaterial({color:hue,transparent:true,opacity:i===0?.12:.055,depthWrite:false,blending:T.AdditiveBlending}));
  ring.position.z=-3.0-i*.6;ring.rotation.x=(i?-.2:.21);
  ring.userData.decorative=true;ring.userData.role='depth reference ring';group.add(ring);
 }
 // Dispersed filaments at several depths create real motion parallax as the
 // camera passes through an anatomical environment. This is illustrative
 // connective/neural structure, not patient-specific reconstruction.
 const strands=mobile?(stage===4?30:60):(stage===4?55:155);
 const filamentMaterial=new T.MeshStandardMaterial({
  color:iris?0xb7b19b:sclera?0xe0d5bc:retina?0x83a6a5:route==='vessel'?0xb2828d:0xa4b9bf,
  roughness:.72,transparent:true,opacity:.22,depthWrite:false,
  side:T.DoubleSide
 });
 const unit=new T.CylinderGeometry(.012,.022,1.0,5,3);
 const batch=new T.InstancedMesh(unit,filamentMaterial,strands);
 const dummy=new T.Object3D();
 const rand=(i,salt)=>{const n=Math.sin(i*127.17+salt*91.4)*43758.5453;return n-Math.floor(n)};
 for(let i=0;i<strands;i++){
  const ring=(i+.5)/strands;
  const a=i*2.39996;
  const r=1.12+3.3*Math.sqrt(ring);
  const z=-3.6+rand(i,6)*6.1;
  dummy.position.set(Math.cos(a)*r,Math.sin(a)*r*.80,z);
  dummy.rotation.set(rand(i,2)*.7-.35,rand(i,3)*1.6-.8,rand(i,4)*1.5-.75);
  const size=.5+rand(i,5)*1.65;
  dummy.scale.set(.45+rand(i,7)*.8,size,.65);
  dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
 }
 batch.instanceMatrix.needsUpdate=true;
 batch.userData.role=stage===4?'matrix-associated motif':
   iris||sclera?'stromal collagen fiber':'microscopic extracellular structure';
 group.add(batch);
 // A few ultra-light granule clusters are placed *within* the tissue volume.
 if(stage===3||stage===4){
  const n=mobile?55:130;
  const geo=new T.SphereGeometry(.028,6,5);
  const mat=new T.MeshPhysicalMaterial({
   color:iris?0xceb58c:0xd5dee0,roughness:.48,transparent:true,opacity:.52,depthWrite:false
  });
  const flecks=new T.InstancedMesh(geo,mat,n);
  for(let i=0;i<n;i++){
   const a=i*2.399963,rr=1.3+2.7*Math.sqrt((i+.5)/n);
   dummy.position.set(Math.cos(a)*rr,Math.sin(a)*rr*.85,
     -2.6+rand(i,9)*5.0);
   const size=.45+rand(i,8)*2.0;
   dummy.scale.set(size,size*(.7+rand(i,2)),size*.8);
   dummy.rotation.set(0,0,0);
   dummy.updateMatrix();flecks.setMatrixAt(i,dummy.matrix);
  }
  flecks.instanceMatrix.needsUpdate=true;
  flecks.userData.decorative=true;group.add(flecks);
 }
 // Surface raking light on fibers or membranes, adjusted to the chosen route.
 const fill=new T.PointLight(hue,stage===2?1.6:2.3,9,2);
 fill.position.set(-2.5,2.4,2.4);fill.userData.decorative=true;group.add(fill);
 // A dim secondary rim light helps very thin fibers and dendrites separate in depth.
 const rim=new T.PointLight(0xe1eaf0,.7,8,2);
 rim.position.set(2.8,-1.6,-.2);rim.userData.decorative=true;group.add(rim);
 group.userData.microParticles=particles;
 group.userData.aura=halo;
}
export function animateMicroAtmosphere(group,t,fade){
 if(!group)return;
 const p=group.userData.microParticles,a=group.userData.aura;
 // Animate only annotated biological objects, using original geometry and
 // non-destructive scale variation. No physics or measured rates are implied.
 const movers=group.userData.bioMovers;
 if(movers){
  for(const obj of movers){
   const m=obj.userData.bioMotion,rest=m.restScale;
   const phase=t*(m.kind==='organelle'?.56:m.kind==='transport'?.48:m.kind==='molecule'?.25:.31)+m.phase;
   const wave=Math.sin(phase)*m.amplitude;
   if(m.kind==='transport'&&m.restPosition){
    obj.position.set(m.restPosition.x+wave,m.restPosition.y,
     m.restPosition.z+.012*Math.sin(phase*1.7));
   }else if(m.kind==='molecule'){
    obj.rotation.y=wave*2.2;
    obj.rotation.x=Math.cos(phase*.67)*m.amplitude;
   }else{
    obj.scale.set(rest.x*(1+wave),rest.y*(1-wave*.55),rest.z*(1+wave*.35));
   }
  }
 }
 if(p){
  p.rotation.z=Math.sin(t*.14)*.16;
  p.position.y=Math.sin(t*.36)*.12;
  p.material.opacity=.25*fade;
 }
 if(a){a.material.opacity=(.74+Math.sin(t*.33)*.1)*fade;}
}