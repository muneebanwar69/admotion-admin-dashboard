"""
Seed Firestore with realistic test data: 20 vehicles + 20 ads.
- All vehicles share the password "Admotion123+" (stored as a bcrypt hash).
- Vehicles are spread across Islamabad / Lahore / Karachi / Rawalpindi with real
  coordinates (so the AI scheduler detects city/area and the map plots them).
- Recent `lastSeen` so most show ONLINE on the fleet map.
- Ads use real (Unsplash CDN) images and are Active with sane targeting.
Idempotent: deletes previously seeded docs (seeded == True) before inserting.

Run:  python seed_data.py
"""
import random
from datetime import datetime, timezone, timedelta

import firebase_admin
from firebase_admin import credentials, firestore

# ---------------------------------------------------------------------------
# Init
# ---------------------------------------------------------------------------
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

PLAIN_PASSWORD = "Admotion123+"
# bcrypt hash of "Admotion123+" (rounds=10). comparePassword() verifies any login.
PASSWORD_HASH = "$2a$10$gRRYD.KYipK7Ub8C0HLaj.MUL4vlMmXFPr2ZO7u5ZyLAp4F.BniT2"

now = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# Real coordinates inside known area bounding boxes (matches main.py CITY_AREAS)
# ---------------------------------------------------------------------------
LOCATIONS = [
    # city, area label, lat, lon
    ("Islamabad",  "F-7",              33.7200, 73.0720),
    ("Islamabad",  "Blue Area",        33.7150, 73.0570),
    ("Islamabad",  "F-8",              33.7100, 73.0600),
    ("Islamabad",  "G-9",              33.6950, 73.0400),
    ("Islamabad",  "F-6",              33.7300, 73.0720),
    ("Lahore",     "Gulberg",          31.5200, 74.3450),
    ("Lahore",     "DHA",              31.4750, 74.4050),
    ("Lahore",     "Johar Town",       31.4700, 74.2750),
    ("Lahore",     "Model Town",       31.4850, 74.3250),
    ("Lahore",     "Liberty",          31.5100, 74.3470),
    ("Karachi",    "Clifton",          24.8200, 67.0350),
    ("Karachi",    "DHA Karachi",      24.8000, 67.0650),
    ("Karachi",    "Saddar",           24.8600, 67.0250),
    ("Karachi",    "Gulshan",          24.9200, 67.0950),
    ("Karachi",    "Clifton",          24.8250, 67.0300),
    ("Rawalpindi", "Saddar Rawalpindi",33.5970, 73.0500),
    ("Rawalpindi", "Commercial Market",33.6200, 73.0700),
    ("Rawalpindi", "Bahria Town",      33.5300, 73.0950),
    ("Rawalpindi", "Saddar Rawalpindi",33.5980, 73.0520),
    ("Islamabad",  "I-8",              33.6850, 73.0800),
]

CAR_IMAGES = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80&auto=format&fit=crop",
]

VEHICLE_TYPES = ["Sedan", "SUV", "Hatchback", "Van", "Pickup"]
MODELS = ["Toyota Corolla", "Honda Civic", "Suzuki Cultus", "Toyota Hilux",
          "Honda City", "Suzuki Swift", "KIA Sportage", "Hyundai Tucson",
          "Toyota Fortuner", "MG HS"]
COLORS = ["White", "Black", "Silver", "Grey", "Blue", "Red"]
FIRST_NAMES = ["Ahmed", "Bilal", "Usman", "Hamza", "Ali", "Hassan", "Saad", "Zain",
               "Fahad", "Imran", "Kashif", "Waleed", "Tariq", "Noman", "Owais",
               "Rizwan", "Shahid", "Junaid", "Adnan", "Faisal"]
LAST_NAMES = ["Khan", "Ahmed", "Malik", "Raza", "Sheikh", "Butt", "Iqbal", "Hussain",
              "Awan", "Qureshi"]

# ---------------------------------------------------------------------------
# Clear previously seeded docs
# ---------------------------------------------------------------------------
def clear_seeded(coll):
    docs = list(db.collection(coll).where("seeded", "==", True).stream())
    for d in docs:
        d.reference.delete()
    return len(docs)

print("Clearing previously seeded data...")
print(f"  vehicles removed: {clear_seeded('vehicles')}")
print(f"  ads removed:      {clear_seeded('ads')}")

# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------
print("\nSeeding 20 vehicles (password for all: Admotion123+)...")
plate_letters = ["LEA", "ICT", "RIA", "AAB", "BFG", "LZH", "KAR", "ABC"]
for i in range(20):
    city, area, lat, lon = LOCATIONS[i]
    # tiny jitter so markers don't perfectly overlap
    lat += random.uniform(-0.0015, 0.0015)
    lon += random.uniform(-0.0015, 0.0015)

    fn = FIRST_NAMES[i]
    ln = random.choice(LAST_NAMES)
    cnic = f"35201-{1000001 + i}-{i % 9 + 1}"
    plate = f"{random.choice(plate_letters)}-{1000 + i * 7}"
    car_id = f"AD-CAR-{i + 1:03d}"
    # most online (recent heartbeat), a few offline (stale) for realism
    online = i % 4 != 0
    last_seen = now - timedelta(seconds=random.randint(5, 90)) if online \
        else now - timedelta(minutes=random.randint(10, 120))

    vehicle = {
        "carId": car_id,
        "type": random.choice(VEHICLE_TYPES),
        "vehicleName": f"{random.choice(MODELS)} ({plate})",
        "plateNumber": plate,
        "ownerName": f"{fn} {ln}",
        "model": random.choice(MODELS),
        "color": random.choice(COLORS),
        "cnic": cnic,
        "phone": f"03{random.randint(0,4)}{random.randint(10000000,99999999)}",
        "password": PASSWORD_HASH,
        "duration": "12 months",
        "registrationDate": (now - timedelta(days=random.randint(30, 400))).strftime("%Y-%m-%d"),
        "contractRate": random.choice([25000, 30000, 35000, 40000, 50000]),
        "requiredHoursPerDay": 8,
        "status": "Active",
        "profileImage": CAR_IMAGES[i % len(CAR_IMAGES)],
        "imageUrl": CAR_IMAGES[i % len(CAR_IMAGES)],
        "owner": {"firstName": fn, "lastName": ln, "cnic": cnic,
                  "email": f"{fn.lower()}.{ln.lower()}@example.com"},
        "bank": {"accountTitle": f"{fn} {ln}", "accountNo": f"{random.randint(10**10, 10**11)}",
                 "iban": f"PK36SCBL{random.randint(10**12, 10**13)}", "bankName": "HBL"},
        "location": {"lat": round(lat, 6), "lon": round(lon, 6),
                     "address": f"{area}, {city}"},
        "currentLocation": {"lat": round(lat, 6), "lng": round(lon, 6)},
        "lastLocation": {"lat": round(lat, 6), "lon": round(lon, 6)},
        "lastSeen": last_seen.isoformat(),
        "assignedAds": [],
        "seeded": True,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    db.collection("vehicles").add(vehicle)
    print(f"  [{i+1:2d}] {car_id} | {city}/{area} | CNIC {cnic} | {'online' if online else 'offline'}")

# ---------------------------------------------------------------------------
# Ads
# ---------------------------------------------------------------------------
ADS = [
    ("Crispy Bites — Buy 1 Get 1", "Food", "Crispy Bites", "photo-1504674900247-0877df9cc836"),
    ("NextGen Laptops 2026", "Tech", "TechNova", "photo-1496181133206-80ce9b88a853"),
    ("Spring Fashion Sale", "Fashion", "Urban Threads", "photo-1483985988355-763728e1935b"),
    ("VOLT Energy — Stay Charged", "Beverage", "VOLT", "photo-1622543925917-763c34d1a86e"),
    ("Run Free — New Sneakers", "Sports", "StridePro", "photo-1542291026-7eec264c27ff"),
    ("Escape to the Northern Areas", "Travel", "WanderPK", "photo-1488646953014-85cb44e25828"),
    ("Glow Skincare Collection", "Beauty", "GlowLab", "photo-1596462502278-27bfdc403348"),
    ("Test Drive the New SUV", "Auto", "AutoPrime", "photo-1583121274602-3e2820c69888"),
    ("Dream Homes in DHA", "Real Estate", "Estate One", "photo-1560518883-ce09059eeffa"),
    ("Learn to Code — Bootcamp", "Education", "CodeCamp", "photo-1503676260728-1c00da094a0b"),
    ("Fresh Coffee, Every Morning", "Food", "Bean & Co", "photo-1495474472287-4d71bcdd2085"),
    ("Smartphone Mega Deal", "Tech", "MobileHub", "photo-1511707171634-5f897ff02aa9"),
    ("Eid Collection Launch", "Fashion", "Elegance", "photo-1445205170230-053b83016050"),
    ("Chilled Soda — Summer Vibes", "Beverage", "FizzUp", "photo-1581636625402-29b2a704ef13"),
    ("Gym Membership 50% Off", "Fitness", "IronFit", "photo-1534438327276-14e5300c3a48"),
    ("Weekend Getaway Packages", "Travel", "TripMate", "photo-1469854523086-cc02fe5d8800"),
    ("Luxury Watches Sale", "Fashion", "TimeLux", "photo-1523275335684-37898b6baf30"),
    ("Healthy Meal Plans", "Food", "FitMeals", "photo-1512621776951-a57141f2eefd"),
    ("Home Internet — 200 Mbps", "Tech", "NetFiber", "photo-1558494949-ef010cbdcc31"),
    ("New Car Insurance Plans", "Auto", "SafeDrive", "photo-1449965408869-eaa3f722e40d"),
]
CITIES = ["Islamabad", "Lahore", "Karachi", "Rawalpindi"]
TIME_SLOTS = ["morning", "afternoon", "evening", "night"]
WEATHERS = ["sunny", "cloudy", "rainy", "smoggy"]

print("\nSeeding 20 ads (real images)...")
for i, (title, category, company, photo_id) in enumerate(ADS):
    url = f"https://images.unsplash.com/{photo_id}?w=1024&q=80&auto=format&fit=crop"
    city = CITIES[i % len(CITIES)]
    slots = random.sample(TIME_SLOTS, k=random.randint(1, 3))
    weathers = random.sample(WEATHERS, k=random.randint(0, 2))
    ad = {
        "adId": f"AD-{i + 1:03d}",
        "title": title,
        "category": category,
        "company": company,
        "budget": random.choice([20000, 35000, 50000, 75000, 100000]),
        "start": (now - timedelta(days=random.randint(1, 20))).strftime("%Y-%m-%d"),
        "end": (now + timedelta(days=random.randint(20, 90))).strftime("%Y-%m-%d"),
        "status": "Active",
        "location": city,
        "type": "Image",
        "mediaType": "Image",
        "preview": url,        # <- what the Ads UI renders
        "mediaUrl": url,
        "mediaBase64": "",
        "mediaName": f"{photo_id}.jpg",
        "email": f"ads@{company.lower().replace(' ', '')}.com",
        "contact": f"03{random.randint(0,4)}{random.randint(10000000,99999999)}",
        "timeSlots": slots,
        "weatherTargets": weathers,
        "targetAreas": [],
        "impressions": 0,
        "seeded": True,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    db.collection("ads").add(ad)
    print(f"  [{i+1:2d}] {ad['adId']} | {category:11s} | {city:11s} | slots={slots}")

print("\nDone. 20 vehicles + 20 ads seeded.")
print(f"All vehicle logins use password: {PLAIN_PASSWORD}")
