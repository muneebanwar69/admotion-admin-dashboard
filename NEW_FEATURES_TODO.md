# AdMotion - New Features Worth Implementing

> Only features NOT yet in the codebase. Ranked by real value to your FYP evaluation.

---

## TIER 1 — Game Changers (Do These First)

### 1. Impression Heatmap on Map
Show a color-coded overlay on the fleet map — red zones = most ad views, blue = least. Built from GPS + impression data already being collected.
- **Tech:** Leaflet.heat plugin (lightweight, works with existing map)
- **Data source:** `impressions` collection already has `vehicleId` + `timestamp`, combine with vehicle GPS
- **Effort:** ~2 hours
- **Why it matters:** Advertisers pay more for high-traffic zones. This is the #1 feature real DOOH platforms sell.

### 2. Live Public Campaign Tracker
A public page (no login required) where an advertiser can see their campaign live — which vehicles are showing their ad right now, on a map.
- **Route:** `/public/track/{campaignId}`
- **Tech:** Read-only Firebase listener, Leaflet map, no auth needed
- **Effort:** ~3 hours
- **Why it matters:** This is your sales pitch. "Give this link to any client and they can watch their ad move around the city in real-time."

### 3. ROI Calculator + Campaign Analytics
For each campaign show: total spend, total impressions, estimated audience reach, cost per impression (CPI), cost per thousand (CPM). Compare against industry benchmarks.
- **Tech:** Pure computation from existing `impressions` + `ads` data
- **Effort:** ~2 hours
- **Why it matters:** Every evaluator will ask "how do you measure success?" — this answers it with numbers.

### 4. Invoice PDF Generation
Auto-generate a monthly PDF invoice per vehicle/driver showing: contract rate, hours displayed, amount earned, deductions, net payable.
- **Tech:** Browser print API (already used in Analytics PDF export)
- **Effort:** ~2 hours
- **Why it matters:** Completes the business cycle — registration → display → earnings → invoice → payment.

### 5. Driver Leaderboard with Gamification
Rank all drivers by: uptime %, total hours, impressions generated. Award badges: Gold (>95% uptime), Silver (>80%), Bronze (>60%).
- **Tech:** Query `vehicles` collection, sort by `totalHoursOnline`, compute uptime %
- **Effort:** ~3 hours
- **Why it matters:** Gamification drives engagement — evaluators love behavioral design thinking.

---

## TIER 2 — Strong Differentiators

### 6. Route Replay with Timeline
For any vehicle, replay its route on any past day. Timeline slider at the bottom, map animates the vehicle moving, sidebar shows which ad was playing at each point.
- **Tech:** Store GPS history in a subcollection `vehicles/{id}/gpsHistory`. Read + animate on Leaflet.
- **Effort:** ~4 hours (needs GPS history storage first)
- **Why it matters:** Proof of delivery — advertisers can verify their ad was shown where promised.

### 7. Geofence Zone Targeting
Admin draws polygon zones on the map ("University Zone", "Mall Area"). Ads can target specific zones. Track impressions per zone.
- **Tech:** Leaflet.draw plugin for polygon creation, point-in-polygon check on GPS data
- **Effort:** ~4 hours
- **Why it matters:** Location-based targeting is the core value proposition of vehicle advertising.

### 8. Speed-Aware Ad Selection
When vehicle is stopped (traffic/signal), show longer video ads. When moving, show short image ads. Already have GPS — just compute speed from consecutive points.
- **Tech:** Speed = distance between last 2 GPS points / time delta. If <5 km/h = stopped.
- **Effort:** ~2 hours
- **Why it matters:** Adaptive content delivery — shows intelligence in the system.

### 9. Campaign Calendar View
Visual week/month calendar showing ad schedules per vehicle. Color-coded blocks for different campaigns. Drag to reschedule.
- **Tech:** CSS grid or a lightweight calendar lib, read from `assignedAds` on vehicle docs
- **Effort:** ~4 hours
- **Why it matters:** Visual scheduling is how every real ad platform works. Tables are not enough.

### 10. Push Notifications (FCM)
Real push notifications to driver's phone: "New ad assigned", "Payment processed", "Your screen is offline".
- **Tech:** Firebase Cloud Messaging — free, works with PWA
- **Effort:** ~3 hours
- **Why it matters:** Makes the driver app feel like a real native app, not just a website.

---

## TIER 3 — Technical Showcases

### 11. QR Code Overlay on Ads
Auto-generate a QR code for each ad that links to the advertiser's website. Overlay it in the corner of the display. Track scans as "engagements".
- **Tech:** `qrcode` npm package, display player renders QR in corner
- **Effort:** ~2 hours
- **Why it matters:** Connects offline advertising to online engagement — measurable CTR for outdoor ads.

### 12. Anomaly Detection
Flag suspicious patterns: vehicle GPS jumping cities, impression count 10x higher than average, screen reported active but no GPS movement for 24h.
- **Tech:** Simple statistical thresholds on existing data
- **Effort:** ~3 hours
- **Why it matters:** Fraud prevention — shows you think about system integrity.

### 13. Predictive Impression Estimator
Before launching a campaign, predict: "If you run this ad on 5 vehicles for 7 days, estimated impressions = X based on historical data."
- **Tech:** Average impressions per vehicle per day from `impressions` collection × vehicles × days
- **Effort:** ~2 hours
- **Why it matters:** Evaluators love predictions. Even a simple one backed by data is impressive.

### 14. Two-Factor Authentication (2FA)
TOTP-based 2FA for admin login. Show QR code for Google Authenticator setup. Verify 6-digit code on login.
- **Tech:** `otplib` npm package for TOTP generation/verification
- **Effort:** ~3 hours
- **Why it matters:** Security feature that every evaluator expects in a production system.

### 15. Shareable Earnings Card
Driver generates a visual "earnings card" (styled image) showing their monthly performance. One tap to share on WhatsApp.
- **Tech:** HTML-to-canvas (`html2canvas`) → download as image → share via Web Share API
- **Effort:** ~2 hours
- **Why it matters:** Viral driver recruitment — "look how much I earned with AdMotion."

---

## TIER 4 — Extra Credit

### 16. Multi-Language (English + Urdu)
Full Urdu translation with RTL layout support. Language toggle in settings.
- **Tech:** `react-i18next` with JSON translation files
- **Effort:** ~5 hours (translation work)
- **Why it matters:** Pakistan market relevance — shows localization awareness.

### 17. Voice Command Navigation
"Show me active vehicles" → navigates to vehicles page filtered by active. Uses Web Speech API.
- **Tech:** `window.SpeechRecognition` — free, no API key needed
- **Effort:** ~3 hours
- **Why it matters:** Accessibility + futuristic interface. Big demo wow factor.

### 18. Advertiser Self-Service Portal
A separate login for advertisers (not admins). They can: upload ads, set budget, choose target areas, view their campaign performance.
- **Tech:** New Firestore collection `advertisers`, new routes `/advertiser/*`
- **Effort:** ~8 hours
- **Why it matters:** Three-sided platform (admin + driver + advertiser) = complete ecosystem.

### 19. Automated A/B Testing
Create 2 versions of an ad → assign each to different vehicles → after 7 days, auto-promote the one with more impressions.
- **Tech:** Store variant info on ad doc, compare impression counts per variant
- **Effort:** ~4 hours
- **Why it matters:** Data-driven marketing — evaluators love evidence-based decision making.

### 20. Screen Health Dashboard
Display player reports: GPS signal strength, network latency, storage remaining, screen resolution, uptime streak. Admin sees a "health score" (0-100) per device.
- **Tech:** `navigator.connection`, `navigator.storage.estimate()`, computed score
- **Effort:** ~3 hours
- **Why it matters:** Shows you think about real-world deployment — devices fail, and you plan for it.

---

## What NOT to Build

These sound cool but add no real value for FYP:
- ~~AR Preview~~ — WebXR is buggy and demo-unreliable
- ~~Blockchain audit trail~~ — Overkill, regular logging is fine
- ~~Payment gateway~~ — JazzCash API approval takes weeks, can't demo it
- ~~Google Maps~~ — Leaflet already works great, switching adds no value
- ~~Social media auto-post~~ — Needs OAuth approvals, can't demo reliably

---

## Recommended Build Order (4-Day Sprint)

| Day | Features | Hours |
|-----|----------|-------|
| Day 1 | Heatmap (#1) + ROI Calculator (#3) + Predictive Estimator (#13) | ~6h |
| Day 2 | Public Tracker (#2) + Invoice PDF (#4) + Shareable Card (#15) | ~7h |
| Day 3 | Leaderboard (#5) + Speed-Aware Ads (#8) + QR Codes (#11) | ~7h |
| Day 4 | Route Replay (#6) + Anomaly Detection (#12) + 2FA (#14) | ~8h |

**After 4 days you'll have 12 new features — your project will be untouchable.**
