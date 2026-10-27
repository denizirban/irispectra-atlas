import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// Anatomical teaching illustration. Never substitute this for a measured fundus photograph.
const TAU=Math.PI*2;
function randomGenerator(seed=91821){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
function retinaTexture(){
  const width=2048,height=1024,c=document.createElement("canvas");
  c.width=width;c.height=height;
  const g=c.getContext("2d"),r=randomGenerator();
  const cx=.75*width,cy=.50*height;
  const base=g.createRadialGradient(cx,cy,26,cx,cy,width*.52);
  base.addColorStop(0,"#a94c37");base.addColorStop(.24,"#8c382d");
  base.addColorStop(.54,"#55231f");base.addColorStop(1,"#261316");
  g.fillStyle=base;g.fillRect(0,0,width,height);
  // Granular pigment / choroidal mottling rather than invented clinical abnormalities.
  for(let i=0;i<26000;i++){
    const x=r()*width,y=r()*height,s=.2+r()*3.2;
    g.fillStyle=r()>.50?"rgba(255,164,112,.035)":"rgba(22,6,9,.070)";
    g.fillRect(x,y,s,s);
  }
  for(let i=0;i<850;i++){
    const x=cx+(r()-.5)*width*.65,y=cy+(r()-.5)*height*.75;
    const size=1+r()*18;
    g.fillStyle="rgba(181,79,56,.028)";g.beginPath();g.ellipse(x,y,size,size*(.6+r()),r()*TAU,0,TAU);g.fill();
  }

  // Macula/fovea region. Real retinal microstructure requires dedicated imaging.
  const mx=.79*width,my=.508*height;
  const macula=g.createRadialGradient(mx,my,2,mx,my,width*.074);
  macula.addColorStop(0,"rgba(35,11,12,.64)");
  macula.addColorStop(.28,"rgba(50,17,15,.50)");
  macula.addColorStop(.74,"rgba(89,33,27,.15)");
  macula.addColorStop(1,"rgba(94,33,28,0)");
  g.fillStyle=macula;g.fillRect(mx-170,my-170,340,340);
  const fovea=g.createRadialGradient(mx,my,1,mx,my,26);
  fovea.addColorStop(0,"rgba(38,11,12,.5)");fovea.addColorStop(1,"rgba(77,27,24,0)");
  g.fillStyle=fovea;g.beginPath();g.ellipse(mx,my,26,20,0,0,TAU);g.fill();

  // Optic disc and central cup.
  const dx=.705*width,dy=.50*height;
  g.save();g.translate(dx,dy);g.rotate(-.12);
  const disc=g.createRadialGradient(-6,-3,4,0,0,58);
  disc.addColorStop(0,"#e6b995");disc.addColorStop(.47,"#d69b7d");
  disc.addColorStop(.74,"#b46d57");disc.addColorStop(1,"rgba(131,58,46,0)");
  g.fillStyle=disc;g.beginPath();g.ellipse(0,0,62,78,0,0,TAU);g.fill();
  const cup=g.createRadialGradient(1,-4,2,0,0,33);
  cup.addColorStop(0,"rgba(255,223,182,.66)");cup.addColorStop(1,"rgba(222,166,131,0)");
  g.fillStyle=cup;g.beginPath();g.ellipse(0,0,37,40,0,0,TAU);g.fill();
  g.restore();

  // Curved vascular arcades. Arteries and veins are rendered as separate tapered paths.
  const routes=[
    [[.705,.500],[.722,.398],[.760,.349],[.848,.348],11,"#552127"],
    [[.705,.501],[.715,.394],[.751,.322],[.795,.281],7,"#ad4b43"],
    [[.705,.500],[.721,.602],[.760,.666],[.846,.654],13,"#5d2428"],
    [[.705,.502],[.721,.584],[.758,.730],[.793,.780],6,"#bd6654"],
    [[.705,.499],[.664,.463],[.636,.376],[.595,.336],9,"#612628"],
    [[.705,.499],[.659,.541],[.633,.644],[.587,.675],7,"#b84f46"],
    [[.707,.501],[.736,.468],[.760,.455],[.786,.445],5,"#9e4140"],
    [[.705,.502],[.737,.544],[.763,.568],[.783,.590],5,"#5c2327"],
    [[.705,.502],[.676,.445],[.640,.455],[.593,.470],5,"#ad5149"]
  ];
  function segment(a,b,c,d,w,color){
    g.beginPath();g.moveTo(a[0]*width,a[1]*height);
    g.bezierCurveTo(b[0]*width,b[1]*height,c[0]*width,c[1]*height,d[0]*width,d[1]*height);
    g.strokeStyle="rgba(23,7,11,.28)";g.lineWidth=w+3;g.lineCap="round";g.stroke();
    g.strokeStyle=color;g.lineWidth=w;g.stroke();
    g.strokeStyle="rgba(237,136,116,.16)";g.lineWidth=Math.max(.8,w*.24);g.stroke();
  }
  for(const [a,b,c,d,w,color] of routes){
    segment(a,b,c,d,w,color);
    for(let n=0;n<5;n++){
      const t=.25+.65*n/5,bt=1-t;
      const px=bt*bt*bt*a[0]+3*bt*bt*t*b[0]+3*bt*t*t*c[0]+t*t*t*d[0];
      const py=bt*bt*bt*a[1]+3*bt*bt*t*b[1]+3*bt*t*t*c[1]+t*t*t*d[1];
      const side=(n%2?1:-1),length=.016+.031*r();
      const finish=[Math.max(.09,Math.min(.95,px+side*length*(.6+r()))),Math.max(.08,Math.min(.92,py+side*length))];
      const start=[px,py],cp1=[px+side*length*.18,py+side*length*.1],cp2=[finish[0]-side*length*.20,finish[1]-side*length*.19];
      segment(start,cp1,cp2,finish,Math.max(1.0,w*(.27+.2*r())),color);
    }
  }
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}
function at(u,v,radius=1.116){
  const theta=(1-v)*Math.PI,phi=u*TAU;
  return new THREE.Vector3(-radius*Math.sin(theta)*Math.cos(phi),radius*Math.cos(theta),radius*Math.sin(theta)*Math.sin(phi));
}
export function createFundusStage(){
  const group=new THREE.Group();
  const material=new THREE.MeshBasicMaterial({map:retinaTexture(),side:THREE.BackSide,color:0xffffff});
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1.12,192,96),material);
  sphere.name="Illustrative interior retinal surface";
  group.add(sphere);
  group.visible=false;
  const spots=[
    {kind:"fundusDisc",u:.705,v:.50},
    {kind:"fundusMacula",u:.79,v:.492},
    {kind:"fundusVessels",u:.744,v:.60},
    {kind:"fundusRetina",u:.833,v:.56}
  ];
  return {group,spots,at};
}
