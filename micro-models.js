// Original educational 3D illustrations. Each object is modeled, not derived from an
// individual pupil photograph or a measured histology/molecular dataset.
export function populateMicroScene(THREE,group,route,stage){
 const mat=(hex,opacity=1)=>new THREE.MeshPhysicalMaterial({color:hex,roughness:.75,metalness:0,clearcoat:.06,transparent:true,opacity,depthWrite:opacity===1});
 const M={
  fiber:mat(route==='sclera'?0xd7ccb5:0xc8a784),
  collagen:mat(0xe1d2ab),melanin:mat(0x49332b),
  cell:mat(0xaa9175,.94),nucleus:mat(0x4e4655),
  vessel:mat(0x9f4f56,.93),axon:mat(0xb5bec5,.95),
  retinal:mat(0xb89f94,.9)
 };
 const sphere=new THREE.SphereGeometry(1,16,12),items=[];
 function mesh(g,m,p,scale){
  const ob=new THREE.Mesh(g,m);ob.position.set(...p);
  if(scale)ob.scale.set(...scale);
  group.add(ob);items.push(ob);return ob;
 }
 function bead(x,y,z,r,m,scale=[1,1,1]){return mesh(sphere,m,[x,y,z],[r*scale[0],r*scale[1],r*scale[2]])}
 function tube(points,r,m){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*5),r,7,false),m,[0,0,0]);
 }
 function random(i){return (Math.sin(i*1234.567+78.2)*43758.5453)%1}
 function fibrous(n=38,ordered=true){
  for(let i=0;i<n;i++){
   const x=(i%9-4)*.52,y=(Math.floor(i/9)-2)*.34,z=Math.sin(i*1.3)*.42;
   const a=[];
   for(let k=0;k<=10;k++){
    const v=(k/10-.5)*6;
    a.push([ordered?v:x+v,y+Math.sin(v*.72+i*.65)*.12,z+Math.cos(v*.53+i)*.12]);
   }
   tube(a,.024+(i%4)*.006,i%5===0?M.collagen:M.fiber);
  }
 }
 function fibroblast(x,y,z,f=1){
  bead(x,y,z,.39*f,M.cell,[1.42,.61,.45]);
  bead(x+.04*f,y,z+.18*f,.19*f,M.nucleus,[1,.73,.48]);
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5,dx=Math.cos(a),dy=Math.sin(a);
   tube([[x+dx*.24*f,y+dy*.13*f,z],[x+dx*.65*f,y+dy*.30*f,z+.1],[x+dx*1.02*f,y+dy*.47*f,z]],.024,M.cell);
  }
 }
 function melanocyte(x,y,z,f=1){
  bead(x,y,z,.34*f,M.cell,[1.13,.92,.63]);
  bead(x,y,z+.17*f,.19*f,M.nucleus);
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,dx=Math.cos(a),dy=Math.sin(a);
   tube([[x,y,z],[x+dx*.46*f,y+dy*.42*f,z+.06],[x+dx*.89*f,y+dy*.80*f,z-.03],[x+dx*1.26*f,y+dy*1.04*f,z]],.019,M.cell);
  }
  for(let i=0;i<29;i++){
   const a=i*2.399,r=Math.sqrt(i/29)*.69*f;
   bead(x+Math.cos(a)*r,y+Math.sin(a)*r*.7,z+.24*f,.039*f,M.melanin);
  }
 }
 function helix(){
  for(let chain=0;chain<3;chain++){
   const pts=[];
   for(let i=0;i<=110;i++){
    const t=i/110,y=(t-.5)*5.4,a=i*.30+chain*2*Math.PI/3;
    pts.push([Math.cos(a)*.48,y,Math.sin(a)*.48]);
    if(i%10===0)bead(Math.cos(a)*.48,y,Math.sin(a)*.48,.08,chain===0?M.fiber:chain===1?M.collagen:M.cell);
   }
   tube(pts,.055,chain===0?M.fiber:chain===1?M.collagen:M.cell);
  }
 }
 function lamina(){
  for(let row=0;row<6;row++){
   const y=(row-2.5)*.46;
   for(let i=0;i<15;i++){
    const x=(i-7)*.35;
    bead(x,y,Math.sin(i+row)*.06,row%2?.11:.16,row===0?M.retinal:row>=4?M.nucleus:M.cell,[1.3,.55,1.0]);
   }
  }
 }
 if(stage===2){
  if(route==='iris'||route==='sclera'){
   fibrous(route==='sclera'?60:35);
   if(route==='iris'){melanocyte(-1.1,-.38,.45,.75);fibroblast(1.3,.66,.45,.62)}
   else for(let i=0;i<3;i++)fibroblast((i-1)*1.85,(i%2?-.8:.6),.35,.60);
  }else if(route==='vessel'){
   const wall=mesh(new THREE.TorusGeometry(1.7,.38,14,75),M.vessel,[0,0,0]);wall.rotation.x=.44;
   for(let i=0;i<20;i++){const a=i*Math.PI/10;bead(Math.cos(a)*1.7,Math.sin(a)*1.7,.25,.15,M.cell)}
  }else if(route==='nerve'){
   for(let i=0;i<30;i++){let a=i*2.399,r=Math.sqrt(i/30)*2.2; tube([[-3,Math.sin(a)*r,Math.cos(a)*r],[-1,Math.sin(a)*r,Math.cos(a)*r],[2,Math.sin(a)*r,Math.cos(a)*r]],.065,M.axon)}
  }else lamina();
 }else if(stage===3){
  if(route==='iris'){
   melanocyte(-1.15,.5,0,1.12);fibroblast(1.25,-.6,.1,1.15);melanocyte(.75,1.25,-.6,.6);
  }else if(route==='sclera'){fibroblast(0,0,0,1.8);fibrous(15)}
  else if(route==='vessel'){for(let i=0;i<5;i++)fibroblast((i-2)*1.3,Math.sin(i)*.65,0,.85)}
  else if(route==='nerve'){for(let i=0;i<18;i++)tube([[0,(i-9)*.26,-2],[0,(i-9)*.26,2]],.065,M.axon)}
  else{for(let i=0;i<9;i++){const x=(i-4)*.63;bead(x,.3,0,.28,M.retinal,[.65,2.5,.75]);tube([[x,-.3,.1],[x,-1,.12],[x,-2,.14]],.045,M.axon)}}
 }else if(stage===4){
  if(route==='iris'||route==='sclera'){helix();if(route==='iris')for(let i=0;i<25;i++){const a=i*2.399,r=Math.sqrt(i/25)*2.1;bead(Math.cos(a)*r,Math.sin(a)*r,(i%4-2)*.3,.08,M.melanin)}}
  else{
   for(let i=0;i<48;i++){const a=i*.67,x=Math.cos(a)*1.8,y=Math.sin(a)*1.1,z=(i-24)*.05;bead(x,y,z,.12,i%4?M.axon:M.nucleus)}
   for(let i=0;i<5;i++){let pts=[];for(let k=0;k<=15;k++)pts.push([Math.sin(k*.43+i)*.9,(k/15-.5)*5.1,Math.cos(k*.43+i)*.8]);tube(pts,.035,M.axon)}
  }
 }
 return items;
}
