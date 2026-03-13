# AdMotion Deployment Guide

## 🚀 Production Deployment Checklist

This guide covers deploying the complete AdMotion system: **Admin Dashboard**, **Vehicle App**, and **FastAPI Backend**.

---

## 📋 Pre-Deployment Requirements

### 1. **Firebase Setup**
- [x] Firebase project created: `admotion-f7970`
- [x] Firestore database enabled
- [x] Firebase Storage enabled  
- [x] Firebase Authentication enabled (recommended for future)
- [x] New service account key generated (never commit to Git)

### 2. **Environment Variables Ready**
- [x] All `.env` files configured (never commit to Git)
- [x] Service account JSON prepared for backend hosting
- [x] API keys rotated from old exposed credentials

### 3. **Code Quality**
- [x] All console.log statements replaced with logger utility
- [x] Production build tested locally
- [x] No hardcoded credentials in codebase
- [x] Firestore security rules updated

---

## 🔐 Critical Security Steps (MUST DO FIRST)

### Step 1: Revoke Old Firebase Credentials

The old Firebase credentials were exposed in Git history. You **must** rotate them:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/admotion-f7970
2. **Navigate to**: Project Settings → Service Accounts
3. **Delete or Regenerate**: The exposed service account key
4. **Generate New Key**: Download new `serviceAccountKey.json` (for backend only)
5. **Update Web API Key** (if needed): Project Settings → General → Web API Key

### Step 2: Remove Secrets from Git History

```powershell
# Install BFG Repo Cleaner (one-time setup)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove sensitive files from all Git history
java -jar bfg.jar --delete-files serviceAccountKey.json
java -jar bfg.jar --delete-files .env

# Cleanup and force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

⚠️ **Warning**: Force push will rewrite history. Notify all team members before doing this.

### Step 3: Deploy Updated Firestore Rules

```powershell
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

---

## 🖥️ Backend Deployment (FastAPI)

### Option 1: Google Cloud Run (Recommended)

#### Prepare Backend
```powershell
# Navigate to backend directory
cd d:\fyp

# Create Dockerfile
```

**File: `Dockerfile`**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Expose port
EXPOSE 8000

# Run with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Deploy to Cloud Run
```powershell
# Install Google Cloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project admotion-f7970

# Build and deploy
gcloud run deploy admotion-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars CORS_ORIGINS=https://your-admin-dashboard.vercel.app

# Add service account as secret (recommended)
# Use Google Secret Manager instead of environment variable
```

**Set Service Account via Secret Manager:**
```powershell
# Create secret
gcloud secrets create firebase-service-account --data-file=serviceAccountKey.json

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

Update `main.py` to read from Secret Manager (optional advanced setup).

**Result:** Backend API URL will be: `https://admotion-backend-xxxxx-uc.a.run.app`

### Option 2: Heroku

```powershell
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create admotion-backend

# Add Python buildpack
heroku buildpacks:set heroku/python

# Create Procfile
echo "web: uvicorn main:app --host=0.0.0.0 --port=${PORT}" > Procfile

# Set environment variables
heroku config:set CORS_ORIGINS="https://your-admin-dashboard.vercel.app"

# Set Firebase service account (as JSON string)
heroku config:set FIREBASE_SERVICE_ACCOUNT_JSON='$(cat serviceAccountKey.json)'

# Deploy
git push heroku main
```

### Option 3: Your Own VPS (DigitalOcean, AWS EC2, etc.)

```bash
# SSH into server
ssh user@your-server-ip

# Install dependencies
sudo apt update
sudo apt install python3 python3-pip

# Clone repository
git clone https://github.com/yourusername/admotion.git
cd admotion

# Install Python packages
pip3 install -r requirements.txt

# Upload service account key securely (DO NOT commit to Git)
scp serviceAccountKey.json user@your-server-ip:/home/user/admotion/

# Set environment variables
echo "export CORS_ORIGINS='https://your-admin-dashboard.vercel.app'" >> ~/.bashrc
source ~/.bashrc

# Run with systemd (production)
sudo nano /etc/systemd/system/admotion-backend.service
```

**File: `/etc/systemd/system/admotion-backend.service`**
```ini
[Unit]
Description=AdMotion FastAPI Backend
After=network.target

[Service]
User=your-username
WorkingDirectory=/home/user/admotion
Environment="CORS_ORIGINS=https://your-admin-dashboard.vercel.app"
ExecStart=/usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable admotion-backend
sudo systemctl start admotion-backend
sudo systemctl status admotion-backend
```

---

## 📱 Admin Dashboard Deployment

### Deploy to Vercel (Recommended)

```powershell
# Install Vercel CLI
npm install -g vercel

# Navigate to project root
cd d:\fyp

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
vercel

# Set environment variables in Vercel Dashboard
# Go to: Project Settings → Environment Variables
```

**Environment Variables to Add:**
```
VITE_FIREBASE_API_KEY=AIzaSyBY531KR4npLICaE09ixt8_OnRckmJJQAM
VITE_FIREBASE_AUTH_DOMAIN=admotion-f7970.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=admotion-f7970
VITE_FIREBASE_STORAGE_BUCKET=admotion-f7970.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=524294117835
VITE_FIREBASE_APP_ID=1:524294117835:web:524dc4d26e7dfc51033e4e
VITE_FIREBASE_MEASUREMENT_ID=G-DFLN5QCP12
VITE_API_URL=https://your-backend-url.a.run.app
VITE_APP_ENV=production
```

```powershell
# Deploy to production
vercel --prod
```

**Update CORS in Backend:**
After deployment, copy your Vercel URL (e.g., `https://admotion.vercel.app`) and update the backend `CORS_ORIGINS` environment variable.

---

## 📺 Vehicle App Deployment

### Method 1: Web App (PWA) on Android TV Boxes

This is the **recommended approach** used by most digital signage companies.

#### Step 1: Deploy Vehicle App to Vercel/Netlify

```powershell
# Navigate to vehicle app
cd d:\fyp\vehicle-app

# Build production version
npm run build

# Deploy to Vercel
vercel

# Or deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod
```

**Set Environment Variables** (same as admin dashboard Firebase config)

**Result:** Vehicle app URL: `https://admotion-vehicle.vercel.app`

#### Step 2: Setup Android TV Boxes

**On Each Android TV Box:**

1. **Enable Unknown Sources**:
   - Settings → Security → Unknown Sources → Enable

2. **Install Chrome or Kiosk Browser**:
   - Download from Google Play Store
   - Recommended: [Fully Kiosk Browser](https://play.google.com/store/apps/details?id=de.ozerov.fully)

3. **Configure Kiosk Mode**:
   - Open browser
   - Navigate to: `https://admotion-vehicle.vercel.app`
   - Login with vehicle credentials (CNIC + password)
   - App will automatically enter fullscreen mode

4. **Auto-Start on Boot** (Fully Kiosk Browser):
   - Settings → Advanced Web Settings → Start URL: `https://admotion-vehicle.vercel.app`
   - Settings → Other Settings → Start on Boot: Enable
   - Settings → Screen Saver: Disable

5. **Network Configuration**:
   - Connect to stable WiFi or mobile hotspot
   - Set static IP (optional but recommended)
   - Test internet connectivity

6. **Testing**:
   - Restart Android TV box
   - App should auto-launch in fullscreen
   - Ads should rotate every 15 seconds
   - Test with both images and videos

### Method 2: Native Android APK (Advanced)

If you need native app features, convert to APK using **Capacitor**:

```powershell
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize Capacitor
npx cap init

# Add Android platform
npx cap add android

# Build web assets
npm run build

# Copy to Android
npx cap copy android

# Open in Android Studio
npx cap open android

# Build APK in Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**Install APK on TV Boxes:**
- Transfer APK via USB or cloud storage
- Install on each TV box
- Configure auto-start using device admin settings

---

## ✅ Post-Deployment Testing

### Backend Health Check
```powershell
# Test health endpoint
curl https://your-backend-url.a.run.app/health

# Expected response:
# {"status":"healthy","timestamp":"2026-02-23T...","service":"AdMotion Scheduler API"}
```

### Admin Dashboard Testing
1. **Visit**: `https://your-admin-dashboard.vercel.app`
2. **Login**: Use admin credentials
3. **Create Test Ad**: Upload image or video
4. **Create Test Vehicle**: Add vehicle with CNIC
5. **Assign Ad to Vehicle**: Verify assignment appears in Firestore
6. **Check Console**: Should see no errors, no debug logs in production

### Vehicle App Testing
1. **Visit on TV Box**: `https://admotion-vehicle.vercel.app`
2. **Login**: Use vehicle CNIC + password
3. **Verify Fullscreen**: Should auto-enter fullscreen mode
4. **Ad Display**: Ad should display on all 4 screen sections
5. **Ad Rotation**: Ads should rotate every 15 seconds
6. **Image/Video**: Both should display with `object-contain` (no cropping)
7. **Offline Mode**: Disconnect internet, verify cached ads still display
8. **Reconnect**: Ads should update when online again

### Performance Monitoring
1. **Firebase Console**: 
   - Monitor Firestore reads/writes (check quotas)
   - Monitor Storage bandwidth usage
2. **Backend Logs**:  
   - Check backend logs for errors
   - Monitor API response times
3. **Network**: 
   - Check network usage on TV boxes
   - Verify ad media caching working

---

## 🔄 Update & Maintenance

### Updating Admin Dashboard
```powershell
cd d:\fyp
git pull origin main
npm install
npm run build
vercel --prod
```

### Updating Vehicle App
```powershell
cd d:\fyp\vehicle-app
git pull origin main
npm install
npm run build
vercel --prod

# TV boxes will auto-update within 60 minutes (Service Worker checks)
# Or manually reload browser on each TV box
```

### Updating Backend
```powershell
cd d:\fyp
git pull origin main

# For Cloud Run:
gcloud run deploy admotion-backend --source .

# For Heroku:
git push heroku main

# For VPS:
ssh user@server
cd admotion
git pull
sudo systemctl restart admotion-backend
```

---

## 🐛 Troubleshooting

### Issue: Vehicle App Not Showing Ads
**Causes:**
1. Vehicle not assigned any ads in admin dashboard
2. Firebase connection issue
3. Ad media failed to load (base64 too large)

**Solutions:**
- Check Firestore: `vehicles/{vehicleId}/assignedAds` field
- Check browser console for errors (Shift+D for debug overlay)
- Re-upload ad with smaller file size (<750KB for base64)

### Issue: "Missing Firebase configuration" Error
**Cause:** Environment variables not set correctly

**Solution:**
- Verify all `VITE_FIREBASE_*` variables set in hosting platform
- Rebuild and redeploy after adding variables
- Check `.env` file locally (for development)

### Issue: Backend CORS Errors
**Cause:** Admin dashboard URL not in CORS whitelist

**Solution:**
- Update backend `CORS_ORIGINS` environment variable
- Redeploy backend
- Format: `https://domain1.com,https://domain2.com` (comma-separated, no spaces)

### Issue: TV Box Exits Fullscreen
**Cause:** User pressed back button or system interrupt

**Solution:**
- App automatically re-enters fullscreen after 2 seconds
- Use kiosk mode browser to prevent exit
- Disable back button in Android TV box settings (admin mode)

### Issue: Ads Not Rotating
**Cause:** Only 1 ad assigned or rotation interval not working

**Solution:**
- Assign multiple ads to vehicle in admin dashboard
- Check browser console: should log "🔄 Starting ad rotation"
- Verify `VITE_AD_ROTATION_INTERVAL=15000` in vehicle app `.env`

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Setup                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Admin Dashboard │         │   Vehicle App    │
│  (Vercel/Netlify)│         │  (Vercel/Netlify)│
│                  │         │                  │
│  - Admin users   │         │  - Android TV    │
│  - Manage ads    │         │  - Auto fullscreen│
│  - Manage vehicles│        │  - Ad display    │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │                            │
         ├────────────┬───────────────┤
         │            │               │
         ▼            ▼               ▼
┌────────────────────────────────────────────┐
│           Firebase (admotion-f7970)        │
│  ┌────────────┐  ┌─────────────┐          │
│  │ Firestore  │  │  Storage    │          │
│  │ Database   │  │  (Media)    │          │
│  └────────────┘  └─────────────┘          │
└────────────────────────────────────────────┘
         ▲
         │
         │
┌────────┴──────────┐
│   FastAPI Backend │
│  (Cloud Run/VPS)  │
│                   │
│  - Ad scheduler   │
│  - Assignment API │
└───────────────────┘
```

---

## 📝 Environment Files Summary

### Root `.env` (Admin Dashboard)
```env
VITE_FIREBASE_API_KEY=AIzaSyBY531KR4npLICaE09ixt8_OnRckmJJQAM
VITE_FIREBASE_AUTH_DOMAIN=admotion-f7970.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=admotion-f7970
VITE_FIREBASE_STORAGE_BUCKET=admotion-f7970.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=524294117835
VITE_FIREBASE_APP_ID=1:524294117835:web:524dc4d26e7dfc51033e4e
VITE_FIREBASE_MEASUREMENT_ID=G-DFLN5QCP12
VITE_APP_ENV=production
VITE_API_URL=https://your-backend-url.a.run.app
```

### `vehicle-app/.env` (Vehicle App)
```env
VITE_FIREBASE_API_KEY=AIzaSyBY531KR4npLICaE09ixt8_OnRckmJJQAM
VITE_FIREBASE_AUTH_DOMAIN=admotion-f7970.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=admotion-f7970
VITE_FIREBASE_STORAGE_BUCKET=admotion-f7970.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=524294117835
VITE_FIREBASE_APP_ID=1:524294117835:web:524dc4d26e7dfc51033e4e
VITE_FIREBASE_MEASUREMENT_ID=G-DFLN5QCP12
VITE_APP_NAME=AdMotion Vehicle Display
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_AD_ROTATION_INTERVAL=15000
```

### `.env.backend` (Backend - DO NOT COMMIT)
```env
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
CORS_ORIGINS=https://your-admin-dashboard.vercel.app,https://your-vehicle-app.vercel.app
HOST=0.0.0.0
PORT=8000
```

---

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Admin dashboard accessible at production URL
- ✅ Admin can login, create ads, create vehicles, assign ads
- ✅ Vehicle app accessible at production URL  
- ✅ Vehicle app auto-enters fullscreen on Android TV boxes
- ✅ Ads display correctly (images and videos with same formatting)
- ✅ Ads rotate every 15 seconds when multiple assigned
- ✅ No console.log statements visible in production (check DevTools)
- ✅ Backend API responds to health check
- ✅ Firestore security rules deployed and validated
- ✅ No secrets (API keys, service account) in Git repository
- ✅ Service Worker registered and caching ads offline
- ✅ TV boxes auto-reconnect and resume after power cycle

---

## 📞 Support & Resources

- **Firebase Console**: https://console.firebase.google.com/project/admotion-f7970
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com/
- **Firebase Docs**: https://firebase.google.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html

---

**Last Updated**: February 23, 2026  
**Version**: 1.0.0  
**Project**: AdMotion - Final Year Project (FYP)
