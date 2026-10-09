import {useEffect,useMemo,useState} from 'react';
import {Play,ShieldAlert} from 'lucide-react';
import {useApp} from '../store';
import {Btn,Card,Empty,fmt,inp,Pager,RiskBadge,Th} from '../components/ui';
import {fmtH,riskOf} from '../services/detection';
export default function Logs(){
  const {events,users,simulate,query}=useApp();
  const [q,setQ]=useState(query);const [sev,setSev]=useState('all');const [usr,setUsr]=useState('all');const [cat,setCat]=useState('all');const [from,setFrom]=useState('');const [to,setTo]=useState('');const [pg,setPg]=useState(1);
  useEffect(()=>setQ(query),[query]);
  const cats=[...new Set(events.map(e=>e.cat))];
  const rows=useMemo(()=>events.filter(e=>(sev==='all'||riskOf(e.score)===sev)&&(usr==='all'||e.user===usr)&&(cat==='all'||e.cat===cat)&&(!from||e.ts.slice(0,10)>=from)&&(!to||e.ts.slice(0,10)<=to)&&(e.user+e.device+e.cat).toLowerCase().includes(q.toLowerCase())),[events,q,sev,usr,cat,from,to]);
  const pages=Math.max(1,Math.ceil(rows.length/10));const p=Math.min(pg,pages);
  const S=(v:string,set:(s:string)=>void,opts:string[],label:string)=><select className={inp} value={v} onChange={e=>{set(e.target.value);setPg(1)}}><option value="all">{label}</option>{opts.map(o=><option key={o}>{o}</option>)}</select>;
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-semibold text-white">Activity Logs</h1>
    <div className="flex gap-2"><Btn onClick={()=>simulate('normal')}><Play size={14}/>Simulate Normal Activity</Btn><Btn v="d" onClick={()=>simulate('suspicious')}><ShieldAlert size={14}/>Simulate Suspicious Activity</Btn></div></div>
    <Card><div className="mb-3 flex flex-wrap gap-2"><input className={inp} placeholder="Search user, device, category" value={q} onChange={e=>{setQ(e.target.value);setPg(1)}}/>{S(sev,setSev,['low','medium','high'],'All severities')}{S(usr,setUsr,users.map(u=>u.id),'All users')}{S(cat,setCat,cats,'All categories')}
      <input type="date" className={inp} value={from} onChange={e=>{setFrom(e.target.value);setPg(1)}} aria-label="From"/><input type="date" className={inp} value={to} onChange={e=>{setTo(e.target.value);setPg(1)}} aria-label="To"/></div>
      {rows.length===0?<Empty text="No events match these filters"/>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><Th>Time</Th><Th>User</Th><Th>Category</Th><Th>Device</Th><Th>Login hour</Th><Th>Failed</Th><Th>Volume</Th><Th>Anomaly score</Th><Th>Class</Th></tr></thead>
        <tbody>{rows.slice((p-1)*10,p*10).map(e=><tr key={e.id} className="border-t border-line hover:bg-white/[0.03]"><td className="whitespace-nowrap px-3 py-2">{fmt(e.ts)}</td><td className="px-3 py-2 text-slate-100">{e.user}</td><td className="px-3 py-2">{e.cat}</td><td className="px-3 py-2 font-mono text-xs">{e.device}</td><td className="px-3 py-2">{fmtH(e.hour)}</td><td className="px-3 py-2">{e.failed}</td><td className="px-3 py-2">{e.volume}</td><td className="px-3 py-2"><RiskBadge level={riskOf(e.score)} label={String(e.score)}/></td><td className="px-3 py-2">{e.cls}{e.simulated&&<span className="ml-1 text-[10px] text-violet-300">(sim)</span>}</td></tr>)}</tbody></table></div>}
      <Pager page={p} pages={pages} set={setPg}/></Card></div>;
}
