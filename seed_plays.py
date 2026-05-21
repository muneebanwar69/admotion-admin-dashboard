"""
Seed sample PLAY HISTORY (impressions) + display hours so the Driver Tracking
page shows live data. Only touches seeded vehicles/ads (seeded == True).
Idempotent: clears previously seeded impressions first.

Run:  python seed_plays.py
"""
import random
from datetime import datetime, timezone, timedelta

import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate("serviceAccountKey.json"))
db = firestore.client()

now = datetime.now(timezone.utc)
today = now.strftime("%Y-%m-%d")
month = now.strftime("%Y-%m")

vehicles = [{"id": d.id, **d.to_dict()} for d in db.collection("vehicles").where("seeded", "==", True).stream()]
ads = [{"id": d.id, **d.to_dict()} for d in db.collection("ads").where("seeded", "==", True).stream()]
print(f"Found {len(vehicles)} seeded vehicles, {len(ads)} seeded ads")

# 1) Clear previously seeded impressions
old = list(db.collection("impressions").where("seeded", "==", True).stream())
for d in old:
    d.reference.delete()
print(f"Cleared {len(old)} old seeded impressions")

WEATHERS = ["sunny", "cloudy", "rainy", "smoggy"]
SLOTS = ["morning", "afternoon", "evening", "night"]

# 2) Give each vehicle realistic display hours (drives the earnings tab)
print("Setting display hours on vehicles...")
for v in vehicles:
    req = v.get("requiredHoursPerDay", 8)
    today_hours = round(random.uniform(0.5, req + 1), 2)        # some behind, some on-track
    month_hours = round(today_hours + random.uniform(20, 160), 2)
    db.collection("vehicles").document(v["id"]).update({
        "todayDisplayHours": today_hours,
        "monthDisplayHours": month_hours,
        "lastEarningsDate": today,
        "earningsMonth": month,
    })

# 3) Generate impressions (play history) spread across the last 3 days,
#    weighted toward the last hour so the feed looks live.
print("Generating play history (impressions)...")
count = 0
batch = db.batch()
n = 0
for _ in range(160):
    v = random.choice(vehicles)
    ad = random.choice(ads)
    # 60% within the last 90 min, rest spread over 3 days
    if random.random() < 0.6:
        ts = now - timedelta(minutes=random.randint(0, 90))
    else:
        ts = now - timedelta(days=random.randint(0, 2), minutes=random.randint(0, 1439))
    loc = v.get("location", {}) or {}
    duration = random.choice([8, 10, 12, 15])
    reach = int(random.uniform(8, 220))
    ref = db.collection("impressions").document()
    batch.set(ref, {
        "adId": ad["id"],
        "vehicleId": v["id"],
        "carId": v.get("carId", ""),
        "duration": duration,
        "adPlays": 1,
        "city": loc.get("address", "").split(",")[-1].strip() if loc.get("address") else "",
        "area": loc.get("address", "").split(",")[0].strip() if loc.get("address") else "",
        "weather": random.choice(WEATHERS),
        "timeSlot": random.choice(SLOTS),
        "estimatedReach": reach,
        "method": "seed-demo",
        "lat": loc.get("lat"),
        "lon": loc.get("lon"),
        "timestamp": ts,                       # real datetime -> Firestore Timestamp
        "recordedAt": ts.isoformat(),
        "date": ts.strftime("%Y-%m-%d"),
        "seeded": True,
    })
    n += 1
    count += 1
    if n >= 400:
        batch.commit(); batch = db.batch(); n = 0
if n:
    batch.commit()

print(f"\nDone. {count} impressions written across {len(vehicles)} vehicles.")
print("Driver Tracking -> Earnings + Play History tabs are now populated.")
