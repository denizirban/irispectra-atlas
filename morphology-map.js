import {MORPHOLOGY} from './morphology-data.js';
import {CHART_ZONES,zoneAt,zoneForEyePoint} from './chart-zones.js';
const chart=document.querySelector('#morphChart'),NS='http://www.w3.org/2000/svg';
if(chart){
 const svg=chart.querySelector('svg'),readout=chart.querySelector('[data-readout]'),
 description=chart.querySelector('[data-description]'),featureList=chart.querySelector('[data-pattern]'),
 patternDetail=chart.querySelector('[data-pattern-detail]'),laterality=chart.querySelector('[data-laterality]');
 const rings=[{name:'Pupillary',inner:33,outer:65},{name:'Inner ciliary',inner:65,outer:96},
 {name:'Mid ciliary',inner:96,outer:126},{name:'Peripheral',inner:126,outer:158}];
 let side='Rx',feature='crypt',minute=20.7,rho=.59;
 const add=(t,attributes,parent=svg)=>{const el=document.createElementNS(NS,t);for(const [k,v] of Object.entries(attributes))el.setAttribute(k,String(v));parent.appendChild(el);return el};
 const pos=(r,m)=>{const a=m/60*Math.PI*2;return [180+r*Math.sin(a),180-r*Math.cos(a)]};
 const arc=(ri,ro,m0,m1)=>{const a=pos(ro,m0),b=pos(ro,m1),c=pos(ri,m1),d=pos(ri,m0);return 'M'+a+' L'+b+' A'+ro+' '+ro+' 0 0 1 '+c+' L'+d+' A'+ri+' '+ri+' 0 0 0 '+a+' Z'};
 const group=add('g',{}),markers=add('g',{}),caption=add('g',{'pointer-events':'none'});
 function read(){
  const hist=zoneAt(side,minute,rho),label=hist?.name||rings[Math.min(3,Math.max(0,Math.floor((rho-.19)*4)))].name+' iris';
  const d=MORPHOLOGY[feature];
  const examples=d?.patterns||[];
  readout.textContent=label;
  description.textContent=rings[Math.min(3,Math.max(0,Math.floor((rho-.19)*4)))].name+' · '+Math.round(minute)+' / 60 · '+(side==='Rx'?'Right':'Left')+' iris';
  patternDetail.textContent=(d?.name||'Iris surface')+' — '+(examples.length?examples.join(' · '):'Visible structure')+'. '+(d?.note||'');
  chart.dataset.zone=label;chart.dataset.zoneMinute=String(minute);
  window.IrispectraMorphology.current={name:label,feature,minute,rho,side};
  return {name:label,feature,minute,rho,side};
 }
 function render(){
  group.replaceChildren();markers.replaceChildren();caption.replaceChildren();
  for(let i=0;i<4;i++)for(let j=0;j<60;j++){
   const m=j+.5,ri=rings[i].inner,ro=rings[i].outer,selected=Math.abs((m-minute+30)%60-30)<1&&rho*158>=ri&&rho*158<ro;
   const el=add('path',{d:arc(ri,ro,j,j+1),fill:selected?'#d7e9c5':i===0?'#a7a16e':i===1?'#8d9d86':i===2?'#658885':'#546c75',opacity:selected?.74:.24,stroke:'#b4c5ad','stroke-width':selected?1:.22,role:'button',tabindex:0,'aria-label':'Map position '+j+' of 60'},group);
   function choose(){minute=m;rho=(ri+ro)/316;render();notify();}
   el.addEventListener('click',choose);
   el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
  }
  CHART_ZONES[side].forEach(([label,m,r])=>{
   const [x,y]=pos(r*158,m),active=Math.abs((m-minute+30)%60-30)<.75&&Math.abs(r-rho)<.07;
   const mark=add('circle',{cx:x,cy:y,r:active?5:3.1,fill:active?'#f4fce9':'#d6e4c8',stroke:'#0c1613','stroke-width':1,opacity:.92,role:'button',tabindex:0,'aria-label':label},markers);
   const choose=e=>{if(e)e.stopPropagation();minute=m;rho=r;render();notify()};
   mark.addEventListener('click',choose);mark.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(e);}});
   if(active){const t=add('text',{x:x+8,y:y-8,fill:'#fff','font-size':10,'font-family':'ui-monospace, monospace'},caption);t.textContent=label;}
  });
  add('circle',{cx:180,cy:180,r:33,fill:'#050707',stroke:'#d6bd88','stroke-width':2.2},caption);
  for(let m=0;m<60;m+=5){const [x,y]=pos(172,m),el=add('text',{x,y:y+3,fill:'#b9c6bb','font-size':9,'text-anchor':'middle','font-family':'monospace'},caption);el.textContent=String(m).padStart(2,'0');}
  read();
 }
 function notify(){window.dispatchEvent(new CustomEvent('irispectra-map-select',{detail:read()}));}
 for(const b of chart.querySelectorAll('[data-eye]'))b.addEventListener('click',()=>{
  side=b.dataset.eye;laterality.textContent=side;
  chart.querySelectorAll('[data-eye]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  render();notify();
 });
 for(const [key,d] of Object.entries(MORPHOLOGY)){
  const b=document.createElement('button');b.type='button';b.className='morph-pattern';b.textContent=d.name;b.dataset.feature=key;
  b.addEventListener('click',()=>{feature=key;featureList.querySelectorAll('button').forEach(v=>v.classList.toggle('active',v===b));render();notify()});
  featureList.appendChild(b);
 }
 featureList.querySelector('[data-feature="crypt"]').classList.add('active');
 document.querySelector('#morphToggle')?.addEventListener('click',()=>{
  const visible=chart.hidden;chart.hidden=!visible;document.querySelector('#morphToggle').setAttribute('aria-expanded',String(visible));
 });
 chart.querySelector('[data-close]').addEventListener('click',()=>{chart.hidden=true;document.querySelector('#morphToggle').setAttribute('aria-expanded','false')});
 window.IrispectraMorphology={
  current:null,
  get side(){return side},
  focus:({radius,angle,kind})=>{
   const loc=zoneForEyePoint(side,radius,angle);minute=loc.minute;rho=loc.rho;
   if(kind&&MORPHOLOGY[kind])feature=kind;
   featureList.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.feature===feature));
   render();return read();
  }
 };
 render();
}
