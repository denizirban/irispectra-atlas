// IRISPECTRA / Route-aware biological worlds.
import {createCurvedBilayer,createCristaeInterior,createTyrosineMotif,createTyrosinaseEnvelope} from './micro-ultrastructure.js';
// The scenes are conceptual scientific visualizations, never patient-derived
// volumetric scans, atomistic simulations, or measured protein coordinates.
export const BIO_STAGES=['WHOLE EYE','IRIS SURFACE','TISSUE','CELLULAR','ORGANELLE','MOLECULAR','ATOMIC'];
export const BIO_TARGETS=[.07,.49,.735,.845,.919,.962,.993];
export const BIO_ROUTES={
 crypt:{name:'Crypt Path',label:'CRYPT',description:'Through a stromal opening into fibroblast-rich collagen matrix',
  anchor:{kind:'crypt',radius:.43,angle:2.38},family:'iris',
  steps:[
   ['Iris crypt','An anterior iris stromal opening'],
   ['Stromal cavity','Interstitial collagen fibers and fibroblasts'],
   ['Fibroblast','Matrix-maintaining connective tissue cell'],
   ['Mitochondrion & nucleus','Intracellular structure and energy production'],
   ['Collagen type I','Triple-helical collagen fibril constituent'],
   ['Peptide chemistry','Carbon, nitrogen, oxygen, hydrogen and covalent bonds']
  ]},
 pigment:{name:'Pigment Path',label:'PIGMENT',description:'From visible iris pigmentation into melanosomes and melanin chemistry',
  anchor:{kind:'radial',radius:.44,angle:4.02},family:'iris',
  steps:[
   ['Iris pigment','Variation in stromal pigment distribution'],
   ['Pigmented stroma','Melanocytes and pigment granules among collagen'],
   ['Melanocyte','Dendritic melanocyte containing melanosomes'],
   ['Melanosome','Pigment-containing intracellular organelle'],
   ['Tyrosinase / melanin','Enzyme-driven melanogenesis and melanin polymer'],
   ['Indole-derived motifs','Representative eumelanin chemistry, not one fixed polymer structure']
  ]},
 muscle:{name:'Pupil & Muscle',label:'PUPIL',description:'Pupillary aperture, iris smooth muscle and calcium-controlled contraction',
  anchor:{kind:'pupil',radius:.20,angle:1.18},family:'iris',
  steps:[
   ['Pupil edge','The contractile pupil boundary'],
   ['Iris muscle','Sphincter and dilator architecture within iris'],
   ['Smooth muscle cell','Contractile actin and myosin-bearing cell'],
   ['Sarcoplasmic calcium','Calcium release and intracellular signaling'],
   ['Actin / myosin','Contractile filaments and receptor pathways'],
   ['Calcium ions','Ca²⁺ and molecular binding motifs']
  ]},
 neural:{name:'Retina & Neural',label:'NEURAL',description:'From retinal laminae through neurons to the visual-signaling cascade',
  anchor:{kind:'fundusRetina',radius:.50,angle:0},family:'retina',
  steps:[
   ['Neural retina','The layered sensory tissue lining the posterior eye'],
   ['Retinal laminae','Photoreceptor, synaptic and ganglion-cell layers'],
   ['Retinal neurons','Rods, cones, bipolar cells, ganglion cells and Müller glia'],
   ['Outer segment discs','Photoreceptor membrane stacks containing opsins'],
   ['Rhodopsin & channels','Photoactivated GPCR signaling and membrane channels'],
   ['Chromophore chemistry','11-cis-retinal and all-trans-retinal isomerization']
  ]}
};
export function bioInfo(route,stage){
 const r=BIO_ROUTES[route]||BIO_ROUTES.crypt;
 const k=Math.max(0,Math.min(5,stage-1));
 const [title,short]=r.steps[k];
 const roleFacts={
  crypt:[
   ['Architecture','Iris connective tissue and anterior stromal openings'],
   ['Cells','Stromal fibroblasts maintain extracellular matrix'],
   ['Fibers','Collagen fibrils form mechanically supportive bundles'],
   ['Organelle','Mitochondria contain a double membrane and cristae'],
   ['Molecule','Triple-helical collagen is assembled from polypeptide chains'],
   ['Atoms','Covalent peptide bonds join amino-acid residues']
  ],
  pigment:[
   ['Color','Iris coloration depends on melanin and light scattering'],
   ['Tissue','Melanocytes extend processes through the stroma'],
   ['Cell','Pigment granules are packaged in melanosomes'],
   ['Organelle','Melanosome maturation controls pigment deposition'],
   ['Chemistry','Tyrosinase catalyzes early reactions in melanogenesis'],
   ['Atoms','Melanin is heterogeneous; shown chemistry is illustrative']
  ],
  muscle:[
   ['Opening','The pupil regulates the amount of light entering the eye'],
   ['Muscle','Sphincter constricts; dilator enlarges the pupil'],
   ['Cell','Smooth muscle contracts through actin and myosin'],
   ['Calcium','Ca²⁺ activates downstream contractile machinery'],
   ['Signal','Parasympathetic muscarinic and sympathetic adrenergic signaling'],
   ['Atoms','Calcium is an ion, not a conventional bonded molecule']
  ],
  neural:[
   ['Surface','The neural retina transduces light into electrical signals'],
   ['Tissue','Layers support photoreception and neural processing'],
   ['Cells','Rods, cones, bipolar and ganglion cells form pathways'],
   ['Discs','Outer-segment membranes support visual pigment reactions'],
   ['Signaling','Opsins activate a G-protein cascade when stimulated by light'],
   ['Chemistry','The retinal chromophore changes configuration after absorption']
  ]
 };
 return {title,short,facts:[roleFacts[route]?.[k]||roleFacts.crypt[k],
  ['Explore next',r.steps[Math.min(5,k+1)][0]]],
  route:r.name,stage,kind:r.family};
}
export function populateBioWorld(T,group,route,stage){
 if(stage<2)return;
 const r=BIO_ROUTES[route]||BIO_ROUTES.crypt;
 const mobile=typeof window!=='undefined'&&window.matchMedia('(max-width: 820px)').matches;
 const K=(v)=>new T.Color(v);
 const mats={
  matrix:new T.MeshPhysicalMaterial({color:0xc6ab8b,roughness:.52,clearcoat:.13,side:T.DoubleSide}),
  pale:new T.MeshStandardMaterial({color:0xe7dcc1,roughness:.67}),
  pink:new T.MeshPhysicalMaterial({color:0x9e736b,roughness:.49,clearcoat:.18,side:T.DoubleSide}),
  cell:new T.MeshPhysicalMaterial({color:route==='neural'?0x9caeb4:0x9e9b8b,roughness:.47,transparent:true,opacity:.90,side:T.DoubleSide}),
  membrane:new T.MeshPhysicalMaterial({color:0xb9b79e,roughness:.29,transparent:true,opacity:.26,side:T.DoubleSide,depthWrite:false}),
  dark:new T.MeshStandardMaterial({color:0x3d3b50,roughness:.67}),
  pigment:new T.MeshStandardMaterial({color:0x543726,roughness:.72}),
  green:new T.MeshStandardMaterial({color:0x6d9b91,roughness:.51}),
  blue:new T.MeshStandardMaterial({color:0x7590a4,roughness:.55}),
  gold:new T.MeshStandardMaterial({color:0xd5b57a,roughness:.47}),
  line:new T.MeshStandardMaterial({color:0x9daaa0,roughness:.44})
 };
 // Shared low-amplitude synthetic height texture gives cell membranes
 // and organelles a matte ultrastructural finish rather than plastic gloss.
 const surfaceBump=()=>{
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d');if(!ctx)return null;
  const frame=ctx.createImageData(128,128);
  for(let yy=0;yy<128;yy++)for(let xx=0;xx<128;xx++){
   const salt=Math.sin((xx+13)*127.1+(yy+23)*311.7)*43758.5453;
   const grain=salt-Math.floor(salt);
   const hills=Math.sin(xx*.34+Math.cos(yy*.11))*Math.cos(yy*.41+Math.sin(xx*.08));
   const value=Math.max(0,Math.min(255,126+hills*23+(grain-.5)*35));
   const p=(yy*128+xx)*4;
   frame.data[p]=frame.data[p+1]=frame.data[p+2]=value;
   frame.data[p+3]=255;
  }
  ctx.putImageData(frame,0,0);
  const texture=new T.CanvasTexture(c);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(2,2);
  return texture;
 };
 const detail=surfaceBump();
 if(detail)for(const [mat,depth] of [[mats.cell,.018],[mats.membrane,.011],[mats.pink,.014]]){
  mat.bumpMap=detail;mat.bumpScale=depth;
 }
 const add=(geo,mat,x=0,y=0,z=0,role='')=>{
  const o=new T.Mesh(geo,mat);o.position.set(x,y,z);
  if(role)o.userData.role=role;
  group.add(o);return o;
 };
 const sphereGeo=new T.SphereGeometry(1,mobile?20:32,mobile?14:24);
 const organicGeo=new T.SphereGeometry(1,mobile?24:40,mobile?18:30);
 const pos=organicGeo.attributes.position;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  const noise=.024*Math.sin(x*12.1+y*5.3)*Math.cos(z*13.7-y*4.1)
   +.012*Math.sin(x*27.2-z*16.3);
  pos.setXYZ(i,x*(1+noise),y*(1+noise),z*(1+noise));
 }
 organicGeo.computeVertexNormals();
 // Each mesh has independent resting proportions; animation is subtle and
 // conceptual, rather than a simulation of measured cellular kinetics.
 const animate=(mesh,kind,phase,amplitude)=>{
  mesh.userData.bioMotion={kind,phase,amplitude,restScale:mesh.scale.clone()};
  return mesh;
 };
 const sphere=(x,y,z,scale,material,role='')=>{
  const o=add(role.includes('membrane')||role.includes('Fibroblast')||role.includes('Melanocyte')?organicGeo:sphereGeo,material,x,y,z,role);o.scale.set(...scale);return o;
 };
 const path=(coordinates,rad,mat,role='')=>{
  const c=new T.CatmullRomCurve3(coordinates.map(p=>new T.Vector3(...p)));
  return add(new T.TubeGeometry(c,Math.min(90,coordinates.length*8),rad,6,false),mat,0,0,0,role);
 };
 const rand=(i,salt=0)=>{const x=Math.sin(i*73.11+salt*58.73)*43758.5453;return x-Math.floor(x)};
 const atomMats={
  C:new T.MeshStandardMaterial({color:0x7c8990,roughness:.48}),
  H:new T.MeshStandardMaterial({color:0xebeee8,roughness:.37}),
  O:new T.MeshStandardMaterial({color:0xcc6468,roughness:.46}),
  N:new T.MeshStandardMaterial({color:0x5980bd,roughness:.49}),
  S:new T.MeshStandardMaterial({color:0xe2c16b,roughness:.44})
 };
 const atom=(x,y,z,type='C',size=.13)=>{
  const o=sphere(x,y,z,[size,size,size],atomMats[type]||atomMats.C,'Atom: '+type);
  o.userData.element=type;return o;
 };
 const bond=(a,b,material=mats.line,radius=.038,role='Covalent bond')=>{
  const from=new T.Vector3(...a),to=new T.Vector3(...b);
  const direction=to.clone().sub(from),dist=direction.length();
  if(dist<.001)return null;
  const o=add(new T.CylinderGeometry(radius,radius,dist,6,1),material,
   (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,role);
  o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
  return o;
 };
 const membraneRing=(radius,z,material,role)=>{
  const torus=add(new T.TorusGeometry(radius,.045,8,80),material,0,0,z,role);
  return torus;
 };
 // Cutaway membrane: two phospholipid head planes, tails and transmembrane channels.
 // Schematic proportions, intentionally not an atomistic molecular model.
 const membranePatch=(x=0,y=0,z=0)=>
  createCurvedBilayer(T,group,mobile,x,y,z);
 const cellBody=(x,y,z,role,scale=[.76,.43,.34])=>{
  animate(sphere(x,y,z,scale,mats.cell,role),'surface',x+y,.007);
  animate(sphere(x,y,z,scale.map(v=>v*1.035),mats.membrane,role+' plasma membrane'),'surface',x-y,.012);
  sphere(x-.11,y+.04,z+.23,[.25,.19,.14],mats.dark,role+' nucleus');
  sphere(x-.17,y+.07,z+.37,[.07,.07,.045],mats.gold,'Nucleolus');
 };
 const mito=(x,y,z)=>{
  const o=add(organicGeo,mats.pink,x,y,z,'Mitochondrion');o.scale.set(.73,.30,.31);animate(o,'organelle',x+y,.012);
  const membrane=add(organicGeo,mats.membrane,x,y,z,'Mitochondrial outer membrane');
  membrane.scale.set(.77,.335,.345);animate(membrane,'organelle',x-y,.01);
  for(let k=0;k<11;k++){
   const xx=x+(k-5)*.115,fold=[];
   for(let j=0;j<=12;j++){
    const t=j/12;
    fold.push([xx+.042*Math.sin(t*Math.PI*3+k*.4),y+(t-.5)*.44,z+.10*Math.cos(t*Math.PI*2+k*.4)]);
   }
   path(fold,.014,mats.gold,'Mitochondrial crista');
  }
  return [o,membrane];
 };
 // Large-scale mitochondrial cutaway: folds are traversable architectural
 // membranes, not a literal nanometre-scale reconstruction.
 const mitoInterior=()=>createCristaeInterior(T,group,mobile);
 const melanosome=(x,y,z)=>{
  // Separate translucent shells reveal internal melanin deposits without
  // implying a precise melanosome ultrastructure from an iris photograph.
  const contentMat=mats.dark.clone();
  contentMat.transparent=true;contentMat.opacity=.44;contentMat.depthWrite=false;
  const shellMat=mats.membrane.clone();
  shellMat.opacity=.24;shellMat.depthWrite=false;
  animate(sphere(x,y,z,[.69,.40,.40],contentMat,'Melanosome pigment matrix'),'organelle',x+y,.008);
  animate(sphere(x,y,z,[.73,.44,.44],shellMat,'Melanosome membrane'),'organelle',x+y,.008);
  for(let i=0;i<(mobile?5:9);i++){
   const p=(i-(mobile?2:4))*.068;
   path([[x-.48,y+p*.6,z-.09*Math.sin(i)],[x-.14,y+p,z+.04*Math.cos(i)],
    [x+.37,y+p*.7,z+.07*Math.sin(i*.7)]],.009,mats.pigment,
    'Melanosome internal pigment fibril (schematic)');
  }
  const n=mobile?45:90;
  const dummy=new T.Object3D(),mesh=new T.InstancedMesh(new T.SphereGeometry(.052,7,6),mats.pigment,n);
  for(let i=0;i<n;i++){
   const a=i*2.399,rr=Math.sqrt((i+.5)/n)*.55;
   dummy.position.set(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.61,z+(rand(i,4)-.5)*.51);
   dummy.scale.setScalar(.7+rand(i,5)*.8);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.userData.role='Melanin pigment granule';
  group.add(mesh);
 };
 const actin=(orientation='horizontal')=>{
  for(let strand=0;strand<2;strand++){
   const pts=[];
   for(let i=0;i<62;i++){
    const t=i/61,a=t*Math.PI*12+strand*Math.PI;
    const c=[(t-.5)*5.6,Math.sin(a)*.20+(strand?-.23:.23),Math.cos(a)*.20+.5];
    pts.push(orientation==='vertical'?[c[1],c[0],c[2]]:c);
   }
   path(pts,.055,strand?mats.pink:mats.green,'Actin filament');
  }
 };
 const collagen=()=>{
  for(let k=0;k<3;k++){
   const pts=[];
   for(let i=0;i<=90;i++){
    const t=i/90,a=t*Math.PI*16+k*Math.PI*2/3;
    pts.push([(t-.5)*5.4,.38*Math.cos(a),.38*Math.sin(a)]);
   }
   path(pts,.056,k===0?mats.gold:k===1?mats.matrix:mats.pale,'Collagen triple-helical chain');
  }
 };
 const neuron=()=>{
  cellBody(0,-.3,.4,'Retinal ganglion cell',[.63,.55,.41]);
  for(let j=0;j<9;j++){
   const a=j*2*Math.PI/9,pts=[];
   for(let i=0;i<=5;i++){
    const rr=i/5*(2+rand(j,3));
    pts.push([rr*Math.cos(a)+Math.sin(i+j)*.085,
      rr*Math.sin(a)+Math.cos(i+j)*.1,.4+(i/5)*-.38]);
   }
   path(pts,.022,mats.green,'Retinal ganglion-cell dendrite');
  }
  path([[.0,-.4,.4],[.2,-1.3,.25],[.1,-2.4,.09],[.45,-3.5,.0]],.07,
   mats.blue,'Retinal ganglion-cell axon');
 };
 const photoreceptors=()=>{
  const count=mobile?6:10;
  for(let i=0;i<count;i++){
   const x=(i-(count-1)/2)*.57;
   const type=i%3===0?'Cone photoreceptor':'Rod photoreceptor';
   sphere(x,-.65,-.1,[.12,.52,.16],i%3===0?mats.gold:mats.green,type);
   for(let k=0;k<7;k++){
    const disc=add(new T.TorusGeometry(.14,.018,5,18),mats.blue,
     x,.18+k*.14,-.1,'Photoreceptor outer-segment disc');
    disc.scale.y=i%3===0?.65:1;
   }
  }
  path([[-2.1,-2.1,-.1],[-.7,-1.9,.10],[.8,-1.85,.13],[2.1,-1.7,-.2]],
   .047,mats.line,'Bipolar-cell synaptic connection');
 };
 const capillary=()=>{
  const ring=add(new T.TorusGeometry(.44,.095,12,48),mats.pink,1.55,-.82,-.72,'Stromal vascular channel');
  ring.rotation.x=.35;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;
   const e=sphere(1.55+.44*Math.cos(a),-.82+.44*Math.sin(a),-.64,
    [.13,.075,.09],mats.cell,'Vascular endothelial cell');e.rotation.z=a+Math.PI/2;
  }
 };
 const calcium=(n=34)=>{
  const geo=new T.SphereGeometry(.063,7,6),batch=new T.InstancedMesh(geo,mats.gold,n),dummy=new T.Object3D();
  for(let i=0;i<n;i++){
   const a=i*2.399,r=.65+2.3*Math.sqrt((i+.5)/n);
   dummy.position.set(Math.cos(a)*r,Math.sin(a)*r*.73,(rand(i,6)-.5)*1.5);
   dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
  }batch.instanceMatrix.needsUpdate=true;
  batch.userData.role='Calcium ion (Ca²⁺)';group.add(batch);
 };
 // TISSUE 2 — true route-dependent spatial architecture.
 if(stage===2){
  if(route==='crypt'){
   for(let k=0;k<33;k++){
    const a=k*2.399,r=.70+2.65*Math.sqrt((k+.5)/33);
    const pts=[];
    for(let j=0;j<=11;j++){
     const t=j/11,x=(t-.5)*6;
     const yy=Math.sin(a)*r+.12*Math.sin(t*9+k);
     const zz=Math.cos(a)*.55-.3+Math.cos(t*6+k)*.18;
     pts.push([x,yy,zz]);
    }
    path(pts,.025+rand(k)*.020,k%4===0?mats.gold:mats.matrix,'Stromal collagen bundle');
   }
   // Fine collagen microfibrils: instanced geometry retains mobile performance.
   const fiberCount=mobile?180:360;
   const fiberGeo=new T.CylinderGeometry(.006,.012,.31,5,1);
   const fiberMat=new T.MeshStandardMaterial({color:0xd2c1a0,roughness:.8,transparent:true,opacity:.49});
   const fiberBatch=new T.InstancedMesh(fiberGeo,fiberMat,fiberCount);
   const fiberDummy=new T.Object3D(),fiberAxis=new T.Vector3(0,1,0);
   for(let i=0;i<fiberCount;i++){
    const phase=i*2.39996;
    fiberDummy.position.set((rand(i,9)-.5)*7.4,Math.sin(phase)*(1+2.4*rand(i,12)),-2.3+rand(i,11)*3.8);
    fiberDummy.quaternion.setFromUnitVectors(fiberAxis,new T.Vector3(1,.09*Math.sin(phase),.1*Math.cos(phase)).normalize());
    fiberDummy.scale.set(1,.7+rand(i,17)*1.4,1);
    fiberDummy.updateMatrix();fiberBatch.setMatrixAt(i,fiberDummy.matrix);
   }
   fiberBatch.instanceMatrix.needsUpdate=true;fiberBatch.userData.role='Illustrative collagen microfibrils';group.add(fiberBatch);
   const inner=membraneRing(.85,.66,mats.dark,'Crypt-like stromal opening');
   inner.scale.set(1.3,.7,1);
   capillary();
   // Depth-separated collagen networks establish strong travel parallax.
   // Each layer represents a stylized extracellular-matrix plane.
   for(let plane=0;plane<4;plane++){
    const z=-2.6+plane*1.15;
    for(let k=0;k<(mobile?9:16);k++){
     const y=(k-(mobile?4:7.5))*.39+Math.sin(k*1.7+plane)*.12;
     const wave=[];
     for(let j=0;j<9;j++){
      const x=-3.9+j*.975;
      wave.push([x,y+Math.sin(j*.83+k+plane)*.13,z+Math.cos(j*.91+k)*.10]);
     }
     path(wave,.018+(k%3)*.005,plane%2?mats.matrix:mats.pale,'Stromal collagen bundle');
    }
   }
  }else if(route==='pigment'){
   // Anatomically informed connective matrix, built in depth-separated
   // planes so users can travel between real 3D collagen fibers.
   const fiberLayers=mobile?3:5,perLayer=mobile?11:19;
   for(let layer=0;layer<fiberLayers;layer++){
    const z=-2.65+layer*1.28;
    for(let i=0;i<perLayer;i++){
     const y=(i-(perLayer-1)/2)*(.33+(layer%2)*.03);
     const points=[];
     for(let j=0;j<=12;j++){
      const u=j/12,x=(u-.5)*7.7;
      points.push([x,y+.10*Math.sin(u*8.2+i*.73+layer),
       z+.10*Math.cos(u*9+i*.53+layer)]);
     }
     path(points,.018+(i%4)*.006,
      (i+layer)%4===0?mats.pale:mats.matrix,'Stromal collagen bundle');
    }
   }
   for(let i=0;i<10;i++){
    const a=i*2.399,r=1.0+1.8*Math.sqrt((i+.5)/10);
    const x=Math.cos(a)*r,y=Math.sin(a)*r*.80;
    cellBody(x,y,.3,'Stromal melanocyte',[.42,.23,.20]);
    // Dendritic processes extend through the connective tissue.
    for(let j=0;j<3;j++){
     const dir=a+j*2.094;
     path([[x,y,.36],[x+.27*Math.cos(dir),y+.22*Math.sin(dir),.24],
      [x+.66*Math.cos(dir),y+.46*Math.sin(dir),.03]],
      .014,mats.cell,'Melanocyte dendritic process');
    }
   }
   cellBody(-1.35,-1.35,-.15,'Stromal fibroblast',[.53,.22,.19]);
   capillary();
   // Pigmented inclusions are positioned inside/near melanocyte bodies
   // rather than floating uniformly throughout the extracellular matrix.
   for(let i=0;i<30;i++){
    const k=i%10,a=k*2.399,r=1.0+1.8*Math.sqrt((k+.5)/10);
    const x=Math.cos(a)*r,y=Math.sin(a)*r*.80,ang=i*2.399;
    sphere(x+.16*Math.cos(ang),y+.09*Math.sin(ang),.42,
     [.024,.024,.024],mats.pigment,'Melanocyte pigment inclusion');
   }
  }else if(route==='muscle'){
   for(let i=0;i<26;i++){
    const a=i*2*Math.PI/26,r=1.8+(i%3)*.18;
    const fiber=sphere(r*Math.cos(a),r*Math.sin(a),.20,[.23,.75,.18],mats.pink,'Iris sphincter smooth muscle');
    fiber.rotation.z=a+Math.PI/2;
   }
   for(let i=0;i<16;i++){
    const a=i*2*Math.PI/16,r=2.7;
    const fiber=sphere(r*Math.cos(a),r*Math.sin(a),-.45,[.13,.62,.14],mats.cell,'Iris dilator muscle');
    fiber.rotation.z=a;
   }
  }else{
   photoreceptors();neuron();
   for(let i=0;i<6;i++){
    const panel=add(new T.PlaneGeometry(5.5,.22),mats.membrane,0,(i-2.5)*.63,-.72,
     'Retinal neural layer');
    panel.rotation.x=.12;
   }
  }
 }
 // CELLULAR 3 — major route-specific cells and supporting parts.
 if(stage===3){
  if(route==='crypt'){
   cellBody(0,0,.6,'Fibroblast',[1.05,.35,.28]);
   // Cell envelope is supplied by cellBody, with a separate bilayer cutaway in organelle view.
   for(let k=0;k<20;k++){
    const a=k*2.39996,y=(rand(k,23)-.5)*.48;
    path([[-1.75,y-.06*Math.sin(a),.42],[-.62,y+.07*Math.cos(a),.52],
     [.52,y-.05*Math.sin(a),.55],[1.7,y+.09*Math.cos(a),.47]],
     .006+(k%4)*.002,k%3===0?mats.pale:mats.matrix,'Fibroblast cytoskeletal filament');
   }
   for(let i=0;i<8;i++){
    const a=i*2*Math.PI/8;
    path([[.4*Math.cos(a),.1*Math.sin(a),.62],
     [1.20*Math.cos(a),.70*Math.sin(a),.45],
     [2.1*Math.cos(a),1.4*Math.sin(a),.20]],.024,mats.matrix,'Fibroblast process');
   }
  }else if(route==='pigment'){
   cellBody(0,0,.6,'Melanocyte',[.62,.48,.34]);
   for(let i=0;i<12;i++){
    const a=i*2*Math.PI/12;
    path([[.2*Math.cos(a),.2*Math.sin(a),.68],
     [1.0*Math.cos(a),1.0*Math.sin(a),.4],
     [2.4*Math.cos(a+.05),2.2*Math.sin(a+.05),.08]],.030,mats.matrix,'Melanocyte dendrite');
   }
   for(let i=0;i<11;i++){const a=i*2.399;const radius=1.5+rand(i)*.6;
    sphere(Math.cos(a)*radius,Math.sin(a)*radius,.38,[.14,.09,.10],mats.pigment,'Melanosome');}
  }else if(route==='muscle'){
   for(let i=0;i<5;i++){
    const y=(i-2)*.74;
    cellBody(0,y,.44,'Iris smooth muscle cell',[2.35,.28,.24]);
    const stripe=path([[-2.3,y,.62],[-.7,y+.035,.65],[1,y-.025,.65],[2.3,y,.61]],.032,mats.gold,'Contractile actomyosin');
   }
  }else{
   photoreceptors();neuron();
   cellBody(1.55,-.8,.63,'Bipolar neuron',[.30,.64,.22]);
   const glia=sphere(-1.1,.7,.35,[.25,1.5,.19],mats.cell,'Müller glial cell');
   glia.rotation.z=.14;
  }
 }
 // ORGANELLE 4 — physically distinct subcellular destinations.
 if(stage===4){
  // Foreground bilayer is physically traversed before the deeper organelle field.
  if(route==='crypt'||route==='pigment')membranePatch(0,0,3.28);
  if(route==='pigment'){
   melanosome(-.8,.15,.3);
   // Additional organelles extend behind the focal plane for parallax.
   melanosome(1.55,.92,-1.65);
   melanosome(-1.75,-.78,-2.05);
   sphere(1.4,-1.0,.1,[.62,.35,.30],mats.cell,'Golgi apparatus');
   for(let j=0;j<8;j++)path([[.65,-1.2+j*.07,.25],[1.40,-1.32+j*.07,.35],
     [2.22,-1.17+j*.07,.20]],.02,mats.gold,'Golgi cisterna');
  }else if(route==='muscle'){
   actin();calcium();
   for(let j=0;j<7;j++)path([[-2.8,(j-3)*.24,-.5],[-.8,(j-3)*.24,.1],
     [1.3,(j-3)*.24,-.3],[2.8,(j-3)*.24,-.2]],.021,mats.pink,
    'Sarcoplasmic reticulum membrane');
  }else if(route==='neural'){
   photoreceptors();sphere(1.65,-.45,.2,[.62,.38,.23],mats.cell,'Synaptic terminal');
  }else{
   mito(-.75,.25,-.65);
   // Additional organelles create visible near/far parallax after the bilayer.
   mito(1.65,.84,-1.62);
   const vesicle=sphere(-2.05,-.90,-2.0,[.33,.22,.28],mats.cell,'Transport vesicle');
   vesicle.userData.bioMotion={kind:'transport',phase:2.1,amplitude:.17,
    restScale:vesicle.scale.clone(),restPosition:vesicle.position.clone()};
   path([[-2.7,-.91,-2.01],[-2.15,-.87,-1.99],[-1.5,-.88,-1.93]],
    .016,mats.gold,'Cytoskeletal transport track (schematic)');
   sphere(1.35,-.4,-.76,[.72,.64,.42],mats.cell,'Cell nucleus');
   sphere(1.35,-.4,-.28,[.24,.2,.14],mats.dark,'Nucleolus');
   for(let j=0;j<7;j++){
    const y=.65-j*.2;
    path([[.25,y,-.40],[1.2,y+.16,-.3],[2.5,y-.08,-.2]],.026,mats.gold,
     'Endoplasmic reticulum');
   }
  }
 }
 // The mitochondrial cutaway belongs to the intracellular organelle chapter.
 // Molecular chapter remains reserved for collagen chemistry.
 if(stage===4&&route==='crypt')mitoInterior();
 // MOLECULAR 5 — illustrative molecular shape and biochemical context.
 if(stage===5){
  if(route==='crypt'){collagen();
  }else if(route==='pigment'){
   createTyrosinaseEnvelope(T,group,mobile);
   for(let i=0;i<11;i++){
    const a=i*1.07,x=1.3+Math.sin(a)*.9,y=(i-5)*.22;
    sphere(x,y,-.05,[.13,.13,.13],mats.pigment,'Melanin polymer motif');
    if(i>0)bond([1.3+Math.sin((i-1)*1.07)*.9,(i-6)*.22,-.05],[x,y,-.05],mats.matrix,.04,
     'Representative polymer connection');
   }
  }else if(route==='muscle'){
   actin();calcium(18);
   for(let i=0;i<10;i++){
    const x=(i-4.5)*.55;
    sphere(x,1.25,.30,[.24,.15,.18],mats.pink,'Myosin motor domain');
   }
  }else{
   for(let i=0;i<7;i++){
    const x=(i-3)*.50;const pts=[];
    for(let j=0;j<=40;j++){
     const u=j/40,y=(u-.5)*3.5;
     pts.push([x+Math.sin(u*12+i)*.19,y,Math.cos(u*10+i)*.16]);
    }
    path(pts,.052,mats.green,'Rhodopsin membrane-spanning helix (schematic)');
   }
   membraneRing(1.8,-.5,mats.blue,'Membrane lipid bilayer');
   sphere(2,-.8,.45,[.41,.28,.27],mats.gold,'Retinal chromophore (schematic)');
  }
 }
 // ATOMIC 6 — CPK-colored atoms, shared bonds; NOT computed coordinates.
 if(stage===6&&route==='pigment'){
  createTyrosineMotif(T,group,mobile);
 }else if(stage===6){
  const motifs={
   crypt:['N','C','C','O','N','C','O','H','H','C','O','C'],
   pigment:['C','C','N','C','O','C','O','C','C','N','H','H'],
   muscle:['O','C','C','N','H','O','C','H','N','O','C','H'],
   neural:['C','C','C','C','C','O','C','C','H','H','O','H']
  };
  const atoms=motifs[route]||motifs.crypt,positions=[];
  for(let i=0;i<atoms.length;i++){
   const a=i*2.17,r=.46+Math.sqrt((i+.5)/atoms.length)*1.68;
   const x=r*Math.cos(a),y=r*Math.sin(a),z=.2+Math.sin(i*1.7)*.47;
   positions.push([x,y,z]);atom(x,y,z,atoms[i],atoms[i]==='H'?.115:.165);
   if(i>0)bond(positions[i-1],positions[i],mats.line,.034,'Illustrative covalent linkage');
  }
  if(route==='muscle'){
   const core=sphere(-1.9,1.15,.1,[.23,.23,.23],mats.gold,'Calcium ion Ca²⁺');
   core.userData.role='Calcium ion Ca²⁺';
  }
  if(route==='neural'){
   path([[-2.25,-1.25,.1],[-1.4,-1.44,.25],[-.5,-1.1,.22]],
    .03,mats.gold,'Retinal cis/trans isomerization (diagram)');
  }
  // Surrounding water molecules are orientation motifs, not MD trajectories.
  for(let i=0;i<8;i++){
   const a=i*2.399,r=2.25+rand(i)*.46;
   const x=Math.cos(a)*r,y=Math.sin(a)*r;
   atom(x,y,-.42,'O',.095);
   atom(x+.16,y+.09,-.42,'H',.06);
   atom(x-.1,y+.14,-.42,'H',.06);
  }
 }
 group.userData.bioMovers=[];
 group.traverse(o=>{if(o.userData?.bioMotion)group.userData.bioMovers.push(o);});
 group.userData.bioRoute=r.name;group.userData.bioStage=stage;
}
