// IRISPECTRA — Cinematic Acoustic Materials v8.
// Original synthesized sound, no recordings or copyrighted compositions.
// Acoustic model: diffuse pressure, flowing microtextures and gently resonant
// water contacts. This is environmental sound design, not biological audio.
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function hash(i,seed=1){
 let x=(Math.imul((i|0)+seed*137,1664525)+1013904223)|0;
 x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
 return ((x>>>0)/4294967295)*2-1;
}
function noise(t,points,seed,length){
 const u=((t/length)*points)%points;
 const i=Math.floor(u),x=u-i;
 const k=x*x*(3-2*x);
 return hash(i,seed)*(1-k)+hash((i+1)%points,seed)*k;
}
function create(ctx,length,rate=16000){
 const sr=Math.min(ctx.sampleRate,rate);
 const count=Math.round(length*sr);
 return {buffer:ctx.createBuffer(2,count,sr),sr,count};
}
const harmonic=(f,t,len,phase=0)=>Math.sin(TAU*(Math.round(f*len)/len)*t+phase);
export function createCinematicMaterials(ctx,compact=false){
 const loopLength=compact?20:32;
 const clips={};
 const f=[43.6535,65.406,87.307,130.813];
 const stems=['pressure','flow','life','space'];
 for(const name of stems){
  const {buffer,sr,count}=create(ctx,loopLength);
  for(let side=0;side<2;side++){
   const data=buffer.getChannelData(side);
   const p=side?1:-1,seed=7+side*17;
   for(let i=0;i<count;i++){
    const t=i/sr,u=t/loopLength;
    const slow=.77+.23*Math.cos(TAU*u);
    let v=0;
    if(name==='pressure'){
     // Centered low fundamentals; upper overtones drift without producing notes.
     const bottom=.24*harmonic(f[0],t,loopLength)
       +.12*harmonic(f[1],t,loopLength,1.7);
     const soft=.043*harmonic(f[2],t,loopLength,.3+p*.045)
       +.014*harmonic(f[3],t,loopLength,2+p*.22);
     v=(bottom+soft)*slow;
    }else if(name==='flow'){
     const wash=noise(t,59,seed,loopLength)*.56
       +noise(t,217,seed+6,loopLength)*.23
       +noise(t,1201,seed+12,loopLength)*.075
       +noise(t,9173,seed+19,loopLength)*.09;
     const current=.54+.32*(.5+.5*Math.cos(TAU*(u*3+side*.14)));
     v=wash*current*.32;
    }else if(name==='life'){
     // Large scale organic irregularity, no melody or constant ticking.
     const longwave=noise(t,17,seed+41,loopLength);
     const tiny=noise(t,431,seed+12,loopLength);
     const grains=noise(t,1511,seed+32,loopLength);
     const softMicro=noise(t,11003,seed+68,loopLength);
     v=(longwave*.18+tiny*.10+grains*.035+
        softMicro*.054)*(.38+.46*slow);
    }else{
     // Distant spacious "air" made of diffuse non-pitched texture.
     v=(noise(t,103,seed+81,loopLength)*.31+
       noise(t,1933,seed+24,loopLength)*.11+
       noise(t,17011,seed+55,loopLength)*.14)*(.52+.32*slow)*.36;
    }
    data[i]=clamp(v,-.7,.7);
   }
  }
  clips[name]=buffer;
 }
 // Inward and outward transitions are different pressure gestures, not reversed
 // rising/falling sine sweeps. Their energy is broad-band and highly damped.
 const movement={};
 for(const direction of ['enter','exit']){
  const duration=direction==='enter'?2.65:2.25;
  const {buffer,sr,count}=create(ctx,duration,18000);
  for(let side=0;side<2;side++){
   const data=buffer.getChannelData(side);
   let low=0,veryLow=0,mid=0;
   for(let i=0;i<count;i++){
    const t=i/sr,u=t/duration;
    const n=hash(i,73+side*31),m=hash(i,29+side*17);
    low=low*.985+n*.015;
    veryLow=veryLow*.998+n*.002;
    mid=mid*.68+m*.32;
    const envelope=Math.pow(Math.sin(Math.PI*u),1.7);
    const pressure=direction==='enter'
      ?(.30*veryLow+.34*low+.20*mid*(1-u))
      :(.32*veryLow+.24*low+.25*mid*u);
    const tailFade=Math.min(1,(duration-t)*28);
    data[i]=pressure*envelope*clamp(tailFade,0,1)*.66;
   }
  }
  movement[direction]=buffer;
 }
 // Material contacts: soft hydrophone-like, non-musical foley. The brief
 // lowpass splashes are sparse, and their pitch is NOT mapped to an atom.
 const contacts=[];
 for(let style=0;style<3;style++){
  const duration=[.42,.59,.74][style];
  const {buffer,sr,count}=create(ctx,duration,18000);
  for(let side=0;side<2;side++){
   const data=buffer.getChannelData(side);
   let liquid=0,grain=0;
   for(let i=0;i<count;i++){
    const t=i/sr;
    liquid=liquid*.945+hash(i,style*23+side*17+1)*.055;
    grain=grain*.53+hash(i,style*97+side*13+20)*.47;
    const snap=(1-Math.exp(-t*140))*Math.exp(-t*(style===1?12:17));
    const drift=(1-Math.exp(-t*44))*Math.exp(-t*(style===2?5.2:8.5));
    const fade=clamp((duration-t)*32,0,1);
    data[i]=(liquid*.56*drift+grain*.07*snap)*fade;
   }
  }
  contacts.push(buffer);
 }
 return {stems:clips,movement,contacts,loopLength};
}
