// IRISPECTRA / Liquid Acoustics: original procedural sounds, no audio assets.
// A close water droplet, a deep water resonance and two different pressure
// transitions (enter / emerge). These are artistic, not literal cell recordings.
const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
const fract=x=>x-Math.floor(x);
const noise=(i,seed)=>fract(Math.sin(i*127.17+seed*78.233)*43758.5453)*2-1;
function bufferFor(ctx,seconds,channels=2){
 const sampleRate=Math.min(ctx.sampleRate,24000);
 const frames=Math.max(32,Math.round(seconds*sampleRate));
 return {buffer:ctx.createBuffer(channels,frames,sampleRate),sampleRate,frames};
}
export function createLiquidBuffers(ctx){
 const drops=[];
 for(let variant=0;variant<4;variant++){
  const seconds=[.72,.94,1.18,.81][variant];
  const {buffer,sampleRate,frames}=bufferFor(ctx,seconds);
  const fundamental=[175,225,145,275][variant];
  for(let channel=0;channel<2;channel++){
   const data=buffer.getChannelData(channel);
   const offset=channel?.0007:0;
   const f=fundamental*(1+(channel?.002:-.002));
   let smoothNoise=0;
   for(let i=0;i<frames;i++){
    const t=i/sampleRate;
    const tt=Math.max(0,t-offset);
    const attack=1-Math.exp(-tt*185);
    const decay=Math.exp(-tt*(variant===2?4.0:5.6));
    // Chirped resonant bubble: the initial high curvature relaxes quickly.
    const phase=2*Math.PI*f*(tt+.66*(1-Math.exp(-tt*15))/15);
    const body=Math.sin(phase)*attack*decay;
    const undertone=Math.sin(2*Math.PI*f*.53*tt+.4)*Math.exp(-tt*6.2);
    smoothNoise=smoothNoise*.69+noise(i,variant+channel*11)*.31;
    const contact=smoothNoise*Math.exp(-tt*120)*(1-Math.exp(-tt*440));
    const tail=.13*Math.sin(phase*1.27+.5)*Math.exp(-tt*11.5);
    const fade=Math.min(1,(seconds-t)*46);
    data[i]=bound((.65*body+.12*undertone+.15*contact+.08*tail)*Math.max(0,fade),-.88,.88);
   }
  }
  drops.push(buffer);
 }
 const pressure={};
 for(const direction of ['enter','emerge']){
  const seconds=2.8;
  const {buffer,sampleRate,frames}=bufferFor(ctx,seconds);
  for(let channel=0;channel<2;channel++){
   const data=buffer.getChannelData(channel);
   let lowNoise=0,subNoise=0;
   for(let i=0;i<frames;i++){
    const t=i/sampleRate,u=t/seconds;
    const swell=Math.pow(Math.sin(Math.PI*u),1.6);
    const eased=u*u*(3-2*u);
    lowNoise=lowNoise*.973+noise(i,34+channel*13)*.027;
    subNoise=subNoise*.996+noise(i,64+channel*17)*.004;
    // A gradual acoustic pressure change, not a synthetic riser.
    const f=direction==='enter'?76-27*eased:51+39*eased;
    const phase=2*Math.PI*(direction==='enter'?(76*t-27*t*u*.48):(51*t+39*t*u*.49));
    const low=.33*Math.sin(phase+channel*.09)+.13*Math.sin(phase*.51);
    const current=(lowNoise*.62+subNoise*.16)*(.82+.18*Math.cos(u*Math.PI*2+channel*.22));
    data[i]=bound((low*.65+current)*swell*.54,-.85,.85);
   }
  }
  pressure[direction]=buffer;
 }
 return {drops,pressure};
}
