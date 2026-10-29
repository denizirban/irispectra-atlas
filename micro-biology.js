// IRISPECTRA / Route-aware biological worlds.
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
 const membranePatch=(x=0,y=0,z=0)=>{
  const count=mobile?168:320;
  const headGeo=new T.IcosahedronGeometry(.045,1);
  const headMat=new T.MeshStandardMaterial({color:0xa9c6ad,roughness:.52});
  const tailMat=new T.MeshStandardMaterial({color:0xc7a980,roughness:.72});
  const heads=new T.InstancedMesh(headGeo,headMat,count*2);
  const tails=new T.InstancedMesh(new T.CylinderGeometry(.009,.009,.155,5),tailMat,count*2);
  const dummy=new T.Object3D();
  for(let layer=0;layer<2;layer++){
   for(let i=0;i<count;i++){
    const col=i%Math.ceil(Math.sqrt(count)),row=Math.floor(i/Math.ceil(Math.sqrt(count)));
    const pitch=3.65/Math.ceil(Math.sqrt(count));
    const px=x+(col-(Math.ceil(Math.sqrt(count))-1)/2)*pitch;
    const py=y+(row-(Math.ceil(Math.sqrt(count))-1)/2)*pitch;
    const phase=Math.sin(px*2.1+py*1.7)*.07;
    const side=layer===0?1:-1;
    dummy.position.set(px,py,z+phase+side*.125);
    dummy.scale.setScalar(.82+.12*rand(i,layer));dummy.updateMatrix();
    heads.setMatrixAt(layer*count+i,dummy.matrix);
    dummy.position.z=z+phase+side*.054;
    dummy.scale.set(1,.9,1);
    dummy.rotation.set(Math.PI/2,0,0);dummy.updateMatrix();
    tails.setMatrixAt(layer*count+i,dummy.matrix);
    dummy.rotation.set(0,0,0);
   }
  }
  heads.instanceMatrix.needsUpdate=true;tails.instanceMatrix.needsUpdate=true;
  heads.userData.role='Phospholipid hydrophilic head';
  tails.userData.role='Phospholipid hydrophobic tails';
  heads.userData.depthBand='membrane';tails.userData.depthBand='membrane';
  group.add(heads,tails);
  for(let i=0;i<(mobile?5:9);i++){
   const px=x+(rand(i,31)-.5)*3.1,py=y+(rand(i,32)-.5)*2.7;
   const channel=add(new T.CylinderGeometry(.088,.11,.48,12,1),mats.green,
     px,py,z,'Transmembrane protein');
   channel.rotation.x=Math.PI/2;channel.material=channel.material.clone();channel.userData.depthBand='membrane';
   const pore=add(new T.CylinderGeometry(.029,.029,.49,9,1),mats.dark,
     px,py,z,'Membrane protein channel pore');
   pore.rotation.x=Math.PI/2;pore.material=pore.material.clone();pore.userData.depthBand='membrane';
  }
 };
 const cellBody=(x,y,z,role,scale=[.76,.43,.34])=>{
  sphere(x,y,z,scale,mats.cell,role);
  sphere(x,y,z,scale.map(v=>v*1.035),mats.membrane,role+' plasma membrane');
  sphere(x-.11,y+.04,z+.23,[.25,.19,.14],mats.dark,role+' nucleus');
  sphere(x-.17,y+.07,z+.37,[.07,.07,.045],mats.gold,'Nucleolus');
 };
 const mito=(x,y,z)=>{
  const o=add(organicGeo,mats.pink,x,y,z,'Mitochondrion');o.scale.set(.73,.30,.31);
  const membrane=add(organicGeo,mats.membrane,x,y,z,'Mitochondrial outer membrane');
  membrane.scale.set(.77,.335,.345);
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
 const mitoInterior=()=>{
  const shell=add(new T.CylinderGeometry(3.25,3.05,8,36,1,true),mats.membrane,0,0,-1.55,'Mitochondrial cutaway boundary');
  shell.rotation.x=Math.PI/2;
  const foldMat=new T.MeshPhysicalMaterial({color:0xb78565,roughness:.48,metalness:0,
   side:T.DoubleSide,transparent:true,opacity:.82,depthWrite:false});
  for(let k=0;k<(mobile?7:11);k++){
   const centerX=(k-(mobile?3:5))*.61;
   const verts=[],idx=[],rows=mobile?14:22,cols=mobile?18:30;
   for(let j=0;j<=rows;j++){
    const t=j/rows,y=(t-.5)*5.9;
    for(let i=0;i<=cols;i++){
     const u=i/cols,z=-4.6+u*6.1;
     const bend=Math.sin(u*Math.PI*2.8+k*.56)*(.22+.08*Math.cos(t*Math.PI*2));
     const pinch=.11*Math.cos(t*Math.PI*4+u*5+k);
     verts.push(centerX+bend+pinch,y,z);
     if(j<rows&&i<cols){
      const a=j*(cols+1)+i;
      idx.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);
     }
    }
   }
   const geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
   geo.setIndex(idx);geo.computeVertexNormals();
   const fold=add(geo,foldMat,0,0,0,'Inner mitochondrial membrane / crista');
   fold.userData.depthBand='crista';
  }
  const n=mobile?50:105,geo=new T.IcosahedronGeometry(.045,0);
  const dots=new T.InstancedMesh(geo,mats.pale,n),d=new T.Object3D();
  for(let i=0;i<n;i++){
   d.position.set((rand(i,41)-.5)*6.4,(rand(i,42)-.5)*5.7,-4.4+rand(i,43)*5.7);
   d.scale.setScalar(.45+rand(i,44)*1.1);d.updateMatrix();dots.setMatrixAt(i,d.matrix);
  }
  dots.instanceMatrix.needsUpdate=true;dots.userData.role='Mitochondrial matrix granule';group.add(dots);
 };
 const melanosome=(x,y,z)=>{
  sphere(x,y,z,[.69,.40,.40],mats.dark,'Melanosome');
  sphere(x,y,z,[.73,.44,.44],mats.membrane,'Melanosome membrane');
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
   for(let i=0;i<10;i++){
    const a=i*2.399,r=1.0+1.8*Math.sqrt((i+.5)/10);
    cellBody(Math.cos(a)*r,Math.sin(a)*r*.80,.3,'Stromal melanocyte',[.42,.23,.20]);
   }
   cellBody(-1.35,-1.35,-.15,'Stromal fibroblast',[.53,.22,.19]);
   for(let i=0;i<36;i++){
    const a=i*2.399,r=.9+2*Math.sqrt((i+.5)/36);
    sphere(Math.cos(a)*r,Math.sin(a)*r*.85,.62,[.038,.038,.038],mats.pigment,'Pigment granule');
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
   sphere(-2.05,-.90,-2.0,[.33,.22,.28],mats.cell,'Transport vesicle');
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
   // Schematic enzyme surface, melanin subunits and substrate.
   sphere(-.8,0,0,[1.2,.82,.70],mats.green,'Tyrosinase enzyme surface (schematic)');
   for(let i=0;i<46;i++){
    const a=i*2.399,r=.84*Math.sqrt((i+.5)/46);
    sphere(-.8+Math.cos(a)*r,Math.sin(a)*r*.74,.48,[.08,.08,.08],
     i%4===0?mats.gold:mats.dark,'Tyrosinase surface residue');
   }
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
 if(stage===6){
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
 group.userData.bioRoute=r.name;group.userData.bioStage=stage;
}
