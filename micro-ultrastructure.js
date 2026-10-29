// IRISPECTRA / original procedural ultrastructure.
// Educational scale transitions, not microscopy-based volumetric reconstructions,
// patient-derived anatomy, crystallographic coordinates or molecular dynamics.
export function createCurvedBilayer(T,group,mobile,x=0,y=0,z=3.28){
 const count=mobile?144:289,grid=Math.ceil(Math.sqrt(count)),spacing=3.85/grid;
 const headGeo=new T.SphereGeometry(.052,mobile?8:11,mobile?6:9);
 const headMat=new T.MeshPhysicalMaterial({color:0xa8c4ab,roughness:.38,clearcoat:.16});
 const tailMat=new T.MeshStandardMaterial({color:0xd1aa82,roughness:.69});
 const heads=new T.InstancedMesh(headGeo,headMat,count*2);
 const tails=new T.InstancedMesh(new T.CylinderGeometry(.012,.015,.16,5),tailMat,count*4);
 const temp=new T.Object3D();
 const wave=(px,py)=>Math.sin(px*1.85+py*1.3)*.065+Math.cos(py*2.2-px*.7)*.027;
 const rand=(a,b)=>{const n=Math.sin(a*127.17+b*91.4)*43758.5453;return n-Math.floor(n)};
 for(let layer=0;layer<2;layer++){
  const side=layer===0?1:-1;
  for(let i=0;i<count;i++){
   const px=x+((i%grid)-(grid-1)/2)*spacing;
   const py=y+(Math.floor(i/grid)-(grid-1)/2)*spacing;
   const surface=wave(px,py);
   temp.rotation.set(0,0,0);
   temp.position.set(px,py,z+surface+side*.17+(rand(i,layer)-.5)*.025);
   temp.scale.setScalar(.82+rand(i,layer+5)*.25);
   temp.updateMatrix();
   heads.setMatrixAt(layer*count+i,temp.matrix);
   for(let chain=0;chain<2;chain++){
    const bend=(rand(i,chain+8)-.5)*.12;
    temp.position.set(px+(chain?1:-1)*.027+bend*.4,py+bend*.45,z+surface+side*.082);
    temp.rotation.set(Math.PI/2+side*bend,.08*bend,0);
    temp.scale.set(.85,1.12,1);
    temp.updateMatrix();
    tails.setMatrixAt(layer*count*2+i*2+chain,temp.matrix);
   }
  }
 }
 heads.instanceMatrix.needsUpdate=tails.instanceMatrix.needsUpdate=true;
 heads.userData.role='Phospholipid polar heads';
 tails.userData.role='Phospholipid hydrophobic chains';
 heads.userData.depthBand=tails.userData.depthBand='membrane';
 group.add(heads,tails);
 const sheetGeo=new T.PlaneGeometry(4.02,4.02,16,16);
 const pos=sheetGeo.attributes.position;
 for(let i=0;i<pos.count;i++)pos.setZ(i,wave(pos.getX(i)+x,pos.getY(i)+y));
 sheetGeo.computeVertexNormals();
 const sheet=new T.Mesh(sheetGeo,new T.MeshPhysicalMaterial({
  color:0xb1b5a2,roughness:.59,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide
 }));
 sheet.position.set(x,y,z);sheet.userData.depthBand='membrane';
 sheet.userData.role='Membrane hydrophobic interior';group.add(sheet);
 const channelMat=new T.MeshPhysicalMaterial({color:0x6b9588,roughness:.47});
 const poreMat=new T.MeshStandardMaterial({color:0x273b39,roughness:.8});
 for(let i=0;i<(mobile?3:6);i++){
  const px=x+(rand(i,31)-.5)*2.95,py=y+(rand(i,32)-.5)*2.7,pz=z+wave(px,py);
  for(let helix=0;helix<6;helix++){
   const a=helix*Math.PI/3,hx=px+.12*Math.cos(a),hy=py+.12*Math.sin(a);
   const points=[];
   for(let j=0;j<=12;j++){
    const t=j/12,theta=t*Math.PI*4+helix;
    points.push(new T.Vector3(hx+.021*Math.cos(theta),hy+.021*Math.sin(theta),pz+(t-.5)*.49));
   }
   const geo=new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.026,5,false);
   const obj=new T.Mesh(geo,channelMat);obj.userData.role='Membrane-spanning protein helix';
   obj.userData.depthBand='membrane';group.add(obj);
  }
  const pore=new T.Mesh(new T.CylinderGeometry(.043,.043,.52,12),poreMat);
  pore.position.set(px,py,pz);pore.rotation.x=Math.PI/2;
  pore.userData.role='Channel lumen';pore.userData.depthBand='membrane';group.add(pore);
 }
}

// Large schematic mitochondrial interior: paired membrane folds with visible
// curved edges and sparse ATP synthase-like particles. Not to scale.
export function createCristaeInterior(T,group,mobile){
 const shellMat=new T.MeshPhysicalMaterial({
  color:0xa77a6d,roughness:.55,side:T.DoubleSide,transparent:true,opacity:.14,depthWrite:false
 });
 const cylinder=new T.Mesh(new T.CylinderGeometry(3.2,3.05,7.7,mobile?22:36,1,true),shellMat);
 cylinder.rotation.x=Math.PI/2;cylinder.position.z=-1.5;
 cylinder.userData.role='Mitochondrial envelope / cutaway';group.add(cylinder);
 const foldMat=new T.MeshPhysicalMaterial({
  color:0xbd8264,roughness:.54,clearcoat:.07,side:T.DoubleSide,
  transparent:true,opacity:.78,depthWrite:false
 });
 const rimMat=new T.MeshStandardMaterial({color:0xe0b38b,roughness:.51});
 const count=mobile?7:11;
 for(let k=0;k<count;k++){
  const centerX=(k-(count-1)/2)*.57;
  const rows=mobile?13:22,cols=mobile?18:30;
  const vertices=[],indices=[],edge=[];
  for(let r=0;r<=rows;r++){
   const y=(r/rows-.5)*5.6;
   for(let c=0;c<=cols;c++){
    const u=c/cols,z=-4.4+u*5.8;
    const bend=.25*Math.sin(u*Math.PI*3+k*.49)+.10*Math.cos(y*1.2+u*7.0+k);
    vertices.push(centerX+bend,y,z);
    if(r<rows&&c<cols){
     const a=r*(cols+1)+c;
     indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);
    }
    if(r===0)edge.push(new T.Vector3(centerX+bend,y,z));
   }
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const fold=new T.Mesh(geo,foldMat);
  fold.userData.role='Folded inner mitochondrial membrane / crista';
  fold.userData.depthBand='crista';group.add(fold);
  const edgeMesh=new T.Mesh(new T.TubeGeometry(
   new T.CatmullRomCurve3(edge),mobile?18:30,.023,5,false),rimMat);
  edgeMesh.userData.role='Crista membrane rim';group.add(edgeMesh);
 }
 const head=new T.IcosahedronGeometry(.075,1),m=new T.MeshStandardMaterial({color:0xe4c59b,roughness:.47});
 const n=mobile?25:65,batch=new T.InstancedMesh(head,m,n),dummy=new T.Object3D();
 for(let i=0;i<n;i++){
  const layer=i%count,u=(i*.6180339)%1,xx=(layer-(count-1)/2)*.57;
  dummy.position.set(xx+.25*Math.sin(u*Math.PI*3+layer*.49)+.12,
   ((i*7)%31/30-.5)*5.1,-4.4+u*5.8);
  dummy.scale.setScalar(.62+(i%4)*.11);dummy.updateMatrix();
  batch.setMatrixAt(i,dummy.matrix);
 }
 batch.instanceMatrix.needsUpdate=true;
 batch.userData.role='ATP synthase-like particles (illustrative)';group.add(batch);
}

// A softly irregular, lobe-based protein envelope communicates folded
// enzyme structure more convincingly than a single plastic ellipsoid.
// It is intentionally not an experimentally determined protein model.
export function createTyrosinaseEnvelope(T,group,mobile){
 const center=new T.Group();
 center.position.set(-.8,0,0);group.add(center);
 const coreMat=new T.MeshPhysicalMaterial({
  color:0x6f9b90,roughness:.59,clearcoat:.07,
  transparent:true,opacity:.62,depthWrite:false
 });
 const core=new T.Mesh(new T.SphereGeometry(1,mobile?18:26,mobile?12:18),coreMat);
 core.scale.set(1.15,.86,.73);
 core.userData.role='Tyrosinase conceptual protein envelope';
 center.add(core);
 const beadGeo=new T.IcosahedronGeometry(.095,1);
 const beadMat=new T.MeshStandardMaterial({color:0x85a99a,roughness:.62});
 const count=mobile?105:210,batch=new T.InstancedMesh(beadGeo,beadMat,count);
 const temp=new T.Object3D();
 for(let i=0;i<count;i++){
  const t=(i+.5)/count,phi=i*2.39996323,r=Math.sqrt(Math.max(0,1-(2*t-1)*(2*t-1)));
  const wrinkle=1+.09*Math.sin(phi*4+t*41)+.05*Math.cos(i*.83);
  temp.position.set(1.14*r*Math.cos(phi)*wrinkle,
   .85*(2*t-1)*wrinkle,.72*r*Math.sin(phi)*wrinkle);
  temp.scale.setScalar(.68+(i%7)*.094);
  temp.rotation.set(i*.17,i*.29,i*.13);temp.updateMatrix();
  batch.setMatrixAt(i,temp.matrix);
 }
 batch.instanceMatrix.needsUpdate=true;
 batch.userData.role='Folded enzyme surface (conceptual)';
 center.add(batch);
 // The two sites symbolize tyrosinase's copper-containing catalytic center;
 // they do not imply measured atom or residue coordinates.
 const copperMat=new T.MeshStandardMaterial({color:0xc89663,metalness:.25,roughness:.4});
 for(const dx of [-.14,.14]){
  const metal=new T.Mesh(new T.SphereGeometry(.12,12,9),copperMat);
  metal.position.set(.19+dx,-.09,.80);
  metal.userData.role='Tyrosinase copper cofactor (schematic)';
  center.add(metal);
 }
 center.userData.bioMotion={kind:'molecule',phase:1.1,amplitude:.014,
  restScale:center.scale.clone(),restPosition:center.position.clone()};
}

// L-tyrosine connectivity: a phenolic aromatic ring linked to an amino-acid
// backbone. Heavy atoms only, implicit hydrogens; these are layout coordinates,
// not a measured 3D conformer. This replaces arbitrary fake covalent chains.
export function createTyrosineMotif(T,group,mobile){
 const assembly=new T.Group();group.add(assembly);
 const atoms=[],bonds=[],radius=.67;
 for(let i=0;i<6;i++){
  const a=Math.PI*2*i/6;
  atoms.push({symbol:'C',p:[-1.0+radius*Math.cos(a),radius*Math.sin(a),.10*Math.sin(i*.8)]});
  bonds.push([i,(i+1)%6]);
 }
 const extras=[
  ['C',.38,0,.10],         // benzylic carbon
  ['C',1.05,.28,.14],      // alpha carbon
  ['C',1.76,.15,.08],      // carboxyl carbon
  ['N',1.04,1.05,.12],     // amine
  ['O',2.32,.76,.08],      // carbonyl oxygen
  ['O',2.02,-.63,.04],     // hydroxyl oxygen
  ['O',-2.39,0,.02]       // phenolic oxygen
 ];
 for(const [symbol,x,y,z] of extras)atoms.push({symbol,p:[x,y,z]});
 bonds.push([0,6],[6,7],[7,8],[7,9],[8,10],[8,11],[3,12]);
 const mats={
  C:new T.MeshStandardMaterial({color:0x889398,roughness:.40}),
  N:new T.MeshStandardMaterial({color:0x537cb5,roughness:.40}),
  O:new T.MeshStandardMaterial({color:0xc96367,roughness:.41})
 };
 const geo=new T.SphereGeometry(1,mobile?11:16,mobile?8:12);
 for(const atom of atoms){
  const mesh=new T.Mesh(geo,mats[atom.symbol]);
  mesh.position.set(...atom.p);
  mesh.scale.setScalar(atom.symbol==='C'?.135:.145);
  mesh.userData.role='Tyrosine atom: '+atom.symbol;assembly.add(mesh);
 }
 const line=new T.MeshStandardMaterial({color:0xbac4bb,roughness:.50});
 for(const [i,j] of bonds){
  const p=atoms[i].p,q=atoms[j].p;
  const a=new T.Vector3(...p),b=new T.Vector3(...q),dir=b.clone().sub(a);
  const stick=new T.Mesh(new T.CylinderGeometry(.035,.035,dir.length(),6),line);
  stick.position.copy(a).add(b).multiplyScalar(.5);
  stick.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());
  stick.userData.role='Tyrosine bond (schematic)';assembly.add(stick);
 }
 // A faint inner circle denotes delocalization in the aromatic ring,
 // rather than inventing a specific bond-order arrangement in the demo.
 const aromatic=new T.Mesh(new T.TorusGeometry(.53,.012,5,mobile?36:64),
  new T.MeshStandardMaterial({color:0x9eb1b4,roughness:.51}));
 aromatic.position.set(-1,0,.11);
 aromatic.userData.role='Tyrosine aromatic ring / delocalized electrons';
 assembly.add(aromatic);
 assembly.userData.bioMotion={kind:'molecule',phase:.42,amplitude:.013,
  restScale:assembly.scale.clone(),restPosition:assembly.position.clone()};
 group.userData.molecule='Tyrosine heavy-atom connectivity; hydrogens implicit';
}
