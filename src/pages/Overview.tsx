import {useMemo,useState} from 'react';
import {Area,AreaChart,CartesianGrid,Cell,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Users,Activity,BellRing,Flame,Search,ArrowUpDown,Play,ShieldAlert} from 'lucide-react';
import {useApp} from '../store';
import {Btn,Card,COL,Empty,fmt,inp,OriginBadge,Pager,RiskBadge,Stat,StatusBadge,Th,tt} from '../components/ui';
import {EVENT_BASE,series} from '../data/mock';
import {riskOf} from '../services/detection';
export default function Overview(){
  const {users,events,alerts,go,simulate,loading}=useApp();
  const [range,setRange]=useState<'24h'|'7d'|'30d'>('24h');
  const [q,setQ]=useState('');const [st,setSt]=useState('all');const [asc,setAsc]=useState(false);const [pg,setPg]=useState(1);
  const extra=events.filter(e=>e.simulated&&e.cls==='suspicious').length;
  const data=useMemo(()=>series(range,extra),[range,extra]);
  const pie=(['low','medium','high'] as const).map(k=>({name:k,value:events.filter(e=>riskOf(e.score)===k).length}));
  const rows=useMemo(()=>alerts.filter(a=>(st==='all'||a.status===st)&&(a.user+a.type+a.device+a.reasons.join()).toLowerCase().includes(q.toLowerCase())).sort((x,y)=>asc?x.score-y.score:y.score-x.score),[alerts,q,st,asc]);
  const pages=Math.max(1,Math.ceil(rows.length/6));const view=rows.slice((Math.min(pg,pages)-1)*6,Math.min(pg,pages)*6);
  if(loading)return <div className="py-20 text-center text-sm text-slate-500">Connecting to detection service…</div>;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-xl font-semibold text-white">Security Overview</h1><p className="text-xs text-amber-300/80">Demo data — values are simulated for presentation.</p></div>
      <div className="flex gap-2"><Btn onClick={()=>simulate('normal')}><Play size={14}/>Simulate Normal</Btn><Btn v="d" onClick={async()=>{const a=await simulate('suspicious');if(a)go('threats',{alert:a.id})}}><ShieldAlert size={14}/>Simulate Suspicious Login</Btn></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Monitored users" value={users.length} icon={<Users size={18}/>}/><Stat label="Events analyzed" value={(EVENT_BASE+events.length).toLocaleString()} icon={<Activity size={18}/>} tone="text-vi"/>
      <Stat label="Active threat alerts" value={alerts.filter(a=>a.status==='open'||a.status==='investigating').length} icon={<BellRing size={18}/>} tone="text-amber-400"/><Stat label="High-risk sessions" value={events.filter(e=>riskOf(e.score)==='high').length} icon={<Flame size={18}/>} tone="text-red-400"/></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2" title="Behavioral Activity" right={<div className="flex gap-1">{(['24h','7d','30d'] as const).map(r=><Btn key={r} v={r===range?'p':'g'} onClick={()=>setRange(r)} className="!px-2 !py-0.5 text-xs">{r}</Btn>)}</div>}>
        <div className="h-64"><ResponsiveContainer><AreaChart data={data}><CartesianGrid stroke="#1f2b45" vertical={false}/><XAxis dataKey="t" stroke="#64748b" fontSize={11} interval="preserveStartEnd"/><YAxis yAxisId="l" stroke="#64748b" fontSize={11}/><YAxis yAxisId="r" orientation="right" stroke="#64748b" fontSize={11}/><Tooltip {...tt}/>
          <Area yAxisId="l" dataKey="normal" name="Normal" stroke={COL.cy} fill={COL.cy} fillOpacity={0.12}/><Area yAxisId="r" dataKey="anomalous" name="Anomalous" stroke={COL.high} fill={COL.high} fillOpacity={0.2}/></AreaChart></ResponsiveContainer></div></Card>
      <Card title="Risk Distribution"><div className="h-64"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none" label={({name,value})=>`${name} ${value}`}>{pie.map(p=><Cell key={p.name} fill={COL[p.name]}/>)}</Pie><Tooltip {...tt}/></PieChart></ResponsiveContainer></div></Card></div>
    <Card title="Recent Security Alerts" right={<div className="flex gap-2"><div className="relative"><Search size={14} className="absolute left-2 top-2.5 text-slate-500"/><input className={`${inp} pl-7`} placeholder="Search alerts" value={q} onChange={e=>{setQ(e.target.value);setPg(1)}}/></div>
      <select className={inp} value={st} onChange={e=>{setSt(e.target.value);setPg(1)}}>{['all','open','investigating','reviewed','dismissed'].map(s=><option key={s}>{s}</option>)}</select></div>}>
      {view.length===0?<Empty text="No alerts match these filters"/>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><Th>User</Th><Th>Event</Th><Th>Device</Th><Th onClick={()=>setAsc(!asc)}><span className="inline-flex items-center gap-1">Risk<ArrowUpDown size={11}/></span></Th><Th>Reason</Th><Th>Time</Th><Th>Status</Th></tr></thead>
        <tbody>{view.map(a=><tr key={a.id} onClick={()=>go('threats',{alert:a.id})} className="cursor-pointer border-t border-line hover:bg-white/[0.03]"><td className="px-3 py-2 text-slate-100">{a.user}</td><td className="px-3 py-2">{a.type} <OriginBadge o={a.origin}/></td><td className="px-3 py-2 font-mono text-xs">{a.device}</td>
          <td className="px-3 py-2"><RiskBadge level={riskOf(a.score)} label={`${a.score}`}/></td><td className="max-w-[260px] truncate px-3 py-2 text-slate-400" title={a.reasons.join(' ')}>{a.reasons[0]}</td><td className="whitespace-nowrap px-3 py-2">{fmt(a.ts)}</td><td className="px-3 py-2"><StatusBadge s={a.status}/></td></tr>)}</tbody></table></div>}
      <Pager page={Math.min(pg,pages)} pages={pages} set={setPg}/></Card></div>;
}
