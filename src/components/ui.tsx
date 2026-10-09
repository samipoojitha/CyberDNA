import {ReactNode,ButtonHTMLAttributes} from 'react';
import {Risk,Status,Origin} from '../types';
import {Inbox} from 'lucide-react';
export const COL={cy:'#22d3ee',vi:'#8b5cf6',high:'#ef4444',medium:'#f59e0b',low:'#10b981'};
export const tt={contentStyle:{background:'#0a101d',border:'1px solid #1f2b45',borderRadius:8,fontSize:12},labelStyle:{color:'#94a3b8'}};
export const inp='rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-cy/60';
export const fmt=(iso:string)=>iso?new Date(iso).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
export const Card=({title,right,children,className=''}:{title?:string;right?:ReactNode;children:ReactNode;className?:string})=>(
  <section className={`rounded-xl border border-line bg-card p-4 transition-colors hover:border-slate-600/60 ${className}`}>
    {title&&<div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-100">{title}</h3>{right}</div>}{children}</section>);
const RC:Record<Risk,string>={low:'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',medium:'text-amber-400 bg-amber-400/10 border-amber-400/30',high:'text-red-400 bg-red-400/10 border-red-400/30'};
const pill='inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium';
export const RiskBadge=({level,label}:{level:Risk;label?:string})=><span className={`${pill} ${RC[level]}`}>{label??level.toUpperCase()}</span>;
const SC:Record<Status,string>={open:'text-red-300 border-red-400/30',investigating:'text-cyan-300 border-cy/40',reviewed:'text-emerald-300 border-emerald-400/30',dismissed:'text-slate-400 border-slate-600'};
export const StatusBadge=({s}:{s:Status})=><span className={`${pill} ${SC[s]}`}>{s}</span>;
export const OriginBadge=({o}:{o:Origin})=><span className={`${pill} ${o==='backend'?'border-cy/40 text-cyan-300':o==='simulated'?'border-vi/50 text-violet-300':'border-slate-600 text-slate-400'}`}>{o==='backend'?'Backend':o==='simulated'?'Simulated':'Demo'}</span>;
export function Btn({v='g',className='',...p}:ButtonHTMLAttributes<HTMLButtonElement>&{v?:'p'|'g'|'d'}){
  const c=v==='p'?'bg-cy/90 text-slate-900 hover:bg-cy':v==='d'?'border border-red-400/40 text-red-300 hover:bg-red-400/10':'border border-line text-slate-200 hover:border-cy/50';
  return <button {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${c} ${className}`}/>;
}
export const Stat=({label,value,icon,tone='text-cy'}:{label:string;value:string|number;icon:ReactNode;tone?:string})=>(
  <Card><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wide text-slate-400">{label}</span><span className={tone}>{icon}</span></div><div className="mt-2 text-3xl font-semibold text-white">{value}</div></Card>);
export const Empty=({text}:{text:string})=><div className="flex flex-col items-center gap-2 py-10 text-sm text-slate-500"><Inbox size={28}/>{text}</div>;
export const Avatar=({id}:{id:string})=><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cy/30 to-vi/40 text-xs font-semibold text-white">{id.slice(-3)}</span>;
export const Pager=({page,pages,set}:{page:number;pages:number;set:(n:number)=>void})=>(
  <div className="mt-3 flex items-center justify-end gap-2 text-xs"><Btn disabled={page<=1} onClick={()=>set(page-1)}>Prev</Btn><span>{page} / {pages}</span><Btn disabled={page>=pages} onClick={()=>set(page+1)}>Next</Btn></div>);
export const Th=({children,onClick}:{children:ReactNode;onClick?:()=>void})=><th onClick={onClick} className={`whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 ${onClick?'cursor-pointer hover:text-cy':''}`}>{children}</th>;
