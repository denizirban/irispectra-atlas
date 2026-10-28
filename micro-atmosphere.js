// Subtle microscopy-inspired optical depth. Lightweight WebGL geometry generated
// for every active layer; no photographic scan / patient-specific representation.
export function addMicroAtmosphere(T,group,route,stage){
 const iris=route==='iris',sclera=route==='sclera',retina=route==='retina';
 const hue=iris?0xc4d0ab:sclera?0xd8cdb6:retina?0x9cb0b5:route==='vessel'?0xc7a3ac:0xbac4d4;
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
 const count=stage===2?120:stage===3?160:205;
 const xyz=new Float32Array(count*3),cols=new Float32Array(count*3),sizes=new Float32Array(count);
 for(let i=0;i<count;i++){
  const a=i*2.399963229728653,rad=Math.sqrt((i+.5)/count)*4.1;
  const z=-1.5+Math.sin(i*19.217)*1.52;
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
  const radius=3.25+i*.56;
  const ring=new T.Mesh(new T.TorusGeometry(radius,.005,4,80),
   new T.MeshBasicMaterial({color:hue,transparent:true,opacity:i===0?.12:.055,depthWrite:false,blending:T.AdditiveBlending}));
  ring.position.z=-1.25-i*.5;ring.rotation.x=(i?-.2:.21);
  ring.userData.decorative=true;ring.userData.role='depth reference ring';group.add(ring);
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
 if(p){
  p.rotation.z=Math.sin(t*.14)*.16;
  p.position.y=Math.sin(t*.36)*.12;
  p.material.opacity=.25*fade;
 }
 if(a){a.material.opacity=(.74+Math.sin(t*.33)*.1)*fade;}
}