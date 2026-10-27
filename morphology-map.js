// Interactive Andrews-inspired positional chart. Original geometry; no book graphics reproduced.
// Anatomical overlays and historic topographical labels are deliberately separate datasets.
import {MORPHOLOGY,polarRegion} from './morphology-data.js';
const N=12,NS='http://www.w3.org/2000/svg';
const chart=document.querySelector('#morphChart');
if(chart){
 const view=chart.querySelector('svg'),caption=chart.querySelector('[data-readout]'),description=chart.querySelector('[data-description]');
 const laterality=chart.querySelector('[data-laterality]'),historical=chart.querySelector('[data-historical]'),features=chart.querySelector('[data-pattern]'),patternNotes=chart.querySelector('[data-pattern-detail]');
 const rings=[{name:'Pupillary zone',lo:34,hi:65},{name:'Inner ciliary',lo:65,hi:96},{name:'Middle ciliary',lo:96,hi:126},{name:'Peripheral ciliary',lo:126,hi:158}];
 const featureList=['crypt','collarette','furrow','radial','lacuna','pigment','mammillation','brushfield','pupil'];
 let side='Rx',region={ring:1,sector:12},activeFeature='crypt';
 function element(t,attrs,parent){const e=document.createElementNS(NS,t);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.appendChild(e);return e;}
 function polar(r,a){return [180+r*Math.sin(a),180-r*Math.cos(a)];}
 function arc(lo,hi,a0,a1){const [x0,y0]=polar(hi,a0),[x1,y1]=polar(hi,a1),[x2,y2]=polar(lo,a1),[x3,y3]=polar(lo,a0);return 'M'+x0+' '+y0+' A'+hi+' '+hi+' 0 0 1 '+x1+' '+y1+' L'+x2+' '+y2+' A'+lo+' '+lo+' 0 0 0 '+x3+' '+y3+' Z';}
 const group=element('g',{},view),labelGroup=element('g',{'pointer-events':'none'},view);
 function zoneCode(r,s){return 'R'+(r+1)+' · '+String(s).padStart(2,'0')+':00';}
 // Historic labels from the user-supplied 2011 Andrews diagram are reference vocabulary,
 // not coordinate-registered diagnostic regions; exact boundaries deliberately not asserted.
 const historicalLabels={Rx:{12:'cerebrum / frontal mapping',3:'sinuses / ear sectors',6:'pelvic / lower sectors',9:'lung / cervical sectors'},Lx:{12:'cerebrum / frontal mapping',3:'lung / cervical sectors',6:'pelvic / lower sectors',9:'sinuses / ear sectors'}};
 function render(){
  group.replaceChildren();labelGroup.replaceChildren();
  for(let i=0;i<4;i++)for(let j=0;j<12;j++){
   const hr=j||12,a0=(j-.5)*Math.PI/6,a1=(j+.5)*Math.PI/6;
   const selected=region.ring===i&&region.sector===hr;
   const e=element('path',{d:arc(rings[i].lo,rings[i].hi,a0,a1),fill:selected?'#dce7c6':i===0?'#d4b88c':i===1?'#99a990':i===2?'#7f9a9d':'#687b8c','fill-opacity':selected?'.52':'.16',stroke:selected?'#e4efce':'#9fb0a4','stroke-opacity':selected?'1':'.34','stroke-width':selected?2:.8,role:'button',tabindex:0,'aria-label':rings[i].name+', '+hr+' o’clock','data-zone':i+'-'+hr},group);
   const select=()=>{region={ring:i,sector:hr};render();};
   e.addEventListener('click',select);e.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select();}});
  }
  element('circle',{cx:180,cy:180,r:33,fill:'#040706',stroke:'#c8ab78','stroke-width':4},labelGroup);
  for(let i=0;i<12;i++){const h=i||12,p=polar(175,i*Math.PI/6);const text=element('text',{x:p[0],y:p[1]+3,'text-anchor':'middle',fill:'#d4ddd0','font-size':10,'font-family':'ui-monospace, monospace'},labelGroup);text.textContent=String(h);}
  caption.textContent=side+' / '+rings[region.ring].name.toUpperCase()+' / '+zoneCode(region.ring,region.sector);
  const h=historicalLabels[side][region.sector];
  description.textContent='Reference clock: '+region.sector+':00. Ring '+(region.ring+1)+' of 4. '+(h&&region.ring>0?'Historic Andrews map nearby: '+h+'. ':'')+'This is a positional atlas reference; labels are not pixel-registered or diagnostic.';
  const f=MORPHOLOGY[activeFeature];
  patternNotes.textContent=f.name+' · '+f.patterns.join(' · ')+'. Measures: '+f.measures.join(', ')+'. '+f.source+'.';
 }
 for(const sideButton of chart.querySelectorAll('[data-eye]'))sideButton.addEventListener('click',()=>{side=sideButton.dataset.eye;laterality.textContent=side;chart.querySelectorAll('[data-eye]').forEach(b=>b.setAttribute('aria-pressed',String(b===sideButton)));render();});
 featureList.forEach(key=>{const e=document.createElement('button');e.type='button';e.textContent=MORPHOLOGY[key].name;e.className='morph-pattern'+(key===activeFeature?' active':'');e.onclick=()=>{activeFeature=key;features.querySelectorAll('button').forEach(b=>b.classList.remove('active'));e.classList.add('active');render();};features.appendChild(e);});
 document.querySelector('#morphToggle')?.addEventListener('click',()=>{const open=chart.hidden;chart.hidden=!open;document.querySelector('#morphToggle').setAttribute('aria-expanded',String(open));});
 chart.querySelector('[data-close]').addEventListener('click',()=>{chart.hidden=true;document.querySelector('#morphToggle').setAttribute('aria-expanded','false');});
 window.IrispectraMorphology={focus:({radius,angle,kind})=>{const loc=polarRegion(radius,angle);region={ring:Math.max(0,Math.min(3,Math.floor(loc.rPercent/25))),sector:loc.clock};if(kind&&MORPHOLOGY[kind])activeFeature=kind;render();}};
 render();
}