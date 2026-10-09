import {Legend,PolarAngleAxis,PolarGrid,Radar,RadarChart,ResponsiveContainer} from 'recharts';
import {ArrowLeft,Clock,Laptop,Timer,Gauge} from 'lucide-react';
import {useApp} from '../store';
import {Avatar,Btn,Card,COL,fmt,RiskBadge} from '../components/ui';
import BaselineChart from '../components/BaselineChart';
import {fmtH,inWindow} from '../services/detection';
export default function Profiles(){
  const {users,events,selUser,go,userRisk,lastSeen}=useApp();
  const u=users.find(x=>x.id===selUser);
  if(!u)return <div className="space-y-4"><h1 className="text-xl font-semibold text-white">Behavioral Profiles</h1>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{users.map(x=>{const r=userRisk(x.id);return <button key={x.id} onClick={()=>go('profiles',{user:x.id})} className="text-left"><Card className="h-full">
      <div className="flex items-center gap-3"><Avatar id={x.id}/><div className="flex-1"><div className="font-medium text-white">{x.id}</div><div className="text-xs text-slate-500">Last activity {fmt(lastSeen(x.id))}</div></div><RiskBadge level={r.level}/></div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><dt className="text-slate-500">Devices</dt><dd>{x.devices.length}</dd><dt className="text-slate-500">Login hours</dt><dd>{fmtH(x.hours[0])}–{fmtH(x.hours[1])}</dd><dt className="text-slate-500">Avg session</dt><dd>{x.avgSession} min</dd><dt className="text-slate-500">Activity/day</dt><dd>{x.volume} events</dd></dl></Card></button>})}</div></div>;
  const mine=events.filter(e=>e.user===u.id);const r=userRisk(u.id);const n=Math.max(1,mine.length);
  const dna=[{k:'Schedule regularity',v:Math.round(100*mine.filter(e=>inWindow(u,e.hour)).length/n)},{k:'Device stability',v:Math.round(100*mine.filter(e=>u.devices.includes(e.device)).length/n)},{k:'Auth cleanliness',v:Math.round(100*mine.filter(e=>e.failed<2).length/n)},{k:'Session consistency',v:Math.min(100,Math.round(u.avgSession*1.6))},{k:'Volume stability',v:Math.round(100*mine.filter(e=>e.volume<u.volume/3).length/n)}];
  return <div className="space-y-4"><Btn onClick={()=>go('profiles')}><ArrowLeft size={14}/>All profiles</Btn>
    <div className="flex items-center gap-3"><Avatar id={u.id}/><h1 className="text-xl font-semibold text-white">{u.id}</h1><RiskBadge level={r.level} label={`${r.level.toUpperCase()} · ${r.score}`}/></div>
    <div className="grid gap-4 lg:grid-cols-2"><Card title="Baseline vs recent activity (events per hour)"><BaselineChart user={u} events={events}/></Card>
      <Card title="Behavioral DNA"><div className="h-52"><ResponsiveContainer><RadarChart data={dna}><PolarGrid stroke="#1f2b45"/><PolarAngleAxis dataKey="k" tick={{fill:'#94a3b8',fontSize:11}}/><Radar name="Learned pattern" dataKey="v" stroke={COL.cy} fill={COL.cy} fillOpacity={0.25}/><Legend/></RadarChart></ResponsiveContainer></div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><span className="flex items-center gap-1"><Clock size={13}/>{fmtH(u.hours[0])}–{fmtH(u.hours[1])}</span><span className="flex items-center gap-1"><Timer size={13}/>{u.avgSession} min sessions</span><span className="flex items-center gap-1"><Gauge size={13}/>{u.volume} events/day</span><span className="flex items-center gap-1"><Laptop size={13}/>{u.devices.join(', ')}</span></div>
        <p className="mt-3 text-[11px] text-slate-500">Behavioral DNA summarizes account activity patterns only. It does not identify a person's real-world identity.</p></Card></div></div>;
}
