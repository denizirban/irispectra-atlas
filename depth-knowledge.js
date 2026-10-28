// Scientific micro-atlas copy. Route anatomy is an educational model, not a
// patient-specific 3D reconstruction. Iris pattern terminology uses Andrews
// (Iris & Pupillary Signs, 2008); general microscopic anatomy uses standard histology.
export const ATLAS_DEPTH={
 iris:[
 {title:"Visible iris",kicker:"SURFACE",short:"A colored, contractile aperture around the pupil.",facts:[["What is visible","Pupil, collarette, radial stromal texture and peripheral folds"],["Observe","Color, contour, orientation and relative position"]]},
 {title:"Anterior iris morphology",kicker:"STRUCTURE",short:"Crypt-like openings, stromal fibers and the irregular collarette are visible at high magnification.",facts:[["Crypt of Fuchs","A visible anterior stromal opening, often near the collarette"],["Lacuna","A historical morphology label for an apparent depression or gap; classify its visible shape"]]},
 {title:"Iris stroma",kicker:"TISSUE",short:"Loose connective tissue containing collagen fibers, blood vessels, melanocytes and fibroblasts.",facts:[["Fibers","Collagen bundles help support the iris"],["Surface depth","The 3D model is illustrative; a macro photograph cannot measure stromal depth"]]},
 {title:"Cells of the iris",kicker:"CELLULAR",short:"Melanocytes produce and contain melanin; fibroblasts help maintain the stromal matrix.",facts:[["Melanocyte","A pigment-producing dendritic cell with melanosomes"],["Fibroblast","Cell involved in collagen and extracellular-matrix maintenance"]]},
 {title:"Collagen & melanin",kicker:"MOLECULAR",short:"The fibrous matrix contains collagen; melanin is packaged in melanosomes.",facts:[["Collagen","Helical polypeptide chains assemble into a collagen triple helix"],["Melanin","A heterogeneous pigment polymer, not a single rigid molecule"]]}
 ],
 sclera:[
 {title:"Sclera",kicker:"SURFACE",short:"The tough, opaque white outer coat of the eye.",facts:[["Role","Shape and mechanical protection"],["Visible structures","Episcleral vessels over the underlying sclera"]]},
 {title:"Episcleral network",kicker:"STRUCTURE",short:"Superficial blood vessels and connective tissue cover the sclera.",facts:[["Vessels","Fine episcleral vessels can be visible"],["Surface","Moist reflections come chiefly from the tear film"]]},
 {title:"Scleral collagen",kicker:"TISSUE",short:"Interwoven collagen bundles form the dense scleral connective tissue.",facts:[["Organization","Irregularly oriented collagen fibrils"],["Contrast","Unlike the transparent cornea, scleral fibril organization scatters light"]]},
 {title:"Scleral fibroblast",kicker:"CELLULAR",short:"Fibroblasts maintain the scleral extracellular matrix.",facts:[["Cells","Fibroblasts reside among collagen bundles"],["Matrix","Collagen and proteoglycans"]]},
 {title:"Collagen hierarchy",kicker:"MOLECULAR",short:"Triple helices assemble into fibrils and larger fiber bundles.",facts:[["Major component","Type I collagen is prominent in the sclera"],["Model","Representative helix, not crystallographic atom coordinates"]]}
 ],
 retina:[
 {title:"Fundus surface",kicker:"SURFACE",short:"The posterior eye includes the optic disc, macula and retinal vessels.",facts:[["Image","This is a teaching model, not a clinical fundus photograph"],["Orientation","The retina lines the inner posterior eye"]]},
 {title:"Retinal nerve fiber layer",kicker:"STRUCTURE",short:"Ganglion-cell axons converge toward the optic disc.",facts:[["Axons","Carry retinal output toward the optic nerve"],["Disc","The optic disc lacks photoreceptors"]]},
 {title:"Retinal laminae",kicker:"TISSUE",short:"Retinal tissue comprises neuronal layers separated by synaptic plexiform layers.",facts:[["Input","Rods and cones are photoreceptors"],["Output","Ganglion cells carry processed signals to the brain"]]},
 {title:"Retinal neurons",kicker:"CELLULAR",short:"Photoreceptors, bipolar, horizontal, amacrine and ganglion cells form retinal circuits.",facts:[["Photoreceptors","Convert light into electrical signals"],["Ganglion cells","Axons form the optic nerve"]]},
 {title:"Phototransduction",kicker:"MOLECULAR",short:"Opsin proteins and retinal chromophore initiate photoreceptor signaling.",facts:[["Rhodopsin","A visual pigment in rods"],["Cascade","Light activates opsin-dependent G-protein signaling"]]}
 ],
 vessel:[
 {title:"Retinal vessel",kicker:"SURFACE",short:"Arteries and veins distribute blood within the retinal circulation.",facts:[["Observe","Branching pattern, caliber and crossings"],["Context","Visible fundus blood vessels"]]},
 {title:"Vascular wall",kicker:"STRUCTURE",short:"The inner vessel lining is formed by endothelial cells.",facts:[["Layers","Endothelium and associated supporting cells"],["Role","Separates circulating blood from surrounding retina"]]},
 {title:"Capillary environment",kicker:"TISSUE",short:"Endothelium, pericytes and basal lamina form a specialized retinal microvascular unit.",facts:[["Pericytes","Support vessel stability"],["Matrix","Basement-membrane extracellular matrix"]]},
 {title:"Endothelium & pericyte",kicker:"CELLULAR",short:"Endothelial junctions regulate the inner blood-retinal barrier.",facts:[["Endothelial cell","Forms vessel lumen boundary"],["Pericyte","Wraps portions of retinal microvessels"]]},
 {title:"Cell junctions",kicker:"MOLECULAR",short:"Tight-junction and adhesion proteins help maintain vascular barrier function.",facts:[["Examples","Claudin-5 and occludin participate in tight junctions"],["Context","This is a schematic protein-level teaching model"]]}
 ],
 nerve:[
 {title:"Optic disc",kicker:"SURFACE",short:"Retinal ganglion cell axons exit the eye at the optic nerve head.",facts:[["Disc","Axons converge at the optic disc"],["Blind spot","The disc has no rods or cones"]]},
 {title:"Nerve fiber bundles",kicker:"STRUCTURE",short:"Retinal ganglion cell axons pass through the nerve fiber layer toward the nerve head.",facts:[["Direction","From retina to optic nerve"],["Support","Glial tissue surrounds axons"]]},
 {title:"Lamina cribrosa",kicker:"TISSUE",short:"A sieve-like connective-tissue region transmits optic nerve axons out of the eye.",facts:[["Architecture","Axon bundles traverse connective-tissue pores"],["Support","Astrocytes and extracellular matrix"]]},
 {title:"Axons & glia",kicker:"CELLULAR",short:"Ganglion-cell axons transmit visual information; glial cells provide metabolic and structural support.",facts:[["Cell","Retinal ganglion neuron"],["Glia","Astrocytes and oligodendrocytes along the visual pathway"]]},
 {title:"Axonal transport",kicker:"MOLECULAR",short:"Microtubules and motor proteins transport cellular materials along axons.",facts:[["Tracks","Microtubule cytoskeleton"],["Motors","Kinesin and dynein drive directional cargo transport"]]}
 ]
};
export const MORPH_DETAILS={
 crypt:{name:"Crypt of Fuchs / crypt-like opening",short:"Opening-like pattern within the anterior iris stroma.",features:["Outline shape","Size relative to iris","Edge definition","Location near or beyond collarette"],patterns:["Rhomboid","Lancet","Black dot","Small slit"]},
 lacuna:{name:"Lacuna",short:"A visible gap or depression-like morphology, labeled using historical terminology.",features:["Major/minor axis","Contour","Orientation","Radial position"],patterns:["Leaf","Lance","Daisy-petal arrangement","Paired","Large"]},
 collarette:{name:"Collarette",short:"Irregular circular boundary between the pupillary and ciliary portions of the iris.",features:["Border shape","Pupil distance","Irregularity","Continuity"],patterns:["Irregular boundary","Prominent edge","Indentation"]},
 furrow:{name:"Contraction furrow",short:"An arc-like fold, typically seen in the more peripheral iris.",features:["Arc extent","Relative radius","Number of folds"],patterns:["Concentric arc","Peripheral circular fold"]},
 pigment:{name:"Pigment marking",short:"A localized or diffuse difference in visible iris pigmentation.",features:["Color","Area","Contrast","Distribution"],patterns:["Spot","Cluster","Diffuse"]}
};
export function getDepthInfo(route,stage,kind){
 const layer=(ATLAS_DEPTH[route]||ATLAS_DEPTH.iris)[Math.max(0,Math.min(4,stage))];
 if(route!=='iris'||stage>1||!MORPH_DETAILS[kind])return layer;
 const m=MORPH_DETAILS[kind];
 return {...layer,title:stage===1?m.name:layer.title,short:m.short,facts:[["Morphology",m.name],["Look for",m.features.slice(0,3).join(", ")]]};
}
