// Anatomically informed labels for procedural educational scenes. Not diagnostic.
const guide={
 crypt:{
  2:[['Crypt-like stromal opening','Visible anterior stromal gap','An irregular opening'],['Stromal collagen bundle','Structural matrix fibers','Interwoven radial fibers'],['Stromal vascular channel','Blood-carrying channel in the stroma','Endothelial wall']],
  3:[['Fibroblast','Maintains extracellular matrix','Elongated cell with extensions'],['Fibroblast process','Fibroblast cellular extension','Fine branching processes']],
  4:[['Mitochondrion','Energy-producing organelle','Folded inner cristae'],['Cell nucleus','Contains genomic DNA','Rounded nucleus with nucleolus']],
  5:[['Collagen triple-helical chain','One polypeptide chain within collagen','Three intertwined protein strands']],
  6:[['Atom: C','Carbon in a representative peptide fragment','Schematic atom-and-bond geometry']]},
 pigment:{
  2:[['Stromal melanocyte','Produces melanin in the iris','Cells within pigmented stroma'],['Pigment granule','Pigment-bearing particulate material','Uneven pigment dots']],
  3:[['Melanocyte','Dendritic pigment-producing cell','Branching cell extensions'],['Melanocyte dendrite','Extension of a melanocyte','Slender dendritic processes']],
  4:[['Melanosome','Pigment-containing organelle','Dense granules within a membrane'],['Golgi apparatus','Processes and sorts cell products','Stacked internal cisternae']],
  5:[['Tyrosinase enzyme surface (schematic)','Enzyme involved in melanogenesis','Illustrative enzyme surface'],['Melanin polymer motif','Heterogeneous pigment-derived subunits','Simplified polymer motifs']],
  6:[['Atom: N','Nitrogen in a representative pigment fragment','Schematic atom-and-bond geometry']]},
 muscle:{
  2:[['Iris sphincter smooth muscle','Constricts the pupil','Circumferential fibers'],['Iris dilator muscle','Dilates the pupil','Radial contractile fibers']],
  3:[['Iris smooth muscle cell','Cell containing actin and myosin','Elongated contractile cell'],['Contractile actomyosin','Filaments producing contractile force','Parallel intracellular strands']],
  4:[['Actin filament','Contractile cytoskeletal element','Twisting filament structure'],['Sarcoplasmic reticulum membrane','Calcium-regulating membrane system','Intracellular folded membranes']],
  5:[['Myosin motor domain','Molecular force-generating unit','Stylized motor heads'],['Calcium ion (Ca²⁺)','Ion involved in contraction signaling','Floating Ca²⁺ ions']],
  6:[['Calcium ion Ca²⁺','Single charged calcium ion','Not a bonded molecule']]},
 neural:{
  2:[['Rod photoreceptor','Low-light receptor in the retina','Rod-shaped outer segment'],['Retinal ganglion cell','Axon projects toward the optic nerve','Branching cell body and axon']],
  3:[['Bipolar neuron','Relays visual signals in retina','Intermediary retinal neuron'],['Müller glial cell','Retinal support cell','Long radial morphology']],
  4:[['Photoreceptor outer-segment disc','Membrane bearing visual pigments','Stacked outer-segment discs'],['Synaptic terminal','Signaling compartment of a neuron','Presynaptic ending']],
  5:[['Rhodopsin membrane-spanning helix (schematic)','Light-sensitive GPCR helix','Conceptual protein helix'],['Retinal chromophore (schematic)','Light-responsive opsin cofactor','Stylized chromophore']],
  6:[['Atom: C','Carbon in a representative molecular fragment','Schematic atom-and-bond geometry']]}
};
export function nodesAt(route,stage){return (guide[route]?.[stage]||[]).map(([role,roleText,visible])=>({role,roleText,visible}));}
export function describeMicroRole(role,route,stage){
 const key=String(role||'Structure');
 return nodesAt(route,stage).find(n=>n.role===key||key.startsWith(n.role))||{
  role:key,roleText:'An illustrative component of this biological scale.',
  visible:'A procedural teaching model, not a patient-derived scan or computed molecular structure.'};
}
