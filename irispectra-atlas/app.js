(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const eyeCanvas = $('eyeCanvas');
  const eyeCtx = eyeCanvas.getContext('2d', { alpha: false });
  const detailCanvas = $('detailCanvas');
  const detailCtx = detailCanvas.getContext('2d', {alpha:false});
  const cropCanvas = $('cropCanvas');
  const cropCtx = cropCanvas.getContext('2d');
  const cropSection = $('cropSection');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const state = {zoom:1, tiltX:0, tiltY:0, wantX:0, wantY:0, detailZoom:1.35,detailX:0,detailY:0, annotated:true, user:false, dragging:false, detailDragging:false, image:null, sourceImage:null, toastTimer:null, anim:0};
  const topics = {
    collarette: {index:'01 / STRUCTURE',title:'The collarette',body:'The collarette is a prominent, irregular ring separating the pupillary and ciliary regions of the iris. Its appearance varies naturally between eyes.'},
    fibers: {index:'02 / STRUCTURE',title:'Radial texture',body:'The iris stroma creates visible radial lines, folds and crypt-like spaces. Image resolution determines which details can be described reliably.'},
    limbal: {index:'03 / STRUCTURE',title:'Outer iris edge',body:'The peripheral iris approaches the iridocorneal angle. The apparent dark outer ring in a photograph can vary with lighting and optical conditions.'},
    pupil: {index:'04 / STRUCTURE',title:'The pupil',body:'The pupil is an opening that controls light entering the eye. Its apparent size changes with lighting and other conditions; a still photo does not establish a clinical measurement.'}
  };
  function rng(seed){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%1000000)/1000000;};}
  const rand = rng(956278);
  const random = (a,b)=>a+rand()*(b-a);
  const sample=document.createElement('canvas');sample.width=1400;sample.height=1400;
  const sc=sample.getContext('2d',{alpha:false});
  function strokeRing(ctx,cx,cy,r,width,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();ctx.restore();}
  function makeIris(){
    const cx=700, cy=700,R=615,pupil=203;
    sc.fillStyle='#050808';sc.fillRect(0,0,1400,1400);
    sc.save();sc.beginPath();sc.arc(cx,cy,R+5,0,TAU);sc.clip();
    let base=sc.createRadialGradient(cx,cy,155,cx,cy,R+10);
    base.addColorStop(0,'#171c18');base.addColorStop(.13,'#867854');base.addColorStop(.23,'#597765');base.addColorStop(.46,'#265b53');base.addColorStop(.73,'#326963');base.addColorStop(.9,'#173a36');base.addColorStop(1,'#050c0d');
    sc.fillStyle=base;sc.fillRect(0,0,1400,1400);
    // Fine radial stromal strands: imperfect curves and multi-depth strokes.
    for(let k=0;k<4400;k++){
      const a=random(0,TAU), b=a+random(-.03,.03), r0=random(pupil-4,pupil+77), r1=random(390,R+20);
      const xm=cx+Math.cos((a+b)/2 + Math.sin(a*13)*.008)*random(300,405);
      const ym=cy+Math.sin((a+b)/2 + Math.sin(a*13)*.008)*random(300,405);
      const x0=cx+Math.cos(a)*r0,y0=cy+Math.sin(a)*r0;
      const x1=cx+Math.cos(b)*r1,y1=cy+Math.sin(b)*r1;
      const warm=(Math.sin(a*5)+Math.sin(a*19)*.4)>0.35;
      const hue=warm?random(33,53):random(144,186),sat=warm?random(18,51):random(16,57),lum=random(25,70),alpha=random(.06,.32);
      sc.strokeStyle=`hsla(${hue},${sat}%,${lum}%,${alpha})`;
      sc.lineWidth=random(.35,3.9);sc.beginPath();sc.moveTo(x0,y0);sc.quadraticCurveTo(xm,ym,x1,y1);sc.stroke();
    }
    // Interwoven fibers, striations, and pigment fibers.
    for(let k=0;k<2900;k++){
      const a=random(0,TAU),r=random(pupil+18,R-17),len=random(16,115),bend=random(-.06,.06);
      const r2=clamp(r+len,pupil+22,R);const b=a+bend;
      const light=rand()>.38;
      sc.strokeStyle=light?`rgba(207,221,176,${random(.025,.19)})`:`rgba(3,22,25,${random(.07,.35)})`;
      sc.lineWidth=random(.5,4.5);sc.beginPath();sc.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);sc.quadraticCurveTo(cx+Math.cos(a+bend*.4)*(r+len*.55),cy+Math.sin(a+bend*.4)*(r+len*.55),cx+Math.cos(b)*r2,cy+Math.sin(b)*r2);sc.stroke();
    }
    // Inner collarette: natural broken wavering edge.
    for(let d=0;d<13;d++){
      sc.beginPath();for(let t=0;t<=520;t++){
        const a=t/520*TAU,r=276+d*1.1+Math.sin(a*17+d*.3)*10+Math.sin(a*39+d)*5+Math.sin(a*9+d)*7;
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(t===0)sc.moveTo(x,y);else sc.lineTo(x,y);
      }sc.closePath();sc.strokeStyle=d%3===0?'rgba(8,28,29,.34)':'rgba(223,188,116,.085)';sc.lineWidth=d%3===0?3.5:1;sc.stroke();
    }
    // Crypts: irregular shaded oval gaps concentrated in middle ring.
    for(let k=0;k<142;k++){
      const a=random(0,TAU),r=random(288,520),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      sc.save();sc.translate(x,y);sc.rotate(a+Math.PI/2);sc.scale(random(.5,1.2),random(.2,.75));
      const sz=random(7,23);sc.fillStyle=`rgba(1,23,25,${random(.07,.28)})`;sc.beginPath();sc.ellipse(0,0,sz,sz*1.95,0,0,TAU);sc.fill();sc.strokeStyle=`rgba(182,195,143,${random(.025,.14)})`;sc.lineWidth=random(.8,3);sc.stroke();sc.restore();
    }
    // Flecked pigment grains.
    for(let k=0;k<7300;k++){
      const a=random(0,TAU),r=Math.sqrt(random((pupil+18)**2,R**2)),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      const warm=rand()<.48;sc.fillStyle=warm?`rgba(229,169,99,${random(.018,.25)})`:`rgba(12,24,22,${random(.025,.35)})`;
      sc.beginPath();sc.ellipse(x,y,random(.2,2.3),random(.6,4.2),a,0,TAU);sc.fill();
    }
    // Ring banding near ciliary border.
    for(let j=0;j<28;j++){const r=random(528,614);strokeRing(sc,cx,cy,r,random(.7,3.5),rand()>.5?'#131d1a':'#a0b3a0',random(.04,.14));}
    let edge=sc.createRadialGradient(cx,cy,475,cx,cy,625);edge.addColorStop(0,'rgba(0,0,0,0)');edge.addColorStop(.76,'rgba(0,0,0,.17)');edge.addColorStop(.96,'rgba(0,0,0,.62)');edge.addColorStop(1,'rgba(0,0,0,.98)');sc.fillStyle=edge;sc.fillRect(0,0,1400,1400);
    sc.restore();
    // Outer boundary, faint radial atmosphere.
    strokeRing(sc,cx,cy,619,10,'#05090a',.94);strokeRing(sc,cx,cy,632,1,'#c0e0cc',.2);
    let pupilG=sc.createRadialGradient(cx-40,cy-48,12,cx,cy,pupil+10);pupilG.addColorStop(0,'#000101');pupilG.addColorStop(.85,'#020606');pupilG.addColorStop(.965,'#060d0d');pupilG.addColorStop(1,'#4e4d37');
    sc.fillStyle=pupilG;sc.beginPath();sc.arc(cx,cy,pupil,0,TAU);sc.fill();strokeRing(sc,cx,cy,pupil+6,12,'#98876a',.13);
    const glaze=sc.createRadialGradient(cx-340,cy-390,0,cx-90,cy-90,790);glaze.addColorStop(0,'rgba(235,255,229,.085)');glaze.addColorStop(.36,'rgba(117,194,175,.018)');glaze.addColorStop(1,'rgba(0,0,0,.21)');sc.save();sc.beginPath();sc.arc(cx,cy,R,0,TAU);sc.clip();sc.fillStyle=glaze;sc.fillRect(0,0,1400,1400);sc.restore();
  }
  makeIris();state.image=sample;
  function currentImage(){return state.image||sample;}
  function updateAtlasImage(){try{document.documentElement.style.setProperty('--iris-image',`url("${currentImage().toDataURL('image/jpeg',.82)}")`);}catch(e){}}
  updateAtlasImage();
  function paintHero(){eyeCtx.drawImage(currentImage(),0,0,1400,1400);}
  paintHero();
  function paintDetails(){
    const bounds=detailCanvas.getBoundingClientRect();const w=Math.max(1,Math.round(bounds.width*Math.min(devicePixelRatio||1,2)));const h=Math.max(1,Math.round(bounds.height*Math.min(devicePixelRatio||1,2)));
    if(detailCanvas.width!==w||detailCanvas.height!==h){detailCanvas.width=w;detailCanvas.height=h;}
    detailCtx.fillStyle='#060a0a';detailCtx.fillRect(0,0,w,h);
    let base=Math.min(w*1.0,h*1.48)*state.detailZoom;
    const offsetX=state.detailX*(devicePixelRatio||1),offsetY=state.detailY*(devicePixelRatio||1);
    detailCtx.save();detailCtx.translate(w/2+offsetX,h/2+offsetY);detailCtx.drawImage(currentImage(),-base/2,-base/2,base,base);detailCtx.restore();
    const shade=detailCtx.createRadialGradient(w/2,h/2,Math.min(w,h)*.28,w/2,h/2,Math.max(w,h)*.7);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.77)');detailCtx.fillStyle=shade;detailCtx.fillRect(0,0,w,h);
    detailCtx.strokeStyle='rgba(159,196,179,.08)';detailCtx.lineWidth=1;for(let x=0;x<w;x+=Math.max(60,Math.round(w/12))){detailCtx.beginPath();detailCtx.moveTo(x,0);detailCtx.lineTo(x,h);detailCtx.stroke();}for(let y=0;y<h;y+=Math.max(60,Math.round(h/8))){detailCtx.beginPath();detailCtx.moveTo(0,y);detailCtx.lineTo(w,y);detailCtx.stroke();}
    if(state.annotated){detailCtx.save();detailCtx.translate(w/2+offsetX,h/2+offsetY);const r=base*.22;detailCtx.setLineDash([7,10]);detailCtx.lineWidth=1;detailCtx.strokeStyle='rgba(190,229,203,.48)';detailCtx.beginPath();detailCtx.arc(0,0,r,0,TAU);detailCtx.stroke();detailCtx.beginPath();detailCtx.arc(0,0,base*.444,0,TAU);detailCtx.stroke();detailCtx.setLineDash([]);detailCtx.restore();}
  }
  const eye3d=$('eye3d');const eyeZone=$('eyeZone');const tip=$('interactionTip');
  function setZoom(z){state.zoom=clamp(z,.65,4.8);$('zoomReadout').textContent=state.zoom.toFixed(2)+'×';$('zoomSlider').value=clamp(state.zoom,1,5);}
  function renderEye(){state.tiltX+=(state.wantX-state.tiltX)*.12;state.tiltY+=(state.wantY-state.tiltY)*.12;eye3d.style.setProperty('--tiltx',state.tiltX+'deg');eye3d.style.setProperty('--tilty',state.tiltY+'deg');eye3d.style.setProperty('--zoom',state.zoom);if(!reduceMotion){state.anim=requestAnimationFrame(renderEye);}}
  renderEye();
  function positionTilt(clientX,clientY){const r=eyeZone.getBoundingClientRect();const x=clamp((clientX-r.left)/r.width*2-1,-1,1),y=clamp((clientY-r.top)/r.height*2-1,-1,1);state.wantX=-y*11;state.wantY=x*14;}
  eyeZone.addEventListener('pointermove',e=>{if(e.target.closest('.hotspot')||e.target.closest('.insight-tooltip'))return;positionTilt(e.clientX,e.clientY);});
  eyeZone.addEventListener('pointerleave',()=>{if(!state.dragging){state.wantX=0;state.wantY=0;}});
  eyeZone.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;state.dragging=true;eyeZone.classList.add('grabbing');eyeZone.setPointerCapture(e.pointerId);tip.style.opacity='.25';});
  eyeZone.addEventListener('pointerup',()=>{state.dragging=false;eyeZone.classList.remove('grabbing');tip.style.opacity='';});
  eyeZone.addEventListener('pointercancel',()=>{state.dragging=false;eyeZone.classList.remove('grabbing');});
  eyeZone.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom+(e.deltaY>0?-.12:.12)*(state.zoom>.9?1:.5));},{passive:false});
  $('zoomSlider').addEventListener('input',e=>{setZoom(+e.target.value);setDetailZoom(+e.target.value);});
  $('zoomIn').addEventListener('click',()=>{setZoom(state.zoom+.25);setDetailZoom(state.detailZoom+.25);});
  $('zoomOut').addEventListener('click',()=>{setZoom(state.zoom-.25);setDetailZoom(state.detailZoom-.25);});
  function setDetailZoom(z){state.detailZoom=clamp(z,.7,5);$('detailMag').textContent=state.detailZoom.toFixed(2)+'×';$('zoomReadout').textContent=state.detailZoom.toFixed(2)+'×';$('zoomSlider').value=clamp(state.detailZoom,1,5);paintDetails();}
  const view=$('viewerWindow');let lastX=0,lastY=0;
  view.addEventListener('pointerdown',e=>{if(e.button!==0)return;state.detailDragging=true;lastX=e.clientX;lastY=e.clientY;view.setPointerCapture(e.pointerId);});
  view.addEventListener('pointermove',e=>{if(!state.detailDragging)return;state.detailX+=e.clientX-lastX;state.detailY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;paintDetails();});
  view.addEventListener('pointerup',()=>{state.detailDragging=false;});view.addEventListener('pointercancel',()=>{state.detailDragging=false;});
  view.addEventListener('wheel',e=>{e.preventDefault();setDetailZoom(state.detailZoom+(e.deltaY>0?-.16:.16));},{passive:false});
  $('toggleLabels').addEventListener('click',()=>{state.annotated=!state.annotated;$('annoState').textContent=state.annotated?'ON':'OFF';$('toggleLabels').setAttribute('aria-pressed',String(state.annotated));document.querySelectorAll('.hotspot').forEach(el=>el.style.display=state.annotated?'':'none');if(!state.annotated)closeTip();paintDetails();});
  $('resetView').addEventListener('click',()=>{state.detailX=0;state.detailY=0;setZoom(1);setDetailZoom(1.35);state.wantX=0;state.wantY=0;toast('VIEW RESET');});
  function closeTip(){ $('insightTooltip').hidden=true;document.querySelectorAll('.hotspot').forEach(el=>el.classList.remove('active')); }
  function topicOpen(topic){const data=topics[topic];if(!data)return;$('tooltipIndex').textContent=data.index;$('tooltipTitle').textContent=data.title;$('tooltipBody').textContent=data.body;$('insightTooltip').hidden=false;document.querySelectorAll('.hotspot').forEach(el=>el.classList.toggle('active',el.dataset.topic===topic));}
  document.querySelectorAll('.hotspot').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();topicOpen(el.dataset.topic);}));
  $('tooltipClose').addEventListener('click',closeTip);
  document.querySelectorAll('.structure-card').forEach(el=>el.addEventListener('click',()=>{$('hero').scrollIntoView({behavior:reduceMotion?'auto':'smooth'});state.wantX=0;state.wantY=0;setZoom(1.2);topicOpen(el.dataset.topic);}));
  const dialog=$('uploadDialog');
  function showUpload(){try{dialog.showModal();}catch(e){dialog.setAttribute('open','');}document.body.classList.add('dialog-open');}
  function hideUpload(){if(dialog.open)dialog.close();document.body.classList.remove('dialog-open');}
  ['navUpload','heroUpload','personalUpload'].forEach(id=>$(id).addEventListener('click',showUpload));
  $('closeDialog').addEventListener('click',hideUpload);
  dialog.addEventListener('click',e=>{if(e.target===dialog)hideUpload();});
  dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
  $('heroDemo').addEventListener('click',()=>{$('explore').scrollIntoView({behavior:reduceMotion?'auto':'smooth'});toast('INTERACTIVE DEMO — DRAG AND SCROLL TO EXPLORE');});
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('visible'),3300);}
  const drop=$('dropZone'),input=$('photoInput');
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');if(e.dataTransfer.files.length)openFile(e.dataTransfer.files[0]);});
  input.addEventListener('change',e=>{if(e.target.files.length)openFile(e.target.files[0]);});
  async function openFile(file){
    if(!file.type.startsWith('image/')){toast('SELECT A VALID IMAGE FILE');return;}
    if(file.size>15*1024*1024){toast('PLEASE SELECT AN IMAGE UNDER 15 MB');return;}
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);state.sourceImage=img;cropSection.hidden=false;['cropX','cropY'].forEach(id=>$(id).value=50);$('cropSize').value=28;drawCropPreview();toast('POSITION THE CIRCLE OVER YOUR IRIS');};
    img.onerror=()=>{URL.revokeObjectURL(url);toast('COULD NOT READ THIS IMAGE — TRY JPG OR PNG');};img.src=url;
  }
  function cropGeometry(){const img=state.sourceImage;const cx=img.naturalWidth*($('cropX').value/100),cy=img.naturalHeight*($('cropY').value/100),diameter=Math.min(img.naturalWidth,img.naturalHeight)*($('cropSize').value/100);return{cx,cy,diameter};}
  function drawCropPreview(){const img=state.sourceImage;if(!img)return;const w=640,h=330;cropCtx.fillStyle='#050808';cropCtx.fillRect(0,0,w,h);const s=Math.min(w/img.naturalWidth,h/img.naturalHeight);const dx=(w-img.naturalWidth*s)/2,dy=(h-img.naturalHeight*s)/2;cropCtx.drawImage(img,dx,dy,img.naturalWidth*s,img.naturalHeight*s);const {cx,cy,diameter}=cropGeometry();const px=dx+cx*s,py=dy+cy*s,pr=diameter*s/2;cropCtx.fillStyle='rgba(0,0,0,.44)';cropCtx.beginPath();cropCtx.rect(0,0,w,h);cropCtx.arc(px,py,pr,0,TAU,true);cropCtx.fill('evenodd');cropCtx.strokeStyle='#d5f3de';cropCtx.lineWidth=2;cropCtx.beginPath();cropCtx.arc(px,py,pr,0,TAU);cropCtx.stroke();cropCtx.strokeStyle='rgba(255,255,255,.75)';cropCtx.lineWidth=1;cropCtx.beginPath();cropCtx.moveTo(px-12,py);cropCtx.lineTo(px+12,py);cropCtx.moveTo(px,py-12);cropCtx.lineTo(px,py+12);cropCtx.stroke();}
  ['cropX','cropY','cropSize'].forEach(id=>$(id).addEventListener('input',drawCropPreview));
  cropCanvas.addEventListener('pointerdown',e=>{const rect=cropCanvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*640,y=(e.clientY-rect.top)/rect.height*330;const im=state.sourceImage;if(!im)return;const s=Math.min(640/im.naturalWidth,330/im.naturalHeight),dx=(640-im.naturalWidth*s)/2,dy=(330-im.naturalHeight*s)/2;$('cropX').value=clamp(((x-dx)/s)/im.naturalWidth*100,0,100);$('cropY').value=clamp(((y-dy)/s)/im.naturalHeight*100,0,100);drawCropPreview();});
  $('confirmCrop').addEventListener('click',()=>{
    const img=state.sourceImage;if(!img)return;const {cx,cy,diameter}=cropGeometry();const c=document.createElement('canvas');c.width=1400;c.height=1400;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#050808';ctx.fillRect(0,0,1400,1400);ctx.save();ctx.beginPath();ctx.arc(700,700,634,0,TAU);ctx.clip();const sourceSize=diameter*1400/(634*2);ctx.drawImage(img,cx-sourceSize/2,cy-sourceSize/2,sourceSize,sourceSize,0,0,1400,1400);ctx.restore();
    strokeRing(ctx,700,700,635,8,'rgba(8,16,16,.82)');state.image=c;state.user=true;state.zoom=1;state.detailX=state.detailY=0;state.detailZoom=1.35;paintHero();paintDetails();updateAtlasImage();$('specimenCode').textContent='SPECIMEN — PERSONAL IMAGE';$('statusMode').textContent='YOUR EYE / LOCAL';hideUpload();closeTip();window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});toast('YOUR ATLAS IS READY — ZOOM TO EXPLORE');
  });
  $('exportArt').addEventListener('click',()=>{
    const c=document.createElement('canvas');c.width=1800;c.height=2200;const ctx=c.getContext('2d');ctx.fillStyle='#071010';ctx.fillRect(0,0,c.width,c.height);let glow=ctx.createRadialGradient(900,900,250,900,920,980);glow.addColorStop(0,'#16312b');glow.addColorStop(1,'#071010');ctx.fillStyle=glow;ctx.fillRect(0,0,1800,2000);ctx.drawImage(currentImage(),100,150,1600,1600);ctx.textAlign='left';ctx.fillStyle='#e8eee3';ctx.font='500 68px sans-serif';ctx.fillText('IRISPECTRA',106,1980);ctx.fillStyle='#a8c3b4';ctx.font='25px monospace';ctx.fillText(state.user?'YOUR PERSONAL IRIS ATLAS':'IRIS ATLAS / DEMO SPECIMEN',110,2045);ctx.fillStyle='#74988a';ctx.font='19px monospace';ctx.fillText('VISUAL EXPLORATION / NOT A MEDICAL ASSESSMENT',110,2124);
    c.toBlob(blob=>{if(!blob){toast('EXPORT FAILED');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=state.user?'irispectra-my-eye.png':'irispectra-demo.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('IMAGE SAVED TO YOUR DEVICE');},'image/png');
  });
  const loader=$('loader');const count=$('loadCount');let pct=0;const loadTimer=setInterval(()=>{pct=Math.min(100,pct+Math.ceil(Math.random()*22));count.textContent=String(pct).padStart(2,'0');if(pct===100){clearInterval(loadTimer);setTimeout(()=>loader.classList.add('done'),180);}},70);
  paintDetails();window.addEventListener('resize',paintDetails,{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTip();}if(document.activeElement===eyeZone&&(e.key==='+'||e.key==='-')){setZoom(state.zoom+(e.key==='+'?.2:-.2));}});
})();
