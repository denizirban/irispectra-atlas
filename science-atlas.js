// IRISPECTRA Science Atlas: educational models, never personal histology.
(function(){
"use strict";
const $=id=>document.getElementById(id);
const layers=[
 ["WHOLE EYE","MACRO","3D ANATOMICAL MODEL","Cornea, sclera, iris and pupil","The cornea and lens refract light. The iris regulates the amount of light that enters through the pupil.","eye"],
 ["IRIS MORPHOLOGY","OBSERVED SURFACE","SYNTHETIC DEMO / USER IMAGE","Pupillary ruff, collarette, crypts, radial texture, contraction furrows and pigment variation","A visible iris pattern can be described morphologically. A photograph alone does not establish disease or microscopic tissue anatomy.","iris"],
 ["ANTERIOR SEGMENT","CROSS SECTION","EDUCATIONAL RECONSTRUCTION","Cornea → aqueous humor → iris → lens → ciliary body","The aqueous-humor-filled anterior chamber lies between the cornea and iris. The ciliary body produces aqueous humor and participates in accommodation.","anterior"],
 ["IRIS HISTOLOGY","TISSUE","EDUCATIONAL RECONSTRUCTION","Anterior border layer → stroma → sphincter/dilator → posterior pigment epithelium","The stroma contains collagen fibers, melanocytes, fibroblasts, blood vessels and nerves. The posterior iris is heavily pigmented.","tissue"],
 ["CELLULAR SCALE","CELL BIOLOGY","CONCEPTUAL CELL MODEL","Melanocytes • fibroblasts • collagen • capillaries","Melanocytes contain melanosomes. Fibroblasts maintain extracellular matrix; collagen provides stromal structure.","cell"],
 ["MOLECULAR SCALE","BIOCHEMISTRY","CONCEPTUAL MOLECULAR MODEL","Melanin • collagen • acetylcholine • norepinephrine","Melanin is a family of pigments, not one fixed molecule. Acetylcholine mediates parasympathetic sphincter activity; norepinephrine participates in sympathetic dilation.","molecule"],
 ["RETINA / FUNDUS","POSTERIOR EYE","EDUCATIONAL ANATOMICAL MODEL","Macula • fovea • optic disc • retinal vessels • optic nerve","The fovea supports high-acuity vision. The optic disc has no photoreceptors; retinal ganglion-cell axons exit through it.","retina"],
 ["NEURAL PATHWAYS","BRAIN CONNECTION","SCHEMATIC CIRCUITS","Vision: retina → chiasm → LGN → visual cortex","Pupillary light reflex: retina → pretectal nuclei → bilateral Edinger–Westphal nuclei → CN III → ciliary ganglion → sphincter pupillae.","neural"]
];
const facts=[
 [["Cornea","The transparent, avascular front surface refracts incoming light."],["Iris","A contractile pigmented diaphragm regulating the pupil."],["Sclera","The collagen-rich coat supporting the globe."]],
 [["Pupillary ruff","Dark, scalloped pupillary margin formed by posterior pigment epithelium."],["Collarette","Irregular ridge dividing the pupillary and ciliary zones."],["Crypts of Fuchs","Openings in the anterior iris border layer exposing deeper stroma."],["Radial fibers","Radially arranged connective tissue contributes to iris texture."],["Contraction furrows","Concentric peripheral folds associated with iris movement."],["Pigment variation","Depends on melanin and light scattering; not a diagnosis."]],
 [["Cornea","Transparent tissue with organized stroma and endothelium."],["Anterior chamber","Aqueous-humor-filled space between cornea and iris."],["Lens","Transparent and flexible optical structure behind the pupil."],["Ciliary body","Produces aqueous humor and regulates accommodation."]],
 [["Border layer","Anterior stromal surface containing melanocytes and fibroblasts."],["Stroma","Collagen, melanocytes, nerves and vessels."],["Sphincter pupillae","Circular smooth muscle producing constriction."],["Dilator pupillae","Radially oriented myoepithelial muscle region."],["Posterior epithelium","Two heavily pigmented epithelial layers."]],
 [["Melanocyte","Melanosomes produce and store pigment."],["Fibroblast","Maintains extracellular matrix."],["Collagen","Fibrillar structural protein."],["Capillary","Small vessel supplying stromal tissue."]],
 [["Melanin","Complex family of biological pigments."],["Collagen","Triple-helical structural proteins forming fibrils."],["Acetylcholine","Neurotransmitter at iris sphincter parasympathetic terminals."],["Norepinephrine","Sympathetic neurotransmitter acting on iris dilator."]],
 [["Retina","Neural tissue transforming photic input into electrical signaling."],["Macula","Region responsible for detailed central vision."],["Fovea","Central high-acuity region."],["Optic disc","Exit for axons and retinal vessels; lacks photoreceptors."],["Optic nerve","Ganglion-cell axons connect retina to brain."]],
 [["Visual pathway","Retina → optic nerve → optic chiasm → optic tract → LGN → optic radiations → visual cortex."],["Pupillary light reflex","Retina → pretectal nuclei → Edinger–Westphal nuclei → CN III → ciliary ganglion → iris sphincter."],["Sympathetic dilation","Hypothalamus → ciliospinal center → superior cervical ganglion → iris dilator."],["LC–NE system","Contributes to arousal and pupil dynamics; pupil size alone is nonspecific."]]
];
function diagram(type){
 const base='<svg viewBox="0 0 560 340" role="img" aria-label="Conceptual '+type+' anatomical diagram"><defs><linearGradient id="ss" x1="0" x2="1"><stop stop-color="#a9c7c6"/><stop offset="1" stop-color="#ac835f"/></linearGradient></defs>';
 let g='';
 if(type==='anterior')g='<path d="M100 170 Q165 20 245 42 Q290 66 296 90 Q254 170 296 250 Q275 309 185 289 Q125 253 100 170Z" fill="#aecdd0" fill-opacity=".19" stroke="#b2d7d5" stroke-width="3"/><path d="M267 45 Q344 65 338 170 Q346 269 267 296" stroke="#b1a076" stroke-width="23" fill="none"/><ellipse cx="353" cy="170" rx="67" ry="117" fill="#a5cfc6" fill-opacity=".24" stroke="#d0ddd0" stroke-width="2"/><path d="M269 93 L287 135 M269 247 L287 206" stroke="#9a634b" stroke-width="16" stroke-linecap="round"/><path d="M250 65 L312 40 M250 276 L312 299" stroke="#c19a6a" stroke-width="15"/>';
 if(type==='tissue')g='<path d="M50 80 Q175 32 295 83 T514 73 L514 126 Q395 154 291 122 Q171 102 50 143Z" fill="#907b63" stroke="#d9b891" stroke-width="2"/><path d="M50 146 Q181 98 298 132 T514 127 L514 236 Q371 272 290 221 Q181 193 50 244Z" fill="#bd9c78" fill-opacity=".56" stroke="#d8b68d" stroke-width="2"/><path d="M50 246 Q173 196 293 231 T514 240" stroke="#8f4e44" stroke-width="20" fill="none"/><path d="M50 274 Q173 243 293 279 T514 269" stroke="#282124" stroke-width="26" fill="none"/><g stroke="#e1d5b5" stroke-width="3" fill="none"><path d="M60 169 Q180 120 292 157 T505 158"/><path d="M60 206 Q180 165 292 197 T505 186"/></g>';
 if(type==='cell')g='<path d="M60 260 Q177 164 320 249 T517 232 M60 284 Q177 189 320 272 T517 254 M60 303 Q177 210 320 293 T517 280" stroke="#baad91" stroke-width="4" fill="none"/><path d="M182 94 Q246 41 283 97 Q302 145 247 173 Q175 156 182 94Z" fill="#87644e" stroke="#ccad8b" stroke-width="3"/><path d="M199 101 L119 48 M263 100 L344 43 M225 154 L174 207" stroke="#bd9a72" stroke-width="10" stroke-linecap="round"/><g fill="#342a26"><circle cx="213" cy="112" r="9"/><circle cx="252" cy="126" r="8"/><circle cx="228" cy="145" r="7"/></g><ellipse cx="416" cy="150" rx="72" ry="24" fill="#b0a18c" stroke="#e0cfb8"/><ellipse cx="416" cy="150" rx="19" ry="9" fill="#685954"/>';
 if(type==='molecule')g='<path d="M55 80 Q89 25 125 80 T195 80 T265 80 T335 80 T405 80 T475 80" stroke="#c5ba92" stroke-width="5" fill="none"/><path d="M55 80 Q89 135 125 80 T195 80 T265 80 T335 80 T405 80 T475 80" stroke="#a4c7b6" stroke-width="5" fill="none"/><g fill="#755b46" stroke="#c69d76" stroke-width="2"><circle cx="135" cy="227" r="44"/><circle cx="222" cy="244" r="32"/><circle cx="312" cy="217" r="48"/><circle cx="403" cy="242" r="31"/></g>';
 if(type==='neural')g='<g stroke="#a2c2b2" stroke-width="7" fill="none"><path d="M55 91 L161 91 L239 137 L321 93 L495 93"/><path d="M55 120 L161 120 L239 137"/></g><g stroke="#dec09b" stroke-dasharray="10 6" stroke-width="5" fill="none"><path d="M55 244 L155 244 L263 269 L366 244 L492 244"/></g><g fill="#16201e" stroke="#ccd9ca" stroke-width="2"><circle cx="55" cy="91" r="25"/><circle cx="239" cy="137" r="22"/><circle cx="321" cy="93" r="23"/><circle cx="495" cy="93" r="25"/></g><g fill="#dcdcc9" font-size="11" font-family="monospace"><text x="34" y="45">RETINA</text><text x="214" y="186">CHIASM</text><text x="307" y="51">LGN</text><text x="467" y="48">CORTEX</text><text x="58" y="310">PLR: RETINA → PRETECTAL → EW → CN III → SPHINCTER</text></g>';
 return base+g+'</svg><p class="atlas-figure-caption">EDUCATIONAL RECONSTRUCTION · NOT TO SCALE</p>';
}
let active=0;
function boot(){
 const d=document.createElement('div');d.className='atlas-depth';d.innerHTML='<div class="atlas-nav"><span class="atlas-kicker">DEPTH MAP <small>01—08</small></span><div id="atlasSteps"></div><small class="atlas-trust">OBSERVED ≠ RECONSTRUCTED</small></div><aside id="atlasSciencePanel" class="atlas-science-panel" hidden><div class="atlas-panel-head"><span id="atlasTag"></span><button id="atlasClose" type="button" aria-label="Close">×</button></div><h2 id="atlasTitle"></h2><p id="atlasIntro"></p><div id="atlasArt"></div><div id="atlasFacts"></div><div id="atlasDetail"></div><small class="atlas-trust">YOUR EYE PHOTO DOES NOT CONTAIN MICROSCOPY, MOLECULAR OR RETINAL DATA.</small></aside>';
 document.getElementById('experience').appendChild(d);
 $('atlasSteps').innerHTML=layers.map((x,i)=>'<button type="button" data-layer="'+i+'" class="atlas-step"><b>'+String(i+1).padStart(2,'0')+'</b><span>'+x[0]+'</span></button>').join('');
 d.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>activate(+b.dataset.layer));
 $('atlasClose').onclick=()=>$('atlasSciencePanel').hidden=true;
 setActive(0);
}
function setActive(i){active=i;document.querySelectorAll('.atlas-step').forEach((b,j)=>b.classList.toggle('selected',j===i))}
function activate(i){
 setActive(i);let x=layers[i];$('atlasSciencePanel').hidden=false;$('atlasTag').textContent='IRISPECTRA / '+x[1]+' / '+x[2];$('atlasTitle').textContent=x[0];$('atlasIntro').textContent=x[4];
 $('atlasArt').innerHTML=['anterior','tissue','cell','molecule','neural'].includes(x[5])?diagram(x[5]):'<div class="atlas-live">◉<small>INTERACTIVE 3D ANATOMY<br>SCENE BEHIND PANEL</small></div>';
 $('atlasFacts').innerHTML=facts[i].map((f,j)=>'<button type="button" data-fact="'+j+'" class="atlas-fact"><b>'+String(j+1).padStart(2,'0')+'</b>'+f[0]+' <span>↗</span></button>').join('');
 document.querySelectorAll('[data-fact]').forEach(b=>b.onclick=()=>showFact(i,+b.dataset.fact));
 document.querySelector('.atlas-journey-nav')?.remove();
 if(i>=3&&i<=5){
  const nav=document.createElement('div');nav.className='atlas-journey-nav';
  nav.innerHTML='<button type="button" id="scienceBack">← PREVIOUS SCALE</button><button type="button" id="scienceNext">'+(i===5?'RETURN TO IRIS ↗':'ENTER '+layers[i+1][0]+' →')+'</button>';
  document.getElementById('atlasDetail').after(nav);
  nav.querySelector('#scienceBack').onclick=()=>activate(i===3?1:i-1);
  nav.querySelector('#scienceNext').onclick=()=>activate(i===5?1:i+1);
 }else{document.querySelector('.atlas-journey-nav')?.remove()}

 showFact(i,0);
 if(i===0)document.getElementById('resetBtn')?.click();
 if(i===1){document.getElementById('enterBtn')?.click(); if(!document.getElementById('anatomyBtn')?.classList.contains('active'))document.getElementById('anatomyBtn')?.click()}
 if(i===6)document.getElementById('rearBtn')?.click();
}
function showFact(i,j){document.querySelectorAll('.atlas-fact').forEach((b,k)=>b.classList.toggle('selected',j===k));const x=facts[i][j];$('atlasDetail').innerHTML='<strong>'+x[0]+'</strong><p>'+x[1]+'</p>'}
window.IrispectraScience={activate,advanceFromCrypt(){activate(3);document.getElementById('atlasSciencePanel')?.classList.add('science-journey');},next(){activate(Math.min(7,active+1))},previous(){activate(Math.max(0,active-1))}};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();