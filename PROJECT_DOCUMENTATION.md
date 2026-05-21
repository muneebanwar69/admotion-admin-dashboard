# AdMotion — Project Documentation

> **AdMotion** is a smart vehicle-advertising platform. Advertisers run ad campaigns on a fleet of cars that carry digital screens. The system uses **AI** to decide *which ad* plays on *which car*, *when*, and *where* — then measures how many people likely saw it and what it cost.

Built by **Alberuni Tech** — Team Lead: *Muneeb Ali Anwar*, AI Engineer: *Muskan Muneeb*, Supervisor: *Dr. Zohaib Ahmed*.

---

## 1. Live URLs (the 3 apps)

The whole product is **one website** with three "doors" depending on who is logging in.

| App | Who uses it | Live URL | Local URL |
|-----|-------------|----------|-----------|
| **Admin Dashboard** | Company staff who manage everything | `https://fyp-iota-nine.vercel.app/login` | `http://localhost:5173/login` |
| **Driver App** | Car owners / drivers | `https://fyp-iota-nine.vercel.app/driver/login` | `http://localhost:5173/driver/login` |
| **Display App** | The screen mounted inside/on the car | `https://fyp-iota-nine.vercel.app/display/setup` | `http://localhost:5173/display/setup` |

**Backend API (AI + scheduler + weather):**
- Local: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/health`

> **Test login:** Use any seeded car CNIC (`35201-1000001-1` … `35201-1000020-2`) with password `Admotion123+`.

---

## 2. The Full Workflow (in very easy language)

Think of it like **Uber, but for advertisements on cars.**

1. **Admin adds cars** 🚗
   The admin registers each car in the system (car details, owner, bank info, password). Each car gets a login.

2. **Admin adds ads** 📢
   The admin uploads advertisement images (or **generates them with AI**). Each ad has a target city, time of day, weather, and a budget.

3. **The AI Scheduler runs** 🧠
   With one click, the AI looks at every car — *where it is, what time it is, what the weather is like* — and picks the best ads for each car. It gives each ad a **5-minute display slot** and estimates **how many people will see it** and **how much it will cost**.

4. **The car's screen plays the ads** 📺
   The driver mounts a screen (phone/tablet/TV) in the car and opens the **Display App**. It logs in once, then plays the assigned ads on a loop. The moment it turns on, it tells the dashboard **"I'm online"**.

5. **Real-world tracking happens automatically** 📍
   As ads play, the screen sends its **GPS location** and a "heartbeat" every minute. The backend uses this to **estimate real impressions** (how many people saw the ad), based on *area type + time of day + weather*.

6. **Everyone sees live data** 📊
   - The **admin** sees which cars are online, what's playing where, live earnings, and impression analytics.
   - The **driver** sees their hours, earnings, and can **message the admin** anytime.
   - Money is calculated: drivers earn based on display hours; ad spend is charged per estimated person reached.

That's the full circle: **Add cars → Add ads → AI assigns → Screens play → Track reach → Pay & report.**

---

## 3. Features (everything in the project)

### 🛡️ Admin Dashboard

| Feature | What it does |
|---------|--------------|
| **Dashboard** | Overview with KPI cards, live vehicle map, vehicle/ad assignment table, customizable widgets (drag/show/hide), greeting banner. |
| **Vehicles Management** | Add/edit/delete cars via a multi-step wizard (vehicle info → owner & bank → documents). Real online/offline status, search, pagination, status filters. |
| **Ads Management** | Add/edit/delete ads, upload image/video, set budget, city, time slots, weather targets, target areas. **"Generate with AI"** button. |
| **AI Ad Generator** | Dedicated page to create ad images from a text idea (+ optional reference image) using OpenAI, then save directly to ads. |
| **Scheduling** | Run the AI scheduler, manual campaign builder (wizard), weather widget for major cities, and a **Live AI Schedule table** (which ad → which car, minutes, AI reach, cost, why). |
| **Driver Tracking** | Real-time per-driver **earnings** + **ad play history** (which ad played on which car, when, estimated reach). |
| **Analytics** | Beautiful charts (Recharts): impression trends, reach by area type, top ads, breakdowns. |
| **Alerts Management** | System alerts (vehicle offline, ad expiring, etc.) with priorities. |
| **Vehicle Reports** | Per-vehicle performance reports. |
| **Report Settings** | Configure automated email reports (daily/weekly). |
| **Admin Management** | Manage admin accounts (with hashed passwords). |
| **My Profile** | Admin's own profile and settings. |
| **Messaging Widget** | Two-way chat with drivers + broadcast announcements to all drivers. |
| **Command Palette** (Ctrl+K) | Quick navigation & actions by typing. |
| **Global Search** | Search across vehicles, ads, etc. |
| **Voice Commands** 🎙️ | Control the app by voice ("go to dashboard", "dark mode"). |
| **Keyboard Shortcuts** | Power-user navigation; help overlay. |
| **Onboarding Tour** | Guided first-time walkthrough. |
| **Dark / Light theme** | Full theme switching. |
| **Offline support** | Works offline with a service worker + queue; syncs when back online (PWA). |
| **Undo system** | Undo recent destructive actions via a toast. |

### 🚗 Driver App (mobile-first)

| Feature | What it does |
|---------|--------------|
| **Driver Login** | Login with CNIC + password. |
| **Driver Dashboard** | Today's hours, live earnings, screen online/offline status, assigned ads. |
| **Earnings** | Detailed daily/monthly earnings vs contract, progress circles. |
| **Route** | The car's route / location info. |
| **Alerts** | Driver-specific notifications. |
| **Profile** | Driver profile. |
| **Messaging** | **Driver can start a chat with the admin** + receive broadcasts. |

### 📺 Display App (the in-car screen)

| Feature | What it does |
|---------|--------------|
| **Pairing / Setup** | One-time login that ties the screen to a specific car. Works on TV & mobile. |
| **Ad Player** | Plays assigned ads on a loop (image/video), full-screen kiosk mode, offline caching (IndexedDB). |
| **Instant online signal** | Sends "I'm active" the moment it opens. |
| **Heartbeat** | Reports online status + counts display hours every 60 seconds. |
| **GPS tracking** | Sends location so impressions can be estimated by area. |
| **Impression logging** | Logs each ad play to the AI impression engine. |

### 🌐 Public Site
A public landing page describing the product (`/site`).

---

## 4. Tech Stack

### Frontend
| Tech | Why it's used |
|------|---------------|
| **React 18** | The UI library — builds the screens as reusable components. |
| **Vite** | Super-fast dev server and build tool. |
| **Tailwind CSS** | Utility CSS classes for styling directly in markup. |
| **React Router** | Handles navigation between pages (URLs → components). |
| **Framer Motion** | Smooth animations & transitions. |
| **Recharts** | Charts and graphs in Analytics. |
| **Leaflet / React-Leaflet** | The interactive vehicle map. |
| **Three.js + React Three Fiber + Drei** | The 3D animated login screen. |
| **lucide-react / react-icons** | Icon sets. |
| **Firebase SDK (Firestore)** | Real-time cloud database (the browser talks to it directly). |
| **bcryptjs** | Hashes passwords safely in the browser. |
| **DOMPurify** | Cleans user text to prevent injection (XSS) in chat. |
| **vite-plugin-pwa / Workbox** | Makes the app installable & work offline. |

### Backend
| Tech | Why it's used |
|------|---------------|
| **Python + FastAPI** | The API server for AI, the scheduler, weather, and impressions. |
| **Firebase Admin SDK** | Backend's secure access to Firestore. |
| **httpx** | Calls external APIs (OpenAI, OpenWeatherMap) from Python. |
| **scikit-learn / numpy / joblib** *(optional)* | Train the machine-learning impression model. |
| **OpenAI API** | Generates ad images and refines ad ideas. |
| **OpenWeatherMap API** | Live weather for ad targeting. |

### Hosting
- **Frontend** → **Vercel** (`fyp-iota-nine.vercel.app`)
- **Database & Auth data** → **Firebase Firestore**
- **Backend** → runs locally or on any Python host.

---

## 5. Common Concepts (explained simply)

These are the everyday building blocks used throughout the code.

### React Components
A **component** is a reusable piece of UI — like a Lego block. A button, a card, a whole page — each is a component. We write them as functions that return what the screen should look like.

### Props
**Props** are inputs you pass *into* a component (like function arguments). Example: `<KpiCard label="Total Ads" value={20} />` — `label` and `value` are props.

### State (`useState`)
**State** is a component's memory — data that can change. When state changes, React automatically re-draws that part of the screen.
```js
const [count, setCount] = useState(0)  // count starts at 0
setCount(count + 1)                     // changing it re-renders the UI
```

### `useEffect` (side effects)
Runs code **after** the screen renders — used for things like fetching data or setting up live listeners.
```js
useEffect(() => {
  // runs when the component loads
  return () => { /* cleanup when it leaves */ }
}, [])  // [] = run once
```

### Custom Hooks
A **hook** is reusable logic shared across components (names start with `use`). This project has hooks like `useDashboardLayout`, `useVoiceCommand`, `useOfflineSupport`, `useFavorites` — each bundles a feature so any page can reuse it.

### `fetch` (talking to the backend)
**`fetch`** is the built-in browser function to call an API over the internet. We use it to talk to our Python backend.
```js
const res = await fetch(`${API_URL}/api/ai/refine`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idea }),
})
const data = await res.json()
```
> **Note on Axios:** *Axios* is a popular library that does the same job as `fetch` with a slightly nicer syntax (automatic JSON, easier errors). **This project uses the built-in `fetch`** (no extra library needed), but the idea is identical: send a request, get a response.

### `async` / `await` & Promises
A **Promise** is "I'll get back to you later." `async/await` lets us write code that *waits* for slow things (like network calls) without freezing the app.

### Context (global data)
**Context** shares data across the whole app without passing props down manually. This project uses contexts for: `AuthContext` (admin login), `DriverAuthContext` (driver login), `ThemeContext` (dark/light), `ToastContext` (popup messages), `UploadContext`, `UndoContext`.

### Real-time listeners (`onSnapshot`)
Instead of asking the database "any updates?" over and over, Firestore's **`onSnapshot`** pushes changes to us the instant they happen. That's why the dashboard updates **live** — new plays, online status, and messages appear without refreshing.

### Routing & Protected Routes
**React Router** maps URLs to pages. A **Protected Route** checks "are you logged in?" before showing admin/driver pages; if not, it redirects to login.

### PWA & Service Worker
A **Service Worker** is a background script that caches the app so it loads fast and **works offline**. This makes AdMotion installable like a real app.

---

## 6. Three.js — the 3D Login Screen

The admin login page ([`LoginScene.jsx`](src/components/LoginScene.jsx)) uses **Three.js**, the standard JavaScript library for 3D graphics in the browser (it draws using WebGL / the GPU).

We don't use Three.js directly — we use **React Three Fiber**, which lets us write 3D scenes as React components, plus **Drei** for ready-made helpers.

**What's on screen:**
- A 3D animated scene that matches the project's vibe (floating shapes / particles / lighting).
- It reacts smoothly and continuously animates.
- Combined with a **2D scroll/parallax** layered design and Framer Motion for an interactive, modern feel.
- Follows HCI best-practices (clear focus, motion that respects `prefers-reduced-motion`).

In short: **Three.js = the engine that renders the moving 3D graphics behind the login form.** The old login is safely kept as `Login.backup.jsx`.

---

## 7. AI Features (end-to-end)

AI is the heart of AdMotion. Here is every AI capability and how it works from start to finish.

### 7.1 🧠 AI Ad Scheduler (the brain)
**Goal:** Automatically decide the best ads for each car.

**How it works:**
1. For every car, the system reads its **GPS → city & area**, the **current time slot** (morning/afternoon/evening/night), and the **live weather**.
2. It filters ads that match that location & time.
3. It **scores** each ad with a formula ([`calculate_ad_score`](main.py)):
   - Area match → ×2.0, City match → ×1.5
   - Time-slot match → ×1.3
   - Weather match → ×1.5
   - **Fairness**: ads that have had *fewer* impressions get boosted, so budgets are spent evenly.
4. It picks the **top 5 ads**, gives each a **5-minute slot**, and saves the schedule.

**Endpoint:** `POST /api/scheduler/run` · **Status:** `GET /api/scheduler/status`

### 7.2 📊 AI Impression Estimation (measuring real reach)
**Goal:** Estimate how many *real people* saw an ad — without expensive cameras.

**How it works ([`impression_engine.py`](impression_engine.py)):**
Real-world reach is estimated as:
```
reach = adPlays × areaFactor × timeFactor × weatherFactor
```
- **Area factor** — a busy commercial area reaches far more people than a quiet residential lane.
- **Time factor** — rush hour (×1.8) vs 3 AM (low).
- **Weather factor** — clear days mean more people outside.

It has **two modes**:
- **Heuristic mode** (default) — the smart formula above. Works with zero training data.
- **ML mode** — when enough real data is collected, a **scikit-learn** model is trained on it for better accuracy. Every impression is stored in an *ML-ready* format so the model can learn over time.

**Endpoints:** `POST /api/impressions` · `GET /api/model/status` · `POST /api/model/train`

### 7.3 💰 AI Cost & Reach in the Schedule
When the scheduler assigns an ad, it **immediately estimates** that slot's impressions and **cost** (reach × cost-per-impression) using the impression engine. The admin sees per-assignment **AI Reach** and **Est. Cost**, plus totals — all in the Live AI Schedule table.

### 7.4 🎨 AI Ad/Image Generator
**Goal:** Create professional ad images without a designer.

**How it works:**
1. Admin types a short idea (e.g. *"energy drink for gamers"*) and optionally uploads a reference product image.
2. **OpenAI (gpt-4o-mini)** *refines* the idea into a polished prompt + headline + caption (`POST /api/ai/refine`).
3. **OpenAI (gpt-image-1)** *generates* the ad image — text-to-image, or image-edit when a reference is provided (`POST /api/ai/generate`).
4. The admin saves it straight into the Ads collection.

> The OpenAI key stays **server-side** for security — the browser never sees it.

### 7.5 🌦️ AI Weather-Aware Targeting
The backend pulls **live weather** (OpenWeatherMap) per city and feeds it into both the scheduler (which ads to pick) and the impression engine (how many people are out). Endpoint: `GET /api/weather/{city}`.

### 7.6 🎙️ Voice Commands
The admin can navigate and control the app hands-free using the browser's speech recognition (e.g. *"show analytics"*, *"dark mode"*) — see [`useVoiceCommand.js`](src/hooks/useVoiceCommand.js).

---

## 8. Project Structure (quick map)

```
fyp/
├── main.py                  # FastAPI backend (AI, scheduler, weather, impressions)
├── impression_engine.py     # AI impression estimation + ML model
├── seed_data.py             # Seeds 20 test cars + 20 ads
├── seed_plays.py            # Seeds sample play history + earnings
├── src/
│   ├── App.jsx              # Routes for admin / driver / display apps
│   ├── pages/               # All screens (Dashboard, Ads, Scheduling, ...)
│   │   ├── driver/          # Driver app pages
│   │   └── display/         # In-car screen pages
│   ├── components/          # Reusable UI (map, widgets, messaging, 3D login)
│   ├── contexts/            # Global state (auth, theme, toast, ...)
│   ├── hooks/               # Reusable logic (voice, layout, offline, ...)
│   ├── services/            # API/Firestore helpers (scheduler, ai, impressions, ...)
│   └── utils/               # Helpers (password hashing, sanitize, logger, ...)
└── PROJECT_DOCUMENTATION.md # This file
```

---

## 9. How to Run Locally

```bash
# 1) Backend (needs serviceAccountKey.json + .env with OPENAI_API_KEY)
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# 2) Frontend
npm install
npm run dev          # opens http://localhost:5173

# 3) (Optional) seed test data
python seed_data.py  # 20 cars + 20 ads
python seed_plays.py # sample play history & earnings
```

**Environment keys** (in `.env`): `VITE_FIREBASE_*` (database), `OPENAI_API_KEY` (AI generator), `OPENWEATHER_API_KEY` (weather), `OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL`.
