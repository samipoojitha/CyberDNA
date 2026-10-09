"""
Run this directly to test SMS without starting the full backend.
Usage:  python test_sms.py
"""
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).resolve().parent / ".env")

account_sid    = os.getenv("TWILIO_ACCOUNT_SID", "")
api_key_sid    = os.getenv("TWILIO_API_KEY_SID", "")
api_key_secret = os.getenv("TWILIO_API_KEY_SECRET", "")
from_number    = os.getenv("TWILIO_FROM_NUMBER", "")
to_number      = os.getenv("ALERT_PHONE_TO", "")

print("── Loaded values ──────────────────────────────────")
print(f"  Account SID : {account_sid[:8]}…")
print(f"  API Key SID : {api_key_sid[:8]}…")
print(f"  From        : {from_number}")
print(f"  To          : {to_number}")
print("───────────────────────────────────────────────────")

if not all([account_sid, api_key_sid, api_key_secret, from_number, to_number]):
    print("ERROR: one or more env vars are missing.")
    raise SystemExit(1)

from twilio.rest import Client

print("Creating Twilio client…")
client = Client(api_key_sid, api_key_secret, account_sid)

print("Sending message…")
msg = client.messages.create(
    to=to_number,
    from_=from_number,
    body="CyberDNA test alert: SMS is working correctly.",
)
print(f"SUCCESS  SID={msg.sid}  status={msg.status}")
