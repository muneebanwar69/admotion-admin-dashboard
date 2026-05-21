# AdMotion — Backend (AI Server) Setup & Run Guide

This guide explains **how to run the Python backend** that powers the AI features:
the AI ad scheduler, impression estimation, ad-image generation (OpenAI), and live weather.

> The frontend (React) is deployed on **Vercel**. The backend (FastAPI) runs separately —
> locally on your machine, or on any Python host.

---

## 1. Prerequisites

| Need | Version | Check |
|------|---------|-------|
| **Python** | 3.10+ | `python --version` |
| **pip** | latest | `python -m pip --version` |
| **Firebase service account** | — | file `serviceAccountKey.json` in the project root |
| **OpenAI API key** | — | for the AI Ad Generator |
| **OpenWeatherMap key** | — | for weather targeting |

---

## 2. One-Time Setup

### Step 1 — Open a terminal in the project folder
```bash
cd d:/fyp
```

### Step 2 — (Recommended) Create a virtual environment
A virtual environment keeps this project's Python packages separate from the rest of your system.

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**Mac / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3 — Install the backend dependencies
```bash
python -m pip install -r requirements.txt
```
> This installs **FastAPI, Uvicorn, Firebase Admin, httpx, python-dotenv**.

**(Optional) Machine-learning extras** — only needed to *train* the impression model:
```bash
python -m pip install -r requirements-ml.txt
```
> Installs **numpy, scikit-learn, joblib**. The backend runs fine without these
> (it uses the smart heuristic model by default).

### Step 4 — Add the Firebase service account key
Place your **`serviceAccountKey.json`** in the project root (`d:/fyp/serviceAccountKey.json`).
> Get it from: Firebase Console → Project Settings → **Service Accounts** → *Generate new private key*.
> This file is **gitignored** (never committed).

### Step 5 — Create the `.env` file
In the project root, create a file named **`.env`** with:
```env
# Firebase (frontend config — already in your .env)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=admotion-f7970
# ...other VITE_FIREBASE_* keys...

# Backend: OpenAI (AI Ad Generator)
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_API_KEY=sk-...your-key-here...

# Backend: Weather targeting
OPENWEATHER_API_KEY=...your-key-here...
```
> `.env` is **gitignored** — your keys stay private.

---

## 3. Run the Backend (the main command)

From the project root, run:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Firebase Admin initialized successfully
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Develop with auto-reload** (restarts on code changes):
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Run on all network interfaces** (so other devices can reach it):
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> Leave this terminal open — the server runs until you press **Ctrl + C**.

---

## 4. Verify It's Working

Open these in your browser (or use `curl`):

| URL | Should return |
|-----|---------------|
| `http://127.0.0.1:8000/health` | `{"status":"ok"}` |
| `http://127.0.0.1:8000/api/ai/status` | `{"configured":true, ...}` (AI key loaded) |
| `http://127.0.0.1:8000/api/scheduler/status` | scheduler stats |
| `http://127.0.0.1:8000/api/weather/Islamabad` | live weather |

Quick check from a terminal:
```bash
curl http://127.0.0.1:8000/api/ai/status
```

---

## 5. All Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET`  | `/health` | Server alive check |
| `POST` | `/api/scheduler/run` | Run the AI ad scheduler |
| `GET`  | `/api/scheduler/status` | Last scheduler run stats |
| `POST` | `/api/impressions` | Log an ad play + estimate reach |
| `GET`  | `/api/model/status` | Impression model: heuristic vs trained |
| `POST` | `/api/model/train` | Train the ML impression model |
| `GET`  | `/api/ai/status` | Is OpenAI configured? |
| `POST` | `/api/ai/refine` | Turn an idea into an ad prompt + copy |
| `POST` | `/api/ai/generate` | Generate an ad image |
| `GET`  | `/api/weather/{city}` | Live weather for a city |
| `GET`  | `/api/areas/{city}` | Geo-fence areas for a city |

---

## 6. Connecting the Frontend to the Backend

The React app reads the backend URL from `VITE_API_URL` (defaults to `http://127.0.0.1:8000`).

- **Local development:** run `npm run dev` — it talks to your local backend automatically.
- **Deployed frontend → your backend:** host the backend publicly (e.g. Render/Railway) and set
  `VITE_API_URL` in Vercel to that URL, then redeploy. Also set the backend env vars
  (`OPENAI_API_KEY`, `OPENWEATHER_API_KEY`, and `FIREBASE_SERVICE_ACCOUNT_JSON`) on that host.

---

## 7. Seed Test Data (optional)

With the backend's credentials in place, you can populate the database:

```bash
python seed_data.py    # 20 test cars + 20 ads (all car passwords: Admotion123+)
python seed_plays.py   # sample play history + driver earnings
```

---

## 8. Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'firebase_admin'` | Run `python -m pip install -r requirements.txt` |
| `Firebase service account file not found` | Put `serviceAccountKey.json` in the project root |
| `AI not configured` / `Incorrect API key` | Set a valid `OPENAI_API_KEY` in `.env`, then **restart** the server |
| Scheduler error: *Firestore not configured* | Missing `serviceAccountKey.json` — add it and restart |
| Port 8000 already in use | Use a different port: `--port 8001` (and update `VITE_API_URL`) |
| OpenWeather "Invalid API key" | New keys take a few hours to activate |
| `gpt-image-1` org-verification error | Switch `OPENAI_IMAGE_MODEL=dall-e-3` in `.env` (no reference-image edits) |

---

## 9. Quick Reference (copy-paste)

```bash
# Setup (once)
cd d:/fyp
python -m venv venv
venv\Scripts\Activate.ps1            # Windows
python -m pip install -r requirements.txt

# Run the AI backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Verify
curl http://127.0.0.1:8000/api/ai/status
```
