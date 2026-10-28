// Irispectra Microworld — 3D educational illustrations, not optical reconstructions.
// Connected to anatomical routes: iris stroma, scleral collagen, retinal laminae,
// vessel endothelial lining, and optic nerve axons. Original procedural geometry.
import {addMicroAtmosphere} from './micro-atmosphere.js';
import {BIO_ROUTES,populateBioWorld} from "./micro-biology.js";
export function populateMicroScene(T,root,route,stage){
 if(BIO_ROUTES[route]){
  // Route-specific worlds are built independently to avoid a generic iris
  // model appearing behind every scientific pathway.
  populateBioWorld(T,root,route,stage);
  addMicroAtmosphere(T,root,route==='neural'?'retina':'iris',stage);
  root.userData.anatomyRoute=route;
  root.userData.scale=stage;
  return root.children;
 }
 const rand=(i,s=1)=>{const a=Math.sin(i*127.13+s*19.71)*43758.5453;return a-Math.floor(a)};
 const isIris=route==='iris',isSclera=route==='sclera';
 const materials={
  collagen:new T.MeshStandardMaterial({color:isSclera?0xd8caac:0xcab697,roughness:.67,metalness:0}),
  collagenLight:new T.MeshStandardMaterial({color:0xf2ddbc,roughness:.55}),
  connective:new T.MeshStandardMaterial({color:0x9a866e,roughness:.80,transparent:true,opacity:.68}),
  cytoplasm:new T.MeshPhysicalMaterial({color:0xb4a18b,roughness:.39,clearcoat:.26,transparent:true,opacity:.93}),
  melanocyte:new T.MeshPhysicalMaterial({color:0x9a897b,roughness:.38,clearcoat:.19,transparent:true,opacity:.95}),
  cellMembrane:new T.MeshStandardMaterial({color:0xe7c9a5,roughness:.28,transparent:true,opacity:.26,side:T.DoubleSide}),
  nucleus:new T.MeshStandardMaterial({color:0x565067,roughness:.58}),
  pigment:new T.MeshStandardMaterial({color:0x50332a,roughness:.62}),
  pigmentLight:new T.MeshStandardMaterial({color:0xa1794a,roughness:.59}),
  vessel:new T.MeshPhysicalMaterial({color:0x91545b,roughness:.5,transparent:true,opacity:.83,side:T.DoubleSide}),
  artery:new T.MeshStandardMaterial({color:0xb96862,roughness:.51}),
  neuron:new T.MeshStandardMaterial({color:0xbdcac6,roughness:.52}),
  neuralDark:new T.MeshStandardMaterial({color:0x7b9da2,roughness:.62}),
  membrane:new T.MeshStandardMaterial({color:0x8c9992,roughness:.76,transparent:true,opacity:.58,side:T.DoubleSide}),
  halo:new T.MeshBasicMaterial({color:isIris?0xa2c5b0:isSclera?0xbab59c:0xa8a1a7,transparent:true,opacity:.075,depthWrite:false,side:T.DoubleSide})
 };
 const baseSphere=new T.SphereGeometry(1,13,10);
 function mesh(geo,material,x=0,y=0,z=0){
  const o=new T.Mesh(geo,material);o.position.set(x,y,z);root.add(o);return o;
 }
 function ellipse(x,y,z,scale,material){
  const o=mesh(baseSphere,material,x,y,z);o.scale.set(...scale);return o;
 }
 function polyline(pts,width,material,segments=38){
  const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  return mesh(new T.TubeGeometry(curve,segments,width,6,false),material);
 }
 function grains(count,mat,create){
  const batch=new T.InstancedMesh(baseSphere,mat,count);
  const dummy=new T.Object3D();
  for(let i=0;i<count;i++){
   const [x,y,z,r,sx=1,sy=1,sz=1]=create(i);
   dummy.position.set(x,y,z);dummy.scale.set(r*sx,r*sy,r*sz);
   dummy.rotation.set(rand(i,3)*.5,rand(i,4)*6.28,rand(i,5)*.5);
   dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
  }
  batch.instanceMatrix.needsUpdate=true;batch.frustumCulled=false;root.add(batch);return batch;
 }
 function mist(){
  const count=44;
  grains(count,materials.halo,i=>{
   const a=i*2.399,r=1.4+rand(i,11)*2.3;
   return [Math.cos(a)*r,Math.sin(a)*r,(rand(i,9)-.5)*3,.04+rand(i,2)*.09];
  });
 }
 function strands(n=26,gap=.65,interweave=false){
  // Curved bundles leave an anterior opening rather than inventing a continuous slab.
  for(let i=0;i<n;i++){
   const y=(i-(n-1)/2)*.20;
   const z=(rand(i,8)-.5)*.47-.33;
   const side=i%2?1:-1;
   const pts=[];
   for(let j=0;j<=12;j++){
    const t=j/12,x=(t-.5)*6.3;
    const corridor=Math.exp(-(x*x)/(.85+gap))*Math.exp(-y*y*2.2);
    const bend=side*corridor*gap*.64;
    pts.push([x,y+bend+Math.sin(x*1.1+i*.58)*.09,z+Math.cos(x*.7+i*.6)*.12]);
   }
   const obj=polyline(pts,.027+rand(i,7)*.023,i%4===0?materials.collagenLight:materials.collagen,48);
   obj.userData.role='collagen fiber bundle';
  }
  if(interweave)for(let i=0;i<12;i++){
   const x=(i-5.5)*.46,pts=[];
   for(let j=0;j<=7;j++){
    const t=j/7;
    pts.push([x+.1*Math.sin(t*11+i), (t-.5)*3.3, -.7+Math.sin(t*8+i)*.1]);
   }
   polyline(pts,.016,materials.connective,25);
  }
 }
 function dendrite(x,y,z,angle,length,material,width=.022){
  const dir=[Math.cos(angle),Math.sin(angle)];
  polyline([[x,y,z],[x+dir[0]*length*.32,y+dir[1]*length*.25,z+.10],
    [x+dir[0]*length*.66,y+dir[1]*length*.63,z-.06],
    [x+dir[0]*length,y+dir[1]*length,z+.045]],width,material,22);
 }
 function nucleus(x,y,z,r=.22){return ellipse(x,y,z,[r,r*.78,r*.7],materials.nucleus)}
 function fibroblast(x,y,z,s=1){
  ellipse(x,y,z,[.70*s,.24*s,.22*s],materials.cytoplasm);
  nucleus(x+.03*s,y,z+.145*s,.18*s);
  const membrane=ellipse(x,y,z,[.74*s,.29*s,.24*s],materials.cellMembrane);
  membrane.userData.role='fibroblast membrane';
  for(let k=0;k<6;k++){
   const a=k*2*Math.PI/6;
   dendrite(x,y,z,a,1.20*s,materials.cytoplasm,.020*s);
  }
  return membrane;
 }
 function melanocyte(x,y,z,s=1){
  const body=ellipse(x,y,z,[.35*s,.31*s,.23*s],materials.melanocyte);
  body.userData.role='melanocyte';
  nucleus(x-.035*s,y,z+.19*s,.17*s);
  for(let k=0;k<9;k++){
   const a=k*2*Math.PI/9+.2;
   dendrite(x,y,z,a,(k%2?1.35:1.85)*s,materials.melanocyte,.017*s);
   dendrite(x+Math.cos(a)*.75*s,y+Math.sin(a)*.75*s,z+.03,a+.4,.38*s,materials.melanocyte,.009*s);
  }
  grains(73,materials.pigment,i=>{
   const a=i*2.399,r=Math.sqrt(rand(i,16))*.45*s;
   return [x+r*Math.cos(a),y+r*Math.sin(a)*.83,z+.26*s+rand(i,17)*.05*s,.025*s+rand(i,6)*.019*s];
  });
 }
 function helixTriple(){
  // Three schematic chains wound around one shared axis, not atomic coordinates.
  for(let chain=0;chain<3;chain++){
   const pts=[],p2=chain*2*Math.PI/3;
   for(let j=0;j<=110;j++){
    const t=j/110,ang=t*Math.PI*13+p2;
    pts.push([.50*Math.cos(ang),(t-.5)*5.2,.50*Math.sin(ang)]);
   }
   const helix=polyline(pts,.058,chain===0?materials.collagenLight:materials.collagen,180);
   helix.userData.role='collagen triple helix';
   grains(48,chain===0?materials.collagenLight:materials.collagen,i=>{
    const t=i/47,ang=t*Math.PI*13+p2;
    return [.50*Math.cos(ang),(t-.5)*5.2,.50*Math.sin(ang),.075];
   });
  }
  for(let j=0;j<17;j++){
   const t=j/16,ang=t*Math.PI*13;
   polyline([[.46*Math.cos(ang),(t-.5)*5.2,.46*Math.sin(ang)],
     [.0,(t-.5)*5.2,.0],[-.46*Math.cos(ang),(t-.5)*5.2,-.46*Math.sin(ang)]],
     .014,materials.connective,12);
  }
 }
 function melanosome(x,y,z,s=.7){
  ellipse(x,y,z,[s*.55,s*.30,s*.33],materials.melanocyte);
  grains(34,materials.pigment,i=>{
   const a=i*2.399,r=Math.sqrt(i/34)*s*.43;
   return [x+Math.cos(a)*r,y+Math.sin(a)*r*.56,z+(rand(i,32)-.5)*s*.28,.041*s];
  });
 }
 function stromalMicrofibers(){
  // Fine fibrils weave around the larger stroma bundles. Each fiber is a
  // representative 3D teaching motif, not a reconstruction of a real specimen.
  for(let i=0;i<44;i++){
   const y=(i-21.5)*.105;
   const z=(rand(i,71)-.5)*.65-.45;
   const pts=[];
   for(let k=0;k<=10;k++){
    const t=k/10,x=(t-.5)*6.0;
    const opening=Math.exp(-x*x*.95)*Math.exp(-y*y*1.25);
    pts.push([x,y+Math.sin(i*.9+x*1.6)*.045+(i%2?1:-1)*opening*.35,
     z+Math.cos(x*1.4+i*.62)*.065]);
   }
   const filament=polyline(pts,.007+rand(i,81)*.008,
    i%5===0?materials.collagenLight:materials.connective,32);
   filament.userData.role='stromal collagen microfibril';
  }
  // Thin perfused stromal channels can occur among collagen bundles.
  for(let i=0;i<3;i++){
   const a=i*2.16;
   const pts=[];
   for(let j=0;j<=11;j++){
    const t=j/11,y=(t-.5)*4.2,x=Math.cos(a)*1.5+Math.sin(t*4+i)*.16;
    pts.push([x,y,-.30+.14*Math.sin(t*9+i)]);
   }
   const vessel=polyline(pts,.036,materials.vessel,38);
   vessel.userData.role='stromal capillary model';
  }
 }
 function intracellularDetail(x,y,z,s=1){
  // Nucleolus, vesicles and schematic mitochondria inside the cellular field.
  const nucleolus=ellipse(x-.09*s,y+.02*s,z+.23*s,[.10*s,.085*s,.07*s],materials.nucleus);
  nucleolus.userData.role='nucleolus';
  for(let i=0;i<20;i++){
   const a=i*2.399,r=Math.sqrt((i+.5)/20)*.67*s;
   const xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.5;
   const e=ellipse(xx,yy,z+.11*s,[.041*s,.035*s,.031*s],
    i%4===0?materials.pigmentLight:materials.connective);
   e.userData.role=i%4===0?'pigment granule':'intracellular vesicle';
  }
  for(let i=0;i<2;i++){
   const x1=x+(i?-.42:.40)*s,y1=y+(i?.22:-.20)*s;
   const mito=ellipse(x1,y1,z+.15*s,[.20*s,.08*s,.065*s],materials.collagenLight);
   mito.rotation.z=i?-.34:.28;mito.userData.role='mitochondrion model';
  }
 }
 function molecularMesh(){
  // An extracellular-matrix crosslink and proteoglycan-like components
  // for comparing molecules adjacent to the collagen triple helix.
  for(let i=0;i<18;i++){
   const y=(i-8.5)*.28,a=i*.87;
   const x=Math.sin(a)*1.4,z=Math.cos(a)*.95-.75;
   const cross=polyline([[x-.34,y-.12,z],[x,y,z+.13],[x+.35,y+.13,z]],
    .014,materials.connective,14);
   cross.userData.role='extracellular matrix connection';
  }
  grains(85,materials.collagenLight,i=>{
   const a=i*2.399,r=1.1+1.1*rand(i,94);
   return [Math.sin(a)*r,(i%21-10)*.24,Math.cos(a)*.35-1.0,
    .025+rand(i,91)*.017];
  }).userData.role='matrix-associated molecular motifs';
 }
 function photoreceptors(){
  // Distinct outer/inner segment motifs for retinal visualization.
  for(let i=0;i<8;i++){
   const x=(i-3.5)*.64;
   const body=ellipse(x,.74,.55,[.12,.33,.18],
    i%3===0?materials.collagenLight:materials.neuron);
   body.userData.role=i%3===0?'cone photoreceptor':'rod photoreceptor';
   for(let k=0;k<5;k++){
    const disc=mesh(new T.TorusGeometry(.11,.013,5,20),
     materials.neuralDark,x,.95+k*.13,.58);
    disc.scale.set(1,i%3===0?.70:1,.66);
    disc.userData.role='photoreceptor disc membrane';
   }
   const axon=polyline([[x,.5,.55],[x,-.20,.45],[x-.08,-.68,.44]],
    .025,materials.neuron,22);axon.userData.role='photoreceptor axon';
  }
 }
 function retinalLayers(){
  // Alternating neurite bands and cell strata; not a patient-specific histology slide.
  for(let layer=0;layer<7;layer++){
   const y=(layer-3)*.52;
   const band=mesh(new T.PlaneGeometry(5.8,.42),layer%2?materials.membrane:materials.halo,0,y,-.56);
   band.userData.role='retinal layer';
   grains(21,layer===5?materials.nucleus:materials.neuron,i=>{
    const x=(i-10)*.26;
    return [x,y+(rand(i,layer)-.5)*.16,-.20+rand(i,8)*.4,.09+rand(i,9)*.055,1,.8,.7];
   });
  }
  for(let i=0;i<14;i++){
   const x=(i-6.5)*.35;
   polyline([[x,-2.0,.18],[x+.08,-1.2,.19],[x-.02,-.34,.08],[x+.06,1.6,.15]],.033,materials.neuralDark,29);
  }
 }
 function axonBundle(n=38){
  for(let i=0;i<n;i++){
   const a=i*2.399,rad=2.4*Math.sqrt(i/n);
   const y=Math.cos(a)*rad,z=Math.sin(a)*rad*.43;
   polyline([[-3,y-.10,z],[-1.5,y+.08,z+.15],[0,y-.07,z],[2.8,y+.11,z-.1]],.040+rand(i,7)*.029,
     i%4===0?materials.collagenLight:materials.neuron,35);
  }
  for(let j=0;j<10;j++){
   const x=(j-5)*.55;
   ellipse(x,-2.4,-.6,[.14,.10,.20],materials.nucleus);
  }
 }
 function vascularRing(){
  const wall=mesh(new T.TorusGeometry(1.66,.37,18,86),materials.vessel,0,0,0);
  wall.userData.role='retinal vessel wall';
  wall.rotation.x=.19;
  const hole=mesh(new T.CircleGeometry(1.30,88),materials.halo,0,0,-.23);
  hole.userData.role='vessel lumen';
  for(let i=0;i<30;i++){
   const a=i*Math.PI*2/30,x=1.65*Math.cos(a),y=1.65*Math.sin(a);
   const e=ellipse(x,y,.20,[.24,.115,.075],materials.cytoplasm);
   e.rotation.z=a+Math.PI/2;
   ellipse(x,y,.29,[.12,.09,.07],materials.nucleus);
  }
 }
 function organelles(){
  for(let i=0;i<11;i++){
   const x=(rand(i,24)-.5)*3.8,y=(rand(i,25)-.5)*2.4;
   ellipse(x,y,.5,[.12+rand(i,26)*.18,.17,.14],i%3?materials.neuron:materials.nucleus);
  }
 }
 mist();
 if(stage===2){
  if(isIris||isSclera){
   strands(isSclera?44:34,isIris?.93:.25,true);
   if(isIris)stromalMicrofibers();
   grains(isIris?100:46,materials.pigment,i=>{
    const a=i*2.399,r=.7+rand(i,17)*1.9;
    return [Math.cos(a)*r,Math.sin(a)*r,-.25+rand(i,19)*.24,.017+rand(i,2)*.023];
   });
   fibroblast(-1.5,-.88,.40,.55);
   if(isIris)melanocyte(1.4,.85,.55,.52);
  }else if(route==='vessel'){vascularRing();}
  else if(route==='nerve'){axonBundle();}
  else retinalLayers();
 }else if(stage===3){
  if(isIris){
   // A pair of distinguishable cells, dendritic versus spindle-shaped.
   strands(13,.2,false);melanocyte(-1.10,.15,.72,1.05);fibroblast(1.36,-.26,.6,1.03);
   intracellularDetail(1.36,-.26,.7,.84);
   organelles();
  }else if(isSclera){
   strands(20,.2,true);fibroblast(0,0,.65,1.45);
  }else if(route==='vessel'){
   vascularRing();fibroblast(-1.0,-.60,1.0,.82);
   ellipse(1.65,.45,.78,[.48,.32,.25],materials.cellMembrane);
  }else if(route==='nerve'){axonBundle(22);nucleus(-.65,.6,.70,.30)}
  else{
   retinalLayers();photoreceptors();
   for(let i=0;i<5;i++){const x=(i-2)*.89;ellipse(x,.3,.7,[.23,.64,.25],materials.neuron)}
  }
 }else if(stage===4){
  if(isIris||isSclera){
   helixTriple();molecularMesh();
   if(isIris){
    melanosome(-1.85,1.05,-1.10,.66);
    melanosome(1.95,-.85,-1.0,.47);
   }
  }else if(route==='vessel'){
   // Simplified junction proteins arranged along endothelial cell boundaries.
   for(let k=0;k<3;k++)polyline([[-2.7,(k-1)*.7,0],[-.5,(k-1)*.7,.2],[2.7,(k-1)*.7,0]],.06,materials.neuralDark,36);
   grains(55,materials.collagenLight,i=>{
    const x=(i%11-5)*.49,y=(Math.floor(i/11)-2)*.46;
    return [x,y,.1+rand(i,4)*.10,.09];
   });
  }else{
   // Molecular-scale transport microtubules and illustrative synaptic clusters.
   for(let i=0;i<7;i++){
    const x=(i-3)*.45;
    polyline([[x,-3,.15],[x+.20,-1.1,.30],[x,1.1,.22],[x+.12,3,.13]],.042,
      i%2?materials.neuron:materials.neuralDark,50);
   }
   grains(60,materials.collagenLight,i=>{
    const x=(i%12-5.5)*.44,y=(Math.floor(i/12)-2)*.55;
    return [x,y,(rand(i,9)-.5)*.9,.065+rand(i,2)*.045];
   });
  }
 }
 addMicroAtmosphere(T,root,route,stage);
 root.userData.anatomyRoute=route;
 root.userData.scale=stage;
 return root.children;
}
