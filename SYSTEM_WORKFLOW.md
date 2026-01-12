# AdMotion System - Complete Workflow Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Admin Dashboard Workflow](#admin-dashboard-workflow)
3. [Vehicle Registration Process](#vehicle-registration-process)
4. [Ad Management Workflow](#ad-management-workflow)
5. [AI Scheduling System](#ai-scheduling-system)
6. [Manual Campaign Management](#manual-campaign-management)
7. [Vehicle App Workflow](#vehicle-app-workflow)
8. [Complete System Flow](#complete-system-flow)

---

## 🎯 System Overview

AdMotion is a comprehensive digital advertising management system that:
- Allows admins to manage vehicles and ads
- Automatically assigns ads to vehicles using AI scheduling
- Displays ads on vehicle LED screens in real-time
- Tracks performance and generates analytics

### System Components
1. **Admin Dashboard** - Web application for managing the system
2. **Vehicle App** - Android TV Box application for displaying ads
3. **Firebase Backend** - Real-time database and authentication
4. **AI Scheduler** - Automated ad assignment system

---

## 👨‍💼 Admin Dashboard Workflow

### Step 1: Admin Login

1. **Access the Dashboard**
   - Navigate to: `https://your-app.vercel.app/login`
   - Or open the application in your browser

2. **Login Credentials**
   - Enter your admin username
   - Enter your password
   - Click "Login"

3. **Dashboard Access**
   - After successful login, you'll see the main dashboard
   - Navigation sidebar with all management options

### Step 2: Admin Management (Super Admin Only)

1. **Add New Admin**
   - Go to **Admin Management** page
   - Click **"+ Add Admin"** button
   - Fill in the form:
     - **Name**: Admin's full name
     - **E-mail**: `zohaib@gmail.com` (example)
     - **Phone No**: Contact number
     - **Role**: Admin, Moderator, or Super Admin
     - **Location**: Admin's location
     - **Password**: Login password
     - **Image**: Upload profile picture (optional)
   - Click **"Save"**

2. **Edit/Delete Admins**
   - Click **Edit** icon to modify admin details
   - Click **Delete** icon to remove admin (with confirmation)

---

## 🚗 Vehicle Registration Process

### Step 1: Register a New Vehicle

1. **Navigate to Vehicles Page**
   - Click **"Vehicles Management"** in the sidebar
   - Click **"+ Add Vehicle"** button

2. **Step 1: Basic Information**
   - **Vehicle Type**: Personal, Commercial, or Fleet
   - **Vehicle Name**: e.g., "Honda Civic"
   - **Owner Name**: Vehicle owner's name
   - **Model**: Year (e.g., "2021")
   - **Color**: Vehicle color
   - **CNIC/NIC**: Owner's CNIC number
   - **Duration/Pass**: Monthly, Quarterly, or Annual
   - **Registration Date**: Vehicle registration date
   - **Password**: **IMPORTANT** - This password will be used by the vehicle to login
   - Click **"Next"**

3. **Step 2: Owner & Bank Details**
   - **First Name**: Owner's first name
   - **Last Name**: Owner's last name
   - **CNIC**: Owner's CNIC
   - **Email**: Owner's email address
   - **Account Title**: Bank account title
   - **Account Number**: Bank account number
   - **IBAN**: Bank IBAN
   - **Bank Name**: Bank name
   - Click **"Next"**

4. **Step 3: Documents**
   - **CNIC Front**: Upload front side of CNIC
   - **CNIC Back**: Upload back side of CNIC
   - **Registration Document**: Upload vehicle registration document
   - Click **"Next"**

5. **Step 4: Review & Save**
   - Review all information
   - Click **"Save Vehicle"**
   - System generates unique **Car ID** (e.g., `CAR-215E9`)
   - Vehicle is saved to Firestore with status "Active"

### Step 2: Vehicle Credentials

**Important Information:**
- **Car ID**: Automatically generated (e.g., `CAR-215E9`)
- **Password**: The password you set in Step 1
- These credentials are used by the vehicle to login to the Vehicle App

### Step 3: View Registered Vehicles

- All vehicles are displayed in a table
- Shows: Car ID, Vehicle Name, Owner, Model, Color, CNIC, Plate Number, Duration, Registration Date, Password, Status
- Can **Edit** or **Delete** vehicles
- Can **Search** by car plate, CNIC, vehicle name, etc.

---

## 📢 Ad Management Workflow

### Step 1: Create a New Ad

1. **Navigate to Ads Page**
   - Click **"Ads Management"** in the sidebar
   - Click **"+ Add Ad"** button

2. **Fill Ad Details**
   - **Title**: Ad title/name
   - **Category**: Ad category
   - **Company**: Company name
   - **Budget**: Advertising budget
   - **Start Time**: When ad should start
   - **End Time**: When ad should end
   - **Location**: Target location
   - **Media Type**: Image or Video
   - **Upload Media**: Upload image or video file
   - **Email**: Contact email
   - **Contact**: Contact number
   - **Active Status**: Enable/disable ad

3. **Save Ad**
   - Click **"Save"**
   - Ad is saved to Firestore `ads` collection
   - Ad becomes available for assignment

### Step 2: Manage Ads

- View all ads in a table
- **Edit** ads to modify details
- **Delete** ads (with confirmation)
- **Search** and filter ads
- See ad status (Active/Inactive)

---

## 🤖 AI Scheduling System

### How AI Assignment Works

1. **Trigger AI Scheduler**
   - Go to **"Scheduling"** page
   - Click **"Run AI"** button
   - This triggers the AI scheduler API

2. **AI Assignment Process**
   - System fetches all **Active** vehicles (not in manual campaigns)
   - System fetches all **Active** ads
   - AI distributes ads to vehicles using round-robin algorithm
   - Each vehicle gets up to 4 ads assigned
   - Ads are assigned with:
     - `adId`: The ad's Firestore document ID
     - `startTime`: When ad should start playing
     - `endTime`: When ad should stop playing
     - `assignedBy`: "ai"

3. **Save Assignments**
   - Assignments are saved to `vehicle.assignedAds` array in Firestore
   - Real-time updates are sent to all vehicle apps
   - Vehicles automatically start displaying assigned ads

### AI Assignment Rules

- Vehicles **NOT** in manual campaigns are assigned by AI
- Vehicles **IN** manual campaigns use campaign ads (AI is skipped)
- Ads are distributed evenly across vehicles
- Time-based scheduling ensures ads play at correct times

---

## 📅 Manual Campaign Management

### Step 1: Create a Campaign

1. **Navigate to Scheduling Page**
   - Click **"Scheduling"** in the sidebar
   - Click **"Create Campaign"** button

2. **Campaign Wizard - Step 1: Basic Info**
   - **Campaign Name**: Name your campaign
   - **Start Date**: Campaign start date
   - **End Date**: Campaign end date
   - **Description**: Campaign description
   - Click **"Next"**

3. **Step 2: Assign Ads**
   - Select ads to include in campaign
   - Can select multiple ads
   - Selected ads will be assigned to vehicles
   - Click **"Next"**

4. **Step 3: Assign Vehicles**
   - Select vehicles for this campaign
   - Selected vehicles will display campaign ads
   - Campaign ads override AI-assigned ads
   - Click **"Next"**

5. **Step 4: Review & Save**
   - Review campaign details
   - Click **"Save Campaign"**
   - Campaign is saved to Firestore
   - Selected vehicles get `campaignId` field
   - Vehicles' `assignedAds` are updated with campaign ads

### Campaign Priority

- **Manual Campaigns** have higher priority than AI assignments
- If a vehicle is in a campaign, it uses campaign ads
- If a vehicle is NOT in a campaign, it uses AI-assigned ads

---

## 📱 Vehicle App Workflow

### Step 1: Vehicle Login

1. **Open Vehicle App**
   - App runs on Android TV Box
   - Opens to login screen

2. **Enter Credentials**
   - **Vehicle ID**: Enter the Car ID (e.g., `CAR-215E9`)
   - **Password**: Enter the password set during vehicle registration
   - Click **"Login & Start"**

3. **Authentication**
   - App connects to Firestore
   - Verifies vehicle exists
   - Checks password matches
   - Validates vehicle status is "Active"
   - If valid, login succeeds

4. **Persistent Login**
   - Credentials are saved to localStorage
   - Vehicle stays logged in forever
   - Auto-login on app restart
   - **Never logs out** automatically

### Step 2: Fetch Assigned Ads

1. **Real-time Ad Fetching**
   - App listens to vehicle document in Firestore
   - Reads `vehicle.assignedAds` array
   - Checks if vehicle has `campaignId`
   - If in campaign, uses campaign ads
   - If not in campaign, uses AI-assigned ads

2. **Ad Processing**
   - Filters ads by time (only active ads)
   - Fetches ad details from `ads` collection
   - Downloads and caches ad media
   - Assigns ads to screen positions:
     - **Front Screen**: First ad (1920×480)
     - **Back Screen**: Second ad (1920×480)
     - **Left Screen**: Third ad (480×480)
     - **Right Screen**: Fourth ad (480×480)

### Step 3: Display Ads

1. **Four-Screen Layout**
   - **Front Screen**: Full-width top screen
   - **Back Screen**: Full-width middle screen
   - **Left Screen**: Square side screen
   - **Right Screen**: Square side screen

2. **Ad Playback**
   - **Videos**: Auto-play in loop
   - **Images**: Display for specified duration
   - Ads rotate based on schedule
   - Real-time updates when ads change

3. **Auto-Reload on Crash**
   - App automatically reloads if it crashes
   - Maintains login state
   - Resumes ad playback

---

## 🔄 Complete System Flow

### End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. Admin Logs In                  │
        │     - Username & Password         │
        │     - Access Dashboard            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  2. Register Vehicle               │
        │     - Fill vehicle details        │
        │     - Set password                │
        │     - Upload documents            │
        │     - Save → Car ID generated     │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  3. Upload Ad                     │
        │     - Fill ad details             │
        │     - Upload media (image/video)  │
        │     - Set budget & dates          │
        │     - Save → Ad created           │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  4. AI Assigns Ads                │
        │     - Click "Run AI"              │
        │     - AI distributes ads          │
        │     - Saves to vehicle.assignedAds│
        │     - Real-time update            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  5. Vehicle Logs In               │
        │     - Enter Car ID                │
        │     - Enter Password              │
        │     - Authenticate via Firestore  │
        │     - Stay logged in forever      │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  6. Vehicle Fetches Ads           │
        │     - Listen to vehicle document  │
        │     - Read assignedAds array      │
        │     - Check campaign priority     │
        │     - Download & cache ads        │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  7. Display Ads on Screens        │
        │     - Front: Ad 1 (1920×480)     │
        │     - Back: Ad 2 (1920×480)      │
        │     - Left: Ad 3 (480×480)       │
        │     - Right: Ad 4 (480×480)       │
        │     - Auto-play & loop            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  8. Real-time Updates             │
        │     - Ads change automatically    │
        │     - No manual refresh needed    │
        │     - Auto-reload on crash        │
        └───────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### Admin Authentication
```
Admin → Login Page → Enter Credentials → Firebase Auth → Dashboard Access
```

### Vehicle Authentication
```
Vehicle App → Login Screen → Enter Car ID + Password → 
Firestore Check → Verify Password → Verify Status → 
Save Credentials → Stay Logged In Forever
```

---

## 📊 Data Flow

### Vehicle Registration
```
Admin Form → Firestore (vehicles collection) → 
Generate Car ID → Save with password → 
Available for login
```

### Ad Creation
```
Admin Form → Firestore (ads collection) → 
Save media URL → Available for assignment
```

### AI Assignment
```
Trigger AI → Fetch vehicles & ads → 
Distribute ads → Update vehicle.assignedAds → 
Real-time sync to vehicle apps
```

### Vehicle Ad Fetching
```
Vehicle Login → Listen to vehicle document → 
Read assignedAds → Fetch ad details → 
Download media → Display on screens
```

---

## 🎯 Key Features

### Admin Dashboard
- ✅ User authentication
- ✅ Vehicle registration with multi-step wizard
- ✅ Ad management (create, edit, delete)
- ✅ AI scheduling system
- ✅ Manual campaign creation
- ✅ Analytics and reporting
- ✅ Activity logging
- ✅ Alert system

### Vehicle App
- ✅ Persistent login (never logs out)
- ✅ Real-time ad updates
- ✅ Four-screen display layout
- ✅ Auto-reload on crash
- ✅ Offline caching
- ✅ GPS tracking
- ✅ Heartbeat monitoring

---

## 🚀 Quick Start Guide

### For Admins

1. **Login**
   ```
   URL: https://your-app.vercel.app/login
   Username: your_username
   Password: your_password
   ```

2. **Register Vehicle**
   - Go to Vehicles → Add Vehicle
   - Complete 3-step wizard
   - **Note the Car ID and Password**

3. **Create Ad**
   - Go to Ads → Add Ad
   - Fill details and upload media
   - Save

4. **Assign Ads**
   - Go to Scheduling → Run AI
   - Or create Manual Campaign

### For Vehicles

1. **Open Vehicle App**
   - App launches on Android TV Box

2. **Login**
   - Enter Car ID (e.g., `CAR-215E9`)
   - Enter Password (set during registration)
   - Click Login

3. **Automatic**
   - App fetches assigned ads
   - Displays on 4 screens
   - Updates in real-time
   - Never logs out

---

## 📝 Important Notes

### Vehicle Credentials
- **Car ID**: Unique identifier (e.g., `CAR-215E9`)
- **Password**: Set during vehicle registration
- **Both required** for vehicle login
- **Saved permanently** - vehicle stays logged in

### Ad Assignment Priority
1. **Manual Campaigns** (highest priority)
2. **AI Schedule** (default)
3. **No assignment** (shows "No Ad" message)

### Real-time Updates
- All changes sync instantly via Firestore
- No manual refresh needed
- Vehicles update automatically when ads change

### Crash Recovery
- App auto-reloads on error
- Maintains login state
- Resumes ad playback

---

## 🔧 Technical Details

### Firebase Collections
- `vehicles` - Vehicle data with assignedAds array
- `ads` - Ad details and media URLs
- `campaigns` - Manual campaign assignments
- `activityLogs` - System activity tracking
- `alerts` - System alerts and notifications
- `admins` - Admin user accounts

### Vehicle App Storage
- `localStorage.vehicle_id` - Firestore document ID
- `localStorage.vehicle_password` - Login password
- `localStorage.vehicle_carId` - Car ID for display
- IndexedDB - Cached ad media

---

## 📞 Support

For issues or questions:
- Check browser console for errors
- Verify Firestore connection
- Check vehicle status is "Active"
- Ensure ads are assigned to vehicle
- Verify vehicle credentials are correct

---

**System Version**: 1.0.0  
**Last Updated**: 2025  
**Supervisor**: SIR ZOHAIB AHMED


