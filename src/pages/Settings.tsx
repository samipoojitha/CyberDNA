import {useApp} from '../store';
import {Btn,Card} from '../components/ui';
export default function Settings(){
  const {backend,reset,events,alerts}=useApp();
  return <div className="space-y-4"><h1 className="text-xl font-semibold text-white">Settings</h1>
    <Card title="Data source"><p className="text-sm">{backend?'FastAPI backend reachable. Alerts it generates are labeled "Backend".':'No backend detected. Running on local demo data; simulated detections are labeled "Simulated".'}</p>
      <p className="mt-2 text-xs text-slate-500">API base: <code>{(import.meta.env.VITE_API_BASE as string|undefined)||'/api'}</code> (set VITE_API_BASE in .env; never put secrets here)</p></Card>
    <Card title="Demo data"><p className="mb-3 text-sm">{events.length} events and {alerts.length} alerts stored in this browser.</p><Btn v="d" onClick={reset}>Reset demo data</Btn></Card></div>;
}
