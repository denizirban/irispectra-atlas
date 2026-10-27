// Spatially anchored multiscale educational routes.
// These descriptions do not imply measured histology or patient-specific microscopy.
const PATHS={
 iris:[
  ["IRIS SURFACE","Pigment, collarette, crypts and contraction furrows","PHOTO / SURFACE MODEL"],
  ["CRYPT / STROMA","Anterior border layer and stromal collagen","EDUCATIONAL TISSUE MODEL"],
  ["HISTOLOGY","Melanocytes, fibroblasts, sphincter and dilator tissue","ILLUSTRATED HISTOLOGY"],
  ["CELLULAR","Melanosomes, fibroblasts and extracellular matrix","CONCEPTUAL CELL MODEL"],
  ["MOLECULAR","Melanin chemistry and collagen assemblies","CONCEPTUAL MOLECULAR MODEL"]
 ],
 sclera:[
  ["SCLERA / EPISCLERA","Outer collagen coat; superficial visible vessels are mainly conjunctival or episcleral","ANATOMICAL MODEL"],
  ["FIBROUS TISSUE","Collagen bundles, fibroblasts and extracellular matrix","ILLUSTRATED HISTOLOGY"],
  ["CELLULAR","Fibroblasts and vascular endothelial cells","CONCEPTUAL CELL MODEL"],
  ["MOLECULAR","Type I collagen and extracellular-matrix crosslinks","CONCEPTUAL MOLECULAR MODEL"]
 ],
 vessels:[
  ["RETINAL VESSELS","Arteries and veins branching over the inner retina","EDUCATIONAL FUNDUS MODEL"],
  ["VESSEL WALL","Endothelium, pericytes, basement membrane","ILLUSTRATED HISTOLOGY"],
  ["CELLULAR","Endothelial cell and pericyte","CONCEPTUAL CELL MODEL"],
  ["MOLECULAR","VE-cadherin and basement-membrane proteins","CONCEPTUAL MOLECULAR MODEL"]
 ],
 retina:[
  ["RETINAL SURFACE","Macula, fovea and photoreceptor-bearing retina","EDUCATIONAL FUNDUS MODEL"],
  ["RETINAL LAYERS","Ganglion cells, bipolar cells and photoreceptors","ILLUSTRATED HISTOLOGY"],
  ["CELLULAR","Rods, cones, bipolar and ganglion cells","CONCEPTUAL CELL MODEL"],
  ["MOLECULAR","Opsins and phototransduction","CONCEPTUAL MOLECULAR MODEL"]
 ],
 nerve:[
  ["OPTIC DISC","Ganglion cell axons converge at the optic nerve head","EDUCATIONAL FUNDUS MODEL"],
  ["NERVE FIBERS","Retinal ganglion cell axons and myelin posterior to the lamina cribrosa","ILLUSTRATED HISTOLOGY"],
  ["NEURAL PATHWAY","Optic nerve → chiasm → optic tract → LGN → visual cortex","SCHEMATIC PATHWAY"],
  ["CELLULAR","Ganglion neurons, oligodendrocytes and astrocytes","CONCEPTUAL CELL MODEL"],
  ["MOLECULAR","Action potentials and synaptic signaling","CONCEPTUAL MOLECULAR MODEL"]
 ]
};
const $=id=>document.getElementById(id);
export function createScalePaths(){
 const el=document.createElement("aside");
 el.id="scaleRouteHud";el.setAttribute("aria-live","polite");
 el.style.cssText="position:fixed;bottom:92px;left:50%;transform:translateX(-50%);z-index:18;max-width:min(460px,88vw);min-width:min(330px,88vw);padding:12px 16px;color:#f0eee8;background:rgba(9,13,15,.74);border:1px solid rgba(230,235,236,.16);border-radius:12px;backdrop-filter:blur(16px);pointer-events:none;font:12px/1.5 system-ui,sans-serif;letter-spacing:.02em";
 el.innerHTML='<div id="scaleRouteName" style="font-size:10px;letter-spacing:.16em;color:#bcc7c5"></div><div id="scaleRouteTitle" style="font-size:15px;font-weight:600;margin-top:2px"></div><div id="scaleRouteDescription"></div><div id="scaleRouteEvidence" style="font-size:10px;letter-spacing:.08em;color:#b6bfbd;margin-top:4px"></div><div id="scaleRouteProgress" style="height:2px;background:rgba(255,255,255,.16);margin-top:9px"><div id="scaleRouteFill" style="height:100%;width:0;background:#c6d5d1;transition:width .2s"></div></div>';
 document.body.appendChild(el);
 let route="iris",lastStage=-1;
 function select(next){if(!PATHS[next])return;route=next;lastStage=-1;render(0);}
 function render(zoom){
  const sections=PATHS[route],stage=Math.min(sections.length-1,Math.floor(Math.max(0,Math.min(.999,zoom))*sections.length));
  if(stage===lastStage)return;lastStage=stage;
  const [title,desc,evidence]=sections[stage];
  $("scaleRouteName").textContent=route.toUpperCase()+" / "+(stage+1)+" OF "+sections.length;
  $("scaleRouteTitle").textContent=title;
  $("scaleRouteDescription").textContent=desc;
  $("scaleRouteEvidence").textContent=evidence+" · NOT DIAGNOSTIC";
  $("scaleRouteFill").style.width=((stage+1)/sections.length*100)+"%";
 }
 render(0);
 return {select,update:render,get route(){return route}};
}
