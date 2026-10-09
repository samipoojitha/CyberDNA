import os
from pathlib import Path

from dotenv import load_dotenv
import truststore
truststore.inject_into_ssl()
from twilio.rest import Client

load_dotenv(Path(__file__).resolve().parent / ".env")

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
API_KEY_SID = os.getenv("TWILIO_API_KEY_SID", "")
API_KEY_SECRET = os.getenv("TWILIO_API_KEY_SECRET", "")
FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
TO_NUMBER = os.getenv("ALERT_PHONE_TO", "")


def send_alert_sms(alert: dict) -> bool:
    settings = [ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, FROM_NUMBER, TO_NUMBER]
    if not all(settings):
        print("SMS not sent: check the Twilio settings in backend/.env")
        return False

    reason = (alert.get("reasons") or ["Unusual activity detected."])[0]
    body = (
        f"CyberDNA alert: {alert.get('type', 'Suspicious activity')}. "
        f"User {alert.get('user', 'unknown')}, "
        f"device {alert.get('device', 'unknown')}, "
        f"risk {alert.get('score', '?')}/100. {reason}"
    )

    try:
        client = Client(API_KEY_SID, API_KEY_SECRET, ACCOUNT_SID)
        message = client.messages.create(
            to=TO_NUMBER,
            from_=FROM_NUMBER,
            body=body,
        )
        print(f"SMS sent. Twilio message ID: {message.sid}")
        return True
    except Exception as error:
        print(f"SMS sending failed: {error}")
        return False