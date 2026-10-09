import {useEffect,useState} from 'react';
import {useApp} from '../store';
import {Btn,Card} from '../components/ui';
import {api} from '../services/api';

type ChannelStatus={sms:boolean;email:boolean;telegram:boolean}|null;

function ChannelBadge({label,icon,configured,detail}:{label:string;icon:string;configured:boolean|undefined;detail:string}){
  if(configured===undefined)return(
    <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">Checking…</p>
      </div>
    </div>
  );
  return(
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${configured?'border-emerald-700 bg-emerald-900/20':'border-slate-700 bg-slate-800/50'}`}>
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${configured?'bg-emerald-800 text-emerald-300':'bg-slate-700 text-slate-400'}`}>
            {configured?'Configured':'Not configured'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{detail}</p>
      </div>
    </div>
  );
}

export default function Settings(){
  const {backend,reset,events,alerts}=useApp();
  const [channels,setChannels]=useState<ChannelStatus>(null);
  const [checking,setChecking]=useState(false);

  useEffect(()=>{
    if(!backend)return;
    setChecking(true);
    api.notificationsStatus().then(s=>{setChannels(s);setChecking(false)});
  },[backend]);

  return(
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      <Card title="Data source">
        <p className="text-sm">{backend
          ?'FastAPI backend reachable. Alerts it generates are labeled "Backend".'
          :'No backend detected. Running on local demo data; simulated detections are labeled "Simulated".'}</p>
        <p className="mt-2 text-xs text-slate-500">API base: <code>{(import.meta.env.VITE_API_BASE as string|undefined)||'/api'}</code> (set VITE_API_BASE in .env; never put secrets here)</p>
      </Card>

      <Card title="Alert notifications">
        {!backend?(
          <p className="text-sm text-slate-400">Start the FastAPI backend to see which notification channels are configured.</p>
        ):(
          <>
            <p className="text-sm text-slate-400 mb-3">
              When a suspicious event is detected, CyberDNA fires alerts on every configured channel.
              Configure channels by adding the relevant variables to <code className="text-xs bg-slate-700 px-1 py-0.5 rounded">backend/.env</code>.
            </p>
            <div className="space-y-2">
              <ChannelBadge
                label="SMS"
                icon="📱"
                configured={channels?.sms}
                detail="Requires: TWILIO_ACCOUNT_SID · TWILIO_API_KEY_SID · TWILIO_API_KEY_SECRET · TWILIO_FROM_NUMBER · ALERT_PHONE_TO"
              />
              <ChannelBadge
                label="Email"
                icon="📧"
                configured={channels?.email}
                detail="Requires: EMAIL_SMTP_HOST · EMAIL_SMTP_PORT (default 587) · EMAIL_FROM · EMAIL_TO · EMAIL_PASSWORD"
              />
              <ChannelBadge
                label="Telegram"
                icon="✈️"
                configured={channels?.telegram}
                detail="Requires: TELEGRAM_BOT_TOKEN · TELEGRAM_CHAT_ID — create a bot at t.me/BotFather, then get your chat ID via @userinfobot"
              />
            </div>
            {!checking&&channels&&!channels.sms&&!channels.email&&!channels.telegram&&(
              <div className="mt-3 rounded-lg border border-amber-700 bg-amber-900/20 p-3">
                <p className="text-xs text-amber-300">⚠️ No channels are configured. Add credentials to <code>backend/.env</code> and restart the backend.</p>
                <details className="mt-2">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">Show .env template</summary>
                  <pre className="mt-2 text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-x-auto whitespace-pre-wrap">{ENV_TEMPLATE}</pre>
                </details>
              </div>
            )}
          </>
        )}
      </Card>

      <Card title="Demo data">
        <p className="mb-3 text-sm">{events.length} events and {alerts.length} alerts stored in this browser.</p>
        <Btn v="d" onClick={reset}>Reset demo data</Btn>
      </Card>
    </div>
  );
}

const ENV_TEMPLATE=`# ── SMS (Twilio) ──────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
ALERT_PHONE_TO=+1xxxxxxxxxx

# ── Email (SMTP / Gmail App Password) ────
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=you@gmail.com
EMAIL_TO=you@gmail.com
EMAIL_PASSWORD=your_app_password

# ── Telegram ──────────────────────────────
TELEGRAM_BOT_TOKEN=123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789`;
