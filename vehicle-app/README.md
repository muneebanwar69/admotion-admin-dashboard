# AdMotion Vehicle App

React web application for Android TV Boxes running on LED screens in vehicles.

## 🚀 Quick Start

### Installation

```bash
cd vehicle-app
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
VITE_API_BASE_URL=https://api.admotion.com
VITE_CDN_BASE_URL=https://cdn.admotion.com
```

### Development

```bash
npm run dev
```

App runs on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Output in `dist/` folder - deploy to your hosting/CDN.

## 📱 Android TV Box Setup

### 1. Install Fully Kiosk Browser

From Google Play Store, install "Fully Kiosk Browser"

### 2. Configure Kiosk Mode

1. Open Fully Kiosk Browser
2. Settings → Start URL: `https://vehicle.admotion.com` (or your hosted URL)
3. Settings → Kiosk Mode:
   - ✅ Enable kiosk mode
   - ✅ Hide navigation bar
   - ✅ Hide status bar
   - ✅ Prevent sleep
   - ✅ Keep screen on
4. Settings → Reload:
   - ✅ Auto-reload on crash
   - ✅ Reload every 24 hours (at 3am)
5. Settings → Set as default home screen app

### 3. Configure GPS

1. Connect USB GPS module
2. Settings → Location → High accuracy mode
3. Grant location permission to Fully Kiosk Browser

### 4. Configure 4G Connection

1. Insert 4G USB dongle
2. Enable USB tethering in Android settings
3. 4G connection active ✅

## 🏗️ Architecture

### Components

- **LoginScreen**: Vehicle authentication
- **FourScreenLayout**: Main 4-screen display manager
- **FullSideScreen**: Front/back displays (1920×480)
- **MiniSideScreen**: Left/right displays (480×480)
- **VideoPlayer**: Video ad playback
- **ImageDisplay**: Image ad display
- **StatusOverlay**: Debug overlay (Shift+D)

### Services

- **firebase.js**: Firebase initialization & messaging
- **api.js**: Backend API calls
- **adCache.js**: IndexedDB ad caching
- **gps.js**: GPS location tracking
- **heartbeat.js**: Status reporting every 60s

### Hooks

- **useCurrentAds**: Real-time Firebase listener for ad assignments

### Store

- **vehicleStore.js**: Zustand state management

## 🔄 How It Works

1. **Vehicle logs in** with Vehicle ID and password
2. **Firebase listener** watches `/assignments/{vehicle_id}` for new ads
3. **Ads downloaded** from CDN and cached in IndexedDB
4. **4 screens display** ads simultaneously (front, back, left, right)
5. **GPS tracking** sends location every 60 seconds
6. **Heartbeat** sends status to Firebase and backend API
7. **Impressions tracked** when ads play

## 📊 Firebase Structure

```
/assignments/{vehicle_id}
  ├── front_ad_id: "ad-123"
  ├── back_ad_id: "ad-456"
  ├── left_ad_id: "ad-789"
  └── right_ad_id: "ad-012"

/vehicles/{vehicle_id}/status/current
  ├── is_online: true
  ├── location: { lat, lon, accuracy }
  ├── screens: { front, back, left, right }
  └── system: { memory_mb, connection, battery, uptime_hours }
```

## 🐛 Debugging

- Press **Shift+D** to toggle status overlay
- Check browser console (Chrome DevTools remote debugging)
- View Firebase console for real-time data
- Check backend API logs for heartbeat/impression data

## 📝 Notes

- App runs in fullscreen kiosk mode
- Ads cached locally for offline playback
- Auto-reloads if crash detected
- Works with 4G USB dongle or WiFi
- Supports USB GPS module for accurate location

## 🔒 Security

- Vehicle authentication required
- Credentials stored in localStorage
- HTTPS required for production
- Firebase security rules enforced

## 📦 Deployment

### Option 1: Static Hosting (Recommended)

Deploy `dist/` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- BunnyCDN

### Option 2: Self-Hosted

Serve `dist/` folder with nginx/Apache

## 🆘 Troubleshooting

**Ads not loading?**
- Check Firebase connection
- Verify vehicle ID is correct
- Check browser console for errors

**GPS not working?**
- Grant location permissions
- Check USB GPS module connection
- Verify GPS Test app shows satellites

**No internet?**
- Check 4G dongle connection
- Verify USB tethering enabled
- Check SIM card has data

**Screen not displaying?**
- Check HDMI connection
- Verify LED controller is powered
- Check Android TV box output settings





