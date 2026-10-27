// Schematic histology/cell/molecular visual layer; not derived from patient images.
export function createMicroWorld(){
 const canvas=document.createElement('canvas');
 canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:5;opacity:0;pointer-events:none;transition:opacity .25s';
 document.body.appendChild(canvas);
 const ctx=canvas.getContext('2d');
 let zoom=0,route='iris',last=-100;
 const colors={iris:['#8c6e51','#bda07f','#544a3b'],sclera:['#b9b2a8','#d6cabc','#84817c'],retina:['#995e58','#d2a387','#544b58'],vessels:['#88404b','#bd8a8e','#dbb4a5'],nerve:['#687b91','#a8b8c8','#cec0a6']};
 function dot(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
 function frame(t){
  requestAnimationFrame(frame);
  if(t-last<35)return;last=t;
  const w=window.innerWidth,h=window.innerHeight,pixelRatio=Math.min(window.devicePixelRatio||1,1.5);
  if(canvas.width!==Math.floor(w*pixelRatio)||canvas.height!==Math.floor(h*pixelRatio)){canvas.width=Math.floor(w*pixelRatio);canvas.height=Math.floor(h*pixelRatio)}
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,w,h);
  const alpha=Math.max(0,Math.min(1,(zoom-.67)/.13));canvas.style.opacity=alpha.toFixed(3);
  if(alpha<=.002)return;
  ctx.fillStyle='#10131a';ctx.fillRect(0,0,w,h);
  const p=colors[route]||colors.iris,stage=zoom<.80?0:zoom<.92?1:2;
  if(stage===0){
   for(let i=0;i<35;i++){ctx.beginPath();for(let x=-10;x<=w+10;x+=8){let y=h*(i+1)/36+Math.sin(x*.016+i*1.7)*10;if(x===-10)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=p[i%3];ctx.lineWidth=2+i%4;ctx.stroke()}
   for(let i=0;i<26;i++){let x=w*((i*.618+.18)%1),y=h*((i*.414+.12)%1);dot(x,y,9+i%4,5+i%3,p[2]);dot(x+2,y,2.5,2,'#d8d1c5')}
  }else if(stage===1){
   for(let i=0;i<25;i++){let x=w*((i*.618+.14)%1),y=h*((i*.414+.16)%1),r=16+i%4*6;dot(x,y,r,r*.8,p[i%3]);dot(x+2,y,r*.34,r*.27,'#28323c');if(route==='iris')for(let j=0;j<6;j++){const a=j*2.4+i;dot(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,3,2,'#30271c')}}
  }else{
   const points=[];for(let i=0;i<63;i++){let a=i*2.399+t*.0001,r=Math.sqrt(i/63)*Math.min(w,h)*.44;points.push([w*.5+Math.cos(a)*r*1.6,h*.5+Math.sin(a)*r]);}
   ctx.strokeStyle=p[1];ctx.lineWidth=1.5;
   for(let i=1;i<points.length;i++){ctx.beginPath();ctx.moveTo(...points[i-1]);ctx.lineTo(...points[i]);ctx.stroke()}
   points.forEach((pt,i)=>dot(pt[0],pt[1],3+i%3,3+i%3,p[i%3]));
  }
  ctx.font='12px system-ui';ctx.fillStyle='#f0eae1';ctx.fillText(['ILLUSTRATED HISTOLOGY','CONCEPTUAL CELLS','CONCEPTUAL MOLECULES'][stage]+' · NOT A PATIENT SCAN',20,h-32);
 }
 requestAnimationFrame(frame);
 return {setZoom(v){zoom=v},setRoute(v){route=v}};
}
