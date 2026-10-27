// Approximate label centroids digitized from the user-supplied John Andrews
// Modern Iridology Chart (2011). The diagram is a historical topographical
// index; these points are NOT tissue anatomy and are not calibrated diagnoses.
// Angles are its 0–60 outer scale (0 = top, 15 = right, 30 = bottom).
export const CHART_ZONES={
 Rx:[
 ['Cerebrum',0,.91],['Hypothalamus',0,.56],['Pituitary gland',1,.44],
 ['Corpus callosum',2,.79],['Frontal lobe',5,.91],['Temporal / cervical region',8,.80],
 ['Ear',9,.64],['Thyroid region',11,.57],['Trachea',12.4,.69],
 ['Bronchials',14,.72],['Oesophagus',15.2,.73],['Cardia',16,.53],
 ['Pancreas',20.8,.59],['Liver (posterior)',20.4,.69],['Bladder',23.3,.70],
 ['Uterus / prostate',24.3,.57],['Pelvic region',26,.79],['Kidney',28.4,.81],
 ['Adrenal',29.0,.51],['Lymphatic region',30,.93],['Sacrum',31.8,.58],
 ['Peritoneum',35,.72],['Gall bladder / biliary area',38.7,.74],
 ['Lower lung lobe',42.8,.75],['Medial lung',46,.67],['Upper lung lobe',49,.74],
 ['Parotid / ear region',53,.73],['Occipital lobe',55.6,.90],['Cerebrum',59,.91]
 ],
 Lx:[
 ['Cerebrum',0,.91],['Hypothalamus',0,.56],['Pituitary gland',1,.44],
 ['Corpus callosum',58,.79],['Frontal lobe',55,.90],['Occipital lobe',5,.90],
 ['Ear / cervical region',9,.74],['Upper lung lobe',11.4,.78],
 ['Lower lung lobe',15.4,.74],['Spleen',21.3,.69],['Diaphragm',21,.83],
 ['Peritoneum',25,.76],['Kidney',31.6,.81],['Pelvic region',33,.80],
 ['Uterus / prostate',35.7,.56],['Bladder',36.7,.70],['Pancreas',39.5,.60],
 ['Liver (posterior)',39.6,.82],['Bronchials',43.6,.71],
 ['Oesophagus',45,.75],['Trachea',48.3,.69],['Thyroid region',50.2,.58],
 ['Sinuses',54.1,.68],['Ear',52,.73],['Spleen / upper sector',4.7,.69],
 ['Lymphatic region',30,.93],['Cerebrum',59,.90]
 ]};
const cyclicDistance=(a,b)=>Math.abs((a-b+30+60)%60-30);
export function chartPosition(x,y){
 const minute=((Math.atan2(x,-y)%(Math.PI*2)+Math.PI*2)%(Math.PI*2))*60/(Math.PI*2);
 const rr=Math.hypot(x,y);
 return {minute,rr};
}
export function zoneAt(side,minute,rho){
 const list=CHART_ZONES[side==='Lx'?'Lx':'Rx'];
 const candidates=list.map(([name,m,r])=>({name,minute:m,rho:r,dMinute:cyclicDistance(minute,m),dRadius:Math.abs(rho-r)}))
 .filter(c=>c.dMinute<=3.2&&c.dRadius<=.19)
 .sort((a,b)=>(a.dMinute/(1+8*a.rho))**2+(a.dRadius*5)**2-((b.dMinute/(1+8*b.rho))**2+(b.dRadius*5)**2));
 return candidates[0]||null;
}
export function zoneForEyePoint(side,r,angle){
 // Three eye geometry: x=cos(angle), y=sin(angle); diagram zero is superior.
 const {minute}=chartPosition(Math.cos(angle),Math.sin(angle));
 // normalize within visible pupil-to-limbus iris annulus
 const rho=.34+Math.max(0,Math.min(1,(r-.195)/(.63-.195)))*.60;
 return {minute,rho,zone:zoneAt(side,minute,rho)};
}
