from __future__ import annotations
from sms_alerts import send_alert_sms
import json
import math
import os
import random
import sqlite3
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("CYBERDNA_DB", ROOT / "cyberdna.db"))
MODEL_PATH = ROOT / "cyberdna_model.joblib"
import joblib

TRAINED_MODEL = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None
USERS = [
    {"id": "user_101", "devices": ["dev_lap_101", "dev_ph_101"], "hours": [8, 17], "avgSession": 42, "volume": 180},
    {"id": "user_102", "devices": ["dev_lap_102"], "hours": [9, 18], "avgSession": 35, "volume": 150},
    {"id": "user_103", "devices": ["dev_wks_103", "dev_ph_103"], "hours": [7, 16], "avgSession": 55, "volume": 220},
    {"id": "user_104", "devices": ["dev_lap_104", "dev_ph_104"], "hours": [9, 17], "avgSession": 38, "volume": 160},
    {"id": "user_105", "devices": ["dev_lap_105"], "hours": [22, 6], "avgSession": 61, "volume": 130},
    {"id": "user_106", "devices": ["dev_wks_106", "dev_lap_106"], "hours": [10, 19], "avgSession": 29, "volume": 140},
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db


def profile(user: dict) -> dict:
    start, end = user["hours"]
    baseline = []

    for hour in range(24):
        active = (
            start <= hour <= end
            if start <= end
            else hour >= start or hour <= end
        )
        value = (
            user["volume"] / 8 * (0.5 + 0.5 * abs(math.sin(hour * 0.7)))
            if active
            else user["volume"] / 8 * 0.03
        )
        baseline.append(round(value))

    return {**user, "baseline": baseline, "recent": baseline[:]}


def assess(user: dict, device: str, hour: int, failed: int) -> tuple[int, list[str]]:
    reasons = []
    score = 0
    start, end = user["hours"]

    in_window = (
        start <= hour <= end
        if start <= end
        else hour >= start or hour <= end
    )

    if device not in user["devices"]:
        score += 35
        reasons.append("The device has not been observed before for this user.")

    if not in_window:
        score += 28
        reasons.append(
            f"Login at {hour:02d}:00 occurred outside the normal activity "
            f"window ({start:02d}:00–{end:02d}:00)."
        )

    score += min(failed * 5, 28)
    if failed >= 2:
        reasons.append(
            f"{failed} failed authentication attempts occurred (typical: 0–1)."
        )

    return min(100, score), reasons
def model_score(user, device, hour, failed, volume):
    rule_score, _ = assess(user, device, hour, failed)

    if TRAINED_MODEL is None:
        return rule_score

    start, end = user["hours"]
    in_window = (
        start <= hour <= end
        if start <= end
        else hour >= start or hour <= end
    )
    features = [[
        int(in_window),
        int(device in user["devices"]),
        failed,
        volume / max(user["volume"], 1),
    ]]
    probabilities = TRAINED_MODEL.predict_proba(features)[0]
    suspicious_index = list(TRAINED_MODEL.classes_).index(1)
    return round(float(probabilities[suspicious_index]) * 100)

def make_event(
    user: dict,
    device: str,
    hour: int,
    failed: int,
    volume: int,
    category: str,
    timestamp: str,
    simulated: bool,
) -> dict:
    score = model_score(user, device, hour, failed, volume)

    if score == 0:
        score = (ord(user["id"][-1]) + hour + random.randint(0, 10)) % 11

    return {
        "id": f"ev_{uuid.uuid4().hex[:12]}",
        "ts": timestamp,
        "user": user["id"],
        "cat": category,
        "device": device,
        "hour": hour,
        "failed": failed,
        "volume": volume,
        "score":score,
        "cls": "suspicious" if score >= 40 else "normal",
        "simulated": simulated,
    }


def save_event(db, event: dict) -> None:
    db.execute(
        "INSERT OR REPLACE INTO events VALUES (?, ?)",
        (event["id"], json.dumps(event)),
    )


def save_alert(db, alert: dict) -> None:
    db.execute(
        "INSERT OR REPLACE INTO alerts VALUES (?, ?)",
        (alert["id"], json.dumps(alert)),
    )


def seed_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with connect() as db:
        db.execute(
            "CREATE TABLE IF NOT EXISTS events "
            "(id TEXT PRIMARY KEY, data TEXT NOT NULL)"
        )
        db.execute(
            "CREATE TABLE IF NOT EXISTS alerts "
            "(id TEXT PRIMARY KEY, data TEXT NOT NULL)"
        )

        if db.execute("SELECT COUNT(*) FROM events").fetchone()[0]:
            return

        alert_seeds = [
            ("user_104", "Unusual login activity", "dev_unknown_77", 3, 6, 35, "open"),
            ("user_106", "Unrecognized device + off-hours", "dev_unk_31", 4, 3, 420, "open"),
            ("user_103", "Repeated failed logins", "dev_wks_103", 23, 8, 760, "investigating"),
            ("user_105", "Off-hours activity", "dev_lap_105", 12, 3, 1100, "open"),
            ("user_102", "New device login", "dev_new_12", 14, 2, 1500, "dismissed"),
            ("user_101", "New device login", "dev_new_03", 10, 0, 2600, "reviewed"),
        ]

        for index, item in enumerate(alert_seeds):
            user_id, alert_type, device, hour, failed, age, status = item
            user = next(user for user in USERS if user["id"] == user_id)
            timestamp = (
                datetime.now(timezone.utc) - timedelta(minutes=age)
            ).isoformat().replace("+00:00", "Z")

            event = make_event(
                user, device, hour, failed, 120, "Login", timestamp, False
            )
            score, reasons = assess(user, device, hour, failed)

            if not reasons:
                reasons = ["Activity deviates from the learned baseline."]

            alert = {
                "id": f"ALT-{1000 + index}",
                "eventId": event["id"],
                "user": user_id,
                "type": alert_type,
                "device": device,
                "hour": hour,
                "failed": failed,
                "volume": 120,
                "score": score or event["score"],
                "reasons": reasons,
                "ts": timestamp,
                "status": status,
                "origin": "seed",
            }
            save_event(db, event)
            save_alert(db, alert)

        categories = ["Login", "Device check", "Session", "Password reset", "File access"]

        for index in range(60):
            user = USERS[index % len(USERS)]
            start, end = user["hours"]
            span = ((end - start + 24) % 24) + 1
            hour = (start + (index * 5 % span)) % 24
            device = user["devices"][index % len(user["devices"])]
            failed = 1 if index % 9 == 0 else 0
            volume = round(user["volume"] / (6 + index % 4))
            timestamp = (
                datetime.now(timezone.utc) - timedelta(minutes=30 + index * 47)
            ).isoformat().replace("+00:00", "Z")

            event = make_event(
                user,
                device,
                hour,
                failed,
                volume,
                categories[index % len(categories)],
                timestamp,
                False,
            )
            save_event(db, event)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title="CyberDNA Demo API",
    version="1.0.0",
    description="Synthetic behavioral telemetry demo.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)
@app.get("/model/status")
def model_status():
    return {"trained": TRAINED_MODEL is not None}


def all_records(table: str) -> list[dict]:
    # The table name is only passed internally as "events" or "alerts".
    with connect() as db:
        rows = db.execute(f"SELECT data FROM {table}").fetchall()

    records = [json.loads(row["data"]) for row in rows]
    return sorted(records, key=lambda item: item["ts"], reverse=True)


@app.get("/dashboard")
def dashboard():
    return {
        "users": [profile(user) for user in USERS],
        "events": all_records("events"),
        "alerts": all_records("alerts"),
    }


@app.get("/users")
def list_users():
    return [profile(user) for user in USERS]


@app.get("/users/{user_id}/profile")
def get_profile(user_id: str):
    user = next((item for item in USERS if item["id"] == user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile(user)


@app.get("/events")
def list_events(limit: int = 500):
    limit = max(1, min(limit, 1000))
    return all_records("events")[:limit]


@app.get("/alerts")
def list_alerts():
    return all_records("alerts")


class SimulateRequest(BaseModel):
    kind: Literal["normal", "suspicious"] = "normal"


@app.post("/events/simulate")
def simulate(request: SimulateRequest):
    if request.kind == "suspicious":
        user = next(user for user in USERS if user["id"] == "user_104")
        device = f"dev_unknown_{random.randint(10, 99)}"
        hour, failed, volume, category = 3, 6, 140, "Login"
    else:
        user = random.choice(USERS)
        device = random.choice(user["devices"])
        hour, failed = user["hours"][0], 0
        volume, category = round(user["volume"] / 7), "Session"

    timestamp = now_iso()
    event = make_event(user, device, hour, failed, volume, category, timestamp, True)
    alert = None

    score, reasons = assess(user, device, hour, failed)
    if request.kind == "suspicious":
        alert = {
            "id": f"ALT-{uuid.uuid4().hex[:6].upper()}",
            "eventId": event["id"],
            "user": user["id"],
            "type": "Unusual login activity",
            "device": device,
            "hour": hour,
            "failed": failed,
            "volume": volume,
            "score": event["score"],
            "reasons": reasons,
            "ts": timestamp,
            "status": "open",
            "origin": "backend",
        }

    with connect() as db:
        save_event(db, event)
        if alert:
            save_alert(db, alert)
    sms_sent = None
    if alert:
        sms_sent = send_alert_sms(alert)
    return {"event": event, "alert": alert, "smsSent": sms_sent}


class AlertUpdate(BaseModel):
    status: Literal["open", "investigating", "reviewed", "dismissed"]


@app.patch("/alerts/{alert_id}")
def update_alert(alert_id: str, update: AlertUpdate):
    with connect() as db:
        row = db.execute(
            "SELECT data FROM alerts WHERE id = ?",
            (alert_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Alert not found")

        alert = json.loads(row["data"])
        alert["status"] = update.status
        alert["origin"] = "backend"
        save_alert(db, alert)

    return alert