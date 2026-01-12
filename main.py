from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# -----------------------------
# Initialize Firestore
# -----------------------------
cred = credentials.Certificate("serviceAccountKey.json")  # download from Firebase
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI(title="AI Scheduler API")

# -----------------------------
# Enable CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 👈 you can restrict later to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Helper function to assign ads
# -----------------------------
def assign_ads_to_vehicles():
    # Fetch vehicles that are NOT in manual campaigns
    vehicles_ref = db.collection("vehicles").stream()
    vehicles = [v.to_dict() | {"id": v.id} for v in vehicles_ref]

    # Fetch all ads
    ads_ref = db.collection("ads").stream()
    ads = [a.to_dict() | {"id": a.id} for a in ads_ref]

    if not vehicles or not ads:
        return {"ok": False, "msg": "No vehicles or ads found"}

    assignments = []
    now = datetime.utcnow()

    # Simple round-robin distribution
    for i, vehicle in enumerate(vehicles):
        assigned = []
        for j in range(3):  # assign 3 ads per vehicle
            ad = ads[(i + j) % len(ads)]
            start_time = now + timedelta(minutes=30 * j)
            end_time = start_time + timedelta(minutes=30)
            assigned.append({
                "adId": ad["id"],
                "startTime": start_time.isoformat(),
                "endTime": end_time.isoformat(),
                "assignedBy": "ai",
            })

            # Save in assignments history
            db.collection("assignments").add({
                "vehicleId": vehicle["id"],
                "adId": ad["id"],
                "startTime": start_time,
                "endTime": end_time,
                "assignedBy": "ai",
                "createdAt": firestore.SERVER_TIMESTAMP,
            })

        # Update vehicle doc with current assignedAds
        db.collection("vehicles").document(vehicle["id"]).update({
            "assignedAds": assigned
        })

        assignments.append({"vehicle": vehicle["id"], "ads": assigned})

    return {"ok": True, "assignments": assignments}

# -----------------------------
# API Endpoint
# -----------------------------
@app.post("/api/scheduler/run")
def run_scheduler():
    try:
        result = assign_ads_to_vehicles()
        return result
    except Exception as e:
        return {"ok": False, "error": str(e)}
