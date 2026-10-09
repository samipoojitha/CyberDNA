import {createContext,useCallback,useContext,useEffect,useState,ReactNode} from 'react';
import {Alert,Ev,Risk,Status,User} from './types';
import {USERS,seed} from './data/mock';
import {api} from './services/api';
import {riskOf} from './services/detection';
export type Page='overview'|'profiles'|'threats'|'logs'|'analytics'|'settings';
interface Toast{id:number;m:string;k:'ok'|'warn'}
interface Ctx{users:User[];events:Ev[];alerts:Alert[];page:Page;selUser:string|null;selAlert:string|null;query:string;backend:boolean;loading:boolean;toasts:Toast[];
  go:(p:Page,o?:{user?:string;alert?:string;q?:string})=>void;toast:(m:string,k?:'ok'|'warn')=>void;
  simulate:(k:'normal'|'suspicious')=>Promise<Alert|undefined>;setStatus:(id:string,s:Status,msg:string)=>void;reset:()=>void;
  userRisk:(id:string)=>{level:Risk;score:number};lastSeen:(id:string)=>string}
const C=createContext<Ctx|null>(null);const KEY='cyberdna:v1';
const load=():{events:Ev[];alerts:Alert[]}=>{try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch{}return seed()};
export function AppProvider({children}:{children:ReactNode}){
  const [data,setData]=useState(load);const [page,setPage]=useState<Page>('overview');
  const [sel,setSel]=useState<{user:string|null;alert:string|null}>({user:null,alert:null});
  const [query,setQuery]=useState('');const [backend,setBackend]=useState(false);const [loading,setLoading]=useState(true);const [toasts,setToasts]=useState<Toast[]>([]);
  useEffect(()=>{api.ping().then(ok=>{setBackend(ok);setLoading(false)})},[]);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{/* storage unavailable */}},[data]);
  const toast=useCallback((m:string,k:'ok'|'warn'='ok')=>{const id=Date.now()+Math.random();setToasts(t=>[...t,{id,m,k}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500)},[]);
  const go:Ctx['go']=(p,o={})=>{setPage(p);setSel({user:o.user??null,alert:o.alert??null});setQuery(o.q??'')};
  const simulate:Ctx['simulate']=async k=>{const r=await api.simulate(k,USERS);
    setData(d=>({events:[r.ev,...d.events],alerts:r.alert?[r.alert,...d.alerts]:d.alerts}));
    if(r.alert){setSel(s=>({...s,alert:r.alert!.id}));
      if(r.source==='backend'&&r.notificationsSent){
        const n=r.notificationsSent;
        const sent=(['sms','email','telegram'] as const).filter(k=>n[k]===true);
        const failed=(['sms','email','telegram'] as const).filter(k=>n[k]===false);
        const msg=sent.length>0?`Alert created. Sent via: ${sent.join(', ')}.${failed.length>0?` Failed: ${failed.join(', ')}.`:''}`:`Alert created, but no notifications were sent. Check backend/.env`;
        toast(msg,'warn');
      }else{
        toast(`${r.source==='demo'?'Simulated alert':'Alert'}: ${r.alert.user} scored ${r.alert.score}/100`,'warn');
      }
    }
    else toast('Normal activity logged; risk stays low');return r.alert};
  const setStatus:Ctx['setStatus']=(id,s,msg)=>{setData(d=>({...d,alerts:d.alerts.map(a=>a.id===id?{...a,status:s}:a)}));api.patchAlert(id,s);toast(msg)};
  const reset=()=>{setData(seed());setSel({user:null,alert:null});toast('Demo data reset')};
  const userRisk=(id:string)=>{const sc=Math.max(0,...data.alerts.filter(a=>a.user===id&&(a.status==='open'||a.status==='investigating')).map(a=>a.score));return {level:riskOf(sc),score:sc}};
  const lastSeen=(id:string)=>data.events.find(e=>e.user===id)?.ts??'';
  return <C.Provider value={{users:USERS,...data,page,selUser:sel.user,selAlert:sel.alert,query,backend,loading,toasts,go,toast,simulate,setStatus,reset,userRisk,lastSeen}}>{children}</C.Provider>;
}
export const useApp=()=>{const c=useContext(C);if(!c)throw new Error('AppProvider missing');return c};
