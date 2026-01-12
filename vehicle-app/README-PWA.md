# AdMotion Vehicle App - PWA Setup

## Overview
This is a Progressive Web App (PWA) designed to run on Android TV boxes for displaying advertisements.

## Features
- ✅ Installable on Android TV boxes
- ✅ Offline-capable with service worker caching
- ✅ Real-time GPS location tracking
- ✅ Heartbeat service for status updates
- ✅ Auto-login after initial setup
- ✅ Background sync for location updates
- ✅ Push notifications support
- ✅ Screen wake lock to prevent display sleep

## Installation on Android TV Box

### Option 1: Direct Installation
1. Open Chrome/WebView browser on the TV box
2. Navigate to your app URL (e.g., `https://your-domain.com`)
3. Chrome will prompt to "Add to Home Screen" or "Install App"
4. Accept the installation
5. The app will appear as an icon on your TV box home screen

### Option 2: Manual APK Installation
1. Use a WebView wrapper like [PWA Builder](https://www.pwabuilder.com/)
2. Generate an APK from your PWA
3. Install the APK on the TV box via USB or network

## Required Icons

Before deploying, you need to generate PNG icons from the SVG template.

### Using Online Tools:
1. Go to https://realfavicongenerator.net/
2. Upload `public/icons/icon.svg`
3. Download the generated icons
4. Place them in `public/icons/`

### Required icon sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Using ImageMagick (command line):
```bash
# Install ImageMagick first
# Then run for each size:
convert public/icons/icon.svg -resize 72x72 public/icons/icon-72x72.png
convert public/icons/icon.svg -resize 96x96 public/icons/icon-96x96.png
convert public/icons/icon.svg -resize 128x128 public/icons/icon-128x128.png
convert public/icons/icon.svg -resize 144x144 public/icons/icon-144x144.png
convert public/icons/icon.svg -resize 152x152 public/icons/icon-152x152.png
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png
convert public/icons/icon.svg -resize 384x384 public/icons/icon-384x384.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512x512.png
```

## Environment Variables

Create a `.env` file with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
VITE_API_BASE_URL=https://your-api-url.com
```

## Building for Production

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Preview locally
npm run preview
```

## Testing PWA Features

### Test Installation:
1. Open Chrome DevTools (F12)
2. Go to Application > Manifest
3. Check for any manifest errors
4. Use "Add to home screen" in Application tab

### Test Offline:
1. Open Chrome DevTools
2. Go to Application > Service Workers
3. Check "Offline"
4. Refresh the page - app should still work

### Test on Android TV:
1. Deploy to a web server with HTTPS
2. Open Chrome on TV box
3. Navigate to your app URL
4. App should prompt for installation

## Admin Dashboard Integration

### Register a Vehicle:
1. In admin dashboard, go to Vehicles
2. Click "Add Vehicle"
3. Enter Vehicle ID (e.g., CAR-001) and Password
4. Save the vehicle

### Create a Campaign:
1. Go to Scheduling
2. Click "Create Campaign"
3. Select the vehicle and ads
4. Set date/time range
5. Submit

### Test on Vehicle App:
1. Open the vehicle app (or install PWA)
2. Login with Vehicle ID and Password
3. The assigned ads should start playing
4. Check Dashboard for real-time location and status

## Troubleshooting

### Location Not Working:
- Ensure location permissions are granted
- Check if GPS is enabled on the device
- Some TV boxes may need external GPS modules

### Ads Not Loading:
- Check network connectivity
- Verify Firebase configuration
- Check browser console for errors

### PWA Not Installing:
- Ensure HTTPS is enabled
- Check manifest.json for errors
- Service worker must be registered successfully

## License
Proprietary - AdMotion 2024
