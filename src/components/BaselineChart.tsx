import {Bar,BarChart,CartesianGrid,Legend,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {COL,tt} from './ui';
import {User,Ev} from '../types';
import {recentFor} from '../services/detection';
export default function BaselineChart({user,events}:{user:User;events:Ev[]}){
  const r=recentFor(user,events);const data=user.baseline.map((b,h)=>({h:`${h}h`,Baseline:b,Recent:r[h]}));
  return <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid stroke="#1f2b45" vertical={false}/><XAxis dataKey="h" stroke="#64748b" fontSize={11} interval={2}/><YAxis stroke="#64748b" fontSize={11}/><Tooltip {...tt}/><Legend/><Bar dataKey="Baseline" fill={COL.vi} radius={[3,3,0,0]}/><Bar dataKey="Recent" fill={COL.cy} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>;
}
