# Software Requirements Specification (SRS)
## AdMotion: Intelligent Vehicle Advertising Ecosystem

**Version:** 2.0  
**Date:** February 17, 2026  
**Status:** Final  
**Classification:** Confidential

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Specific Requirements](#3-specific-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Quality Attributes](#8-quality-attributes)
9. [Design Constraints](#9-design-constraints)
10. [Implementation Notes](#10-implementation-notes)
11. [Glossary](#11-glossary)
12. [Appendices](#12-appendices)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the AdMotion vehicle advertising platform. It serves as a comprehensive reference for developers, testers, architects, and stakeholders to understand the complete scope and specifications of the software system.

### 1.2 Scope
The SRS covers:
- Web-based Admin Dashboard (React application)
- Vehicle Display Application (PWA)
- Backend API (FastAPI)
- Database (Firebase Firestore)
- External Integrations
- System Administration and Operations

### 1.3 Audience
- Software Developers
- Quality Assurance Engineers
- System Architects
- Project Managers
- Business Stakeholders
- System Administrators

### 1.4 Document Organization
This document follows IEEE 830 standards for software requirements specification. Each requirement is numbered with unique identifiers for traceability.

---

## 2. Overall Description

### 2.1 Product Perspective
AdMotion is an independent web-based platform that operates in a cloud-only environment, leveraging Firebase as the primary backend infrastructure.

### 2.2 Product Functions
Major functions include:
1. User authentication and authorization
2. Vehicle registration and management
3. Advertising campaign management
4. Real-time content synchronization
5. Performance analytics and reporting
6. Financial management and settlements
7. System administration and monitoring

### 2.3 User Classes and Characteristics

#### 2.3.1 Super Admin
- **Skill Level:** High - Technical and business expertise
- **Primary Task:** System-wide management and oversight
- **Frequency:** Daily
- **Permissions:** Full system access

#### 2.3.2 Regional Admin
- **Skill Level:** Medium - Business operations experience
- **Primary Task:** Regional vehicle and campaign management
- **Frequency:** Daily
- **Permissions:** Regional management, vehicle approval, campaign oversight

#### 2.3.3 Moderator
- **Skill Level:** Medium - Reporting and analysis
- **Primary Task:** Content moderation, analytics review
- **Frequency:** Daily
- **Permissions:** Read-only access to most functions

#### 2.3.4 Fleet Manager
- **Skill Level:** Medium - Vehicle and financial management
- **Primary Task:** Vehicle management, revenue tracking
- **Frequency:** Weekly
- **Permissions:** Vehicle management, revenue dashboard

#### 2.3.5 Advertiser
- **Skill Level:** Low to Medium - Marketing background
- **Primary Task:** Campaign creation and management
- **Frequency:** Multiple times weekly
- **Permissions:** Campaign creation, analytics viewing

#### 2.3.6 Vehicle Application (Automated)
- **Type:** Embedded system on Android TV Box
- **Primary Task:** Display ads, health monitoring, sync
- **Frequency:** Continuous
- **Permissions:** Display management, status reporting

### 2.4 Operating Environment

#### 2.4.1 Hardware
- **Server:** Cloud-based (Firebase, Google Cloud)
- **Web Client:** Modern browsers (Chrome, Firefox, Safari)
- **Mobile:** Responsive design for tablets
- **Vehicle:** Android TV Box (Minimum 2GB RAM, 16GB Storage)

#### 2.4.2 Software
- **Frontend:** React 18+, Node.js 16+
- **Backend:** Python 3.9+, FastAPI
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage, Google Cloud Storage
- **Authentication:** Firebase Authentication

#### 2.4.3 Network Requirements
- Minimum bandwidth: 1 Mbps for dashboard
- Vehicle app: 500 Kbps sustained
- 4G/LTE connectivity for vehicles
- Redundant internet connectivity recommended

### 2.5 Design and Implementation Constraints
- Must use Firebase for data persistence
- Web application must be responsive
- Vehicle app must work offline
- All data must be encrypted in transit and at rest
- Must comply with local data protection laws
- Deployment to Vercel and Android platforms

---

## 3. Specific Requirements

### 3.1 Requirement Numbering Scheme
Requirements are numbered as:
- `F-XXX` for Functional Requirements
- `NF-XXX` for Non-Functional Requirements
- `UI-XXX` for User Interface Requirements
- `DS-XXX` for Data/Security Requirements
- `INT-XXX` for Integration Requirements

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Web Dashboard

**UI-001: Login Interface**
- Requirement: Display secure login form with email/username and password
- Components: Input fields, "Remember Me" checkbox, "Forgot Password" link
- Validation: Client-side and server-side validation
- Error Handling: Clear error messages for failed login attempts
- Rate Limiting: Maximum 5 attempts per 15 minutes per IP
- Success: Redirect to dashboard after authentication
- Session Management: 30-minute timeout with warning at 25 minutes

**UI-002: Dashboard Layout**
- Requirement: Responsive layout with sidebar navigation and main content area
- Components: 
  - Top navigation bar with user profile and notifications
  - Left sidebar with context menu
  - Main content area for page content
  - Footer with support links
- Responsiveness: Works on desktop (1920+), tablet (768-1024), mobile (320-767)
- Accessibility: WCAG 2.1 Level AA compliance

**UI-003: Navigation Menu**
- Requirement: Dynamic menu based on user role
- Super Admin Menu:
  - Dashboard
  - Admin Management
  - Vehicle Management
  - Campaign Management
  - Analytics & Reports
  - Financial Management
  - System Settings
  - Support & Help
- Admin Menu: (subset of Super Admin)
- Moderator Menu: (reporting and analytics only)
- Accessibility: Keyboard navigation support

#### 4.1.2 Vehicle Display Application

**UI-004: Vehicle App Layout**
- Requirement: Display ads across 4 screens (front, back, left, right)
- Screen Layout:
  - Front: 1920x480 (primary)
  - Back: 1920x480 (secondary)
  - Left: 480x480 (side)
  - Right: 480x480 (side)
- Ad Rotation: Automatic transition based on campaign schedule
- Smooth Transitions: Fade effect between ads (500ms)
- Offline Mode: Display cached ads if no connectivity
- Debug Overlay: Hidden debug panel (Shift+D) showing metrics

### 4.2 Hardware Interfaces

**INT-001: Android TV Box Integration**
- Requirement: Support mainstream Android TV Box models
- Supported Models: Xiaomi Box, Mecool, X88 Pro
- Minimum Specs: ARMv7+ processor, 2GB RAM, 16GB storage
- Connectivity: Dual WiFi bands (2.4GHz, 5GHz)
- Communication: HTTP/HTTPS, WebSocket for real-time updates

**INT-002: LED Display Interface**
- Requirement: Support HD and 4K LED displays
- Display Types: P4, P5 outdoor LED panels
- Resolution Support: 1920x480, 2560x720, 3840x2160
- Brightness: 5000+ nits with auto-dimming
- Refresh Rate: 60Hz minimum
- Color Support: 16-bit color minimum

**INT-003: GPS Module Integration**
- Requirement: Track vehicle location in real-time
- Update Frequency: Every 30 seconds
- Accuracy: ±10 meters
- Data Format: Latitude, Longitude, Altitude, Speed
- Transmission: Encrypted to backend
- Privacy: GPS data retained for 30 days maximum

### 4.3 Software Interfaces

**INT-004: Firebase Firestore Interface**
- Requirement: Interact with Firestore database for CRUD operations
- Collections: users, vehicles, campaigns, ads, impressions, revenue
- Real-time Listeners: Subscribe to real-time updates
- Batch Operations: Atomic multi-document transactions
- Query Support: Complex filtering and sorting
- Security: Rule-based access control

**INT-005: Firebase Storage Interface**
- Requirement: Store and retrieve media files
- Supported Formats: MP4, WebM, JPG, PNG, GIF
- Maximum File Size: 100MB per file
- Upload: Direct browser upload with progress tracking
- Download: CDN delivery with auto-resizing
- Access: Public/private based on rules

**INT-006: Firebase Authentication Interface**
- Requirement: Secure user authentication
- Methods: Email/password, phone, Google Sign-In
- Token Management: JWT tokens with 1-hour expiry
- Refresh Tokens: 7-day refresh token rotation
- Multi-Factor Authentication: Support for 2FA
- Session Management: Automatic cleanup after timeout

**INT-007: FastAPI Backend Interface**
- Requirement: Call Python AI scheduling engine
- Endpoints: 
  - `/api/schedule` - Trigger ad scheduling algorithm
  - `/api/optimize` - Optimize campaign distribution
  - `/api/analytics` - Generate analytics reports
- Protocol: REST over HTTPS
- Rate Limiting: 100 requests per minute per IP
- Timeout: 30-second maximum request timeout
- Error Codes: Standard HTTP status codes

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

**F-001: User Login**
- **Description:** Authenticate user with email/password credentials
- **Precondition:** User has registered account
- **Main Flow:**
  1. User enters email and password
  2. System validates format
  3. System queries Firestore for user
  4. System verifies password hash
  5. System creates session token
  6. System logs authentication event
  7. System redirects to dashboard
- **Postcondition:** User authenticated, session established, audit log updated
- **Acceptance Criteria:**
  - Login succeeds within 2 seconds
  - Invalid credentials show clear error
  - Account lockout after 5 failed attempts
  - Sessions expire after 30 minutes of inactivity
  - All login events audited

**F-002: User Logout**
- **Description:** Terminate user session
- **Precondition:** User is logged in
- **Main Flow:**
  1. User clicks Logout
  2. System destroys session token
  3. System clears browser storage
  4. System logs logout event
  5. System redirects to login page
- **Acceptance Criteria:**
  - Logout completes within 500ms
  - Session immediately invalidated
  - Forward button disabled after logout
  - Session data cleared completely

**F-003: Password Reset**
- **Description:** Allow user to reset forgotten password
- **Precondition:** User exists in system
- **Main Flow:**
  1. User clicks "Forgot Password"
  2. User enters email address
  3. System validates email exists
  4. System sends reset email with link
  5. User clicks link (valid for 24 hours)
  6. User enters new password
  7. System validates password strength
  8. System updates password hash
  9. User logged in automatically
- **Acceptance Criteria:**
  - Email sent within 10 seconds
  - Reset link valid for 24 hours only
  - One-time use reset link
  - Password must meet complexity requirements
  - Old sessions invalidated after reset

**F-004: Role-Based Access Control**
- **Description:** Enforce user permissions based on assigned role
- **Precondition:** User is authenticated
- **Main Flow:**
  1. System loads user role from profile
  2. System loads role permissions from configuration
  3. System filters UI based on permissions
  4. System enforces permissions on backend
  5. Unauthorized access returns 403 error
- **Roles:**
  - Super Admin: All permissions
  - Admin: Regional management
  - Moderator: Read-only reporting
  - Fleet Manager: Vehicle and revenue management
  - Advertiser: Campaign creation and monitoring
- **Acceptance Criteria:**
  - Permission checks happen on every API call
  - Unauthorized access logged
  - Role changes effective within 60 seconds
  - UI reflects user permissions correctly

### 5.2 Vehicle Management

**F-005: Vehicle Registration**
- **Description:** Register new vehicle with complete details
- **Precondition:** Admin user logged in, vehicle not registered
- **Main Flow:**
  1. Admin navigates to Vehicle Registration
  2. Admin enters vehicle details (make, model, color, plate)
  3. Admin enters owner details (name, CNIC, contact)
  4. Admin enters bank details (account, IBAN)
  5. Admin uploads documents (registration, insurance, ID)
  6. System validates all inputs
  7. System calls AI endpoint to generate vehicle ID
  8. System stores in Firestore
  9. System sends credentials to owner
  10. Vehicle status set to "Pending Verification"
- **Acceptance Criteria:**
  - Registration completes in <30 seconds
  - All fields validated before submission
  - Documents auto-scanned for completeness
  - Owner receives credentials via email/SMS
  - Vehicle ID generated uniquely
  - Audit log records registration

**F-006: Vehicle Status Management**
- **Description:** Update vehicle operational status
- **Precondition:** Vehicle registered in system
- **Status Values:**
  - Pending: Awaiting verification
  - Active: Operational, displaying ads
  - Maintenance: Temporary offline for service
  - Suspended: Deactivated due to violation
  - Inactive: Owner requested deactivation
- **Main Flow:**
  1. Admin selects vehicle from list
  2. Admin clicks "Change Status"
  3. Admin selects new status
  4. Admin provides reason/notes
  5. System updates status in Firestore
  6. System notifies owner of status change
  7. System triggers appropriate workflows
- **Acceptance Criteria:**
  - Status change effective within 10 seconds
  - Owner notified immediately
  - Status change audited
  - Ad delivery respects status
  - Heartbeat validation updated

**F-007: Vehicle Health Monitoring**
- **Description:** Track vehicle connectivity and health status
- **Precondition:** Vehicle is active and connected
- **Main Flow:**
  1. Vehicle sends heartbeat every 60 seconds
  2. System records heartbeat timestamp
  3. System checks device metrics (CPU, memory, temp)
  4. System analyzes connectivity quality
  5. System flags issues if detected
  6. System maintains health dashboard
  7. System alerts admin if vehicle offline >5 minutes
- **Health Metrics:**
  - Last Seen: Latest heartbeat timestamp
  - Connectivity: Signal strength, latency
  - Performance: CPU usage, memory available
  - Storage: Available space for ad caching
  - Temperature: Device operating temperature
- **Acceptance Criteria:**
  - Heartbeat received within 90 seconds (tolerance for delays)
  - Dashboard shows real-time health
  - Alerts generated for > 5 minute offline
  - Historical data retained for 30 days
  - Performance data accurate to <5%

**F-008: Vehicle Location Tracking**
- **Description:** Track vehicle GPS location
- **Precondition:** Vehicle has GPS module and active connectivity
- **Main Flow:**
  1. GPS module provides location every 30 seconds
  2. Vehicle app sends to backend
  3. System stores location in Firestore
  4. System updates location on admin map
  5. System calculates vehicle path/route
  6. System enables location-based ad targeting
- **Acceptance Criteria:**
  - Location accuracy within 10 meters
  - Location updated every 30-60 seconds
  - Historical locations retained for 90 days
  - Map shows real-time vehicle positions
  - Location data encrypted in transit

### 5.3 Campaign Management

**F-009: Campaign Creation**
- **Description:** Create new advertising campaign
- **Precondition:** Advertiser logged in with valid account
- **Main Flow:**
  1. Advertiser clicks "Create Campaign"
  2. Enters campaign details (name, description)
  3. Sets budget (minimum $100, maximum $100,000)
  4. Sets campaign duration (minimum 1 day, maximum 365 days)
  5. Uploads media content (images or videos)
  6. Uploads supported formats:
     - Images: JPG, PNG, GIF (max 10MB each)
     - Videos: MP4, WebM (max 100MB)
  7. Sets targeting criteria:
     - Geographic area (city, zone)
     - Vehicle type (taxi, bus, truck)
     - Time slots (peak, off-peak)
     - Days of week
  8. Reviews campaign summary
  9. Submits for approval
- **Acceptance Criteria:**
  - Campaign creation takes <10 minutes
  - Media preview available before submission
  - Budget validation prevents overspend
  - Targeting options cover minimum geographic areas
  - Content preview shows on all 4 screens
  - Campaign starts immediately after approval

**F-010: Campaign Approval Workflow**
- **Description:** Review and approve/reject campaigns
- **Precondition:** Campaign submitted for approval
- **Approval Process:**
  1. System performs automated checks:
     - Content scan for prohibited content
     - Brand safety verification
     - Keyword filtering
  2. System assigns to human moderator if needed
  3. Moderator reviews content
  4. Moderator can:
     - Approve: Campaign goes live within 1 minute
     - Request Changes: Advertiser must revise
     - Reject: Campaign canceled, reason provided
  5. Appeal process available for rejection
- **Timeline:**
  - Automated checks: <5 seconds
  - Human review: <4 hours during business hours
  - Decision notification: <30 seconds after decision
- **Acceptance Criteria:**
  - 99% content approved within 4 hours
  - Clear rejection reasons provided
  - Appeal process documented
  - Audit trail of all decisions
  - Approval history accessible

**F-011: Campaign Scheduling**
- **Description:** Schedule when campaign displays
- **Precondition:** Campaign approved
- **Scheduling Options:**
  - Immediate start
  - Scheduled start date/time
  - Recurring daily/weekly
  - Specific time ranges (9 AM - 5 PM)
  - Days of week selection
  - Holiday exclusions
- **Main Flow:**
  1. Advertiser sets schedule preferences
  2. System validates schedule against constraints
  3. System calculates expected impressions
  4. System shows cost estimate
  5. Advertiser confirms
  6. AI engine generates distribution plan
  7. System schedules ad delivery to vehicles
- **Acceptance Criteria:**
  - Flexible scheduling options
  - Accurate impression forecasting
  - Schedule changes effective within 1 hour
  - Recurring campaigns auto-renew
  - Holiday calendar integration

**F-012: Campaign Monitoring & Analytics**
- **Description:** Track campaign performance in real-time
- **Precondition:** Campaign is active
- **Metrics Tracked:**
  - Impressions (total, unique)
  - Geographic distribution
  - Time of day performance
  - Vehicle type performance
  - Budget spent vs. allocated
  - ROI calculation
- **Dashboard Display:**
  - Real-time metrics updated every 10 seconds
  - Charts showing performance trends
  - Geographic heat map
  - Performance by vehicle breakdown
  - Cost per impression tracking
- **Acceptance Criteria:**
  - Metrics accurate within <1% (50-60 second delay acceptable)
  - Dashboard loads in <3 seconds
  - Charts respond to zoom/filters
  - Export data in CSV, PDF, Excel
  - Custom date range analysis

**F-013: Campaign Budget Management**
- **Description:** Track and enforce campaign budgets
- **Precondition:** Campaign is active
- **Budget Features:**
  - Daily budget limit
  - Total campaign budget limit
  - Budget holdback (5% reserve)
  - Real-time spend tracking
  - Automatic pausing when budget exhausted
  - Manual budget adjustment (if approved)
- **Alerts:**
  - 80% budget consumed: Warning notification
  - 95% budget consumed: Critical alert
  - Budget exhausted: Auto-pause campaign
- **Acceptance Criteria:**
  - Budget enforcement within 1 minute
  - Real-time spend calculation
  - Clear budget status indicators
  - Historical spend records
  - Budget reports available

**F-014: Emergency Campaign Stop**
- **Description:** Immediately halt active campaign
- **Precondition:** Campaign is active
- **Trigger Scenarios:**
  - Admin manual stop (security, legal)
  - Advertiser self-cancel
  - System auto-stop (violation detected)
  - Emergency broadcast needed
- **Main Flow:**
  1. User clicks "Emergency Stop"
  2. System confirms action
  3. System immediately stops distribution
  4. System sends stop signal to all vehicles within 5 seconds
  5. Vehicles revert to default/previous ad
  6. System logs action with timestamp and reason
  7. Stakeholders notified
- **Acceptance Criteria:**
  - All vehicles stop within 10 seconds
  - Zero orphaned ads on display
  - Audit trail records reason and user
  - Partial refund processed if applicable
  - Investigation process initiated

### 5.4 Ad Distribution & Scheduling

**F-015: AI-Powered Ad Distribution**
- **Description:** Intelligently distribute ads across vehicle network
- **Precondition:** Campaigns ready, vehicles available
- **Algorithm Features:**
  - Round-robin distribution for fairness
  - Budget optimization
  - Vehicle availability consideration
  - Geographic targeting
  - Time-based scheduling
  - Performance-based adjustments
  - Conflict resolution
- **Main Flow:**
  1. Admin triggers AI scheduling
  2. System collects current campaign data
  3. System collects vehicle availability data
  4. AI algorithm processes optimization
  5. Algorithm generates distribution plan
  6. System validates plan against constraints
  7. System assigns ads to vehicles
  8. System updates Firestore with assignments
  9. Real-time listeners propagate to vehicles
  10. Vehicles begin displaying scheduled ads
- **Acceptance Criteria:**
  - Algorithm efficiency >95%
  - Processing completes within 5 minutes
  - Fair distribution across vehicles
  - Budget constraints always satisfied
  - Geographic targeting respected
  - Real-time execution of schedule

**F-016: Manual Ad Assignment**
- **Description:** Override automatic distribution for special campaigns
- **Precondition:** Campaign created, user has override permission
- **Main Flow:**
  1. Admin/Advertiser selects "Manual Override"
  2. Selects specific vehicles from list
  3. Can apply to:
     - Individual vehicles
     - Vehicle groups (by zone, type)
     - All vehicles in campaign
  4. Reviews cost impact
  5. Confirms assignment
  6. System updates assignments immediately
  7. Changes reflected to vehicles within 10 seconds
- **Acceptance Criteria:**
  - Manual assignment overrides auto-scheduling
  - Premium pricing available
  - Display of cost impact
  - Instant vehicle-side update
  - Audit trail of overrides

**F-017: Real-Time Synchronization**
- **Description:** Push content updates to vehicles in real-time
- **Precondition:** Vehicle online, change made to assignment
- **Main Flow:**
  1. Admin makes change (new campaign, update, stop)
  2. System detects change in Firestore
  3. System triggers update to affected vehicles
  4. WebSocket sends update notification to vehicle app
  5. Vehicle app receives update
  6. Vehicle downloads new content if needed
  7. Vehicle caches content locally
  8. Vehicle switches to new ad/content
  9. Vehicle sends confirmation to system
  10. System logs successful sync
- **Acceptance Criteria:**
  - 95% of vehicles sync within 200ms
  - Graceful handling of offline vehicles
  - Queue updates for offline vehicles
  - Content pre-cached when possible
  - Bandwidth optimization
  - Sync success rates tracked

**F-018: Offline Content Handling**
- **Description:** Display ads when vehicle has no connectivity
- **Precondition:** Vehicle has cached content, no connection
- **Main Flow:**
  1. Vehicle detects no connectivity
  2. Vehicle continues displaying cached ads
  3. Vehicle queues health/impression data
  4. When connection restored:
     - Sync queued data
     - Download new content
     - Update schedule
- **Acceptance Criteria:**
  - Graceful operation for up to 24 hours offline
  - Queue up to 10,000 impression records
  - Cache rotation prevents stale content
  - Automatic cleanup of old cache
  - Switch to previous ad if current missing

### 5.5 Analytics & Reporting

**F-019: Real-Time Analytics Dashboard**
- **Description:** Display live performance metrics
- **Precondition:** Campaigns running
- **Dashboard Components:**
  - Live KPI cards (impressions, spend, ROI)
  - Graph showing impression trend
  - Geographic heat map
  - Top performing campaigns
  - Vehicle performance breakdown
  - Real-time notifications
- **Update Frequency:** Every 10 seconds
- **Acceptance Criteria:**
  - All metrics accurate within 1%
  - Dashboard responsive on all devices
  - Charts interactive (zoom, filter, drill-down)
  - 99.9% dashboard availability
  - <3 second load time

**F-020: Campaign Performance Reports**
- **Description:** Generate detailed campaign analytics
- **Precondition:** Campaign has run for at least 1 hour
- **Report Components:**
  - Campaign summary (name, duration, budget, spend)
  - Impression metrics (total, unique, by location)
  - Performance trends (hourly, daily)
  - Geographic breakdown
  - Vehicle type breakdown
  - ROI calculation
  - Comparison to benchmarks
  - Optimization recommendations
- **Export Formats:** PDF, Excel, CSV, JSON
- **Report Scheduling:** On-demand or automated daily/weekly
- **Acceptance Criteria:**
  - Report generation completes within 30 seconds
  - Data accuracy verified
  - Trend analysis meaningful
  - Export formats render correctly
  - Historical reports accessible

**F-021: Revenue & Financial Reports**
- **Description:** Track financial performance and payouts
- **Precondition:** Campaigns completed and impressions recorded
- **Reports Include:**
  - Total revenue by period
  - Cost per impression trends
  - Vehicle owner payouts
  - Platform revenue
  - Tax calculations
  - Financial reconciliation
  - Payout history
- **Acceptance Criteria:**
  - Financial accuracy to 0.01%
  - Audit trail for all transactions
  - Payout processing transparent
  - Historical records retained
  - Tax reporting compliance

### 5.6 Payment & Revenue Management

**F-022: Revenue Calculation**
- **Description:** Calculate revenue based on impressions
- **Formula:** Revenue = Impressions × CPM ÷ 1000
- **Precondition:** Campaign running and impressions recorded
- **Main Flow:**
  1. System records each impression
  2. Hourly: System aggregates impressions
  3. Daily: System calculates daily revenue
  4. Monthly: System calculates total revenue
  5. System applies:
     - Campaign CPM rate
     - Volume discounts if applicable
     - Performance bonuses if earned
     - Tax withholding
  6. System generates revenue records
  7. System prepares payout calculation
- **Acceptance Criteria:**
  - Calculation accuracy to 0.01%
  - Real-time impression counting
  - Rate adjustments applied correctly
  - Historical revenue tracking
  - Transparent calculation details

**F-023: Automated Payout Processing**
- **Description:** Process monthly payments to vehicle owners
- **Precondition:** Month ended, revenue calculated
- **Payment Process:**
  1. System calculates payable amount
  2. Minimum payout threshold check ($50)
  3. Tax calculations and withholding
  4. Payout schedule generation
  5. Payment batch creation
  6. Payment processor submission
  7. Payment status tracking
  8. Confirmation to vehicle owner
  9. Payment receipt generation
- **Payment Methods:**
  - Bank transfer
  - E-wallet transfer
  - Check (if requested)
- **Timeline:**
  - Processing: 1-2 days
  - Settlement: 3-5 business days
- **Acceptance Criteria:**
  - All eligible payments processed
  - 99.9% success rate
  - Payment receipts generated
  - Dispute process available
  - Payment history accessible

**F-024: Invoice & Statement Generation**
- **Description:** Generate financial statements and invoices
- **Precondition:** Transaction data available
- **Statement Components:**
  - Vehicle owner earnings statement
  - Campaign billing invoice
  - Tax summary
  - Itemized impression records
  - Payment history
- **Frequency:**
  - Monthly automatic statements
  - On-demand reports available
- **Export Formats:** PDF, Excel, Email delivery
- **Acceptance Criteria:**
  - Statements generated within 1 minute
  - Data accuracy verified
  - Professional formatting
  - Email delivery successful
  - Historical access >2 years

### 5.7 System Settings & Administration

**F-025: User Role Management**
- **Description:** Create and manage user roles and permissions
- **Precondition:** Super Admin logged in
- **Features:**
  - Create custom roles
  - Assign permissions to roles
  - Manage user-role assignments
  - Role hierarchy definition
  - Permission inheritance
- **Predefined Roles:**
  - Super Admin, Admin, Moderator, Fleet Manager, Advertiser
- **Permission Categories:**
  - User Management
  - Vehicle Management
  - Campaign Management
  - Financial Management
  - Reporting & Analytics
  - System Administration
- **Acceptance Criteria:**
  - Role changes effective within 60 seconds
  - Permission denials return appropriate error
  - Audit log records all role changes
  - Role-based UI rendering correct

**F-026: System Configuration**
- **Description:** Configure system-level parameters
- **Precondition:** Super Admin logged in
- **Configurable Parameters:**
  - Revenue share percentages
  - Minimum/maximum campaign budgets
  - Content moderation rules
  - Geographic service areas
  - Payment processing settings
  - Notification preferences
  - Maintenance windows
- **Acceptance Criteria:**
  - Changes effective within 1 hour
  - Configuration validation prevents errors
  - Rollback capability for configurations
  - Change history maintained
  - Audit logging of all changes

**F-027: System Monitoring & Alerts**
- **Description:** Monitor system health and performance
- **Precondition:** System running
- **Monitoring Metrics:**
  - API response times
  - Database performance
  - Storage usage
  - Network bandwidth
  - Error rates
  - Failed requests
  - Active user count
  - System resource usage
- **Alerts Triggered For:**
  - High error rates (>1% of requests)
  - Slow response times (>5 seconds)
  - Database connectivity issues
  - Storage >80% capacity
  - Network issues
  - Unauthorized access attempts
- **Acceptance Criteria:**
  - Real-time monitoring dashboard
  - Alerts sent within 60 seconds
  - Multiple alert channels (email, SMS, in-app)
  - Alert history maintained
  - Performance data retained for 90 days

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**NF-001: Dashboard Response Time**
- Dashboard page load time: <2 seconds (first load)
- Page transitions: <500ms
- Data table rendering: <1 second for 1000 rows
- Chart generation: <3 seconds for complex charts
- Search results: <1 second for typical queries
- Measured: 95th percentile response time

**NF-002: API Performance**
- REST API response time: <200ms for critical endpoints
- Non-critical endpoints: <1 second
- Real-time synchronization: <200ms for 95% of messages
- Batch operations: Complete 1000 items in <30 seconds

**NF-003: Vehicle App Performance**
- App launch time: <3 seconds
- Ad switching: <500ms with smooth transition
- Offline mode: Instant (cached)
- UI responsiveness: 60 FPS minimum

**NF-004: Scalability**
- System supports 1000+ concurrent users
- Handles 10,000+ active vehicles
- Process 100+ impressions per second
- Generate 1000 reports simultaneously
- Support millions of daily transactions

### 6.2 Reliability & Availability

**NF-005: System Uptime**
- Target: 99.9% uptime (8.76 hours downtime per year)
- Measured: Over 30-day periods
- Maintenance windows: Scheduled during low-usage periods
- Zero-downtime deployments required

**NF-006: Fault Tolerance**
- Automatic failover for critical services
- No single point of failure
- Data replication across regions
- Backup database auto-activation
- Message queue persistence

**NF-007: Data Backup & Recovery**
- Daily backups retained for 90 days
- Weekly backups retained for 1 year
- Recovery Time Objective (RTO): <1 hour
- Recovery Point Objective (RPO): <1 hour
- Tested recovery procedures monthly

**NF-008: Error Handling**
- Graceful degradation when services fail
- Clear error messages to users
- Automatic retry for transient failures
- Circuit breaker pattern for dependent services
- Exponential backoff for retries

### 6.3 Security Requirements

**NF-009: Authentication**
- Support password authentication with:
  - Minimum 12 characters
  - Uppercase, lowercase, numbers, symbols required
  - Password history prevents reuse of last 5 passwords
- Multi-factor authentication (MFA) support:
  - Time-based one-time password (TOTP)
  - SMS-based OTP
  - Email verification
- Session management:
  - 30-minute idle timeout
  - 8-hour maximum session duration
  - Single session per user (new login invalidates old)

**NF-010: Authorization**
- Role-based access control (RBAC)
- Attribute-based access control (ABAC) for complex scenarios
- Permission inheritance from roles
- Deny-by-default approach
- Audit trail of all permission checks

**NF-011: Data Encryption**
- TLS 1.3 for all data in transit
- AES-256 encryption for data at rest
- Key rotation every 90 days
- Separate encryption keys per data tenant
- Secure key management using Google Cloud KMS

**NF-012: Input Validation**
- Client-side validation for UX
- Server-side validation for security
- Whitelist-based input validation
- File upload validation:
  - File signature verification
  - File size limits enforced
  - Antivirus scanning
  - MIME type validation

**NF-013: Output Encoding**
- HTML entity encoding for web output
- URL encoding for URLs
- JSON encoding for API responses
- CSV escaping for exports
- Prevention of XSS attacks

**NF-014: Audit Logging**
- All user actions logged
- Login/logout events recorded
- Configuration changes tracked
- Data access logged
- Financial transactions audited
- 7-year retention for audit logs
- Tamper-proof log storage

**NF-015: Compliance Requirements**
- GDPR compliance:
  - Right to access personal data
  - Right to be forgotten (data deletion)
  - Data portability
  - Breach notification within 72 hours
- CCPA compliance for US data
- Local data protection laws
- Regional privacy regulations
- PCI-DSS compliance for payment data

### 6.4 Usability Requirements

**NF-016: User Interface Consistency**
- Consistent color scheme and typography
- Standard navigation patterns
- Keyboard shortcuts for common tasks
- Help system integrated throughout
- Dark/light theme support

**NF-017: Accessibility**
- WCAG 2.1 Level AA compliance
- Screen reader support
- Keyboard navigation for all features
- Color contrast ratio 4.5:1 for text
- Alternative text for all images
- Form labels associated with inputs

**NF-018: Responsiveness**
- Desktop: 1920x1080 and larger
- Tablet: 768x1024 to 1024x768
- Mobile: 320x568 to 480x854
- Touch-friendly interface (minimum 44x44 px buttons)
- Orientation changes handled gracefully

**NF-019: Help & Documentation**
- In-app help with contextual tips
- Tutorial for first-time users
- FAQ section accessible
- Video demonstrations for complex tasks
- Support contact information readily available

### 6.5 Maintainability & Support

**NF-020: Code Quality**
- Code review before all deployments
- Test coverage >80% for critical paths
- Documentation for all major functions
- Adherence to coding standards
- Regular technical debt reduction

**NF-021: Logging & Monitoring**
- Comprehensive logging of all operations
- Structured logging format (JSON)
- Log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Centralized log aggregation
- Real-time alerting for critical events

**NF-022: Supportability**
- 24/5 support for critical issues (weekdays)
- 24/7 support for critical security issues
- <1 hour response time for critical issues
- <4 hour response time for normal issues
- Knowledge base maintained
- Support ticket tracking system

**NF-023: Deployment**
- Automated deployment pipeline
- Blue-green deployment capability
- Canary deployments for risky changes
- Rollback within 5 minutes if needed
- Zero-downtime updates for most changes

---

## 7. Data Requirements

### 7.1 Data Dictionary

#### Users Collection
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| uid | String | PK | Unique user identifier |
| email | String | Unique | User email address |
| password_hash | String | Required | Bcrypt hashed password |
| role | String | [Admin, Moderator, etc] | User role |
| name | String | Max 100 | Full name |
| phone | String | Max 20 | Contact number |
| created_at | Timestamp | Auto | Account creation date |
| last_login | Timestamp | Optional | Last login timestamp |

#### Vehicles Collection
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| vehicle_id | String | PK | Unique vehicle identifier |
| owner_id | String | FK | Reference to owner user |
| status | String | [Pending, Active, Maintenance, Suspended, Inactive] | Current status |
| make | String | Required | Vehicle make |
| model | String | Required | Vehicle model |
| year | Integer | 1990-present | Vehicle year |
| plate_number | String | Unique | License plate |
| color | String | Optional | Vehicle color |
| gps_location | GeoPoint | Auto | Current GPS location |
| last_heartbeat | Timestamp | Auto | Last health check |
| created_at | Timestamp | Auto | Registration date |

#### Campaigns Collection
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| campaign_id | String | PK | Unique campaign identifier |
| advertiser_id | String | FK | Campaign creator |
| status | String | [Draft, Pending, Active, Completed, Canceled, Suspended] | Campaign status |
| name | String | Max 200 | Campaign name |
| budget | Number | Min 100 | Total budget allocated |
| budget_spent | Number | Updated hourly | Amount spent |
| start_date | Timestamp | Required | Campaign start |
| end_date | Timestamp | Required | Campaign end |
| targeting_geo | Array | List of zones | Geographic targeting |
| targeting_time | Array | Time ranges | Time-based targeting |
| created_at | Timestamp | Auto | Created date |
| approved_at | Timestamp | Optional | Approval timestamp |

### 7.2 Data Volume Estimates

| Entity | Year 1 | Year 2 | Year 3 |
|--------|--------|---------|---------|
| Users | 1,000 | 5,000 | 20,000 |
| Vehicles | 500 | 2,000 | 5,000 |
| Campaigns | 5,000 | 50,000 | 200,000 |
| Impressions/day | 5M | 50M | 200M |
| Storage (GB) | 50 | 200 | 500 |

---

## 8. Quality Attributes

### 8.1 Performance Metrics
- Page load time: <2 seconds (95th percentile)
- API latency: <200ms (95th percentile)
- Sync latency: <200ms (95th percentile)
- Database query time: <100ms (95th percentile)

### 8.2 Reliability Metrics
- System uptime: >99.9%
- Data consistency: 99.99%
- Transaction success rate: >99.9%
- Error rate: <0.1% of requests

### 8.3 Security Metrics
- Zero critical vulnerabilities
- Quarterly security audits
- <24 hour patch deployment for critical CVEs
- 100% encryption in transit and at rest

### 8.4 User Experience Metrics
- System Usability Scale (SUS): >80
- Net Promoter Score (NPS): >60
- First-time user setup: <15 minutes
- Feature discoverability: >90%

---

## 9. Design Constraints

### 9.1 Technology Constraints
- Firebase Firestore as primary database
- React for web frontend
- FastAPI for backend API
- Android TV Box for vehicle displays
- PWA for cross-platform vehicle app

### 9.2 Architectural Constraints
- Microservices architecture where possible
- Stateless API design for scalability
- Cloud-native deployment
- RESTful API design
- Real-time messaging via WebSockets/Firebase

### 9.3 Regulatory Constraints
- GDPR data privacy compliance
- CCPA compliance for US
- Local data residency requirements
- Financial transaction regulations
- Advertising standards compliance

---

## 10. Implementation Notes

### 10.1 Development Best Practices
- Test-driven development (TDD) required
- Code review for all changes
- Continuous integration/deployment
- Automated testing at all levels
- Performance testing before release

### 10.2 Documentation Requirements
- API documentation with examples
- User guides for all major features
- Administrator manual
- Architecture documentation
- Database schema documentation

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| CPM | Cost Per Thousand Impressions |
| DOOH | Digital Out-of-Home Advertising |
| GDPR | General Data Protection Regulation |
| ACAC | Attribute-Based Access Control |
| RBAC | Role-Based Access Control |
| PWA | Progressive Web Application |
| API | Application Programming Interface |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| KMS | Key Management Service |

---

## 12. Appendices

### Appendix A: API Endpoint Specifications
[Detailed endpoint specifications with request/response examples]

### Appendix B: Database Schema Diagrams
[Firestore collection hierarchy and relationships]

### Appendix C: Security Policy Document
[Detailed security policies and procedures]

### Appendix D: Compliance Checklist
[GDPR, CCPA, and local regulation compliance items]

---

**Approval:**

This SRS is approved by:

**Project Manager:** _____________________________ Date: _________

**Technical Lead:** _____________________________ Date: _________

**Business Sponsor:** _____________________________ Date: _________

---

**END OF DOCUMENT**