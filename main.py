from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import logging
import httpx
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("admotion-scheduler")

# ---------------------------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Initialize Firestore (kept exactly as original)
# ---------------------------------------------------------------------------
try:
    service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')

    if service_account_json:
        service_account_dict = json.loads(service_account_json)
        cred = credentials.Certificate(service_account_dict)
    else:
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'serviceAccountKey.json')
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(
                f"Firebase service account file not found: {service_account_path}. "
                "Set FIREBASE_SERVICE_ACCOUNT_JSON env variable or provide the file."
            )
        cred = credentials.Certificate(service_account_path)

    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase Admin initialized successfully")
except Exception as e:
    logger.error("Firebase initialization error: %s", e)
    raise

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(title="AdMotion Scheduler API", version="2.0.0")

allowed_origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class ImpressionRequest(BaseModel):
    adId: str
    vehicleId: str
    duration: float = Field(ge=0, description="Duration in seconds")
    screenType: str = "exterior"


class SchedulerStatusResponse(BaseModel):
    last_run: Optional[str] = None
    vehicles_processed: int = 0
    ads_assigned: int = 0
    vehicles_skipped_manual: int = 0
    errors: list[str] = []


# ---------------------------------------------------------------------------
# Constants & Configuration
# ---------------------------------------------------------------------------

OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

COST_PER_IMPRESSION: float = 10.0  # PKR

ADS_PER_VEHICLE: int = 5

# Time slot definitions (hour ranges, 24-h format)
TIME_SLOTS: dict[str, tuple[int, int]] = {
    "early_morning": (5, 8),
    "morning": (8, 12),
    "afternoon": (12, 17),
    "evening": (17, 21),
    "night_a": (21, 24),  # 21-00
    "night_b": (0, 5),    # 00-05
}

# Geo-fence area definitions for major Pakistan cities
CITY_AREAS: dict[str, dict[str, dict[str, float]]] = {
    "Islamabad": {
        "F-6": {"lat_min": 33.7250, "lat_max": 33.7350, "lon_min": 73.0650, "lon_max": 73.0800},
        "F-7": {"lat_min": 33.7150, "lat_max": 33.7250, "lon_min": 73.0650, "lon_max": 73.0800},
        "F-8": {"lat_min": 33.7050, "lat_max": 33.7150, "lon_min": 73.0500, "lon_max": 73.0700},
        "Blue Area": {"lat_min": 33.7100, "lat_max": 33.7200, "lon_min": 73.0500, "lon_max": 73.0650},
        "G-9": {"lat_min": 33.6900, "lat_max": 33.7000, "lon_min": 73.0300, "lon_max": 73.0500},
        "I-8": {"lat_min": 33.6800, "lat_max": 33.6900, "lon_min": 73.0700, "lon_max": 73.0900},
        "G-11": {"lat_min": 33.6700, "lat_max": 33.6800, "lon_min": 73.0100, "lon_max": 73.0300},
        "H-9": {"lat_min": 33.6800, "lat_max": 33.6900, "lon_min": 73.0400, "lon_max": 73.0600},
    },
    "Lahore": {
        "Gulberg": {"lat_min": 31.5100, "lat_max": 31.5300, "lon_min": 74.3300, "lon_max": 74.3600},
        "DHA": {"lat_min": 31.4700, "lat_max": 31.5000, "lon_min": 74.3700, "lon_max": 74.4200},
        "Model Town": {"lat_min": 31.4800, "lat_max": 31.5000, "lon_min": 74.3100, "lon_max": 74.3400},
        "Johar Town": {"lat_min": 31.4600, "lat_max": 31.4800, "lon_min": 74.2700, "lon_max": 74.3000},
        "Liberty": {"lat_min": 31.5100, "lat_max": 31.5200, "lon_min": 74.3400, "lon_max": 74.3600},
    },
    "Karachi": {
        "Clifton": {"lat_min": 24.8100, "lat_max": 24.8300, "lon_min": 67.0200, "lon_max": 67.0500},
        "DHA Karachi": {"lat_min": 24.7900, "lat_max": 24.8100, "lon_min": 67.0500, "lon_max": 67.0800},
        "Saddar": {"lat_min": 24.8500, "lat_max": 24.8700, "lon_min": 67.0100, "lon_max": 67.0400},
        "Gulshan": {"lat_min": 24.9100, "lat_max": 24.9300, "lon_min": 67.0800, "lon_max": 67.1100},
    },
    "Rawalpindi": {
        "Saddar Rawalpindi": {"lat_min": 33.5900, "lat_max": 33.6050, "lon_min": 73.0400, "lon_max": 73.0600},
        "Commercial Market": {"lat_min": 33.5800, "lat_max": 33.5950, "lon_min": 73.0500, "lon_max": 73.0700},
        "Bahria Town": {"lat_min": 33.5200, "lat_max": 33.5500, "lon_min": 73.0800, "lon_max": 73.1200},
    },
}

# Rough city-level bounding boxes (used to determine which city a vehicle is in)
CITY_BOUNDS: dict[str, dict[str, float]] = {
    "Islamabad": {"lat_min": 33.60, "lat_max": 33.80, "lon_min": 72.95, "lon_max": 73.15},
    "Lahore": {"lat_min": 31.35, "lat_max": 31.65, "lon_min": 74.15, "lon_max": 74.50},
    "Karachi": {"lat_min": 24.75, "lat_max": 25.05, "lon_min": 66.90, "lon_max": 67.20},
    "Rawalpindi": {"lat_min": 33.50, "lat_max": 33.65, "lon_min": 73.00, "lon_max": 73.20},
}

# OpenWeatherMap main condition → our category
WEATHER_CATEGORIES: dict[str, str] = {
    "Clear": "sunny",
    "Clouds": "cloudy",
    "Rain": "rainy",
    "Drizzle": "rainy",
    "Thunderstorm": "rainy",
    "Snow": "cold",
    "Mist": "smoggy",
    "Haze": "smoggy",
    "Fog": "smoggy",
    "Smoke": "smoggy",
}

# ---------------------------------------------------------------------------
# Weather Cache
# ---------------------------------------------------------------------------
weather_cache: dict[str, dict] = {}  # {city: {"data": {...}, "timestamp": datetime}}
WEATHER_CACHE_TTL: int = 1800  # 30 minutes in seconds

# ---------------------------------------------------------------------------
# Scheduler State (in-memory; survives across requests)
# ---------------------------------------------------------------------------
scheduler_state: dict = {
    "last_run": None,
    "vehicles_processed": 0,
    "ads_assigned": 0,
    "vehicles_skipped_manual": 0,
    "errors": [],
}


# ===========================================================================
# Helper Functions
# ===========================================================================

def _utcnow() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


# ---- Time-Based Scheduling ------------------------------------------------

def get_current_time_slot(now: Optional[datetime] = None) -> str:
    """Return the current time-slot name based on the hour (UTC+5 for Pakistan)."""
    if now is None:
        now = _utcnow()
    # Convert to Pakistan Standard Time (UTC+5)
    pkt = now + timedelta(hours=5)
    hour = pkt.hour

    if 5 <= hour < 8:
        return "early_morning"
    elif 8 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def ad_matches_time_slot(ad: dict, current_slot: str) -> bool:
    """Check whether an ad is eligible for the current time slot."""
    time_slots = ad.get("timeSlots")
    if not time_slots or time_slots == "all":
        return True  # No restriction → always eligible
    if isinstance(time_slots, list):
        return current_slot in time_slots
    return True


# ---- Location-Based Scheduling --------------------------------------------

def detect_city(lat: float, lon: float) -> Optional[str]:
    """Return city name if vehicle GPS falls within a known city bounding box."""
    for city, bounds in CITY_BOUNDS.items():
        if (bounds["lat_min"] <= lat <= bounds["lat_max"]
                and bounds["lon_min"] <= lon <= bounds["lon_max"]):
            return city
    return None


def detect_area(lat: float, lon: float, city: str) -> Optional[str]:
    """Return specific area name if vehicle GPS falls within a known area zone."""
    areas = CITY_AREAS.get(city, {})
    for area_name, bbox in areas.items():
        if (bbox["lat_min"] <= lat <= bbox["lat_max"]
                and bbox["lon_min"] <= lon <= bbox["lon_max"]):
            return area_name
    return None


def ad_matches_location(ad: dict, vehicle_city: Optional[str], vehicle_area: Optional[str]) -> bool:
    """Check whether an ad targets this vehicle's location (city/area)."""
    ad_location = (ad.get("location") or "").strip()

    # No location set on ad → treat as national/all
    if not ad_location:
        return True

    # City-level match
    if vehicle_city and ad_location.lower() == vehicle_city.lower():
        # Area-level further filtering (if the ad specifies target areas)
        target_areas = ad.get("targetAreas")
        if target_areas and isinstance(target_areas, list) and len(target_areas) > 0:
            if vehicle_area and vehicle_area in target_areas:
                return True
            # Ad targets specific areas but vehicle is not in any of them
            return False
        return True

    # If ad location doesn't match city at all, reject
    # (unless ad location is empty / "national" / "all")
    if ad_location.lower() in ("national", "all", ""):
        return True

    return False


# ---- Weather-Based Scheduling ---------------------------------------------

async def fetch_weather(city: str) -> dict:
    """
    Fetch current weather for a city from OpenWeatherMap.
    Returns cached data if available and fresh.
    """
    now = _utcnow()

    # Check cache
    cached = weather_cache.get(city)
    if cached:
        age = (now - cached["timestamp"]).total_seconds()
        if age < WEATHER_CACHE_TTL:
            return cached["data"]

    if not OPENWEATHER_API_KEY:
        logger.warning("OPENWEATHER_API_KEY not set; defaulting weather to 'sunny'")
        fallback = {"main": "Clear", "category": "sunny", "temp": 25, "description": "clear sky"}
        weather_cache[city] = {"data": fallback, "timestamp": now}
        return fallback

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": f"{city},PK", "appid": OPENWEATHER_API_KEY, "units": "metric"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            raw = resp.json()

        main_weather = raw.get("weather", [{}])[0].get("main", "Clear")
        category = WEATHER_CATEGORIES.get(main_weather, "sunny")
        temp = raw.get("main", {}).get("temp", 25)
        description = raw.get("weather", [{}])[0].get("description", "")

        # Cold override: if temp < 10 treat as cold regardless of sky
        if temp < 10:
            category = "cold"

        data = {
            "main": main_weather,
            "category": category,
            "temp": temp,
            "description": description,
        }
        weather_cache[city] = {"data": data, "timestamp": now}
        return data

    except Exception as exc:
        logger.error("Weather API error for %s: %s", city, exc)
        fallback = {"main": "Clear", "category": "sunny", "temp": 25, "description": "api error fallback"}
        weather_cache[city] = {"data": fallback, "timestamp": now}
        return fallback


# ---- Fair Visibility -------------------------------------------------------

def load_impression_counts() -> dict[str, int]:
    """Load total impression count per ad from Firestore `impressions` collection."""
    counts: dict[str, int] = {}
    try:
        docs = db.collection("impressions").stream()
        for doc in docs:
            d = doc.to_dict()
            ad_id = d.get("adId")
            if ad_id:
                counts[ad_id] = counts.get(ad_id, 0) + 1
    except Exception as exc:
        logger.error("Error loading impressions: %s", exc)
    return counts


# ---- Scoring Algorithm -----------------------------------------------------

def calculate_ad_score(
    ad: dict,
    vehicle_city: Optional[str],
    vehicle_area: Optional[str],
    current_time_slot: str,
    weather_category: str,
    impression_counts: dict[str, int],
) -> float:
    """Compute a composite score for an ad given the vehicle context."""
    score: float = 1.0

    # --- Area / location match bonus ---
    target_areas = ad.get("targetAreas")
    if target_areas and isinstance(target_areas, list) and vehicle_area and vehicle_area in target_areas:
        score *= 2.0  # Strong area-level match
    elif vehicle_city and (ad.get("location") or "").lower() == vehicle_city.lower():
        score *= 1.5  # City-level match

    # --- Time slot bonus ---
    time_slots = ad.get("timeSlots")
    if time_slots and isinstance(time_slots, list) and current_time_slot in time_slots:
        score *= 1.3

    # --- Weather bonus ---
    weather_targets = ad.get("weatherTargets")
    if weather_targets and isinstance(weather_targets, list) and weather_category in weather_targets:
        score *= 1.5

    # --- Fair visibility (inverse impression ratio) ---
    budget = float(ad.get("budget") or 10000)
    target_impressions = budget / COST_PER_IMPRESSION
    current_impressions = impression_counts.get(ad.get("id", ""), 0)
    if target_impressions > 0:
        ratio = current_impressions / target_impressions
        fairness_score = max(0.1, 1.0 - ratio)
        score *= (1.0 + fairness_score)

    return round(score, 4)


# ---- Active Ad Filtering ---------------------------------------------------

def is_ad_active(ad: dict, now: datetime) -> bool:
    """Return True if the ad is currently active (status + date range)."""
    status = (ad.get("status") or "").lower()
    if status not in ("active", "approved", "running"):
        return False

    # Check date range
    start = ad.get("start") or ad.get("startDate")
    end = ad.get("end") or ad.get("endDate")

    try:
        if start:
            start_dt = _parse_datetime(start)
            if start_dt and now < start_dt:
                return False
        if end:
            end_dt = _parse_datetime(end)
            if end_dt and now > end_dt:
                return False
    except Exception:
        pass  # If dates are malformed, still consider ad active

    return True


def _parse_datetime(value) -> Optional[datetime]:
    """Safely parse a datetime from Firestore (could be string or Timestamp)."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if hasattr(value, "seconds"):  # Firestore Timestamp
        return datetime.fromtimestamp(value.seconds, tz=timezone.utc)
    if isinstance(value, str):
        for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                continue
    return None


# ---- Manual Campaign Detection ---------------------------------------------

def get_manual_vehicle_ids() -> set[str]:
    """Return the set of vehicle IDs that are currently in active manual campaigns."""
    manual_ids: set[str] = set()
    now = _utcnow()
    try:
        campaigns = db.collection("campaigns").where("mode", "==", "manual").stream()
        for doc in campaigns:
            c = doc.to_dict()
            # Check campaign is active by status and date range
            status = (c.get("status") or "").lower()
            if status not in ("active", "running", "approved"):
                continue

            start = _parse_datetime(c.get("startDate"))
            end = _parse_datetime(c.get("endDate"))
            if start and now < start:
                continue
            if end and now > end:
                continue

            vehicles = c.get("vehicles", [])
            if isinstance(vehicles, list):
                for v in vehicles:
                    if isinstance(v, str):
                        manual_ids.add(v)
                    elif isinstance(v, dict) and "id" in v:
                        manual_ids.add(v["id"])
    except Exception as exc:
        logger.error("Error loading manual campaigns: %s", exc)
    return manual_ids


# ===========================================================================
# Core AI Scheduler
# ===========================================================================

async def run_ai_scheduler() -> dict:
    """
    Run the full AI scheduling pipeline:
    1. Detect manual-campaign vehicles and skip them
    2. For each non-manual vehicle, determine city/area, time slot, weather
    3. Filter eligible ads, score them, pick top N
    4. Assign ads to vehicle with time windows
    5. Persist assignments to Firestore
    """
    now = _utcnow()
    current_slot = get_current_time_slot(now)
    errors: list[str] = []
    assignments_made: list[dict] = []
    vehicles_processed = 0
    vehicles_skipped = 0

    logger.info("Scheduler run started | time_slot=%s", current_slot)

    # Step 1: Identify manual-campaign vehicles
    manual_vehicle_ids = get_manual_vehicle_ids()
    logger.info("Manual-campaign vehicles: %d", len(manual_vehicle_ids))

    # Step 2: Load all vehicles
    try:
        vehicles_snap = db.collection("vehicles").stream()
        vehicles = [v.to_dict() | {"id": v.id} for v in vehicles_snap]
    except Exception as exc:
        msg = f"Failed to load vehicles: {exc}"
        logger.error(msg)
        return {"ok": False, "error": msg}

    # Step 3: Load all ads
    try:
        ads_snap = db.collection("ads").stream()
        all_ads = [a.to_dict() | {"id": a.id} for a in ads_snap]
    except Exception as exc:
        msg = f"Failed to load ads: {exc}"
        logger.error(msg)
        return {"ok": False, "error": msg}

    # Filter to active ads
    active_ads = [a for a in all_ads if is_ad_active(a, now)]
    logger.info("Active ads: %d / %d total", len(active_ads), len(all_ads))

    if not active_ads:
        return {
            "ok": True,
            "message": "No active ads available for scheduling",
            "vehicles_processed": 0,
            "ads_assigned": 0,
            "vehicles_skipped_manual": len(manual_vehicle_ids),
        }

    # Step 4: Load impression counts for fairness
    impression_counts = load_impression_counts()

    # Step 5: Pre-fetch weather for known cities (batch)
    weather_by_city: dict[str, dict] = {}
    cities_needed: set[str] = set()
    for v in vehicles:
        loc = v.get("location", {})
        if isinstance(loc, dict):
            lat = loc.get("lat", 0)
            lon = loc.get("lon", 0)
            city = detect_city(lat, lon)
            if city:
                cities_needed.add(city)

    for city in cities_needed:
        weather_by_city[city] = await fetch_weather(city)

    # Step 6: Process each vehicle
    total_ads_assigned = 0
    batch = db.batch()
    batch_count = 0
    MAX_BATCH = 450  # Firestore limit is 500 per batch

    for vehicle in vehicles:
        vid = vehicle.get("id", "")

        # Skip manual-campaign vehicles
        if vid in manual_vehicle_ids:
            vehicles_skipped += 1
            continue

        vehicles_processed += 1

        try:
            # 6a. Determine vehicle location
            loc = vehicle.get("location", {})
            lat = lon = 0.0
            if isinstance(loc, dict):
                lat = float(loc.get("lat", 0))
                lon = float(loc.get("lon", 0))

            vehicle_city = detect_city(lat, lon) if (lat and lon) else None
            vehicle_area = detect_area(lat, lon, vehicle_city) if vehicle_city else None

            # 6b. Get weather for this city
            weather_category = "sunny"  # default
            if vehicle_city and vehicle_city in weather_by_city:
                weather_category = weather_by_city[vehicle_city].get("category", "sunny")

            # 6c. Filter ads for this vehicle
            eligible_ads: list[dict] = []
            for ad in active_ads:
                if not ad_matches_location(ad, vehicle_city, vehicle_area):
                    continue
                if not ad_matches_time_slot(ad, current_slot):
                    continue
                eligible_ads.append(ad)

            if not eligible_ads:
                # If no ads match strict criteria, fall back to all active ads
                eligible_ads = active_ads.copy()

            # 6d. Score & sort
            scored: list[tuple[float, dict]] = []
            for ad in eligible_ads:
                s = calculate_ad_score(
                    ad, vehicle_city, vehicle_area, current_slot, weather_category, impression_counts
                )
                scored.append((s, ad))

            scored.sort(key=lambda x: x[0], reverse=True)
            top_ads = [ad for _, ad in scored[:ADS_PER_VEHICLE]]

            # 6e. Build assignment entries with time windows
            assigned_list: list[dict] = []
            slot_duration = timedelta(minutes=30)
            for idx, ad in enumerate(top_ads):
                start_time = now + slot_duration * idx
                end_time = start_time + slot_duration
                entry = {
                    "adId": ad["id"],
                    "title": ad.get("title", ""),
                    "startTime": start_time.isoformat(),
                    "endTime": end_time.isoformat(),
                    "assignedBy": "ai",
                    "score": scored[idx][0] if idx < len(scored) else 0,
                    "city": vehicle_city or "",
                    "area": vehicle_area or "",
                    "timeSlot": current_slot,
                    "weather": weather_category,
                }
                assigned_list.append(entry)

                # Assignment history document
                if batch_count < MAX_BATCH:
                    assignment_ref = db.collection("assignments").document()
                    batch.set(assignment_ref, {
                        "vehicleId": vid,
                        "adId": ad["id"],
                        "adTitle": ad.get("title", ""),
                        "startTime": start_time.isoformat(),
                        "endTime": end_time.isoformat(),
                        "assignedBy": "ai",
                        "city": vehicle_city or "",
                        "area": vehicle_area or "",
                        "timeSlot": current_slot,
                        "weather": weather_category,
                        "score": scored[idx][0] if idx < len(scored) else 0,
                        "createdAt": firestore.SERVER_TIMESTAMP,
                    })
                    batch_count += 1

            # 6f. Update vehicle's assignedAds
            if batch_count < MAX_BATCH:
                veh_ref = db.collection("vehicles").document(vid)
                batch.update(veh_ref, {"assignedAds": assigned_list})
                batch_count += 1

            total_ads_assigned += len(assigned_list)
            assignments_made.append({
                "vehicleId": vid,
                "vehicleName": vehicle.get("vehicleName", ""),
                "city": vehicle_city,
                "area": vehicle_area,
                "weather": weather_category,
                "adsAssigned": len(assigned_list),
                "topAdIds": [a["adId"] for a in assigned_list],
            })

            # Commit batch if nearing limit
            if batch_count >= MAX_BATCH:
                batch.commit()
                batch = db.batch()
                batch_count = 0

        except Exception as exc:
            msg = f"Error processing vehicle {vid}: {exc}"
            logger.error(msg)
            errors.append(msg)

    # Commit remaining batch
    if batch_count > 0:
        try:
            batch.commit()
        except Exception as exc:
            msg = f"Batch commit error: {exc}"
            logger.error(msg)
            errors.append(msg)

    # Update scheduler state
    scheduler_state.update({
        "last_run": now.isoformat(),
        "vehicles_processed": vehicles_processed,
        "ads_assigned": total_ads_assigned,
        "vehicles_skipped_manual": vehicles_skipped,
        "errors": errors,
    })

    logger.info(
        "Scheduler run complete | vehicles=%d | ads_assigned=%d | skipped_manual=%d | errors=%d",
        vehicles_processed, total_ads_assigned, vehicles_skipped, len(errors),
    )

    return {
        "ok": True,
        "timestamp": now.isoformat(),
        "timeSlot": current_slot,
        "vehiclesProcessed": vehicles_processed,
        "vehiclesSkippedManual": vehicles_skipped,
        "totalAdsAssigned": total_ads_assigned,
        "assignments": assignments_made,
        "errors": errors,
    }


# ===========================================================================
# API Endpoints
# ===========================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": _utcnow().isoformat(),
        "service": "AdMotion AI Scheduler API",
        "version": "2.0.0",
    }


@app.post("/api/scheduler/run")
async def run_scheduler():
    """Run the full AI scheduler pipeline."""
    try:
        result = await run_ai_scheduler()
        return result
    except Exception as exc:
        logger.exception("Scheduler run failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/scheduler/status")
async def get_scheduler_status():
    """Return status/stats from the last scheduler run."""
    return {
        "ok": True,
        "lastRun": scheduler_state["last_run"],
        "vehiclesProcessed": scheduler_state["vehicles_processed"],
        "adsAssigned": scheduler_state["ads_assigned"],
        "vehiclesSkippedManual": scheduler_state["vehicles_skipped_manual"],
        "errors": scheduler_state["errors"],
    }


@app.post("/api/impressions")
async def record_impression(payload: ImpressionRequest):
    """Record an ad impression from a vehicle screen."""
    try:
        doc_data = {
            "adId": payload.adId,
            "vehicleId": payload.vehicleId,
            "duration": payload.duration,
            "screenType": payload.screenType,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "recordedAt": _utcnow().isoformat(),
        }
        db.collection("impressions").add(doc_data)

        # Also increment the ad's spent field (cost_per_impression per view)
        try:
            ad_ref = db.collection("ads").document(payload.adId)
            ad_ref.update({"spent": firestore.Increment(COST_PER_IMPRESSION)})
        except Exception:
            pass  # Non-critical; ad might not have a spent field yet

        return {"ok": True, "message": "Impression recorded"}
    except Exception as exc:
        logger.error("Failed to record impression: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/weather/{city}")
async def get_weather(city: str):
    """Get current (cached) weather data for a city."""
    # Normalize city name
    city_normalized = city.strip().title()

    # Check if it's a known city
    known_cities = list(CITY_AREAS.keys())
    if city_normalized not in known_cities:
        # Try case-insensitive match
        for kc in known_cities:
            if kc.lower() == city_normalized.lower():
                city_normalized = kc
                break

    data = await fetch_weather(city_normalized)
    return {
        "ok": True,
        "city": city_normalized,
        "weather": data,
    }


@app.get("/api/areas/{city}")
async def get_areas(city: str):
    """Get defined geo-fence areas for a city."""
    city_normalized = city.strip().title()

    # Case-insensitive lookup
    for kc in CITY_AREAS:
        if kc.lower() == city_normalized.lower():
            city_normalized = kc
            break

    areas = CITY_AREAS.get(city_normalized)
    if areas is None:
        return {
            "ok": True,
            "city": city_normalized,
            "areas": {},
            "message": f"No area definitions found for {city_normalized}",
            "availableCities": list(CITY_AREAS.keys()),
        }

    return {
        "ok": True,
        "city": city_normalized,
        "areas": areas,
        "areaNames": list(areas.keys()),
        "count": len(areas),
    }
