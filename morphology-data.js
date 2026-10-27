// Source-derived morphology vocabulary; not a medical diagnostic system.
// Source: John Andrews, Iris & Pupillary Signs, 3rd ed. Corona Books (2008).
// Pages refer to print page numbers; PDF location can be offset.
// No book diagrams, passages or tables are reproduced.
export const MORPHOLOGY={
  crypt:{name:"Crypt / small dark opening",patterns:["Rhomboid","Lancet","Black dot","Small slit"],measures:["Radial position","Angular sector","Visible major axis","Visible minor axis","Area","Orientation"],note:"A small dark feature with a defined contour on the anterior iris. Pattern labels describe appearance, not illness.",source:"Iris & Pupillary Signs (2008), Crypts & Defects, p.57 (PDF p.71)",status:"Morphology term; images need independent visual identification"},
  collarette:{name:"Collarette",patterns:["Irregular boundary","Prominent edge","Indentation"],measures:["Relative radius","Border continuity","Angular sector"],note:"An irregular anatomical landmark separating pupillary and ciliary zones.",source:"Iris & Pupillary Signs (2008), Landmarks in the Iris (PDF p.9) and Iris Anatomy chapter",status:"Anatomical landmark"},
  furrow:{name:"Contraction furrow",patterns:["Concentric arc","Peripheral circular fold"],measures:["Arc length (angle)","Relative radius","Visible count"],note:"A peripheral fold or curved marking of the anterior iris surface.",source:"Iris & Pupillary Signs (2008), Contraction Furrows, ch. starting p.73",status:"Morphology term"},
  radial:{name:"Radial texture / furrow",patterns:["Radial streak","Radial furrow"],measures:["Orientation","Radial extent","Sector"],note:"A radial appearance in the iris stroma; visible patterns do not establish tissue depth.",source:"Iris & Pupillary Signs (2008), Iris Anatomy / Miscellaneous Signs",status:"Morphology term"},
  limbal:{name:"Limbal region",patterns:["Peripheral iris boundary"],measures:["Relative radius","Limbal continuity"],note:"Peripheral boundary near the iris root as seen in a frontal illustration.",source:"Iris & Pupillary Signs (2008), Landmarks (PDF p.9)",status:"Anatomical landmark"},
  pupil:{name:"Pupil / inner pupillary border",patterns:["Circular contour","Irregular contour"],measures:["Pupil-to-iris ratio","Circularity","Center offset"],note:"The pupil aperture and visible surrounding pigment border. A photo alone does not measure PLR dynamics.",source:"Iris & Pupillary Signs (2008), Inner Pupillary Border, ch. starting p.159",status:"Anatomical landmark"},
  lacuna:{name:"Lacuna",patterns:["Leaf","Lance","Daisy-petal arrangement","Paired","Large"],measures:["Area","Major/minor axis","Shape factor","Relative location"],note:"Historical appearance categories are retained as morphological vocabulary, not disease classifications.",source:"Iris & Pupillary Signs (2008), Differentiation of Lacunae, pp.43–54",status:"Historical taxonomy; not diagnostic"},
  pigment:{name:"Pigment marking",patterns:["Spot","Cluster","Diffuse"],measures:["Area","Color reference","Relative location"],note:"Visible pigmentation only. Avoid interpretation of systemic function.",source:"Iris & Pupillary Signs (2008), Development & Meaning of Pigmentation, ch. starting p.59",status:"Visible morphology"},
  mammillation:{name:"Iris mammillation",patterns:["Nodular surface elevations"],measures:["Distribution","Count","Apparent size"],note:"Visible nodules require suitable photography; no depth is measured from a single photo.",source:"Iris & Pupillary Signs (2008), Mammilations, ch. starting p.83",status:"Morphology term"},
  brushfield:{name:"Brushfield spot",patterns:["Peripheral pale spot"],measures:["Count","Distribution","Relative radius"],note:"Spot appearances are not inferred to be disease markers by this atlas.",source:"Iris & Pupillary Signs (2008), Brushfield's Spots, ch. starting p.79",status:"Morphology term"}
};
export function polarRegion(radius,angle){
 const r=Math.max(0,Math.min(1,radius/.63));
 // Three.js angle=0 points right (3 o'clock); negative Y is the screen bottom after projection.
 const hourIndex=(Math.round(3-angle*6/Math.PI)%12+12)%12;
 const clock=hourIndex===0?12:hourIndex;
 const zone=radius<.29?"Pupillary zone / collarette":radius<.44?"Inner ciliary zone":radius<.53?"Middle ciliary zone":"Peripheral ciliary zone";
 const ring=radius<.29?1:radius<.44?2:3;
 return {clock,sector:clock,zone,ring,polarId:"R"+ring+"-S"+String(clock).padStart(2,"0"),rPercent:Math.round(r*100),angleDeg:Math.round(((angle*180/Math.PI)%360+360)%360)};
}
