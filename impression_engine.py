"""
impression_engine.py
=====================
Estimates *real-world ad impressions* (estimated reach) for a single ad play
on a moving vehicle, and lays the base scaffold for a future trainable ML model.

WHY THIS EXISTS
---------------
A vehicle screen playing an ad once is NOT "1 impression". The real number of
people who saw it depends on WHERE the vehicle is (busy commercial street vs.
empty residential lane), WHEN it is (rush hour vs. 3 AM), and the conditions
(clear vs. heavy rain keeps people indoors).

Industry-standard DOOH estimation formula used here:

    estimatedReach = adPlays
                     x areaFactor    (location type from GPS geofence)
                     x timeFactor    (rush hour vs. off-peak)
                     x weatherFactor (footfall dampening)

Every estimate we store also doubles as a labelled training row, so once
enough data accumulates, `ImpressionModel` can be trained to *predict* reach
instead of using the fixed heuristic.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger("admotion-scheduler.impressions")

# ---------------------------------------------------------------------------
# 1. AREA TYPE CLASSIFICATION
# ---------------------------------------------------------------------------
# Map the named geofence areas (defined in main.py CITY_AREAS) to a coarse
# "area type". High-footfall commercial zones expose an ad to far more people
# per play than quiet residential sectors.

AREA_TYPE_FACTOR: dict[str, float] = {
    "commercial": 3.0,   # markets, business districts, shopping hubs
    "main_road":  2.2,   # arterial roads / high-traffic corridors
    "mixed":      1.6,   # mixed commercial + residential
    "residential": 1.0,  # housing sectors, low pedestrian density
    "unknown":    1.3,   # GPS known but area unclassified -> mild default
    "no_gps":     1.0,   # no location at all -> conservative baseline
}

# Classify each known area name. Anything not listed -> "mixed".
AREA_NAME_TO_TYPE: dict[str, str] = {
    # Islamabad
    "Blue Area": "commercial",
    "F-6": "commercial",
    "F-7": "commercial",
    "F-8": "mixed",
    "G-9": "mixed",
    "I-8": "mixed",
    "G-11": "residential",
    "H-9": "main_road",
    # Lahore
    "Gulberg": "commercial",
    "Liberty": "commercial",
    "DHA": "residential",
    "Model Town": "residential",
    "Johar Town": "mixed",
    # Karachi
    "Clifton": "commercial",
    "Saddar": "commercial",
    "DHA Karachi": "residential",
    "Gulshan": "mixed",
    # Rawalpindi
    "Saddar Rawalpindi": "commercial",
    "Commercial Market": "commercial",
    "Bahria Town": "residential",
}


def classify_area(area_name: Optional[str], has_gps: bool) -> str:
    """Return the area-type bucket for an area name."""
    if not has_gps:
        return "no_gps"
    if not area_name:
        return "unknown"
    return AREA_NAME_TO_TYPE.get(area_name, "mixed")


# ---------------------------------------------------------------------------
# 2. TIME-OF-DAY FACTOR
# ---------------------------------------------------------------------------
# Rush hours expose the ad to dense commuter traffic; late night is near-empty.
# Hours are in Pakistan Standard Time (UTC+5).

def time_factor(now: Optional[datetime] = None) -> tuple[float, int]:
    """Return (timeFactor, pkt_hour)."""
    if now is None:
        now = datetime.now(timezone.utc)
    pkt_hour = (now + timedelta(hours=5)).hour

    if 8 <= pkt_hour < 10 or 17 <= pkt_hour < 20:
        return 1.8, pkt_hour          # morning / evening rush
    if 10 <= pkt_hour < 17:
        return 1.3, pkt_hour          # daytime
    if 20 <= pkt_hour < 23:
        return 1.1, pkt_hour          # early night, some footfall
    if 5 <= pkt_hour < 8:
        return 0.9, pkt_hour          # early morning
    return 0.4, pkt_hour              # 23:00 - 05:00 deep night


# ---------------------------------------------------------------------------
# 3. WEATHER FACTOR
# ---------------------------------------------------------------------------
# Heavy rain / cold keeps pedestrians indoors -> fewer eyes on the ad.

WEATHER_FACTOR: dict[str, float] = {
    "sunny":  1.0,
    "cloudy": 0.95,
    "smoggy": 0.85,
    "cold":   0.8,
    "rainy":  0.65,
}


def weather_factor(weather_category: Optional[str]) -> float:
    return WEATHER_FACTOR.get((weather_category or "sunny").lower(), 1.0)


# ---------------------------------------------------------------------------
# 4. HEURISTIC ESTIMATOR  (always available, zero dependencies)
# ---------------------------------------------------------------------------

def estimate_reach_heuristic(
    *,
    ad_plays: int,
    area_name: Optional[str],
    has_gps: bool,
    weather_category: Optional[str],
    now: Optional[datetime] = None,
) -> dict:
    """
    Compute estimated real-world reach for `ad_plays` plays.

    Returns a dict with the final number AND every factor, so the caller can
    store a fully-explainable, ML-ready row in Firestore.
    """
    area_type = classify_area(area_name, has_gps)
    a_factor = AREA_TYPE_FACTOR.get(area_type, 1.3)
    t_factor, pkt_hour = time_factor(now)
    w_factor = weather_factor(weather_category)

    estimated = ad_plays * a_factor * t_factor * w_factor

    return {
        "estimatedReach": round(estimated, 2),
        "adPlays": ad_plays,
        "areaType": area_type,
        "areaFactor": a_factor,
        "timeFactor": t_factor,
        "weatherFactor": w_factor,
        "hour": pkt_hour,
        "method": "heuristic",
        "modelVersion": "v1",
    }


# ---------------------------------------------------------------------------
# 5. ML MODEL SCAFFOLD  (base laid now; trained later when data exists)
# ---------------------------------------------------------------------------
# This class is intentionally inert until a model file exists. `predict()`
# ALWAYS falls back to the heuristic if the model is missing or sklearn is
# not installed, so the app never breaks. Once the `impressions` collection
# has accumulated enough rows, run `train_from_rows(...)` to produce the
# model artifact and predictions become learned instead of fixed.

MODEL_PATH = os.getenv("IMPRESSION_MODEL_PATH", "impression_model.pkl")

# Feature order the model will be trained/served with (kept in one place).
FEATURE_COLUMNS = ["areaType", "hour", "weatherFactor", "timeFactor", "areaFactor"]


class ImpressionModel:
    """Lazy-loading wrapper around an optional scikit-learn regressor."""

    def __init__(self) -> None:
        self._model = None
        self._loaded = False

    # ---- loading -------------------------------------------------------
    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        if not os.path.exists(MODEL_PATH):
            logger.info("No trained impression model found (%s) - using heuristic.", MODEL_PATH)
            return
        try:
            import joblib  # lazy import; optional dependency
            self._model = joblib.load(MODEL_PATH)
            logger.info("Loaded trained impression model from %s", MODEL_PATH)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Could not load impression model (%s); using heuristic.", exc)
            self._model = None

    @property
    def is_trained(self) -> bool:
        self._ensure_loaded()
        return self._model is not None

    # ---- inference -----------------------------------------------------
    def predict(self, **kwargs) -> dict:
        """
        Predict estimated reach. Falls back to the heuristic whenever the
        model is unavailable, so this is always safe to call.
        """
        heuristic = estimate_reach_heuristic(**kwargs)
        self._ensure_loaded()
        if self._model is None:
            return heuristic

        try:
            import numpy as np
            # Encode area type the same way training did.
            area_types = list(AREA_TYPE_FACTOR.keys())
            area_idx = area_types.index(heuristic["areaType"]) if heuristic["areaType"] in area_types else 0
            features = np.array([[
                area_idx,
                heuristic["hour"],
                heuristic["weatherFactor"],
                heuristic["timeFactor"],
                heuristic["areaFactor"],
            ]])
            predicted = float(self._model.predict(features)[0]) * heuristic["adPlays"]
            heuristic["estimatedReach"] = round(max(predicted, 0.0), 2)
            heuristic["method"] = "ml"
            heuristic["modelVersion"] = "ml-v1"
            return heuristic
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Model predict failed (%s); using heuristic.", exc)
            return heuristic


# Module-level singleton used by the API.
impression_model = ImpressionModel()


def train_from_rows(rows: list[dict]) -> dict:
    """
    Train the impression model from accumulated Firestore `impressions` rows.

    Each row is expected to contain the factor fields we already store
    (areaType, hour, weatherFactor, timeFactor, areaFactor) plus an observed
    target. Until a real observed-reach signal exists (e.g. camera / sensor /
    survey), `estimatedReach` serves as a bootstrap target so the pipeline is
    fully wired and testable end-to-end.

    Call this from an offline script or an admin-only endpoint once enough
    data has accumulated. It is deliberately NOT invoked at request time.
    """
    if len(rows) < 50:
        return {"ok": False, "reason": f"Need >=50 rows, got {len(rows)}."}

    try:
        import numpy as np
        from sklearn.ensemble import RandomForestRegressor
        import joblib
    except ImportError:
        return {
            "ok": False,
            "reason": "scikit-learn / joblib not installed. "
                      "Add 'scikit-learn' and 'joblib' to requirements.txt to train.",
        }

    area_types = list(AREA_TYPE_FACTOR.keys())
    X, y = [], []
    for r in rows:
        try:
            at = r.get("areaType", "unknown")
            X.append([
                area_types.index(at) if at in area_types else 0,
                int(r.get("hour", 12)),
                float(r.get("weatherFactor", 1.0)),
                float(r.get("timeFactor", 1.0)),
                float(r.get("areaFactor", 1.3)),
            ])
            # Per-play target so prediction scales with adPlays at inference.
            plays = max(int(r.get("adPlays", 1)), 1)
            y.append(float(r.get("estimatedReach", 0.0)) / plays)
        except (TypeError, ValueError):
            continue

    if len(X) < 50:
        return {"ok": False, "reason": f"Only {len(X)} valid rows after cleaning."}

    model = RandomForestRegressor(n_estimators=120, random_state=42, max_depth=8)
    model.fit(np.array(X), np.array(y))
    joblib.dump(model, MODEL_PATH)

    # Reset singleton so the new model is picked up on next predict().
    impression_model._model = None
    impression_model._loaded = False

    return {
        "ok": True,
        "trainedRows": len(X),
        "modelPath": MODEL_PATH,
        "featureColumns": FEATURE_COLUMNS,
    }
