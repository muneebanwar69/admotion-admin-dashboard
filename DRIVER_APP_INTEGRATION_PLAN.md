# AdMotion - Driver App Integration Plan

## Can We Combine Vehicle App + Driver App Into One?

**YES — and we SHOULD.** Here's why and how.

---

## The Architecture: One App, Two Interfaces

Instead of building two separate apps, we build **one unified PWA** with **role-based views**:

```
┌─────────────────────────────────────────────────────────┐
│                  AdMotion Unified App                     │
│                  (Single React PWA)                       │
├─────────────────────┬───────────────────────────────────┤
│                     │                                     │
│   DRIVER VIEW       │     DISPLAY VIEW                   │
│   (Phone/Tablet)    │     (Roof Screen - Android TV)     │
│                     │                                     │
│  • Login/Auth       │  • Full-screen ad playback         │
│  • Route map        │  • Auto-advances ads               │
│  • Earnings         │  • No login UI (auto-auth)         │
│  • Current ad info  │  • Heartbeat to Firebase           │
│  • Alerts           │  • Offline fallback ads             │
│  • Notifications    │  • GPS signal → Firebase           │
│  • Profile          │  • NO driver controls              │
│                     │                                     │
└─────────────────────┴───────────────────────────────────┘
          │                         │
          └────────┬────────────────┘
                   │
           Firebase Backend
           (Shared Firestore, Auth, Storage)
```

### Why Combine?

| Benefit | Details |
|---------|---------|
| **Single codebase** | One repo, one deployment pipeline, shared components |
| **Shared Firebase config** | Same Firestore rules, same auth system, same collections |
| **Shared services** | Activity logger, alerts, scheduling — all reused |
| **Consistent design** | Same Tailwind theme, same glassmorphism style |
| **Easier maintenance** | Fix once, works everywhere |
| **PWA = installable** | Driver installs on phone like a native app, display runs in kiosk mode |

---

## How It Works: The Signal Flow

```
                    ┌──────────────────┐
                    │   FIREBASE        │
                    │   (Cloud)         │
                    │                   │
                    │  • ads collection  │
                    │  • assignments     │
                    │  • vehicles        │
                    │  • impressions     │
                    │  • drivers         │
                    └────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  ADMIN      │  │  DRIVER    │  │  ROOF      │
     │  DASHBOARD  │  │  PHONE     │  │  SCREEN    │
     │  (Desktop)  │  │  (PWA)     │  │  (TV Box)  │
     │             │  │            │  │            │
     │  Manages    │  │  Views     │  │  Plays     │
     │  everything │  │  status    │  │  ads       │
     │             │  │  earnings  │  │  Sends GPS │
     │             │  │  alerts    │  │  Sends     │
     │             │  │  NO ad     │  │  heartbeat │
     │             │  │  playback  │  │  Logs      │
     │             │  │            │  │  impressions│
     └────────────┘  └────────────┘  └────────────┘
```

### Critical Rule: Ads NEVER Play on Driver's Phone

The driver's phone is a **monitoring and control interface only**. Here's why:

1. **Safety** — Drivers should not be distracted by ads on their phone screen
2. **Signal source** — GPS and impression data come from the **roof screen's TV box**, not the phone
3. **Bandwidth** — Video ads would drain the driver's mobile data
4. **Accuracy** — The TV box is physically mounted on the vehicle, so its GPS is the vehicle's true location

### How the Roof Screen Works (Independent of Phone)

```
┌─────────────────────────────────────────────┐
│           ROOF-MOUNTED LED SCREEN            │
│         (Android TV Box Inside)              │
│                                              │
│  1. TV Box boots → opens PWA in kiosk mode   │
│  2. Auto-authenticates with device token      │
│  3. Connects to Firebase (4G SIM card)        │
│  4. Fetches assigned ads for this vehicle     │
│  5. Downloads media assets to local cache     │
│  6. Plays ads in rotation (full-screen)       │
│  7. Sends GPS coordinates every 30 seconds    │
│  8. Logs impressions (ad + location + time)   │
│  9. Sends heartbeat every 60 seconds          │
│ 10. If offline → plays cached/default ads     │
│                                              │
│  ⚠️  NO connection to driver's phone needed   │
│  ⚠️  Works completely independently            │
│  ⚠️  Has its own 4G SIM for connectivity      │
└─────────────────────────────────────────────┘
```

---

## Unified App Routing Structure

```
/                         → Landing / Role selection
/login                    → Unified login (detects role)
/driver/*                 → Driver phone interface
  /driver/dashboard       → Driver home (earnings, current status)
  /driver/route           → Live route map
  /driver/earnings        → Detailed earnings breakdown
  /driver/ads             → View current/upcoming ads (info only, no playback)
  /driver/alerts          → Driver-specific alerts
  /driver/profile         → Driver profile & settings
  /driver/support         → Help & contact

/display/*                → Roof screen interface
  /display/play           → Full-screen ad player (kiosk mode)
  /display/setup          → One-time device registration
  /display/diagnostics    → Screen health check (admin access only)

/dashboard/*              → Existing admin dashboard (unchanged)
  /dashboard              → Admin home
  /vehicles               → Vehicle management
  /ads                    → Ad management
  /scheduling             → Campaign scheduling
  /analytics              → Analytics
  ... (all existing routes)
```

---

## Firebase Collections (New + Modified)

### New Collection: `drivers`

```javascript
{
  id: "driver_abc123",
  name: "Ahmed Khan",
  phone: "+923001234567",
  email: "ahmed@email.com",
  cnic: "35201-1234567-1",
  licenseNo: "LHR-2024-12345",
  licenseExpiry: "2027-05-15",
  profileImage: "https://storage.../driver_abc.jpg",

  // Vehicle assignment
  assignedVehicleId: "VEH-001",
  assignedVehiclePlate: "LEA-1234",

  // Status
  status: "active", // active, inactive, on_break, suspended
  isOnline: true,
  lastSeen: Timestamp,
  currentLocation: { lat: 31.5204, lng: 74.3587 },

  // Earnings
  totalEarnings: 45000,
  currentMonthEarnings: 12000,
  pendingPayout: 5000,
  payoutMethod: "jazzcash", // jazzcash, easypaisa, bank
  payoutDetails: { accountNo: "03001234567" },

  // Performance
  totalTrips: 234,
  totalHoursOnline: 1560,
  rating: 4.8,
  adUptime: 96.5, // percentage

  // Auth
  passwordHash: "bcrypt...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Modified Collection: `vehicles`

```javascript
{
  // ... existing fields ...

  // NEW: Link to driver
  assignedDriverId: "driver_abc123",
  assignedDriverName: "Ahmed Khan",

  // NEW: Device info for roof screen
  displayDevice: {
    deviceId: "tv_box_xyz",
    deviceToken: "auto_auth_token_...",
    firmwareVersion: "2.1.0",
    lastHealthCheck: Timestamp,
    screenResolution: "1920x480",
    storageUsed: "2.4GB",
    storageFree: "5.6GB",
    simICCID: "8992...",
    signalStrength: -67, // dBm
    brightness: 85 // percentage
  }
}
```

### New Collection: `driverEarnings`

```javascript
{
  id: "earning_001",
  driverId: "driver_abc123",
  vehicleId: "VEH-001",
  date: "2026-03-15",

  hoursOnline: 8.5,
  adsDisplayed: 145,
  impressions: 12400,

  grossRevenue: 2500,
  platformFee: 750,    // 30%
  netEarning: 1750,

  status: "pending", // pending, paid, disputed
  paidAt: null,

  createdAt: Timestamp
}
```

---

## Driver Phone PWA Features

### 1. Driver Dashboard (Home)
- Today's earnings (live counter)
- Current ad playing on roof screen (name + thumbnail, NOT the actual ad)
- Vehicle status indicator (online/offline)
- Hours online today
- Quick stats: trips, impressions, uptime percentage
- Alerts badge

### 2. Live Route Map
- Real-time vehicle position on map (from roof TV box GPS, NOT phone GPS)
- Route history trail
- Geofence zones highlighted
- Points of interest markers
- Traffic overlay

### 3. Earnings Center
- Daily / Weekly / Monthly earnings breakdown
- Earnings graph (line chart)
- Payout history
- Pending payouts
- Payment method settings (JazzCash/Easypaisa/Bank)

### 4. Ad Schedule View
- Today's ad schedule (what plays when)
- Upcoming campaigns
- Ad info cards (title, advertiser, duration) — NO playback on phone
- Campaign countdown timers

### 5. Alerts & Notifications
- Push notifications for:
  - New ad assigned to vehicle
  - Payout processed
  - Roof screen offline alert
  - Maintenance reminder
  - New message from admin
- Alert history with read/unread status

### 6. Driver Profile
- Personal info
- License & document uploads
- Performance score
- Rating & feedback
- Vehicle assignment info

### 7. Support & Help
- FAQ section
- Report an issue
- Contact admin (in-app messaging)
- Hardware troubleshooting guide

---

## Technical Implementation

### Device Detection & Auto-Routing

```javascript
// In App.jsx — detect device type and route accordingly
const getDeviceMode = () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Explicit mode from URL (for TV box kiosk setup)
  if (urlParams.get('mode') === 'display') return 'display';

  // Check localStorage (set during first setup)
  const savedMode = localStorage.getItem('admotion_device_mode');
  if (savedMode) return savedMode;

  // Auto-detect: Android TV / large landscape = display mode
  const isAndroidTV = /Android TV|BRAVIA|AFT/i.test(navigator.userAgent);
  const isKiosk = window.matchMedia('(display-mode: fullscreen)').matches;

  if (isAndroidTV || isKiosk) return 'display';

  // Default: check if user is driver or admin
  return null; // Let login flow decide
};
```

### Roof Screen: Kiosk Mode Setup

```javascript
// The TV box opens the PWA with: https://admotion.web.app?mode=display&device=VEH-001
//
// This triggers:
// 1. Auto-auth using stored device token
// 2. Full-screen kiosk mode (no browser chrome)
// 3. Ad playback loop begins
// 4. GPS tracking starts (from TV box, NOT phone)
// 5. Heartbeat reporting starts
// 6. Impression logging starts
```

### Driver Auth Flow

```javascript
// Driver login is separate from admin login
// Drivers use phone number + password (or OTP)
//
// After login:
// 1. Fetch driver profile from 'drivers' collection
// 2. Fetch assigned vehicle details
// 3. Subscribe to real-time updates:
//    - Vehicle status (from roof screen heartbeat)
//    - Current ad playing (from assignments)
//    - Earnings (from driverEarnings)
//    - Alerts (from alerts collection, filtered by driverId)
```

### Important: GPS Signal Source

```
❌ WRONG: Driver phone sends GPS → Firebase → used for ad targeting
✅ RIGHT: Roof TV box sends GPS → Firebase → used for ad targeting

Why?
- TV box is PHYSICALLY ATTACHED to the vehicle
- Phone might be at home, in pocket, or anywhere
- TV box GPS = vehicle's true location
- Driver phone just READS the location from Firebase to show on map
```

---

## PWA Configuration

### manifest.json (Updated)

```json
{
  "name": "AdMotion",
  "short_name": "AdMotion",
  "description": "Vehicle Advertising Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B1452",
  "theme_color": "#0B1452",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "shortcuts": [
    {
      "name": "My Earnings",
      "url": "/driver/earnings",
      "icon": "/icons/earnings.png"
    },
    {
      "name": "Route Map",
      "url": "/driver/route",
      "icon": "/icons/map.png"
    }
  ]
}
```

### Service Worker Strategy

```
DRIVER PHONE (PWA):
  - Cache: App shell, static assets, Tailwind CSS
  - Network-first: Earnings data, alerts, vehicle status
  - Offline: Show cached dashboard with "last updated" timestamp
  - Push notifications: Via Firebase Cloud Messaging (FCM)

ROOF SCREEN (DISPLAY):
  - Cache: Ad media assets (videos/images) — aggressive caching
  - Pre-fetch: Download next 10 ads in advance
  - Offline: Play cached ads in rotation (never show blank screen)
  - Background sync: Queue impressions, upload when online
```

---

## Mobile-First Responsive Design

### Driver Phone UI Principles

```
1. BOTTOM NAVIGATION BAR (thumb-friendly)
   [🏠 Home]  [🗺️ Route]  [💰 Earnings]  [🔔 Alerts]  [👤 Profile]

2. CARD-BASED LAYOUT
   - Large touch targets (min 48px)
   - Swipe gestures for navigation
   - Pull-to-refresh on all screens
   - Smooth animations (Framer Motion)

3. COLOR SCHEME (matches admin dashboard)
   - Primary: #0B1452 (deep navy)
   - Accent: #3b82f6 (blue)
   - Earnings: #14b8a6 (teal/green)
   - Alerts: #f59e0b (orange)
   - Background: #f0f4f8 (light) / #0f172a (dark)
   - Glassmorphism cards with backdrop blur

4. TYPOGRAPHY
   - Inter font (same as admin)
   - Larger base size for mobile (16px)
   - Bold earnings numbers
   - Clear status indicators
```

---

## Integration Steps (Implementation Order)

### Phase 1: Foundation (Week 1)
1. Add PWA manifest & service worker to existing Vite config
2. Create device mode detection in App.jsx
3. Add `/driver/*` routes (lazy-loaded)
4. Create DriverAuthContext (separate from admin auth)
5. Set up `drivers` collection in Firestore + update rules

### Phase 2: Driver Core Screens (Week 2)
6. Driver login page (phone + password)
7. Driver dashboard (earnings widget, status, current ad info)
8. Earnings page (daily/weekly/monthly breakdown)
9. Profile page (personal info, documents)
10. Bottom navigation component

### Phase 3: Real-Time Features (Week 3)
11. Live route map (reads GPS from vehicle's TV box data in Firebase)
12. Alerts page with push notification setup (FCM)
13. Ad schedule view (read-only, no playback)
14. Support/messaging integration

### Phase 4: Display Mode (Week 3-4)
15. Display auto-auth with device tokens
16. Full-screen ad player component
17. Ad rotation engine with transitions
18. GPS reporting service (runs on TV box)
19. Impression logging service
20. Heartbeat service
21. Offline fallback with cached ads

### Phase 5: Polish (Week 4)
22. PWA install prompts
23. Offline indicators & sync queue
24. Performance optimization
25. Testing on real Android TV box
26. Testing on various phones (Android + iOS Safari)

---

## Summary

| Aspect | Driver Phone | Roof Screen |
|--------|-------------|-------------|
| **Device** | Any smartphone | Android TV box |
| **Interface** | Mobile-optimized PWA | Full-screen kiosk |
| **Auth** | Phone + password login | Auto device token |
| **Ads** | View info only (NO playback) | Full video/image playback |
| **GPS** | Reads from Firebase | Sends to Firebase |
| **Data source** | Consumes data | Produces data |
| **Network** | Driver's mobile data/WiFi | Dedicated 4G SIM |
| **Offline** | Cached dashboard | Cached ad playback |
| **Notifications** | Push via FCM | None needed |
| **Install** | "Add to Home Screen" | Pre-installed kiosk app |

**One codebase. One Firebase backend. Two interfaces. Zero confusion.**
