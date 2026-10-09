import {Alert,Ev,Status,User} from '../types';
import {assess} from './detection';
import {mkEv} from '../data/mock';
const BASE=(import.meta.env.VITE_API_BASE as string|undefined)||'/api';
async function req<T>(path:string,init?:RequestInit):Promise<T|null>{
  try{const r=await fetch(BASE+path,{...init,headers:{'Content-Type':'application/json'}});return r.ok?await r.json() as T:null}catch{return null}
}
export interface SimResult{ev:Ev;alert?:Alert;source:'backend'|'demo';smsSent?:boolean|null}
export const api={
  // Future: GET /dashboard, /users, /users/{id}/profile, /events, /alerts — pages currently read the shared local store.
  ping:async()=>(await req<unknown>('/dashboard'))!==null,
  async simulate(kind:'normal'|'suspicious',users:User[]):Promise<SimResult>{
    const remote=await req<{event:Ev;alert?:Alert;smsSent?:boolean|null}>('/events/simulate',{method:'POST',body:JSON.stringify({kind})});
    if(remote)return {ev:remote.event,alert:remote.alert&&{...remote.alert,origin:'backend'},source:'backend',smsSent:remote.smsSent};
    const now=new Date().toISOString();
    if(kind==='normal'){const u=users[Math.floor(Math.random()*users.length)];
      return {ev:mkEv(u,u.devices[0],u.hours[0],0,Math.round(u.volume/7),'Session',now,true),source:'demo'}}
    const u=users.find(x=>x.id==='user_104')!;const dev=`dev_unknown_${Math.floor(Math.random()*90+10)}`;
    const ev=mkEv(u,dev,3,6,140,'Login',now,true);const a=assess(u,dev,3,6);
    return {ev,source:'demo',alert:{id:`ALT-${Date.now().toString().slice(-6)}`,eventId:ev.id,user:u.id,type:'Unusual login activity',device:dev,hour:3,failed:6,volume:140,score:ev.score,reasons:a.reasons,ts:now,status:'open',origin:'simulated'}};
  },
  patchAlert:(id:string,status:Status)=>req(`/alerts/${id}`,{method:'PATCH',body:JSON.stringify({status})}),
};
