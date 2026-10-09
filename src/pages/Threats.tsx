import {useState} from 'react';
import {CheckCircle2,Search,XCircle} from 'lucide-react';
import {useApp} from '../store';
import {Btn,Card,Empty,fmt,inp,OriginBadge,RiskBadge,StatusBadge,COL} from '../components/ui';
import {fmtH,recommend,riskOf} from '../services/detection';
export default function Threats(){
  const {alerts,users,selAlert,go,setStatus}=useApp();const [f,setF]=useState('all');
  const list=alerts.filter(a=>f==='all'||a.status===f).sort((a,b)=>b.ts.localeCompare(a.ts));
  const cur=alerts.find(a=>a.id===selAlert)??list[0];
  const u=users.find(x=>x.id===cur?.user);
  return <div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-xl font-semibold text-white">Threat Detection</h1><select className={inp} value={f} onChange={e=>setF(e.target.value)}>{['all','open','investigating','reviewed','dismissed'].map(s=><option key={s}>{s}</option>)}</select></div>
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="max-h-[70vh] overflow-y-auto !p-2">{list.length===0?<Empty text="No alerts"/>:list.map(a=><button key={a.id} onClick={()=>go('threats',{alert:a.id})} className={`mb-1 w-full rounded-lg border p-3 text-left transition ${a.id===cur?.id?'border-cy/50 bg-cy/5':'border-transparent hover:bg-white/[0.04]'}`}>
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-white">{a.user}</span><RiskBadge level={riskOf(a.score)} label={`${a.score}`}/></div><div className="mt-1 text-xs text-slate-400">{a.type}</div><div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">{fmt(a.ts)}<StatusBadge s={a.status}/></div></button>)}</Card>
      {cur&&u?<Card><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-white">{cur.type}</h2><OriginBadge o={cur.origin}/></div><p className="text-xs text-slate-500">{cur.id} · {cur.user} · {cur.device} · {fmt(cur.ts)}</p></div><StatusBadge s={cur.status}/></div>
        <div className="mt-4 flex items-center gap-4"><div className="text-5xl font-bold" style={{color:COL[riskOf(cur.score)]}}>{cur.score}<span className="text-lg text-slate-500">/100</span></div><div className="flex-1"><RiskBadge level={riskOf(cur.score)} label={`${riskOf(cur.score).toUpperCase()} SEVERITY`}/><div className="mt-2 h-2 rounded-full bg-line"><div className="h-2 rounded-full transition-all" style={{width:`${cur.score}%`,background:COL[riskOf(cur.score)]}}/></div></div></div>
        <h3 className="mt-5 text-sm font-semibold text-slate-100">Why this was flagged</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm">{cur.reasons.map(r=><li key={r}>{r}</li>)}</ul>
        <h3 className="mt-5 text-sm font-semibold text-slate-100">Observed vs baseline</h3>
        <div className="mt-2 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500"><th className="py-1">Signal</th><th>Observed</th><th>Normal baseline</th></tr></thead><tbody>
          {[['Device',cur.device,u.devices.join(', ')],['Login time',fmtH(cur.hour),`${fmtH(u.hours[0])}–${fmtH(u.hours[1])}`],['Failed attempts',String(cur.failed),'0–1'],['Activity volume',`${cur.volume} events`,`~${u.volume} events/day`]].map(r=><tr key={r[0]} className="border-t border-line"><td className="py-2 text-slate-400">{r[0]}</td><td className="text-slate-100">{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
        <div className="mt-5 rounded-lg border border-line bg-bg p-3 text-sm"><b className="text-cy">Recommended next action: </b>{recommend(riskOf(cur.score))}</div>
        <div className="mt-4 flex flex-wrap gap-2"><Btn v="p" disabled={cur.status==='investigating'} onClick={()=>setStatus(cur.id,'investigating','Investigation started (demo state only)')}><Search size={14}/>Investigate</Btn>
          <Btn disabled={cur.status==='reviewed'} onClick={()=>setStatus(cur.id,'reviewed','Alert marked as reviewed')}><CheckCircle2 size={14}/>Mark as Reviewed</Btn>
          <Btn v="d" disabled={cur.status==='dismissed'} onClick={()=>setStatus(cur.id,'dismissed','Alert dismissed')}><XCircle size={14}/>Dismiss Alert</Btn></div>
        <p className="mt-3 text-[11px] text-slate-500">These actions only change local demo state. No account is blocked or modified.</p></Card>:<Card><Empty text="Select an alert to investigate"/></Card>}</div></div>;
}
