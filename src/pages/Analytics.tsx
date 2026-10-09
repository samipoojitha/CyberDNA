import {useState} from 'react';
import {Bar,BarChart,CartesianGrid,Cell,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Info} from 'lucide-react';
import {useApp} from '../store';
import {Card,COL,inp,tt} from '../components/ui';
import BaselineChart from '../components/BaselineChart';
import {series} from '../data/mock';
export default function Analytics(){
  const {users,events,alerts}=useApp();const [uid,setUid]=useState(users[0].id);
  const extra=events.filter(e=>e.simulated&&e.cls==='suspicious').length;
  const byUser=users.map(u=>({u:u.id,score:Math.max(0,...events.filter(e=>e.user===u.id).map(e=>e.score))}));
  const types=Object.entries(alerts.reduce<Record<string,number>>((m,a)=>({...m,[a.type]:(m[a.type]??0)+1}),{})).map(([t,c])=>({t,c}));
  const fresh=events.filter(e=>!users.find(u=>u.id===e.user)!.devices.includes(e.device)).length;
  const dev=[{name:'Known device',value:events.length-fresh},{name:'Novel device',value:fresh}];
  const axes={stroke:'#64748b',fontSize:11};
  return <div className="space-y-4"><h1 className="text-xl font-semibold text-white">Analytics</h1>
    <div className="flex gap-2 rounded-lg border border-vi/30 bg-vi/10 p-3 text-sm"><Info size={16} className="mt-0.5 shrink-0 text-violet-300"/>Anomaly detection highlights deviations from learned behavior. A flagged event is not a confirmed attack. Model accuracy metrics are intentionally not shown until real evaluation results exist.</div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Anomaly trend (30 days, demo)"><div className="h-56"><ResponsiveContainer><LineChart data={series('30d',extra)}><CartesianGrid stroke="#1f2b45" vertical={false}/><XAxis dataKey="t" {...axes} interval={6}/><YAxis {...axes}/><Tooltip {...tt}/><Line dataKey="anomalous" name="Anomalous events" stroke={COL.high} dot={false}/></LineChart></ResponsiveContainer></div></Card>
      <Card title="Highest anomaly score by user"><div className="h-56"><ResponsiveContainer><BarChart data={byUser}><CartesianGrid stroke="#1f2b45" vertical={false}/><XAxis dataKey="u" {...axes}/><YAxis domain={[0,100]} {...axes}/><Tooltip {...tt}/><Bar dataKey="score" radius={[4,4,0,0]}>{byUser.map(b=><Cell key={b.u} fill={b.score>=70?COL.high:b.score>=40?COL.medium:COL.low}/>)}</Bar></BarChart></ResponsiveContainer></div></Card>
      <Card title="Most frequent anomaly types"><div className="h-56"><ResponsiveContainer><BarChart data={types} layout="vertical" margin={{left:40}}><CartesianGrid stroke="#1f2b45" horizontal={false}/><XAxis type="number" allowDecimals={false} {...axes}/><YAxis type="category" dataKey="t" width={150} {...axes}/><Tooltip {...tt}/><Bar dataKey="c" name="Alerts" fill={COL.vi} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div></Card>
      <Card title="Device novelty"><div className="h-56"><ResponsiveContainer><PieChart><Pie data={dev} dataKey="value" innerRadius={45} outerRadius={80} stroke="none" label={({name,value})=>`${name}: ${value}`}><Cell fill={COL.cy}/><Cell fill={COL.medium}/></Pie><Tooltip {...tt}/></PieChart></ResponsiveContainer></div></Card></div>
    <Card title="Baseline vs observed activity" right={<select className={inp} value={uid} onChange={e=>setUid(e.target.value)}>{users.map(u=><option key={u.id}>{u.id}</option>)}</select>}><BaselineChart user={users.find(u=>u.id===uid)!} events={events}/></Card></div>;
}
