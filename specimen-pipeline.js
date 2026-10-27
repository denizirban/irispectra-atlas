// Specimen photographs: original images from Wikimedia Commons with attribution.
// These are real macro iris photographs. The resulting annular texture is aligned
// onto a modeled surface; its depth is illustrative rather than scan-derived.
export const SPECIMENS=[
 {
  key:"osmo",title:"ICE / HAZEL",creator:"Osmo Lundell",license:"CC BY-SA 4.0",year:2025,
  url:"https://upload.wikimedia.org/wikipedia/commons/c/c5/Iris_of_human_male.jpg",
  credit:"https://commons.wikimedia.org/wiki/File:Iris_of_human_male.jpg",
  cx:.518,cy:.512,outer:.365,innerRatio:.44
 },
 {
  key:"green",title:"GOLD / SAGE",creator:"Lizapopova143",license:"CC BY 4.0",year:2019,
  url:"https://upload.wikimedia.org/wikipedia/commons/a/a1/Green_iris.jpg",
  credit:"https://commons.wikimedia.org/wiki/File:Green_iris.jpg",
  cx:.500,cy:.504,outer:.43,innerRatio:.31
 },
 {
  key:"amber",title:"AMBER / BROWN",creator:"Mcorrens",license:"CC BY-SA 3.0",year:2009,
  url:"https://upload.wikimedia.org/wikipedia/commons/1/15/Iris_of_the_Human_Eye.jpg",
  credit:"https://commons.wikimedia.org/wiki/File:Iris_of_the_Human_Eye.jpg",
  cx:.5,cy:.49,outer:.345,innerRatio:.345
 }
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function makeAnnularSpecimen(img,spec,{size=2048}={}){
 const originalW=img.naturalWidth||img.width,originalH=img.naturalHeight||img.height;
 const ratio=Math.min(1,3072/Math.max(originalW,originalH));
 const W=Math.max(1,Math.round(originalW*ratio)),H=Math.max(1,Math.round(originalH*ratio));
 const working=document.createElement("canvas");working.width=W;working.height=H;
 const g=working.getContext("2d",{willReadFrequently:true});
 g.drawImage(img,0,0,W,H);
 const src=g.getImageData(0,0,W,H).data;
 const out=document.createElement("canvas");out.width=out.height=size;
 const c=out.getContext("2d",{willReadFrequently:false});
 const frame=c.createImageData(size,size),pixels=frame.data;
 const cx=(spec.cx??.5)*W,cy=(spec.cy??.5)*H;
 const outer=Math.min(W,H)*(spec.outer??.355),inner=outer*(spec.innerRatio??.34);
 const half=size/2;
 // Every visible iris pixel is sampled outside the source pupil and inside its limbus.
 // The ring spans UV radii 0.30…1, corresponding to the WebGL iris annulus.
 for(let y=0;y<size;y++){
  const dy=(y+.5-half)/half;
  for(let x=0;x<size;x++){
   const dx=(x+.5-half)/half,rr=Math.hypot(dx,dy),o=(y*size+x)*4;
   if(rr>1.0||rr<.299){pixels[o+3]=0;continue;}
   const t=clamp((rr-.30)/.70,0,1);
   const srcR=inner+(outer-inner)*t;
   const ox=dx/rr,oy=dy/rr;
   const sx=clamp(Math.round(cx+ox*srcR),0,W-1),sy=clamp(Math.round(cy+oy*srcR),0,H-1);
   const p=(sy*W+sx)*4;
   pixels[o]=src[p];pixels[o+1]=src[p+1];pixels[o+2]=src[p+2];
   // Soft limbal falloff so no hard artificial dark edge against the 3D limbal rim.
   pixels[o+3]=Math.round(255*clamp((1-rr)/.032,0,1));
  }
 }
 c.putImageData(frame,0,0);
 return out;
}
