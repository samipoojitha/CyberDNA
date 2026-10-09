import {Risk,User,Ev} from '../types';
// Local, rule-based stand-in for the future FastAPI detector. Not a trained model.
export const riskOf=(s:number):Risk=>s>=70?'high':s>=40?'medium':'low';
export const fmtH=(h:number)=>`${String(h).padStart(2,'0')}:00`;
export const inWindow=(u:User,h:number)=>{const [a,b]=u.hours;return a<=b?h>=a&&h<=b:h>=a||h<=b};
export function assess(u:User,device:string,hour:number,failed:number){
  const reasons:string[]=[];let s=0;
  if(!u.devices.includes(device)){s+=35;reasons.push('The device has not been observed before for this user.')}
  if(!inWindow(u,hour)){s+=28;reasons.push(`Login at ${fmtH(hour)} occurred outside the normal activity window (${fmtH(u.hours[0])}–${fmtH(u.hours[1])}).`)}
  s+=Math.min(failed*5,28);
  if(failed>=2)reasons.push(`${failed} failed authentication attempts occurred (typical: 0–1).`);
  return {score:Math.min(100,s),reasons};
}
export const recommend=(r:Risk)=>r==='high'?'Verify with the account owner through a trusted channel and consider requiring re-authentication. (Manual step: this demo enforces nothing.)':r==='medium'?'Review recent sessions for this user and watch for repeat behavior.':'No action needed; continue monitoring.';
export const recentFor=(u:User,events:Ev[])=>{const r=[...u.recent];events.filter(e=>e.user===u.id&&e.cls==='suspicious').forEach(e=>{r[e.hour]+=Math.round(e.volume/10)});return r};
