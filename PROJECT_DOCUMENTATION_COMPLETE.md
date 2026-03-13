# Complete Project Documentation
## AdMotion: Intelligent Vehicle Advertising Ecosystem

**Master Document Version:** 2.0  
**Last Updated:** February 17, 2026  
**Status:** Complete Final Handoff

---

## 📋 Comprehensive Table of Contents

### SECTION 1: PROJECT OVERVIEW
- [1.1 Executive Summary](#11-executive-summary)
- [1.2 Project Vision](#12-project-vision)
- [1.3 Key Success Factors](#13-key-success-factors)
- [1.4 High-Level Timeline](#14-high-level-timeline)
- [1.5 Project Organization](#15-project-organization)

### SECTION 2: DETAILED DOCUMENTATION
- **2.1 Project Charter** → [Complete Project Charter](docs/Project Charter - AdMotion.md)
  - Scope, objectives, stakeholders, timeline, governance
  
- **2.2 Business Requirements Document** → [Comprehensive BRD](docs/BRD - AdMotion - Comprehensive.md)
  - 40+ pages covering business case, market analysis, requirements
  
- **2.3 Software Requirements Specification** → [Comprehensive SRS](docs/SRS - AdMotion - Comprehensive.md)
  - 35+ pages covering functional and non-functional specifications
  
- **2.4 User Stories & Use Cases** → [Detailed User Stories](docs/User Stories - AdMotion.md)
  - User stories, acceptance criteria, sprint planning
  
- **2.5 Feature Analysis** → [Complete Feature Analysis](docs/Feature Analysis - AdMotion.md)
  - Feature breakdown, dependencies, prioritization

### SECTION 3: TECHNICAL DOCUMENTATION
- [3.1 System Architecture](#31-system-architecture)
- [3.2 Technology Stack](#32-technology-stack)
- [3.3 Data Architecture](#33-data-architecture)
- [3.4 API Specifications](#34-api-specifications)
- [3.5 Deployment Architecture](#35-deployment-architecture)

### SECTION 4: OPERATIONAL DOCUMENTATION
- [4.1 Admin Operations Guide](#41-admin-operations-guide)
- [4.2 Vehicle Onboarding Process](#42-vehicle-onboarding-process)
- [4.3 Campaign Management Workflow](#43-campaign-management-workflow)
- [4.4 Dashboard User Manual](#44-dashboard-user-manual)

### SECTION 5: DEVELOPMENT & DEPLOYMENT
- [5.1 Development Setup](#51-development-setup)
- [5.2 Build & Deployment](#52-build--deployment)
- [5.3 Testing Strategy](#53-testing-strategy)
- [5.4 DevOps Practices](#54-devops-practices)

### SECTION 6: QUALITY ASSURANCE
- [6.1 Testing Plan](#61-testing-plan)
- [6.2 Security Validation](#62-security-validation)
- [6.3 Performance Testing](#63-performance-testing)
- [6.4 UAT Procedures](#64-uat-procedures)

### SECTION 7: SUPPORT & MAINTENANCE
- [7.1 Support Process](#71-support-process)
- [7.2 Maintenance Schedule](#72-maintenance-schedule)
- [7.3 Troubleshooting Guide](#73-troubleshooting-guide)
- [7.4 SLA Terms](#74-sla-terms)

### SECTION 8: APPENDICES
- [Appendix A: Glossary](#appendix-a-glossary)
- [Appendix B: Acronyms](#appendix-b-acronyms)
- [Appendix C: References](#appendix-c-references)
- [Appendix D: Version History](#appendix-d-version-history)

---

## 1.1 Executive Summary

### Project: AdMotion - Intelligent Vehicle Advertising Ecosystem
**Type:** Digital-Out-of-Home (DOOH) Advertising Platform  
**Duration:** 8 months development, 24 months to full scale  
**Budget:** $500K (development), $2M+ (operations Year 1-3)  
**Status:** Developed and ready for deployment

### Business Goal
Transform urban vehicles into a dynamic advertising network by combining mobile hardware with intelligent cloud-based management, creating a mutually beneficial ecosystem for vehicle owners, advertisers, and ad agencies.

### Key Metrics
- **Year 1:** 500 vehicles, 5M monthly impressions, $300K revenue
- **Year 2:** 2,000 vehicles, 50M monthly impressions, $2.4M revenue
- **Year 3:** 5,000 vehicles, 200M monthly impressions, $8.4M revenue

### Critical Success Factors
1. Fleet owner adoption and retention
2. Real-time platform reliability
3. Advertiser ROI demonstration
4. Regulatory compliance
5. Cost efficiency vs. traditional DOOH

---

## 1.2 Project Vision

### Long-Term Vision
To establish AdMotion as the leading mobile DOOH platform globally, enabling:
- 100,000+ active vehicles in major cities worldwide
- Billions of daily advertising impressions
- Sustainable revenue model benefiting all stakeholders
- Industry-leading technology and innovation

### Core Values
- **Transparency:** Clear pricing, real metrics, fair partnerships
- **Innovation:** Cutting-edge technology, continuous improvement
- **Reliability:** 99.9%+ uptime, content delivery guarantee
- **Sustainability:** Win-win for all ecosystem participants

---

## 1.3 Key Success Factors

### Technical Success
✓ Build scalable platform for 10,000+ vehicles
✓ Achieve <200ms real-time synchronization
✓ Ensure 99.9% uptime and reliability
✓ Implement enterprise-grade security

### Business Success
✓ Onboard 500+ vehicles in Year 1
✓ Generate $300K+ revenue Year 1
✓ Achieve positive unit economics by Month 12
✓ Maintain 90%+ customer satisfaction

### Market Success
✓ Differentiate from traditional DOOH
✓ Demonstrate clear ROI for advertisers
✓ Build strong fleet partner relationships
✓ Expand into multiple geographic markets

---

## 1.4 High-Level Timeline

### Phase 1: Foundation (Months 1-2)
- Infrastructure setup
- User management system
- Core database design
- Team onboarding

### Phase 2: Core Development (Months 3-4)
- Vehicle registration system
- Admin dashboard MVP
- Ad management system
- Backend API framework

### Phase 3: Advanced Features (Months 5-6)
- Real-time synchronization
- Vehicle app development
- AI scheduling engine
- Analytics system

### Phase 4: Testing & Launch (Months 7-8)
- Comprehensive testing
- Pilot program (100 vehicles)
- Security hardening
- Production deployment

### Phase 5: Scaling (Months 9-12)
- Onboarding 200+ additional vehicles
- Marketing and promotion
- Enterprise client acquisition
- Performance optimization

---

## 1.5 Project Organization

### Core Team Structure
```
Project Manager
├── Development Team (8 engineers)
│   ├── Frontend (3 developers)
│   ├── Backend (3 developers)
│   └── DevOps (2 engineers)
├── QA Team (2 testers)
├── Product Manager
└── Business Development (2 staff)
```

### Governance & Decision Making
- **Weekly Standup:** Monday-Friday, 10 AM
- **Sprint Planning:** Every 2 weeks
- **Steering Committee:** Monthly review
- **Executive Summary:** Bi-weekly dashboard

---

## 3.1 System Architecture

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    ADMOTION SYSTEM ARCHITECTURE              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRESENTATION LAYER                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Web Dashboard        Vehicle Display App              │ │
│  │  (React/Vite)         (PWA/React)                      │ │
│  │  ┌──────────────────┐ ┌────────────────────────────┐   │ │
│  │  │ Admin Interface  │ │ Vehicle LED Screen Control │   │ │
│  │  │ Campaign Mgmt    │ │ Real-time Ad Display       │   │ │
│  │  │ Analytics        │ │ Health Monitoring          │   │ │
│  │  │ Reports          │ │ GPS Tracking               │   │ │
│  │  └──────────────────┘ └────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▼                                 │
│  APPLICATION LAYER                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  REST API Layer     WebSocket Layer    GraphQL Layer   │ │
│  │  • HTTP/HTTPS       • Real-time Events • Optional      │ │
│  │  • Rate Limiting    • Pub/Sub          • Future        │ │
│  │  • Version v1.0     • Message Queue    • Enhancement   │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▼                                 │
│  BUSINESS LOGIC LAYER                                       │
│  ┌──────────────────┐ ┌────────────────────────────────┐   │
│  │ FastAPI Backend  │ │ AI Scheduling Engine           │   │
│  │ • User Mgmt      │ │ • Round-robin Distribution     │   │
│  │ • Vehicle Mgmt   │ │ • Budget Optimization          │   │
│  │ • Campaign Mgmt  │ │ • Performance Analysis         │   │
│  │ • Finance        │ │ • Conflict Resolution          │   │
│  └──────────────────┘ └────────────────────────────────┘   │
│                            ▼                                 │
│  DATA LAYER                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Firebase Firestore  │  Firebase Storage             │   │
│  │  • Users             │  • Media files                │   │
│  │  • Vehicles          │  • Campaigns                  │   │
│  │  • Campaigns         │  • Documents                  │   │
│  │  • Impressions       │  • Backups                    │   │
│  │  • Transactions      │                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▼                                 │
│  INFRASTRUCTURE LAYER                                       │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  │ Cloud SDN       │ │ CDN/Caching      │ │ Monitoring   │ │
│  │ Auto-scaling    │ │ Content Delivery │ │ & Logging    │ │
│  │ Load Balancing  │ │ Performance      │ │              │ │
│  └─────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Architecture
```
Users (Web)  →  Vercel Edge Network → React App (Dist)
                        ↓
                  Global CDN
                        ↓
Vehicles (4G) → Firestore Listeners → Real-time Sync
                        ↓
                 Google Cloud Compute
                        ↓
            FastAPI Backend (AI Engine)
                        ↓
            Firebase Firestore Database
                        ↓
            Cloud Storage & Backups
```

---

## 3.2 Technology Stack

### Frontend Technologies
| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Framework | React | 18+ | Virtual DOM for smooth ad transitions |
| Build Tool | Vite | Latest | Fast build, HMR for development |
| Styling | Tailwind CSS | 3+ | Utility-first CSS, responsive design |
| State Mgmt | Context API | Built-in | Adequate for app complexity |
| Charts | Chart.js/Recharts | Latest | Interactive analytics visualization |
| UI Components | Material-UI | 5+ | Professional component library |

### Backend Technologies
| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Framework | FastAPI | Latest | Modern, async-ready Python framework |
| Language | Python | 3.9+ | Rich ecosystem, AI/ML libraries |
| async | asyncio | Built-in | Non-blocking I/O for scalability |
| Validation | Pydantic | Latest | Type hints, automatic validation |
| AI/ML | TensorFlow/scikit-learn | Latest | Algorithm development |

### Database & Storage
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | Firestore | Real-time data, scalability |
| Cache | Firebase Realtime DB | Transient data, pub/sub |
| Object Storage | Google Cloud Storage | Media files, backups |
| Search | Algolia (future) | Text search capability |

### Infrastructure & DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Hosting | Vercel + Google Cloud | App delivery, compute |
| CI/CD | GitHub Actions | Automated testing, deployment |
| Monitoring | Cloud Monitoring | System health tracking |
| Logging | Cloud Logging | Centralized logs |
| Security | Cloud KMS | Key management |

---

## 3.3 Data Architecture

### Firestore Collections Structure
```
admotion/
├── users/
│   ├── {uid}/
│   │   ├── profile
│   │   ├── preferences  
│   │   ├── permissions
│   │   └── audit_logs
├── vehicles/
│   ├── {vehicle_id}/
│   │   ├── details
│   │   ├── owner_info
│   │   ├── status
│   │   ├── location (GeoPoint)
│   │   ├── health_metrics
│   │   ├── assigned_ads
│   │   └── performance
├── campaigns/
│   ├── {campaign_id}/
│   │   ├── details
│   │   ├── content
│   │   ├── targeting
│   │   ├── budget
│   │   ├── status
│   │   ├── approvals
│   │   └── analytics
├── ads/
│   ├── {ad_id}/
│   │   ├── metadata
│   │   ├── media_refs (Storage paths)
│   │   ├── format_variants
│   │   └── quality_info
├── impressions/
│   ├── {impression_id}/
│   │   ├── campaign_id (indexed)
│   │   ├── vehicle_id (indexed)
│   │   ├── timestamp (indexed)
│   │   ├── duration
│   │   └── metrics
├── revenue/
│   ├── {transaction_id}/
│   │   ├── vehicle_id
│   │   ├── amount
│   │   ├── impressions
│   │   ├── date
│   │   └── status
└── system/
    ├── config
    ├── alerts
    └── audit_logs (archival)
```

### Data Flow Diagram
```
Vehicle Displays Ad  →  Record Impression  →  Firestore
                              ↓
                        Impact Real-time Listener
                              ↓
                    Dashboard Analytics Updated
                              ↓
                        Revenue Calculated (hourly)
                              ↓
                        Payout Generated (monthly)
```

---

## 3.4 API Specifications

### Core API Endpoints

#### Authentication Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/reset-password
```

#### Vehicle Management Endpoints
```
GET    /api/v1/vehicles
POST   /api/v1/vehicles
GET    /api/v1/vehicles/{id}
PATCH  /api/v1/vehicles/{id}
DELETE /api/v1/vehicles/{id}
GET    /api/v1/vehicles/{id}/health
POST   /api/v1/vehicles/{id}/heartbeat
GET    /api/v1/vehicles/{id}/location-history
```

#### Campaign Management Endpoints
```
GET    /api/v1/campaigns
POST   /api/v1/campaigns
GET    /api/v1/campaigns/{id}
PATCH  /api/v1/campaigns/{id}
DELETE /api/v1/campaigns/{id}
POST   /api/v1/campaigns/{id}/approve
POST   /api/v1/campaigns/{id}/reject
POST   /api/v1/campaigns/{id}/pause
POST   /api/v1/campaigns/{id}/resume
POST   /api/v1/campaigns/{id}/emergency-stop
```

#### Analytics Endpoints
```
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/campaigns/{id}
GET    /api/v1/analytics/vehicles/{id}
GET    /api/v1/analytics/impressions
POST   /api/v1/analytics/reports/generate
GET    /api/v1/analytics/reports/{id}/download
```

#### Financial Endpoints
```
GET    /api/v1/finance/revenue
GET    /api/v1/finance/payouts
POST   /api/v1/finance/process-payouts
GET    /api/v1/finance/statements
GET    /api/v1/finance/tax-reports
```

---

## 3.5 Deployment Architecture

### Development Environment
```
Local Machine
├── Docker Compose (Firebase Emulator)
├── Local React Server (port 3000)
├── Local FastAPI (port 8000)
└── Local Database (Firebase Emulator)
```

### Staging Environment
```
Staging Cloud
├── Vercel (Preview URLs)
├── Cloud Run (FastAPI - limited scale)
├── Firestore (test project)
└── Cloud Storage (test buckets)
```

### Production Environment
```
Production Cloud
├── Vercel (Edge Functions, serverless)
├── Cloud Run (FastAPI - auto-scaled)
├── Firestore (production scale)
├── Cloud Storage (replicated, backup)
├── CDN (global edge caching)
└── Monitoring & Alerting (24/7)
```

---

## 4.1 Admin Operations Guide

### Dashboard Navigation
The Admin Dashboard provides access to all system management functions through an intuitive sidebar navigation.

#### Main Menu Sections
1. **Dashboard** - Overview and KPIs
2. **Admin Management** - User account management
3. **Vehicle Management** - Fleet operations
4. **Campaign Management** - Ad campaigns
5. **Analytics** - Performance reporting
6. **Financial** - Revenue and payouts
7. **Settings** - System configuration
8. **Support** - Help and documentation

### Common Administrative Tasks

#### Task 1: Register New Admin User
**Steps:**
1. Navigate to Admin Management → Add Admin
2. Fill in user details (name, email, phone, location)
3. Assign role (Admin, Moderator, Super Admin)
4. Set initial password
5. (Optional) Upload profile picture
6. Click Save
7. System sends welcome email to new admin

**Expected Outcome:** New admin receives email with login credentials, can log in after verification

#### Task 2: Approve/Reject Vehicle Registration
**Steps:**
1. Navigate to Vehicle Management → Pending Vehicles
2. Review vehicle details and uploaded documents
3. Verify owner information against CNIC/ID
4. Check background for any violations
5. Click Approve or Reject
6. If reject: Enter reason for rejection
7. Click Submit
8. Owner notified via email

**Expected Outcome:** Vehicle activated or rejection reason sent to owner

#### Task 3: Monitor Real-Time Network Health
**Steps:**
1. Go to Dashboard
2. View Live KPI cards (Active Vehicles, Online Vehicles)
3. Check vehicle heat map for geographic distribution
4. Review Alert Feed for critical issues
5. Click on any vehicle to see detailed health metrics
6. Monitor uptime, connectivity, temperature

**Expected Outcome:** Quick assessment of network health and performance

---

## 4.2 Vehicle Onboarding Process

### Step 1: Pre-Registration
1. Vehicle owner creates account on platform
2. Verifies email address
3. Completes KYC (Know Your Customer) form
4. Agrees to terms and revenue sharing agreement

### Step 2: Vehicle Details Submission
1. Enter vehicle make, model, year, color
2. Provide license plate number
3. Enter owner name, CNIC/ID, contact information
4. Provide bank account details (Account number, IBAN, bank name)
5. Review and submit

### Step 3: Document Upload
1. Upload vehicle registration certificate
2. Upload vehicle insurance policy
3. Upload owner ID/CNIC or passport
4. Upload proof of address
5. System scans documents automatically

### Step 4: Verification
- System verifies documents (CNIC format, account validity)
- Admin reviews documents manually
- Background check performed
- Vehicle ownership verified against government records

### Step 5: Hardware Setup Coordination
- Owner receives hardware installation instructions
- Technician assigned for installation
- Installation date and time scheduled
- Owner receives hardware tracking information

### Step 6: Initial Configuration
- Vehicle connects to device management system
- Network connectivity tested
- Display configuration verified
- Advertising and revenue sharing agreement activated

### Step 7: Activation
- Vehicle moves to "Active" status
- Initial ads assigned (platform promotional content)
- Heartbeat monitoring initiated
- Owner can access revenue dashboard

---

## 4.3 Campaign Management Workflow

### Campaign Lifecycle

```
DRAFT
  ↓ (Save Campaign)
PENDING APPROVAL
  ├─ Admin Reviews
  │   ├─→ APPROVED → READY TO LAUNCH
  │   └─→ CHANGES REQUESTED → Back to DRAFT
  └─→ REJECTED (Final)

READY TO LAUNCH
  ├─ AI Scheduling
  └─→ ACTIVE

ACTIVE
  ├─ Campaign Running (Real-time monitoring)
  ├─ Budget tracking
  ├─ Impression counting
  └─→ COMPLETED (at end date)

COMPLETED
  └─ Final analytics available
```

### Campaign Creation Walkthrough

**Step 1: Basic Information**
- Campaign name (max 200 characters)
- Campaign description (optional)
- Budget (minimum $100)
- Duration (1-365 days)
- Start date/time (immediate or scheduled)

**Step 2: Media Upload**
- Drag & drop area for files
- Accepted: PNG, JPG, GIF (images), MP4, WebM (videos)
- Maximum 100MB per file
- Preview shows on all 4 screens
- Quality check performed automatically

**Step 3: Targeting Configuration**
- **Geographic:** Select cities, zones
- **Vehicle Type:** Taxi, Bus, Truck, Private
- **Time-based:** Peak hours (9-5), Off-peak, All day
- **Days:** Specific days, weekends, all days
- **Advanced:** Audience segments, competitor exclusion

**Step 4: Review & Submit**
- Preview campaign layout
- Cost calculation
- Duration and reach estimate
- Confirmation of targeting
- Submit for approval

---

## 5.1 Development Setup

### Prerequisites
```bash
Node.js 16+ & npm
Python 3.9+ & pip
Docker & Docker Compose
Git & GitHub
Firebase CLI
```

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/admotion/platform.git
cd admotion
```

#### 2. Frontend Setup
```bash
cd src
npm install
npm run dev  # Runs on localhost:3000
```

#### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py  # Runs on localhost:8000
```

#### 4. Firebase Setup
```bash
firebase init
firebase emulators:start   # Start local Firebase emulator
```

---

## 5.2 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deployment to Vercel
```bash
vercel deploy --prod
```

### Python Backend Deployment
```bash
gcloud run deploy admotion-backend --source .
```

---

## 6.1 Testing Plan

### Unit Tests
- Framework: Jest (React), Pytest (Python)
- Target: >80% code coverage
- Execution: On every commit

### Integration Tests
- Components with API calls
- Database operations
- Real-time synchronization
- Execution: On pull requests

### End-to-End Tests
- Framework: Cypress
- Scenarios: User flows, critical paths
- Execution: Before release

### Performance Tests
- Load testing (1000 concurrent users)
- Stress testing (10x normal load)
- Endurance testing (72-hour runs)
- Tools: Apache JMeter, K6

---

## 6.2 Security Validation

### Regular Security Audits
- Quarterly external penetration testing
- Monthly internal code reviews
- Automated SAST/DAST scanning
- Dependency vulnerability scanning

### Security Checklist
- ✓ All data encrypted (TLS/HTTPS)
- ✓ Password hashing (bcrypt+)
- ✓ Rate limiting implemented
- ✓ Input validation on all endpoints
- ✓ SQL injection prevention
- ✓ XSS attack prevention
- ✓ CSRF protection
- ✓ Secure session management

---

## 7.1 Support Process

### Support Channels
- **Email:** support@admotion.com
- **Phone:** +1-XXX-XXX-XXXX (business hours)
- **Chat:** In-app support widget
- **Portal:** Self-service knowledge base

### Severity Levels
- **Critical:** System down, security breach → 1 hour response
- **High:** Major feature broken → 4 hour response
- **Medium:** Performance issue → 8 hour response
- **Low:** Question, feature request → 24 hour response

---

## 7.2 Maintenance Schedule

### Regular Maintenance
- **Weekly:** Database cleanup, log rotation
- **Monthly:** Security patches, dependency updates
- **Quarterly:** Full system review, capacity planning
- **Annually:** Disaster recovery drill, audit

### Scheduled Maintenance Windows
- **Every Sunday:** 2-4 AM UTC
- **Notification:** 7 days advance notice
- **Duration:** <2 hours
- **Business Impact:** Minimal (off-peak hours)

---

## 7.3 Troubleshooting Guide

### Issue: Vehicle Not Connecting
**Symptoms:** Vehicle shows offline, no heartbeat
**Steps:**
1. Check network connectivity (4G/WiFi)
2. Verify device IP configuration
3. Check firewall rules
4. Restart device and re-authenticate
5. If issue persists, contact support

### Issue: Ads Not Displaying
**Symptoms:** Vehicle online but no ad content shown
**Steps:**
1. Check campaign status (should be Active)
2. Verify targeting includes vehicle zone
3. Check device storage (should have space for cache)
4. Clear device cache
5. Re-download campaign content

### Issue: Slow Dashboard Performance
**Symptoms:** Dashboard takes >5 seconds to load
**Steps:**
1. Clear browser cache
2. Disable browser extensions
3. Check network connection
4. Use different browser
5. Check system monitoring for server issues

---

## 7.4 SLA Terms

### Service Level Agreement
- **Uptime Target:** 99.9% calculated monthly
- **Measured:** Excluding scheduled maintenance
- **Response Time:** <200ms for 95% of requests
- **Data Durability:** 99.99% (4 nines)

### Credits for Non-Compliance
- 99%-99.9%: 10% credit
- 95%-99%: 25% credit
- <95%: 50% credit + incident review

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **DOOH** | Digital Out-of-Home - advertising on electronic displays |
| **CPM** | Cost Per Thousand - advertising rate metric |
| **Impression** | One display of an advertisement |
| **LED** | Light Emitting Diode - display technology |
| **PWA** | Progressive Web App - web app with offline capabilities |
| **API** | Application Programming Interface |
| **RBAC** | Role-Based Access Control |
| **KMS** | Key Management Service |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **Heartbeat** | Periodic status signal from vehicle |
| **Sync** | Synchronization of data |

---

## Appendix B: Acronyms

| Acronym | Meaning |
|---------|---------|
| FYP | Final Year Project |
| GDPR | General Data Protection Regulation |
| CCPA | California Consumer Privacy Act |
| ABAC | Attribute-Based Access Control |
| JWT | JSON Web Token |
| REST | Representational State Transfer |
| HTTPS | HyperText Transfer Protocol Secure |
| TLS | Transport Layer Security |
| AES | Advanced Encryption Standard |
| XSS | Cross-Site Scripting |
| CSRF | Cross-Site Request Forgery |
| SEO | Search Engine Optimization |
| CDN | Content Delivery Network |
| CI/CD | Continuous Integration/Continuous Deployment |

---

## Appendix D: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial documentation |
| 1.5 | Jan 2026 | Added technical details |
| 2.0 | Feb 17 2026 | Comprehensive final handoff |

---

**This document contains all necessary information for**  
**successful project handoff and deployment.**

**Final Status: COMPLETE ✓**

---

**Document prepared for:** Final Year Project Submission  
**Confidentiality:** Confidential  
**Classification:** Project Documentation