import {User,Ev,Alert,Status} from '../types';
import {assess} from '../services/detection';
const prof=(a:number,b:number,v:number)=>Array.from({length:24},(_,h)=>{const w=a<=b?h>=a&&h<=b:h>=a||h<=b;return w?Math.round(v*(0.5+0.5*Math.abs(Math.sin(h*0.7)))):Math.round(v*0.03)});
const mk=(id:string,devices:string[],hours:[number,number],avgSession:number,volume:number,seed:number):User=>{const baseline=prof(hours[0],hours[1],volume/8);return {id,devices,hours,avgSession,volume,baseline,recent:baseline.map((v,i)=>Math.max(0,v+((i*7+seed)%5)-2))}};
export const USERS:User[]=[mk('user_101',['dev_lap_101','dev_ph_101'],[8,17],42,180,1),mk('user_102',['dev_lap_102'],[9,18],35,150,2),mk('user_103',['dev_wks_103','dev_ph_103'],[7,16],55,220,3),mk('user_104',['dev_lap_104','dev_ph_104'],[9,17],38,160,4),mk('user_105',['dev_lap_105'],[22,6],61,130,0),mk('user_106',['dev_wks_106','dev_lap_106'],[10,19],29,140,2)];
export const EVENT_BASE=12400; // historical events assumed already analyzed (demo)
let n=0;
export const mkEv=(u:User,device:string,hour:number,failed:number,volume:number,cat:string,ts:string,simulated=false):Ev=>{
  const a=assess(u,device,hour,failed);const score=Math.min(100,a.score+(a.score?0:(u.id.charCodeAt(6)+hour+n)%11));
  return {id:`ev_${Date.now().toString(36)}${++n}`,ts,user:u.id,cat,device,hour,failed,volume,score,cls:score>=40?'suspicious':'normal',simulated};
};
const ago=(m:number)=>new Date(Date.now()-m*60000).toISOString();
const cats=['Login','Device check','Session','Password reset','File access'];
export function seed(){
  const events:Ev[]=[];const alerts:Alert[]=[];
  const A:{u:string;type:string;d:string;h:number;f:number;m:number;s:Status}[]=[
    {u:'user_104',type:'Unusual login activity',d:'dev_unknown_77',h:3,f:6,m:35,s:'open'},
    {u:'user_106',type:'Unrecognized device + off-hours',d:'dev_unk_31',h:4,f:3,m:190,s:'open'},
    {u:'user_103',type:'Repeated failed logins',d:'dev_wks_103',h:23,f:8,m:420,s:'investigating'},
    {u:'user_105',type:'Off-hours activity',d:'dev_lap_105',h:12,f:3,m:760,s:'open'},
    {u:'user_102',type:'New device login',d:'dev_new_12',h:14,f:2,m:1500,s:'dismissed'},
    {u:'user_101',type:'New device login',d:'dev_new_03',h:10,f:0,m:2600,s:'reviewed'}];
  A.forEach((x,i)=>{const u=USERS.find(k=>k.id===x.u)!;const ts=ago(x.m);const ev=mkEv(u,x.d,x.h,x.f,120,'Login',ts);events.push(ev);const a=assess(u,x.d,x.h,x.f);
    alerts.push({id:`ALT-${1000+i}`,eventId:ev.id,user:x.u,type:x.type,device:x.d,hour:x.h,failed:x.f,volume:120,score:ev.score,reasons:a.reasons.length?a.reasons:['Activity deviates from the learned baseline.'],ts,status:x.s,origin:'seed'})});
  for(let i=0;i<60;i++){const u=USERS[i%6];const [a,b]=u.hours;const span=((b-a+24)%24)+1;
    events.push(mkEv(u,u.devices[i%u.devices.length],(a+(i*5)%span)%24,i%9===0?1:0,Math.round(u.volume/(6+i%4)),cats[i%5],ago(30+i*47)))}
  events.sort((x,y)=>y.ts.localeCompare(x.ts));return {events,alerts};
}
export const series=(r:string,extra:number)=>{const n2=r==='24h'?24:r==='7d'?7:30;
  return Array.from({length:n2},(_,i)=>{const normal=Math.round((r==='24h'?420:9800)*(0.7+0.3*Math.abs(Math.sin(i*0.9))));
    return {t:i===n2-1?'now':r==='24h'?`${i}:00`:`${n2-1-i}d ago`,normal,anomalous:Math.round(normal*0.012*(1+Math.abs(Math.cos(i*1.7))))+(i===n2-1?extra:0)}})};
