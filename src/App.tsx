import {useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {BarChart3,Bell,Dna,Fingerprint,LayoutDashboard,Menu,ScrollText,Search,Settings as Cog,ShieldAlert,PanelLeftClose,PanelLeftOpen,X} from 'lucide-react';
import {Page,useApp} from './store';
import Overview from './pages/Overview';import Profiles from './pages/Profiles';import Threats from './pages/Threats';import Logs from './pages/Logs';import Analytics from './pages/Analytics';import Settings from './pages/Settings';
const NAV:{id:Page;label:string;icon:LucideIcon}[]=[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'profiles',label:'Behavioral Profiles',icon:Fingerprint},{id:'threats',label:'Threat Detection',icon:ShieldAlert},{id:'logs',label:'Activity Logs',icon:ScrollText},{id:'analytics',label:'Analytics',icon:BarChart3},{id:'settings',label:'Settings',icon:Cog}];
const PAGES:Record<Page,()=>JSX.Element>={overview:Overview,profiles:Profiles,threats:Threats,logs:Logs,analytics:Analytics,settings:Settings};
export default function App(){
  const {page,go,alerts,backend,toasts}=useApp();const [col,setCol]=useState(false);const [drawer,setDrawer]=useState(false);const [q,setQ]=useState('');
  const Cur=PAGES[page];const open=alerts.filter(a=>a.status==='open').length;
  const nav=(c:boolean)=><nav className="flex flex-col gap-1 p-3">{NAV.map(n=><button key={n.id} onClick={()=>{go(n.id);setDrawer(false)}} title={n.label} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${page===n.id?'bg-cy/10 text-cy':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><n.icon size={18}/>{!c&&n.label}</button>)}</nav>;
  const brand=<div className="flex h-14 items-center gap-2 border-b border-line px-4 font-semibold text-white"><Dna className="text-cy" size={22}/>CyberDNA</div>;
  return <div className="flex min-h-screen">
    <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-line bg-card transition-all md:block ${col?'w-16':'w-60'}`}>{col?<div className="grid h-14 place-items-center border-b border-line"><Dna className="text-cy"/></div>:brand}{nav(col)}
      <button onClick={()=>setCol(!col)} className="absolute bottom-4 left-5 text-slate-500 hover:text-cy" aria-label="Toggle sidebar">{col?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button></aside>
    {drawer&&<div className="fixed inset-0 z-40 md:hidden"><div className="absolute inset-0 bg-black/60" onClick={()=>setDrawer(false)}/><aside className="relative h-full w-64 bg-card">{brand}{nav(false)}<button className="absolute right-3 top-4 text-slate-400" onClick={()=>setDrawer(false)} aria-label="Close menu"><X size={18}/></button></aside></div>}
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur">
      <button className="md:hidden" onClick={()=>setDrawer(true)} aria-label="Open menu"><Menu/></button>
      <form className="relative max-w-md flex-1" onSubmit={e=>{e.preventDefault();go('logs',{q})}}><Search size={14} className="absolute left-3 top-2.5 text-slate-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search users, devices, events…" className="w-full rounded-lg border border-line bg-card py-1.5 pl-8 pr-3 text-sm outline-none focus:border-cy/60"/></form>
      <span className={`hidden items-center gap-1.5 text-xs sm:flex ${backend?'text-emerald-400':'text-amber-300'}`}><span className="h-2 w-2 rounded-full bg-current"/>{backend?'Backend online':'Demo mode'}</span>
      <button className="relative" onClick={()=>go('threats')} aria-label="Alerts"><Bell size={19}/>{open>0&&<span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] text-white">{open}</span>}</button>
      <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cy/40 to-vi/50 text-xs font-semibold text-white">AD</span><span className="hidden text-sm lg:block">Admin</span></div></header>
      <main className="mx-auto max-w-7xl p-4 md:p-6"><Cur/></main></div>
    <div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map(t=><div key={t.id} className={`rounded-lg border bg-card px-4 py-2 text-sm shadow-lg ${t.k==='warn'?'border-amber-400/50 text-amber-200':'border-cy/40 text-slate-100'}`}>{t.m}</div>)}</div></div>;
}
