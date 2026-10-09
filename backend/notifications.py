"""
CyberDNA – multi-channel alert dispatcher
Channels: SMS (Twilio), Email (SMTP), Telegram (Bot API)

Each channel is enabled only when its required env vars are present.
Call dispatch(alert) to fire all enabled channels and get a per-channel report.
"""
from __future__ import annotations

import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the same directory as this file
load_dotenv(Path(__file__).resolve().parent / ".env")

# ── Twilio SMS ────────────────────────────────────────────────────────────────
_TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
_TWILIO_API_KEY_SID = os.getenv("TWILIO_API_KEY_SID", "")
_TWILIO_API_KEY_SECRET = os.getenv("TWILIO_API_KEY_SECRET", "")
_TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER", "")
_TWILIO_TO = os.getenv("ALERT_PHONE_TO", "")

# ── Email (SMTP) ──────────────────────────────────────────────────────────────
_EMAIL_SMTP_HOST = os.getenv("EMAIL_SMTP_HOST", "")
_EMAIL_SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "587"))
_EMAIL_FROM = os.getenv("EMAIL_FROM", "")
_EMAIL_TO = os.getenv("EMAIL_TO", "")
_EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

# ── Telegram ──────────────────────────────────────────────────────────────────
_TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
_TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def _fmt_body(alert: dict) -> str:
    """Return a short, human-readable description of the alert."""
    reason = (alert.get("reasons") or ["Unusual activity detected."])[0]
    return (
        f"CyberDNA Alert: {alert.get('type', 'Suspicious activity')}\n"
        f"User: {alert.get('user', 'unknown')}\n"
        f"Device: {alert.get('device', 'unknown')}\n"
        f"Risk score: {alert.get('score', '?')}/100\n"
        f"Reason: {reason}"
    )


# ── SMS via Twilio ────────────────────────────────────────────────────────────

def send_sms(alert: dict) -> bool:
    """Send an SMS alert via Twilio. Returns True on success."""
    required = [
        _TWILIO_ACCOUNT_SID,
        _TWILIO_API_KEY_SID,
        _TWILIO_API_KEY_SECRET,
        _TWILIO_FROM,
        _TWILIO_TO,
    ]
    if not all(required):
        print("SMS skipped: one or more Twilio env vars are missing.")
        return False

    reason = (alert.get("reasons") or ["Unusual activity detected."])[0]
    body = (
        f"CyberDNA alert: {alert.get('type', 'Suspicious activity')}. "
        f"User {alert.get('user', 'unknown')}, "
        f"device {alert.get('device', 'unknown')}, "
        f"risk {alert.get('score', '?')}/100. {reason}"
    )

    try:
        from twilio.rest import Client
        from twilio.http.http_client import TwilioHttpClient

        # 15-second timeout so the call never hangs the server
        http_client = TwilioHttpClient(timeout=15)
        client = Client(
            _TWILIO_API_KEY_SID,
            _TWILIO_API_KEY_SECRET,
            _TWILIO_ACCOUNT_SID,
            http_client=http_client,
        )
        message = client.messages.create(
            to=_TWILIO_TO,
            from_=_TWILIO_FROM,
            body=body,
        )
        print(f"SMS sent. Twilio message SID: {message.sid}")
        return True
    except Exception as exc:
        print(f"SMS failed: {exc}")
        return False


# ── Email via SMTP ────────────────────────────────────────────────────────────

def send_email(alert: dict) -> bool:
    """Send an email alert via SMTP (TLS on port 587 by default). Returns True on success."""
    required = [_EMAIL_SMTP_HOST, _EMAIL_FROM, _EMAIL_TO, _EMAIL_PASSWORD]
    if not all(required):
        print("Email skipped: one or more EMAIL_* env vars are missing.")
        return False

    subject = (
        f"[CyberDNA] {alert.get('type', 'Alert')} — "
        f"risk {alert.get('score', '?')}/100"
    )
    plain_body = _fmt_body(alert)
    html_body = (
        f"<h2 style='color:#e11d48'>CyberDNA Security Alert</h2>"
        f"<table style='border-collapse:collapse;font-family:monospace'>"
        f"<tr><td style='padding:4px 12px 4px 0;color:#64748b'>Type</td>"
        f"<td><strong>{alert.get('type','–')}</strong></td></tr>"
        f"<tr><td style='padding:4px 12px 4px 0;color:#64748b'>User</td>"
        f"<td>{alert.get('user','–')}</td></tr>"
        f"<tr><td style='padding:4px 12px 4px 0;color:#64748b'>Device</td>"
        f"<td>{alert.get('device','–')}</td></tr>"
        f"<tr><td style='padding:4px 12px 4px 0;color:#64748b'>Risk score</td>"
        f"<td><strong>{alert.get('score','?')}/100</strong></td></tr>"
        f"</table>"
        f"<h3>Reasons</h3><ul>"
        + "".join(f"<li>{r}</li>" for r in (alert.get("reasons") or []))
        + f"</ul><hr/><p style='font-size:12px;color:#94a3b8'>"
        f"Alert ID: {alert.get('id','–')} · {alert.get('ts','–')}</p>"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = _EMAIL_FROM
    msg["To"] = _EMAIL_TO
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(_EMAIL_SMTP_HOST, _EMAIL_SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(_EMAIL_FROM, _EMAIL_PASSWORD)
            server.sendmail(_EMAIL_FROM, _EMAIL_TO, msg.as_string())
        print(f"Email sent to {_EMAIL_TO}")
        return True
    except Exception as exc:
        print(f"Email failed: {exc}")
        return False


# ── Telegram via Bot API ──────────────────────────────────────────────────────

def send_telegram(alert: dict) -> bool:
    """Send a Telegram message via the Bot API. Returns True on success."""
    required = [_TELEGRAM_BOT_TOKEN, _TELEGRAM_CHAT_ID]
    if not all(required):
        print("Telegram skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.")
        return False

    text = (
        f"🚨 *CyberDNA Alert*\n"
        f"*{alert.get('type', 'Suspicious activity')}*\n\n"
        f"👤 User: `{alert.get('user', 'unknown')}`\n"
        f"💻 Device: `{alert.get('device', 'unknown')}`\n"
        f"⚠️ Risk: *{alert.get('score', '?')}/100*\n\n"
        + "\n".join(f"• {r}" for r in (alert.get("reasons") or ["Unusual activity detected."]))
    )

    try:
        import httpx  # imported lazily so httpx is optional at import time

        url = f"https://api.telegram.org/bot{_TELEGRAM_BOT_TOKEN}/sendMessage"
        response = httpx.post(
            url,
            json={
                "chat_id": _TELEGRAM_CHAT_ID,
                "text": text,
                "parse_mode": "Markdown",
            },
            timeout=10,
        )
        response.raise_for_status()
        print(f"Telegram message sent. message_id: {response.json()['result']['message_id']}")
        return True
    except Exception as exc:
        print(f"Telegram failed: {exc}")
        return False


# ── Orchestrator ──────────────────────────────────────────────────────────────

def dispatch(alert: dict) -> dict[str, bool | None]:
    """
    Fire all configured notification channels for a given alert.

    Returns a dict with per-channel results:
        {"sms": True|False|None, "email": True|False|None, "telegram": True|False|None}
    None  → channel not configured (env vars absent)
    True  → message sent successfully
    False → channel configured but send failed
    """
    results: dict[str, bool | None] = {
        "sms": None,
        "email": None,
        "telegram": None,
    }

    # SMS
    if all([_TWILIO_ACCOUNT_SID, _TWILIO_API_KEY_SID, _TWILIO_API_KEY_SECRET, _TWILIO_FROM, _TWILIO_TO]):
        results["sms"] = send_sms(alert)

    # Email
    if all([_EMAIL_SMTP_HOST, _EMAIL_FROM, _EMAIL_TO, _EMAIL_PASSWORD]):
        results["email"] = send_email(alert)

    # Telegram
    if all([_TELEGRAM_BOT_TOKEN, _TELEGRAM_CHAT_ID]):
        results["telegram"] = send_telegram(alert)

    return results


def channel_status() -> dict[str, bool]:
    """Return which channels are configured (credentials present), without exposing values."""
    return {
        "sms": all([_TWILIO_ACCOUNT_SID, _TWILIO_API_KEY_SID, _TWILIO_API_KEY_SECRET, _TWILIO_FROM, _TWILIO_TO]),
        "email": all([_EMAIL_SMTP_HOST, _EMAIL_FROM, _EMAIL_TO, _EMAIL_PASSWORD]),
        "telegram": all([_TELEGRAM_BOT_TOKEN, _TELEGRAM_CHAT_ID]),
    }
