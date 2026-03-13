# AdMotion — Ad Playback Strategy on Vehicles

## Deep Codebase Analysis & Implementation Approaches

> **Document Purpose:** This document provides a comprehensive analysis of the AdMotion codebase and proposes detailed approaches for playing ads on registered vehicles, integrating AI-driven scheduling, ensuring equal ad visibility, and supporting priority ads with fixed placement.

---

## Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Current Data Flow: Ad Creation → Vehicle Display](#2-current-data-flow-ad-creation--vehicle-display)
3. [Existing Gaps & Limitations](#3-existing-gaps--limitations)
4. [Approach 1: AI-Powered Smart Ad Scheduler](#4-approach-1-ai-powered-smart-ad-scheduler)
5. [Approach 2: Equal Visibility Algorithm](#5-approach-2-equal-visibility-algorithm)
6. [Approach 3: Priority Ad System](#6-approach-3-priority-ad-system)
7. [Approach 4: Real-Time Geo-Targeted Ad Serving](#7-approach-4-real-time-geo-targeted-ad-serving)
8. [Approach 5: Hybrid AI + Rule-Based Engine](#8-approach-5-hybrid-ai--rule-based-engine)
9. [Impression Tracking & Analytics Pipeline](#9-impression-tracking--analytics-pipeline)
10. [Vehicle-Side Playback Engine Redesign](#10-vehicle-side-playback-engine-redesign)
11. [Budget Management & Pay-Per-Impression](#11-budget-management--pay-per-impression)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Firestore Schema Changes](#13-firestore-schema-changes)
14. [API Endpoints Required](#14-api-endpoints-required)
15. [Summary & Recommendation](#15-summary--recommendation)

---

## 1. Current Architecture Overview

The AdMotion platform consists of **three distinct systems**:

| System | Technology | Purpose |
|--------|-----------|---------|
| **Admin Dashboard** (`src/`) | React + Vite + Firebase | Manage vehicles, ads, campaigns, analytics |
| **Vehicle PWA** (`vehicle-app/`) | React + Vite + Zustand + Firebase | Display ads on vehicle screens (Android TV boxes) |
| **Python Backend** (`main.py`) | FastAPI + Firebase Admin SDK | AI scheduler for ad-to-vehicle assignment |

### Firestore Collections Currently In Use

| Collection | Purpose |
|------------|---------|
| `vehicles` | Vehicle registration, location tracking, ad assignments |
| `ads` | Ad metadata + media (base64 images, Storage URLs for video) |
| `campaigns` | Manual campaign grouping — ads → vehicles |
| `admins` | Admin user accounts (custom auth) |
| `activityLogs` | Immutable audit trail |
| `alerts` | System alerts (expiry warnings, budget alerts) |
| `assignments` | Historical record of AI-assigned ad slots |

### Key Data Models

**Vehicle Document** (`vehicles/{id}`):
```json
{
  "carId": "01",
  "vehicleName": "Honda Civic",
  "type": "Personal|Commercial|Fleet",
  "ownerName": "...",
  "status": "Active",
  "assignedAds": [
    { "adId": "...", "startTime": "ISO", "endTime": "ISO", "campaignId": "..." }
  ],
  "location": { "lat": 33.6, "lon": 73.0, "accuracy": 10, "address": "..." },
  "lastHeartbeat": "Timestamp",
  "isOnline": true,
  "currentlyPlaying": { "adId": "...", "title": "...", "startedAt": "..." }
}
```

**Ad Document** (`ads/{id}`):
```json
{
  "adId": "Ad 01",
  "title": "Summer Sale",
  "company": "Coca-Cola",
  "category": "Retail",
  "budget": "50000",
  "start": "2025-06-01",
  "end": "2025-12-31",
  "status": "Active",
  "location": "Islamabad",
  "type": "Image|Video",
  "mediaBase64": "...",
  "mediaUrl": "https://...",
  "createdAt": "ISO"
}
```

**Campaign Document** (`campaigns/{id}`):
```json
{
  "name": "Summer Promotion",
  "cities": ["Islamabad", "Lahore"],
  "startDate": "ISO",
  "endDate": "ISO",
  "weekdays": { "mon": true, "tue": true },
  "ads": ["adDocId1", "adDocId2"],
  "vehicles": ["vehicleDocId1", "vehicleDocId2"],
  "mode": "manual"
}
```

---

## 2. Current Data Flow: Ad Creation → Vehicle Display

```
┌─────────────────────┐          ┌─────────────┐          ┌──────────────────┐
│   Admin Dashboard    │          │  Firestore   │          │   Vehicle PWA    │
│   (React + Vite)     │          │  (Cloud DB)  │          │   (React + Zustand)│
└─────────┬───────────┘          └──────┬──────┘          └────────┬─────────┘
          │                             │                          │
  1. Admin creates ad ─────────►  ads/{id} created                 │
     (title, media, dates)        (base64 or Storage URL)          │
          │                             │                          │
  2. Admin creates campaign ───►  campaigns/{id} created           │
     (selects ads + vehicles)           │                          │
          │                             │                          │
  3. Campaign submit writes ───►  vehicles/{id}.assignedAds = [    │
     ad refs to vehicle docs       {adId, startTime, endTime}     │
                                    ]                              │
          │                             │                          │
          │                             │    onSnapshot fires ────►│
          │                             │                          │
          │                             │◄─── Fetch ads/{adId} ───│
          │                             │     for each assigned ad │
          │                             │                          │
          │                             │                   Load into adQueue
          │                             │                   Display on 4 screens
          │                             │                   Rotate every 15 sec
          │                             │                          │
          │                      vehicles/{id}.location ◄──── GPS heartbeat
          │                      vehicles/{id}.lastHeartbeat       (every 30-60s)
```

### Current Playback Behavior (Vehicle PWA)

- **4-screen layout**: Top (60% height) + Bottom row (left 20% + center 60% + right 20%)
- **All 4 screens show the SAME ad** simultaneously
- Ads rotate every **15 seconds** sequentially through the queue
- Videos auto-play, loop, muted
- Images displayed with `object-contain`
- **No intelligence** — just cycles through whatever is in `assignedAds`

### Current AI Scheduler (`main.py`)

- **Round-robin only**: Assigns 3 ads per vehicle, cycling through all active ads
- Each assignment gets a 30-minute time slot (sequential)
- **No geo-targeting, no budget logic, no time-of-day logic, no priority system**
- Trigger: Called from dashboard via `POST /api/scheduler/run`

---

## 3. Existing Gaps & Limitations

### Critical Gaps for Ad Playback

| # | Gap | Impact |
|---|-----|--------|
| 1 | **No real analytics** — chart data is hardcoded mock data | Cannot track impressions, views, or ad performance |
| 2 | **No ad-to-vehicle targeting** — scheduler is naive round-robin | No smart distribution, no geo-fencing |
| 3 | **No impression tracking pipeline** — `sendImpression()` calls non-existent backend endpoint | Cannot count plays, cannot bill advertisers |
| 4 | **No budget tracking** — budget is a text string, never decremented | Cannot enforce spending limits |
| 5 | **No priority system** — all ads treated equally with no weight/tier | Premium advertisers get no advantage |
| 6 | **No equal visibility guarantee** — round-robin doesn't account for actual play counts | Some ads may get significantly more views |
| 7 | **Time-of-day scheduling unused** — weekday fields exist in campaigns but never applied | Cannot target rush hour, evening, etc. |
| 8 | **Ad caching implemented but unused** — IndexedDB cache in vehicle-app never invoked | Offline playback doesn't work |
| 9 | **Backend has only 2 endpoints** — heartbeat, location, impression, FCM endpoints don't exist | Vehicle-app API calls silently fail |
| 10 | **No campaign budget enforcement** — campaigns have budget field but it's cosmetic | Campaigns run indefinitely |

### Architectural Concerns

- Passwords stored in plain text in vehicle documents
- Images stored as base64 in Firestore (1MB document limit risk)
- Firestore rules are wide open (`allow read, write: if true`)
- Two duplicate ad form components with different field naming
- Firebase config hardcoded (no environment-based switching)

---

## 4. Approach 1: AI-Powered Smart Ad Scheduler

### Concept

Replace the naive round-robin scheduler with an **AI-driven ad assignment engine** that considers multiple factors when deciding which ads to play on which vehicles.

### Scoring Algorithm

Each ad-vehicle pair receives a **relevance score** based on weighted factors:

```
Score(ad, vehicle) = Σ (weight_i × factor_i)

Where factors include:
  - Geographic Match       (weight: 0.30) — Is the vehicle in the ad's target city/area?
  - Time Relevance         (weight: 0.20) — Is it the right time of day for this ad category?
  - Visibility Deficit     (weight: 0.25) — How underserved is this ad vs. its fair share?
  - Budget Remaining       (weight: 0.15) — Does this ad still have budget to spend?
  - Priority Tier          (weight: 0.10) — Is this a premium/priority ad?
```

### Implementation in `main.py`

```python
from fastapi import FastAPI
from firebase_admin import firestore
import numpy as np
from datetime import datetime, timezone

app = FastAPI()

# ─── Scoring Weights ───
WEIGHTS = {
    "geo_match": 0.30,
    "time_relevance": 0.20,
    "visibility_deficit": 0.25,
    "budget_remaining": 0.15,
    "priority_tier": 0.10,
}

# ─── Category → Best Hours Mapping ───
CATEGORY_PEAK_HOURS = {
    "Retail": [10, 11, 12, 13, 14, 15, 16, 17, 18],
    "Food & Beverage": [11, 12, 13, 18, 19, 20, 21],
    "Entertainment": [17, 18, 19, 20, 21, 22],
    "Technology": [9, 10, 11, 14, 15, 16],
    "Healthcare": [8, 9, 10, 11, 14, 15, 16],
    "Real Estate": [10, 11, 12, 15, 16, 17],
    "default": list(range(8, 22)),  # 8 AM to 10 PM
}

def calculate_geo_score(ad: dict, vehicle: dict) -> float:
    """Score 0-1 based on whether vehicle is in the ad's target location."""
    ad_location = ad.get("location", "").lower()
    vehicle_address = (vehicle.get("location", {}).get("address", "")).lower()
    vehicle_city = vehicle.get("city", "").lower()
    
    if not ad_location:
        return 0.5  # No geo preference — neutral
    
    if ad_location in vehicle_address or ad_location in vehicle_city:
        return 1.0  # Exact city match
    
    # Could add proximity-based scoring with lat/lon here
    return 0.2  # No match

def calculate_time_score(ad: dict) -> float:
    """Score 0-1 based on current hour vs. ad category peak hours."""
    category = ad.get("category", "default")
    peak_hours = CATEGORY_PEAK_HOURS.get(category, CATEGORY_PEAK_HOURS["default"])
    current_hour = datetime.now().hour
    
    if current_hour in peak_hours:
        return 1.0
    
    # Score decreases with distance from peak hours
    min_distance = min(abs(current_hour - h) for h in peak_hours)
    return max(0.1, 1.0 - (min_distance * 0.2))

def calculate_visibility_deficit(ad: dict, total_impressions: dict, total_ads: int) -> float:
    """Score 0-1: Higher when ad is underserved relative to fair share."""
    ad_id = ad.get("adId", "")
    ad_impressions = total_impressions.get(ad_id, 0)
    total = sum(total_impressions.values()) or 1
    
    fair_share = total / max(total_ads, 1)
    deficit = fair_share - ad_impressions
    
    # Normalize to 0-1 range
    if deficit > 0:
        return min(1.0, deficit / max(fair_share, 1))
    return 0.0  # Already got its fair share or more

def calculate_budget_score(ad: dict) -> float:
    """Score 0-1 based on remaining budget percentage."""
    try:
        total_budget = float(ad.get("budget", 0))
        spent = float(ad.get("budgetSpent", 0))
        if total_budget <= 0:
            return 0.0
        remaining_pct = (total_budget - spent) / total_budget
        return max(0.0, min(1.0, remaining_pct))
    except (ValueError, TypeError):
        return 0.5  # Default if budget is not a number

def calculate_priority_score(ad: dict) -> float:
    """Score 0-1 based on priority tier."""
    tier = ad.get("priorityTier", "standard")
    return {
        "critical": 1.0,   # Always-on, never rotated out
        "premium": 0.8,    # High frequency
        "standard": 0.5,   # Normal rotation
        "filler": 0.2,     # Low priority, fill empty slots
    }.get(tier, 0.5)

def compute_score(ad: dict, vehicle: dict, impressions: dict, total_ads: int) -> float:
    """Compute final weighted score for an ad-vehicle pair."""
    scores = {
        "geo_match": calculate_geo_score(ad, vehicle),
        "time_relevance": calculate_time_score(ad),
        "visibility_deficit": calculate_visibility_deficit(ad, impressions, total_ads),
        "budget_remaining": calculate_budget_score(ad),
        "priority_tier": calculate_priority_score(ad),
    }
    
    final_score = sum(WEIGHTS[k] * scores[k] for k in WEIGHTS)
    return round(final_score, 4)

@app.post("/api/scheduler/run")
async def run_ai_scheduler():
    """AI-powered ad scheduler that assigns ads to vehicles based on multi-factor scoring."""
    db = firestore.client()
    
    # Fetch all active ads and vehicles
    ads = [doc.to_dict() | {"_id": doc.id} for doc in db.collection("ads").where("status", "==", "Active").stream()]
    vehicles = [doc.to_dict() | {"_id": doc.id} for doc in db.collection("vehicles").where("status", "==", "Active").stream()]
    
    # Fetch impression counts from analytics
    impressions = {}
    for doc in db.collection("impressions").stream():
        data = doc.to_dict()
        ad_id = data.get("adId", "")
        impressions[ad_id] = impressions.get(ad_id, 0) + data.get("count", 0)
    
    total_ads = len(ads)
    assignments = []
    
    for vehicle in vehicles:
        # Score all ads for this vehicle
        scored_ads = []
        for ad in ads:
            score = compute_score(ad, vehicle, impressions, total_ads)
            scored_ads.append({"ad": ad, "score": score})
        
        # Sort by score (highest first), take top N ads
        scored_ads.sort(key=lambda x: x["score"], reverse=True)
        top_ads = scored_ads[:5]  # Assign top 5 ads per vehicle
        
        # Build assignment with time slots
        assigned = []
        slot_duration_minutes = 15  # Each ad gets 15-minute slot
        now = datetime.now(timezone.utc)
        
        for i, entry in enumerate(top_ads):
            ad = entry["ad"]
            start = now.replace(minute=(i * slot_duration_minutes) % 60)
            assigned.append({
                "adId": ad["_id"],
                "score": entry["score"],
                "startTime": start.isoformat(),
                "endTime": ad.get("end", ""),
                "assignedAt": now.isoformat(),
                "priorityTier": ad.get("priorityTier", "standard"),
            })
        
        # Write to vehicle document
        db.collection("vehicles").document(vehicle["_id"]).update({
            "assignedAds": assigned,
            "lastAssignmentUpdate": firestore.SERVER_TIMESTAMP,
        })
        
        assignments.append({
            "vehicleId": vehicle["_id"],
            "vehicleName": vehicle.get("vehicleName", ""),
            "adsAssigned": len(assigned),
        })
    
    return {"ok": True, "assignments": assignments, "totalVehicles": len(vehicles), "totalAds": len(ads)}
```

### How It Works

1. **Fetch all active ads and vehicles** from Firestore
2. **For each vehicle**, score every ad using the multi-factor scoring formula
3. **Assign top 5 highest-scoring ads** to each vehicle
4. **Write assignments** to each vehicle's `assignedAds` array in Firestore
5. **Vehicle PWA** receives real-time update via `onSnapshot` and starts playing

### Scheduler Trigger Options

| Trigger | Interval | Use Case |
|---------|----------|----------|
| Manual (Admin clicks "Run AI") | On-demand | Testing, emergency reassignment |
| Cron Job (Cloud Scheduler) | Every 30 minutes | Regular redistribution |
| Event-driven (Vehicle moves to new city) | Real-time | Dynamic geo-targeting |
| Campaign start/end | On event | New campaign activates |

---

## 5. Approach 2: Equal Visibility Algorithm

### Problem Statement

Without tracking, some ads naturally get more screen time than others. The goal is to guarantee that **every ad gets approximately equal total impressions** over a given time period, adjusted for their campaign duration.

### Fair Share Formula

```
FairShare(ad_i) = TotalImpressions / NumberOfActiveAds

CurrentShare(ad_i) = ImpressionCount(ad_i)

Deficit(ad_i) = FairShare(ad_i) - CurrentShare(ad_i)

Priority_Boost(ad_i) = max(0, Deficit(ad_i)) / FairShare(ad_i)
```

### Implementation: Impression-Weighted Rotation

Instead of simple sequential rotation (every 15 seconds), the vehicle-app should use **weighted random selection**:

```javascript
// vehicle-app/src/utils/fairRotation.js

/**
 * Selects the next ad to display based on impression deficit.
 * Ads with fewer impressions are more likely to be selected.
 * 
 * @param {Array} adQueue - Array of ad objects with impressionCount
 * @returns {Object} - Selected ad
 */
export function selectNextAd(adQueue) {
  if (adQueue.length === 0) return null;
  if (adQueue.length === 1) return adQueue[0];

  // Calculate total impressions across all ads
  const totalImpressions = adQueue.reduce((sum, ad) => sum + (ad.impressionCount || 0), 0);
  const fairShare = totalImpressions / adQueue.length;

  // Calculate deficit-based weights
  const weights = adQueue.map(ad => {
    const impressions = ad.impressionCount || 0;
    const deficit = fairShare - impressions;
    
    // Higher weight for underserved ads
    // Minimum weight of 1 so no ad is completely excluded
    return Math.max(1, deficit + fairShare);
  });

  // Normalize weights to probabilities
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const probabilities = weights.map(w => w / totalWeight);

  // Weighted random selection
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < adQueue.length; i++) {
    cumulative += probabilities[i];
    if (random <= cumulative) {
      return adQueue[i];
    }
  }

  return adQueue[adQueue.length - 1];
}

/**
 * Get visibility statistics for all ads
 * @param {Array} adQueue - Array of ads with impression data
 * @returns {Object} - Visibility metrics
 */
export function getVisibilityStats(adQueue) {
  const impressions = adQueue.map(ad => ad.impressionCount || 0);
  const total = impressions.reduce((a, b) => a + b, 0);
  const average = total / adQueue.length;
  
  // Gini coefficient — 0 means perfect equality, 1 means maximum inequality
  const sorted = [...impressions].sort((a, b) => a - b);
  const n = sorted.length;
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sorted[i];
  }
  const gini = total > 0 ? numerator / (n * total) : 0;

  return {
    totalImpressions: total,
    averagePerAd: Math.round(average),
    giniCoefficient: Math.round(gini * 1000) / 1000,
    equalityRating: gini < 0.1 ? "Excellent" : gini < 0.2 ? "Good" : gini < 0.3 ? "Fair" : "Poor",
    perAd: adQueue.map(ad => ({
      adId: ad.adId,
      title: ad.title,
      impressions: ad.impressionCount || 0,
      sharePercent: total > 0 ? Math.round(((ad.impressionCount || 0) / total) * 100) : 0,
      deviation: Math.round(((ad.impressionCount || 0) - average) / Math.max(average, 1) * 100),
    })),
  };
}
```

### How Equal Visibility Works End-to-End

```
  1. Vehicle-app tracks local impression count per ad
  2. On each rotation cycle (every 15 sec):
     a. Calculate fair share for each ad
     b. Compute deficit (fair_share - actual_impressions)
     c. Use deficit-weighted random selection
     d. Display the selected ad
     e. Increment local impression counter
  3. Every 5 minutes: Sync impression counts to Firestore
  4. Backend scheduler reads impression data → adjusts assignments
  5. Cycle continues with constantly-balanced visibility
```

### Guaranteed Outcomes

| Metric | Target | Mechanism |
|--------|--------|-----------|
| Max deviation from fair share | ≤ 10% | Deficit-weighted selection |
| Gini coefficient | < 0.1 | Continuous rebalancing |
| Recovery from imbalance | < 30 minutes | Aggressive boost for underserved ads |
| Zero-impression prevention | 100% | Minimum weight of 1 ensures all ads play |

---

## 6. Approach 3: Priority Ad System

### Problem Statement

Some advertisers pay more (premium tier). Their ads should get **guaranteed higher frequency and placement** while still maintaining fairness among same-tier ads.

### Priority Tier Definitions

| Tier | Display Frequency | Share Multiplier | Interruption | Removal |
|------|-------------------|------------------|--------------|---------|
| **Critical** | Always in rotation, never skipped | 3.0x | Can interrupt other tiers | Cannot be auto-removed |
| **Premium** | High frequency, preferred slots | 2.0x | Can interrupt Standard | Only manual removal |
| **Standard** | Normal rotation | 1.0x | No interruption | Normal rotation rules |
| **Filler** | Low frequency, fills empty slots | 0.5x | Never interrupts | First to be replaced |

### Priority-Weighted Fair Share

The equal visibility algorithm is modified to account for priority tiers:

```
WeightedFairShare(ad_i) = (TotalSlots × TierMultiplier(ad_i)) / Σ TierMultiplier(all_ads)
```

**Example with 4 ads (1000 total slot-seconds in a period):**

| Ad | Tier | Multiplier | Weighted Share | Impressions Target |
|----|------|------------|----------------|-------------------|
| Ad A | Critical | 3.0x | 3.0 / 7.0 = 42.9% | ~429 |
| Ad B | Premium | 2.0x | 2.0 / 7.0 = 28.6% | ~286 |
| Ad C | Standard | 1.0x | 1.0 / 7.0 = 14.3% | ~143 |
| Ad D | Standard | 1.0x | 1.0 / 7.0 = 14.3% | ~143 |

### Implementation

```javascript
// vehicle-app/src/utils/priorityRotation.js

const TIER_MULTIPLIERS = {
  critical: 3.0,
  premium: 2.0,
  standard: 1.0,
  filler: 0.5,
};

/**
 * Select next ad considering both priority tiers AND equal visibility.
 * Priority ads get proportionally more screen time.
 * Within the same tier, visibility is equalized.
 */
export function selectNextAdWithPriority(adQueue, lastPlayedAdId = null) {
  if (adQueue.length === 0) return null;
  if (adQueue.length === 1) return adQueue[0];

  // Calculate weighted total impressions target
  const totalMultiplier = adQueue.reduce(
    (sum, ad) => sum + (TIER_MULTIPLIERS[ad.priorityTier] || 1.0), 0
  );
  
  const totalImpressions = adQueue.reduce(
    (sum, ad) => sum + (ad.impressionCount || 0), 0
  );

  // For each ad, compute its weighted fair share and deficit
  const scored = adQueue.map(ad => {
    const multiplier = TIER_MULTIPLIERS[ad.priorityTier] || 1.0;
    const weightedShare = (totalImpressions * multiplier) / totalMultiplier;
    const actual = ad.impressionCount || 0;
    const deficit = weightedShare - actual;
    
    // Critical ads get minimum floor — never zero weight
    const minWeight = ad.priorityTier === 'critical' ? 5.0 : 
                      ad.priorityTier === 'premium' ? 2.0 : 1.0;
    
    const weight = Math.max(minWeight, deficit + weightedShare);
    
    // Slight penalty for just-played ad to avoid immediate repeat
    const repeatPenalty = ad.adId === lastPlayedAdId ? 0.3 : 1.0;
    
    return {
      ad,
      weight: weight * repeatPenalty,
      deficit,
      multiplier,
    };
  });

  // Weighted random selection
  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (const entry of scored) {
    cumulative += entry.weight;
    if (random <= cumulative) {
      return entry.ad;
    }
  }

  return scored[scored.length - 1].ad;
}
```

### Priority Rules Matrix

```
┌──────────────────────────────────────────────────────────┐
│                  PRIORITY AD RULES                       │
├──────────────┬───────────────────────────────────────────┤
│ Critical Ads │ • Always assigned to ALL vehicles         │
│              │ • Cannot be removed by scheduler          │
│              │ • Gets 3x share of impressions            │
│              │ • Plays first in any new session          │
│              │ • Never times out (runs until campaign    │
│              │   end date regardless of budget)          │
├──────────────┼───────────────────────────────────────────┤
│ Premium Ads  │ • Preferentially assigned to high-traffic │
│              │   vehicles (based on route analytics)     │
│              │ • Gets 2x share of impressions            │
│              │ • Plays during peak hours first           │
│              │ • Budget depletes at premium rate         │
├──────────────┼───────────────────────────────────────────┤
│ Standard Ads │ • Normal scheduler assignment             │
│              │ • Gets 1x fair share                      │
│              │ • Budget depletes at standard rate        │
│              │ • Can be replaced when slots are full     │
├──────────────┼───────────────────────────────────────────┤
│ Filler Ads   │ • Only assigned when slots are empty       │
│              │ • Gets 0.5x share                         │
│              │ • First to be replaced by higher tier     │
│              │ • No budget depletion (free/house ads)    │
└──────────────┴───────────────────────────────────────────┘
```

---

## 7. Approach 4: Real-Time Geo-Targeted Ad Serving

### Concept

Since each vehicle already reports its GPS location every 30 seconds, we can serve **location-aware ads** that change as vehicles move through different areas.

### Geo-Zone Definition

```javascript
// New Firestore collection: geoZones/{id}
{
  "name": "Blue Area Islamabad",
  "type": "commercial",
  "center": { "lat": 33.7294, "lon": 73.0931 },
  "radiusKm": 2.0,
  "demographics": ["professionals", "shoppers", "commuters"],
  "peakHours": [9, 10, 11, 12, 13, 14, 17, 18],
  "preferredCategories": ["Technology", "Food & Beverage", "Real Estate"]
}
```

### How It Works

```
Vehicle moves into "Blue Area Islamabad" zone
        │
        ▼
Backend detects zone change (from heartbeat location)
        │
        ▼
Queries ads matching:
  - location = "Islamabad"
  - category in ["Technology", "Food & Beverage", "Real Estate"]
  - status = "Active"
  - budget remaining > 0
        │
        ▼
Scores ads using AI algorithm (Approach 1)
        │
        ▼
Updates vehicle.assignedAds in real-time
        │
        ▼
Vehicle PWA receives onSnapshot → new ads load instantly
```

### Haversine Distance Check

```python
import math

def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two GPS coordinates in kilometers."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))

def get_vehicle_zone(lat, lon, zones):
    """Determine which geo-zone a vehicle is currently in."""
    for zone in zones:
        distance = haversine_km(lat, lon, zone["center"]["lat"], zone["center"]["lon"])
        if distance <= zone["radiusKm"]:
            return zone
    return None  # Vehicle is outside all defined zones
```

---

## 8. Approach 5: Hybrid AI + Rule-Based Engine

### Recommended Architecture

The best approach combines **all four previous approaches** into a single intelligent engine:

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID AD ENGINE                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Rule Engine   │  │ AI Scorer    │  │ Equal Visibility     │  │
│  │              │  │              │  │ Tracker              │  │
│  │ • Priority   │  │ • Geo match  │  │                      │  │
│  │   tiers      │  │ • Time score │  │ • Impression counts  │  │
│  │ • Budget     │  │ • Category   │  │ • Deficit calc       │  │
│  │   limits     │  │   relevance  │  │ • Gini monitoring    │  │
│  │ • Date       │  │ • Audience   │  │ • Rebalancing        │  │
│  │   ranges     │  │   profiling  │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ASSIGNMENT ORCHESTRATOR                     │   │
│  │                                                          │   │
│  │  1. Filter: Remove expired, exhausted-budget, inactive   │   │
│  │  2. Priority: Ensure critical/premium ads always present │   │
│  │  3. Score: AI multi-factor scoring for each ad-vehicle   │   │
│  │  4. Balance: Apply visibility deficit boost              │   │
│  │  5. Select: Top N ads per vehicle                        │   │
│  │  6. Assign: Write to Firestore vehicle documents         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              VEHICLE PLAYBACK ENGINE                     │   │
│  │                                                          │   │
│  │  1. Receive assigned ads via onSnapshot                  │   │
│  │  2. Separate: Critical → Premium → Standard → Filler    │   │
│  │  3. Build rotation queue with weighted time allocation   │   │
│  │  4. Track local impressions per ad                       │   │
│  │  5. Use deficit-weighted selection for next ad           │   │
│  │  6. Sync impression data to Firestore every 5 minutes   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Decision Flow

```
New scheduling cycle triggered
        │
        ├── 1. FILTER
        │     Remove ads where:
        │       • status != "Active"
        │       • current date outside start-end range
        │       • budgetSpent >= budget (if budget tracking enabled)
        │
        ├── 2. PRIORITY LOCK
        │     For each vehicle:
        │       • Always include ALL "critical" tier ads (guaranteed slots)
        │       • Reserve 60% of slots for "premium" and above
        │       • Remaining 40% for "standard" and "filler"
        │
        ├── 3. AI SCORING
        │     For remaining slots, score each eligible ad:
        │       score = geo(0.30) + time(0.20) + deficit(0.25) + budget(0.15) + priority(0.10)
        │
        ├── 4. VISIBILITY REBALANCING
        │     Apply deficit boost:
        │       • If ad has < 80% of fair share → boost score by 1.5x
        │       • If ad has < 50% of fair share → boost score by 2.5x
        │       • If ad has > 120% of fair share → reduce score by 0.5x
        │
        ├── 5. SELECTION
        │     Select top N ads per vehicle (N = max_ads_per_vehicle, default 5-8)
        │     Ensure at least 1 ad from each active campaign if possible
        │
        └── 6. ASSIGNMENT
              Write to vehicles/{id}.assignedAds
              Log to assignments collection
              Update analytics counters
```

---

## 9. Impression Tracking & Analytics Pipeline

### Current State

The vehicle-app has a `sendImpression()` function that calls a non-existent backend endpoint. No impression data is actually tracked.

### Proposed Impression Pipeline

```
Vehicle PWA                    Backend (FastAPI)              Firestore
───────────                    ─────────────────              ─────────
                                                              
Ad displays on screen    →     POST /api/v1/impressions  →   impressions/{id}
  {vehicleId, adId,            Validates & stores             {vehicleId, adId,
   timestamp, duration,                                        timestamp, duration,
   gpsLat, gpsLon,                                            location, zone}
   screenPosition}                                            
                                                              
Every 5 minutes:         →     POST /api/v1/impressions/batch → Batch write
  Send buffered array          More efficient than individual
  of impression events
                               
                               Periodically aggregate:         adAnalytics/{adId}
                               Cron every hour                 {totalImpressions,
                                                                impressionsByHour,
                                                                impressionsByZone,
                                                                impressionsByVehicle,
                                                                uniqueVehicles,
                                                                avgDurationSeconds}
```

### New Backend Endpoints Needed

```python
@app.post("/api/v1/impressions")
async def record_impression(data: ImpressionData):
    """Record a single ad impression from a vehicle."""
    db.collection("impressions").add({
        "vehicleId": data.vehicle_id,
        "adId": data.ad_id,
        "timestamp": firestore.SERVER_TIMESTAMP,
        "duration": data.duration_seconds,
        "location": {"lat": data.lat, "lon": data.lon},
        "zone": detect_zone(data.lat, data.lon),
    })
    
    # Increment counter on ad analytics document
    ad_ref = db.collection("adAnalytics").document(data.ad_id)
    ad_ref.set({
        "totalImpressions": firestore.Increment(1),
        "totalDuration": firestore.Increment(data.duration_seconds),
        "lastImpression": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    
    return {"ok": True}

@app.post("/api/v1/impressions/batch")
async def record_impressions_batch(data: list[ImpressionData]):
    """Record multiple impressions in a single batch write."""
    batch = db.batch()
    for impression in data:
        ref = db.collection("impressions").document()
        batch.set(ref, {
            "vehicleId": impression.vehicle_id,
            "adId": impression.ad_id,
            "timestamp": impression.timestamp,
            "duration": impression.duration_seconds,
            "location": {"lat": impression.lat, "lon": impression.lon},
        })
    batch.commit()
    return {"ok": True, "count": len(data)}

@app.get("/api/v1/analytics/ad/{ad_id}")
async def get_ad_analytics(ad_id: str):
    """Get aggregated analytics for a specific ad."""
    doc = db.collection("adAnalytics").document(ad_id).get()
    if doc.exists:
        return doc.to_dict()
    return {"totalImpressions": 0, "totalDuration": 0}

@app.get("/api/v1/analytics/visibility")
async def get_visibility_report():
    """Get equal visibility report across all active ads."""
    ads = [doc.to_dict() | {"_id": doc.id} for doc in db.collection("ads").where("status", "==", "Active").stream()]
    analytics = {doc.id: doc.to_dict() for doc in db.collection("adAnalytics").stream()}
    
    total_impressions = sum(a.get("totalImpressions", 0) for a in analytics.values())
    fair_share = total_impressions / max(len(ads), 1)
    
    report = []
    for ad in ads:
        ad_analytics = analytics.get(ad["_id"], {})
        impressions = ad_analytics.get("totalImpressions", 0)
        deviation = ((impressions - fair_share) / max(fair_share, 1)) * 100
        report.append({
            "adId": ad.get("adId"),
            "title": ad.get("title"),
            "company": ad.get("company"),
            "impressions": impressions,
            "fairShare": round(fair_share),
            "deviationPercent": round(deviation, 1),
            "status": "balanced" if abs(deviation) < 10 else "overserved" if deviation > 0 else "underserved",
        })
    
    # Calculate Gini coefficient
    values = sorted([r["impressions"] for r in report])
    n = len(values)
    total = sum(values) or 1
    gini = sum((2 * (i + 1) - n - 1) * v for i, v in enumerate(values)) / (n * total) if n > 0 else 0
    
    return {
        "totalImpressions": total_impressions,
        "totalAds": len(ads),
        "fairSharePerAd": round(fair_share),
        "giniCoefficient": round(gini, 3),
        "equalityRating": "Excellent" if gini < 0.1 else "Good" if gini < 0.2 else "Fair" if gini < 0.3 else "Poor",
        "ads": report,
    }
```

### Vehicle-Side Impression Tracking

```javascript
// vehicle-app/src/services/impressionTracker.js

const BUFFER_SIZE = 20;       // Send after 20 impressions
const FLUSH_INTERVAL = 300000; // Or every 5 minutes

class ImpressionTracker {
  constructor() {
    this.buffer = [];
    this.localCounts = {};  // { adId: count }
    
    // Auto-flush every 5 minutes
    setInterval(() => this.flush(), FLUSH_INTERVAL);
  }

  record(vehicleId, adId, durationSeconds, lat, lon) {
    this.buffer.push({
      vehicle_id: vehicleId,
      ad_id: adId,
      duration_seconds: durationSeconds,
      lat, lon,
      timestamp: new Date().toISOString(),
    });

    // Track locally for equal visibility
    this.localCounts[adId] = (this.localCounts[adId] || 0) + 1;

    if (this.buffer.length >= BUFFER_SIZE) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;
    
    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(`${API_BASE}/api/v1/impressions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
    } catch (err) {
      // Re-add to buffer on failure
      this.buffer.unshift(...batch);
      console.warn('Impression flush failed, will retry');
    }
  }

  getLocalCount(adId) {
    return this.localCounts[adId] || 0;
  }

  getAllCounts() {
    return { ...this.localCounts };
  }
}

export const impressionTracker = new ImpressionTracker();
```

---

## 10. Vehicle-Side Playback Engine Redesign

### Current Problem

The current `FourScreenLayout.jsx` uses a simple sequential rotation with `setInterval`. This needs to be upgraded to support:

1. Priority-aware rotation
2. Equal visibility tracking
3. Impression logging
4. Dynamic ad updates without interrupting playback
5. Offline resilience via IndexedDB cache

### Proposed Playback State Machine

```
                    ┌──────────────────────┐
                    │     INITIALIZING     │
                    │  Load assigned ads   │
                    │  Check cache         │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     SELECTING        │
        ┌──────────│  Run priority +      │
        │          │  visibility algorithm │
        │          └──────────┬───────────┘
        │                     │
        │          ┌──────────▼───────────┐
        │          │     DISPLAYING       │
        │          │  Show ad on screens  │──── Record impression
        │          │  Start timer         │     after full display
        │          └──────────┬───────────┘
        │                     │
        │                     │ Timer expires (15s image / video end)
        │                     │
        │          ┌──────────▼───────────┐
        │          │    TRANSITIONING     │
        │          │  Fade out / slide    │
        │          └──────────┬───────────┘
        │                     │
        └─────────────────────┘  (loop back to SELECTING)
        
        External events:
        • onSnapshot update → Merge new ads into queue
        • Network loss → Switch to cached ads
        • Critical ad arrives → Interrupt current, play immediately
```

### Playback Configuration

```javascript
// vehicle-app/src/config/playback.js

export const PLAYBACK_CONFIG = {
  // Display durations (milliseconds)
  IMAGE_DISPLAY_DURATION: 15000,    // 15 seconds for images
  VIDEO_DISPLAY_DURATION: null,     // null = play full video
  MIN_DISPLAY_DURATION: 5000,       // Minimum 5 seconds (for impressions to count)
  
  // Transition settings
  TRANSITION_DURATION: 500,         // 500ms fade transition
  TRANSITION_TYPE: 'fade',          // 'fade' | 'slide' | 'none'
  
  // Rotation settings
  MAX_ADS_IN_ROTATION: 10,         // Maximum ads loaded at once
  REPEAT_PREVENTION_COUNT: 2,      // Don't repeat last 2 ads
  
  // Priority settings
  CRITICAL_INTERRUPT_ENABLED: true, // Critical ads can interrupt playback
  CRITICAL_MIN_FREQUENCY: 3,       // Critical ad plays every 3rd cycle minimum
  
  // Impression tracking
  IMPRESSION_BUFFER_SIZE: 20,      
  IMPRESSION_FLUSH_INTERVAL: 300000, // 5 minutes
  MIN_VIEW_FOR_IMPRESSION: 3000,   // 3 seconds = counts as impression
  
  // Offline settings
  CACHE_ENABLED: true,
  CACHE_MAX_ADS: 50,
  CACHE_EXPIRY_HOURS: 24,
  
  // Sync settings
  HEARTBEAT_INTERVAL: 60000,       // 1 minute
  LOCATION_INTERVAL: 30000,        // 30 seconds
  ANALYTICS_SYNC_INTERVAL: 300000, // 5 minutes
};
```

---

## 11. Budget Management & Pay-Per-Impression

### Current State

Budget is stored as a text string (e.g., `"50000"`) in the ad document. It is never decremented or checked.

### Proposed Budget System

```javascript
// New fields on ad document
{
  "budget": 50000,                 // Total budget (PKR) — convert to number
  "budgetSpent": 0,                // Running total spent
  "costPerImpression": 0.50,       // PKR per impression (based on tier)
  "budgetAlertThreshold": 0.80,    // Alert at 80% spent
  "budgetAction": "pause",         // What happens at 100%: "pause" | "notify" | "continue"
}
```

### Cost Per Impression by Tier

| Priority Tier | Cost Per Impression (PKR) | Rationale |
|---------------|---------------------------|-----------|
| Critical | 2.00 | 3x visibility guarantee |
| Premium | 1.00 | 2x preferred placement |
| Standard | 0.50 | Normal rotation |
| Filler | 0.00 | House ads, free |

### Budget Enforcement Flow

```
Impression recorded
        │
        ▼
Calculate cost: CPM × tier_multiplier
        │
        ▼
Update ad document:
  budgetSpent += cost
        │
        ▼
Check: budgetSpent >= budget?
  │
  ├── NO → Continue running
  │
  └── YES → Check budgetAction:
        │
        ├── "pause" → Set ad status = "Paused (Budget Exhausted)"
        │              Remove from all vehicle assignments
        │              Create alert in alerts collection
        │
        ├── "notify" → Send alert to admin
        │               Continue running (advertiser pays overage)
        │
        └── "continue" → Just log, keep running
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Add `priorityTier` field to ad creation form | High | 2 hours |
| Convert budget to number type, add `budgetSpent`, `costPerImpression` | High | 3 hours |
| Implement impression tracking backend endpoints | High | 8 hours |
| Implement `ImpressionTracker` in vehicle-app | High | 4 hours |
| Activate IndexedDB ad caching (already implemented) | Medium | 2 hours |
| Add heartbeat/location/impression endpoints to `main.py` | High | 6 hours |

### Phase 2: AI Scheduler (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Implement multi-factor scoring algorithm in `main.py` | High | 12 hours |
| Add geo-zone collection and management UI | Medium | 8 hours |
| Implement priority-aware ad assignment | High | 6 hours |
| Set up Cloud Scheduler cron (every 30 min) | Medium | 2 hours |
| Implement event-driven reassignment on zone change | Low | 8 hours |

### Phase 3: Equal Visibility (Week 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Implement deficit-weighted rotation in vehicle-app | High | 6 hours |
| Build visibility analytics dashboard panel | Medium | 8 hours |
| Add Gini coefficient monitoring | Low | 4 hours |
| Implement rebalancing alerts | Medium | 3 hours |
| Add visibility report API endpoint | Medium | 4 hours |

### Phase 4: Budget & Polish (Week 7-8)

| Task | Priority | Effort |
|------|----------|--------|
| Implement budget tracking and depletion | High | 6 hours |
| Add budget exhaustion alerts and auto-pause | High | 4 hours |
| Replace mock analytics with real impression data | High | 8 hours |
| Implement playback state machine in vehicle-app | Medium | 10 hours |
| Security: hash vehicle passwords, tighten Firestore rules | High | 4 hours |
| End-to-end testing | High | 8 hours |

### Total Estimated Effort: ~120 hours (8 weeks at ~15 hours/week)

---

## 13. Firestore Schema Changes

### Modified Collections

**`ads/{id}` — New Fields:**
```json
{
  "priorityTier": "standard|premium|critical|filler",
  "budget": 50000,
  "budgetSpent": 0,
  "costPerImpression": 0.50,
  "budgetAlertThreshold": 0.80,
  "budgetAction": "pause|notify|continue",
  "targetZones": ["zone-id-1", "zone-id-2"],
  "targetDemographics": ["professionals", "students"],
  "peakHoursOnly": false
}
```

**`vehicles/{id}` — New Fields:**
```json
{
  "currentZone": "zone-id-1",
  "routeHistory": [
    { "zone": "zone-id-1", "enteredAt": "ISO", "exitedAt": "ISO" }
  ],
  "lifetimeImpressions": 1500,
  "todayImpressions": 45
}
```

### New Collections

**`impressions/{id}`** — Individual impression events:
```json
{
  "vehicleId": "vehicle-doc-id",
  "adId": "ad-doc-id",
  "campaignId": "campaign-doc-id",
  "timestamp": "Timestamp",
  "durationSeconds": 15,
  "location": { "lat": 33.7, "lon": 73.0 },
  "zone": "zone-id-1",
  "screenPosition": "all",
  "wasFullView": true
}
```

**`adAnalytics/{adId}`** — Aggregated per-ad analytics:
```json
{
  "totalImpressions": 15420,
  "totalDurationSeconds": 231300,
  "uniqueVehicles": 45,
  "impressionsByHour": { "0": 120, "1": 80, "8": 450, "17": 890 },
  "impressionsByZone": { "zone-1": 3200, "zone-2": 5100 },
  "impressionsByDay": { "2025-06-01": 520, "2025-06-02": 610 },
  "lastImpression": "Timestamp",
  "avgDurationSeconds": 14.8,
  "budgetUtilization": 0.65
}
```

**`geoZones/{id}`** — Geographic targeting zones:
```json
{
  "name": "Blue Area Islamabad",
  "type": "commercial|residential|highway|educational",
  "center": { "lat": 33.7294, "lon": 73.0931 },
  "radiusKm": 2.0,
  "demographics": ["professionals", "shoppers"],
  "peakHours": [9, 10, 11, 12, 17, 18],
  "preferredCategories": ["Technology", "Real Estate"],
  "trafficDensity": "high|medium|low",
  "estimatedDailyReach": 50000
}
```

**`visibilitySnapshots/{date}`** — Daily visibility reports:
```json
{
  "date": "2025-06-15",
  "totalImpressions": 45000,
  "totalActiveAds": 25,
  "fairSharePerAd": 1800,
  "giniCoefficient": 0.08,
  "equalityRating": "Excellent",
  "underservedAds": ["ad-id-1"],
  "overservedAds": ["ad-id-5"],
  "maxDeviation": 8.5,
  "adBreakdown": [
    { "adId": "...", "impressions": 1750, "deviationPercent": -2.8, "status": "balanced" }
  ]
}
```

---

## 14. API Endpoints Required

### Existing (keep)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/api/scheduler/run` | Trigger AI scheduler (upgrade algorithm) |

### New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/impressions` | Record single impression |
| POST | `/api/v1/impressions/batch` | Record batch of impressions |
| POST | `/api/v1/device/heartbeat` | Vehicle heartbeat with location |
| POST | `/api/v1/device/location` | Vehicle GPS update |
| GET | `/api/v1/analytics/ad/{ad_id}` | Per-ad analytics |
| GET | `/api/v1/analytics/visibility` | Equal visibility report |
| GET | `/api/v1/analytics/vehicle/{vehicle_id}` | Per-vehicle analytics |
| GET | `/api/v1/zones` | List all geo-zones |
| POST | `/api/v1/zones/detect` | Detect zone from lat/lon |
| GET | `/api/v1/scheduler/status` | Last scheduler run info |
| POST | `/api/v1/budget/check` | Check & update budget for an ad |

---

## 15. Summary & Recommendation

### Recommended Approach: Hybrid AI + Rule-Based Engine (Approach 5)

This combines all capabilities into one unified system:

| Feature | Mechanism |
|---------|-----------|
| **Ad Playback** | Vehicle PWA receives assignments via Firestore `onSnapshot`, plays ads in a priority-aware rotation |
| **AI Integration** | Multi-factor scoring algorithm (geo + time + deficit + budget + priority) runs every 30 minutes server-side |
| **Equal Visibility** | Deficit-weighted random selection at vehicle level + server-side Gini coefficient monitoring |
| **Priority Ads** | Tier system (Critical/Premium/Standard/Filler) with multiplied fair-share and guaranteed slots |
| **Geo-Targeting** | Real-time zone detection from GPS, location-aware ad assignment |
| **Budget Control** | Per-impression cost tracking, auto-pause on depletion, tiered pricing |
| **Analytics** | Full impression pipeline: buffered tracking → batch upload → hourly aggregation → dashboard |

### Critical Path Priority

```
1. Impression tracking (without data, nothing else works)
   └► Backend endpoints + Vehicle-side tracker

2. Priority tier system (immediate business value)
   └► Ad form field + Assignment logic

3. Equal visibility algorithm (fairness guarantee)
   └► Deficit-weighted rotation + Monitoring

4. AI scoring engine (intelligent distribution)
   └► Multi-factor scorer + Cron scheduler

5. Geo-targeting (advanced feature)
   └► Zone management + Real-time reassignment

6. Budget system (monetization)
   └► Cost tracking + Auto-pause + Alerts
```

### Key Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| Ad visibility equality (Gini) | < 0.1 | Daily snapshot |
| Impression delivery rate | > 95% of scheduled | Impressions vs assignments |
| Average ad display time | ≥ 12 seconds | Impression duration |
| Critical ad guarantee | 100% inclusion | Assignment audits |
| Budget accuracy | ± 2% | Budgeted vs actual spend |
| Scheduler latency | < 5 seconds | Run time measurement |
| Vehicle-side cache hit rate | > 80% offline | Cache analytics |

---

> **Document Version:** 1.0  
> **Generated:** Based on deep analysis of AdMotion codebase  
> **Scope:** Admin Dashboard (`src/`), Vehicle PWA (`vehicle-app/`), Backend (`main.py`), Firestore schema  
> **Files Analyzed:** 50+ source files across all three systems
