 Business Requirements Document (BRD)
 AdMotion: Intelligent Vehicle Advertising Ecosystem

Version: 2.0  
Date: February 17, 2026  
Status: Final  
Classification: Confidential



 Table of Contents

1. [Executive Summary](1executivesummary)
2. [Business Context](2businesscontext)
3. [Problem Statement](3problemstatement)
4. [Proposed Solution](4proposedsolution)
5. [Market Analysis](5marketanalysis)
6. [Business Objectives](6businessobjectives)
7. [Business Requirements](7businessrequirements)
8. [Scope & Constraints](8scopeconstraints)
9. [Stakeholder Analysis](9stakeholderanalysis)
10. [Business Rules & Policies](10businessrulespolicies)
11. [Use Cases & Scenarios](11usecasesscenarios)
12. [Data & Information Requirements](12datainformationrequirements)
13. [Process Flows & Workflows](13processflowsworkflows)
14. [Assumptions & Constraints](14assumptionsconstraints)
15. [Risk Analysis](15riskanalysis)
16. [Financial Projections](16financialprojections)
17. [Success Metrics & KPIs](17successmetricskpis)
18. [Implementation Timeline](18implementationtimeline)
19. [Approval & SignOff](19approvalsignoff)
20. [Appendices](20appendices)



 1. Executive Summary

 1.1 Project Overview
AdMotion is a revolutionary DigitalOutofHome (DOOH) advertising platform that transforms urban vehicles into dynamic, intelligent advertising displays. The platform connects fleet owners seeking additional revenue streams with advertisers requiring costeffective, targeted advertising solutions.

 1.2 Business Problem
Traditional outdoor advertising suffers from static displays, poor targeting, high operational costs, and limited realtime control. DigitalOutofHome advertising requires expensive infrastructure and longterm commitments, limiting accessibility for small and medium enterprises (SMEs).

 1.3 Proposed Solution
AdMotion introduces a mobile DOOH network by leveraging existing vehicle infrastructure. Vehicle owners can monetize their assets through roofmounted LED displays, while advertisers gain access to an affordable, scalable, and datadriven advertising platform with realtime content control and comprehensive analytics.

 1.4 Value Proposition
 For Fleet Owners: 3050% revenue increase through ad display monetization
 For Advertisers: 6070% cost savings compared to traditional DOOH
 For Ad Agencies: Access to emerging technology and mobile audience
 For Platform: Sustainable recurring revenue model

 1.5 Expected Benefits
 Generate 5000+ vehicle network within 24 months
 Achieve 40% brand awareness among target advertisers
 Create 50+ sustainable jobs
 Process 500M+ ad impressions annually
 Establish market leadership in mobile DOOH segment



 2. Business Context

 2.1 Industry Overview

 2.1.1 Global Advertising Market
 Total Global Ad Spend: $600B+ annually
 DOOH Segment: $25B+ and growing at 8% CAGR
 Digital Advertising: 60% of total spend
 Outdoor Advertising: 7% of total spend

 2.1.2 DigitalOutofHome Industry
 Traditional DOOH: Billboard displays, transit advertising
 New DOOH: Dynamic screens, realtime content
 Growth Driver: Demand for targeted, measurable advertising
 Technological Enablers: Mobile connectivity, cloud platforms, AI

 2.1.3 Market Segments
1. Transit DOOH: Buses, trains, airports  35% of market
2. Billboard DOOH: Large format screens  40% of market
3. Retail DOOH: Instore displays  15% of market
4. Mobile DOOH: Emerging segment  growth opportunity

 2.2 Current Market Landscape

 2.2.1 Competitive Analysis
 Traditional Players: JCDecaux, Clear Channel, Outfront Media
   Strengths: Scale, inventory, relationships
   Weaknesses: High costs, static approach, slow to innovate
  
 Tech Companies: Uber, Grab, Lyft
   Strengths: Technology, fleet, visibility
   Weaknesses: Primary focus is ridesharing, not advertising
  
 Local Competitors: Regional advertising networks
   Strengths: Local relationships, flexibility
   Weaknesses: Limited scale, technology gaps

 2.2.2 Market Opportunities
 Mobile advertising reaching new audiences
 Flexibility in content and targeting
 Realtime responsiveness to market conditions
 AIdriven optimization capabilities
 Integration with digital marketing ecosystems

 2.3 Technology Landscape

 2.3.1 Enabling Technologies
 Cloud Computing: Firebase, AWS, Azure for scalability
 Realtime Databases: Firestore, DynamoDB for instant updates
 AI/ML: Algorithm optimization, predictive analytics
 Mobile: Android TV, PWA for vehicle displays
 Connectivity: 4G/5G, satellite for connectivity

 2.3.2 Industry Standards
 DOOH performance metrics (impressions, dwell time)
 Advertising compliance and content standards
 Data privacy regulations (GDPR, CCPA)
 Payment and revenue sharing mechanisms



 3. Problem Statement

 3.1 Current State Analysis

 3.1.1 Traditional DOOH Challenges
1. Lack of RealTime Control
    Manual content updates requiring technician visits
    2448 hour delay for content changes
    Inability to respond to market events or emergencies
    Cost of maintenance and updates

2. Poor Targeting Capabilities
    Onesizefitsall advertising approach
    No timebased or locationbased targeting
    Inability to adjust for different audiences
    Limited demographic data

3. High Entry Barriers
    Minimum commitments: $50,000+ per location
    Longterm contracts: 23 years minimum
    Complex deployment: 612 months setup
    Inaccessible to SMEs and startups

4. Fragmented Analytics
    Basic metrics: "Ads shown" or "Screen operational"
    No impression tracking
    No audience demographic data
    Delayed reporting (monthly or quarterly)

5. Limited Inventory
    Geographic limitations
    Fixed display locations
    Finite number of premium locations
    Difficult to scale quickly

 3.1.2 Vehicle Fleet Challenges
 Underutilized advertising potential
 Missed revenue opportunities
 No standardized monetization mechanism
 Vehicle idle time generating no revenue

 3.1.3 Advertiser Pain Points
 High media costs ($10,000+ per month per location)
 Long approval processes
 Limited flexibility in campaigns
 Difficulty accessing premium locations
 Poor ROI measurement

 3.2 Business Impact
 Annual loss of $2M+ potential revenue for 500vehicle fleet
 Advertisers shifting to digital channels (lower cost, better metrics)
 Market share loss to digital platforms
 Reduced competitiveness in modern advertising landscape



 4. Proposed Solution

 4.1 Solution Overview

 4.1.1 Core Concept
Transform vehicles into a mobile, scalable, intelligent advertising network through:
 Roofmounted LED displays on vehicles
 Cloudbased management dashboard
 AIpowered content distribution
 Realtime analytics and reporting

 4.1.2 Key Components
1. Hardware Layer
    P4/P5 LED display panels (1920x480 front/back, 480x480 sides)
    Android TV Box as compute node
    4G/LTE modem for connectivity
    Solar charging auxiliary system

2. Software Layer
    Reactbased admin dashboard
    Vehicle display PWA application
    FastAPI backend with AI engine
    Firebase cloud infrastructure

3. Service Layer
    Realtime content synchronization
    Performance monitoring and alerts
    Analytics and reporting
    Payment and revenue distribution

 4.2 Solution Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  ADMOTION ECOSYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │   PRESENTATION LAYER                               │ │
│  │  ┌──────────────────┐  ┌──────────────────┐       │ │
│  │  │ Admin Dashboard  │  │ Vehicle Display  │       │ │
│  │  │    (React)       │  │     App (PWA)    │       │ │
│  │  └──────────────────┘  └──────────────────┘       │ │
│  └────────────────────────────────────────────────────┘ │
│                            ▼                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │   API LAYER                                        │ │
│  │  REST & WebSocket APIs for realtime              │ │
│  │  communication and data synchronization           │ │
│  └────────────────────────────────────────────────────┘ │
│                            ▼                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │   BUSINESS LOGIC LAYER                             │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │ AI Scheduler │  │ Analytics    │               │ │
│  │  │              │  │ Engine       │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │ Optimization │  │ Monitoring   │               │ │
│  │  │ Engine       │  │ & Alerts     │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
│                            ▼                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │   DATA LAYER                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │ Firestore DB │  │ Storage/CDN  │               │ │
│  │  │              │  │              │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

 4.3 Business Model

 4.3.1 Revenue Streams
1. Revenue Sharing with Fleet Owners
    4060% of advertising revenue shared with vehicle owners
    Performancebased bonuses for highperforming vehicles
    Monthly payouts with transparent reporting

2. Advertising Platform Fees
    Commission: 2030% of advertising spend
    Setup fees for campaigns
    Premium features and analytics packages

3. Premium Services
    Priority placement and targeting
    Dedicated account management
    Custom analytics and reporting
    API access for thirdparty integration

4. Data Insights and Analytics
    Aggregated mobility data
    Audience insights and demographics
    Trend analysis and forecasting
    Licensing to research firms

 4.3.2 Cost Structure
 Hardware: $2,5003,000 per vehicle
 Cloud Infrastructure: $25 per vehicle monthly
 Support & Operations: $200300 per vehicle annually
 Marketing & Acquisition: Customer acquisition cost $100200

 4.3.3 Monetization Timeline
 Year 1: 500 active vehicles, 5M monthly impressions
 Year 2: 2,000 active vehicles, 50M monthly impressions
 Year 3: 5,000 active vehicles, 200M monthly impressions



 5. Market Analysis

 5.1 Market Size & Opportunity

 5.1.1 Total Addressable Market (TAM)
 Global DOOH market: $25B
 Mobile advertising segment: $4B+ and growing
 Regional market (South Asia): $500M+ potential
 Initial target market: $50M+ opportunity

 5.1.2 Serviceable Addressable Market (SAM)
 Urban vehicle fleet: 100,000+ vehicles
 Suitable for advertising: 50,000+ vehicles
 Initial target: 5,000 vehicles
 Revenue potential: $50M+ annually

 5.1.3 Serviceable Obtainable Market (SOM)
 Year 1: 500 vehicles ($5M revenue)
 Year 2: 2,000 vehicles ($20M revenue)
 Year 3: 5,000 vehicles ($50M revenue)

 5.2 Customer Segmentation

 5.2.1 Fleet Owners
 Profile: Commercial vehicle owners, taxi companies, delivery services
 Size: 50,000+ in target market
 Pain Points: Low utilization, need additional revenue
 Motivation: 3050% revenue increase
 Willingness to Pay: High  recurring revenue

 5.2.2 Advertisers
 Profile: SMEs, local businesses, startups, agencies
 Size: 100,000+ potential advertisers
 Pain Points: High advertising costs, poor targeting
 Motivation: Cost savings, realtime control, ROI measurement
 Willingness to Pay: High  cost savings justify platform fees

 5.2.3 Ad Agencies
 Profile: Digital agencies, media buying firms
 Size: 1,000+ potential agencies
 Pain Points: Limited DOOH inventory, long implementation times
 Motivation: New revenue streams, advanced capabilities
 Willingness to Pay: High  efficiency gains

 5.3 Competitive Position

 5.3.1 Competitive Advantages
1. Mobile Network: Firstmover advantage in mobile DOOH
2. Cost Efficiency: 6070% lower costs than traditional DOOH
3. Technology: AIpowered optimization and realtime control
4. Scalability: Easy to add vehicles without infrastructure investment
5. Data: Realtime performance metrics and audience insights

 5.3.2 Competitive Threats
 Traditional DOOH providers entering mobile space
 Ridesharing companies leveraging existing fleets
 Tech giants (Google, Meta) offering new advertising options
 Price competition from emerging players

 5.3.3 Market Differentiation
 Speed to Market: Deploy in days vs. months for traditional
 Flexibility: Change content in realtime vs. fixed scheduling
 Affordability: 70% cost savings vs. traditional DOOH
 Intelligence: AI optimization vs. manual scheduling
 Transparency: Realtime metrics vs. retroactive reporting



 6. Business Objectives

 6.1 Strategic Objectives

 6.1.1 Market Leadership
 Establish AdMotion as leading mobile DOOH platform within 24 months
 Achieve 10,000+ vehicle network within 36 months
 Capture 15% of regional DOOH market within 3 years

 6.1.2 Revenue Growth
 Generate $5M revenue in Year 1
 Scale to $50M revenue by Year 3
 Achieve positive unit economics by Month 12
 Reach profitability by Month 24

 6.1.3 Customer Acquisition
 Onboard 500 vehicles in Year 1
 Reach 2,000 vehicles by end of Year 2
 Achieve 5,000 vehicles by end of Year 3

 6.1.4 Technology Excellence
 Build industryleading platform
 Establish AI/ML capabilities for optimization
 Achieve 99.9% uptime and reliability
 Create sustainable competitive advantage

 6.2 Operational Objectives

 6.2.1 Quality & Performance
 99.9% system uptime
 <200ms content synchronization
 98% content delivery rate
 Zero data loss guarantee

 6.2.2 Customer Satisfaction
 90%+ Net Promoter Score (NPS)
 95%+ customer retention
 <1% churn rate
 4.5+ star rating

 6.2.3 Process Efficiency
 Vehicle onboarding in <24 hours
 Campaign activation in <2 hours
 Payment processing within 48 hours
 Support response time <4 hours

 6.2.4 Innovation & Growth
 Launch 2 major features quarterly
 Maintain 30%+ R&D budget allocation
 File 2+ patents annually
 Publish industry research/whitepaper



 7. Business Requirements

 7.1 Functional Business Requirements

 BRF001: User Management
Requirement: System shall support multitier user roles with granular permissions.

Details:
 Super Admin: Full system control, user management, financial oversight
 Admin: Regional management, vehicle approval, campaign oversight
 Moderator: Reporting and monitoring only
 Fleet Manager: Vehicle and revenue management
 Advertiser: Campaign creation and management

Acceptance Criteria:
 Role assignment and removal in <1 minute
 Permission changes effective within 5 seconds
 Audit log of all role changes
 Rolebased menu visibility

 BRF002: Vehicle Registration & Management
Requirement: System shall enable comprehensive vehicle management lifecycle.

Details:
 Vehicle registration with complete documentation
 Status tracking (Pending, Active, Suspended, Inactive)
 Owner information and revenue tracking
 GPS location tracking
 Hardware monitoring and maintenance scheduling
 Multivehicle account management

Acceptance Criteria:
 Registration completion in <20 minutes
 Document upload and verification support
 Realtime status updates
 Bulk vehicle import capability

 BRF003: Campaign Management
Requirement: System shall provide complete advertising campaign lifecycle.

Details:
 Campaign creation with media upload
 Budget management and spending limits
 Targeting options (time, location, vehicle type)
 Content approval workflow
 Campaign automation and scheduling
 Emergency stop capability

Acceptance Criteria:
 Campaign creation in <10 minutes
 Support for images, videos, animations
 Realtime budget monitoring
 Instant emergency stop execution

 BRF004: Ad Distribution & Scheduling
Requirement: System shall intelligently distribute ads across vehicle network.

Details:
 Automated roundrobin distribution
 Budgetaware optimization
 Vehicle availability consideration
 Geographic targeting
 Performancebased adjustment
 Manual override for premium clients

Acceptance Criteria:
 Distribution algorithm achieving 95%+ efficiency
 Realtime optimization execution
 Support for concurrent campaigns
 Fallback mechanism for edge cases

 BRF005: RealTime Synchronization
Requirement: System shall synchronize content in realtime to all vehicles.

Details:
 Sub200ms content propagation
 Offline handling and recovery
 Bandwidth optimization
 Conflict resolution
 Data consistency guarantees
 Network redundancy

Acceptance Criteria:
 95% of vehicles receive updates within 200ms
 Zero data inconsistency
 Automatic recovery from disconnections
 99.9% sync success rate

 BRF006: Analytics & Reporting
Requirement: System shall provide comprehensive performance analytics.

Details:
 Realtime impression tracking
 Performance dashboards
 Custom report generation
 Data export capabilities
 Geographic analytics
 Campaign comparison tools
 Audience insights

Acceptance Criteria:
 Dashboard loading in <3 seconds
 Report generation in <30 seconds
 Support for custom date ranges
 Export in multiple formats (PDF, Excel, CSV)

 BRF007: Payment & Revenue Management
Requirement: System shall automate revenue calculation and distribution.

Details:
 Accurate impressionbased revenue calculation
 Automated monthly settlements
 Transparent payment reporting
 Tax calculation and withholding
 Payment method flexibility (bank transfer, ewallet)
 Dispute resolution mechanism

Acceptance Criteria:
 Revenue calculation accuracy to 0.01%
 Payment processing within 48 hours
 Monthly payment statements
 Appeal/dispute resolution in 7 days

 BRF008: Security & Compliance
Requirement: System shall implement enterprisegrade security.

Details:
 Data encryption in transit and at rest
 Rolebased access control
 Audit logging and monitoring
 Compliance with GDPR, CCPA, local regulations
 Twofactor authentication
 Regular security audits

Acceptance Criteria:
 All data encrypted with AES256
 Zero unauthorized access incidents
 Quarterly security audits
 100% audit log completeness

 7.2 NonFunctional Business Requirements

 BRNF001: Performance
 System shall support 1000+ concurrent users
 Realtime operations <200ms latency
 Dashboard response time <2 seconds
 Report generation <30 seconds
 Video ad streaming without buffering

 BRNF002: Reliability
 99.9% system uptime
 Automatic failover and recovery
 Zerodowntime deployments
 Regular backup and disaster recovery
 Data replication across regions

 BRNF003: Scalability
 Horizontal scaling for increased load
 Support for 10,000+ vehicles
 Handling millions of impressions
 Growing user base without performance degradation
 Cloudnative architecture

 BRNF004: Usability
 Intuitive interface requiring minimal training
 Mobileresponsive design
 Multilanguage support
 Accessibility compliance (WCAG 2.1 AA)
 Contextsensitive help system

 BRNF005: Maintainability
 Modular, welldocumented codebase
 Comprehensive logging and monitoring
 Easy deployment and rollback
 Clear separation of concerns
 Support for iterative improvements



 8. Scope & Constraints

 8.1 Project Scope

 8.1.1 In Scope
 Webbased admin dashboard
 Vehicle display application (PWA)
 Backend API and services
 Firebase infrastructure
 AI scheduling engine
 Analytics and reporting
 Payment integration
 Security implementation

 8.1.2 Out of Scope
 Hardware manufacturing
 LED display production
 Physical vehicle installation
 Vehicle GPS/tracking hardware
 Thirdparty payment platform development
 Mobile app for vehicle owners (Phase 2)
 International expansion (Phase 2)

 8.2 Constraints

 8.2.1 Technical Constraints
 Dependency on Firebase platform availability
 Android TV box lifecycle and updates
 Mobile network reliability
 Browser compatibility limitations
 Video streaming bandwidth requirements

 8.2.2 Operational Constraints
 Initial geographic limitation to target regions
 Fleet owner availability for onboarding
 Regulatory approvals for vehicle modifications
 Content guidelines and compliance
 Privacy regulations compliance

 8.2.3 Resource Constraints
 Limited budget for cloud infrastructure
 Team size limitations
 Development timeline (68 months)
 Hardware procurement delays
 Testing environment availability

 8.2.4 Market Constraints
 Regulatory uncertainty for vehicle advertising
 Competition from established DOOH providers
 Consumer acceptance of vehicle advertising
 Advertiser hesitation for new medium
 Fleet owner skepticism



 9. Stakeholder Analysis

 9.1 Primary Stakeholders

 9.1.1 Fleet Owners
 Interest: Revenue generation, ease of use
 Influence: High  network growth depends on adoption
 Needs: Simple onboarding, reliable payments, minimal support burden
 Success Metrics: 30%+ revenue increase, <2 hours monthly maintenance

 9.1.2 Advertisers
 Interest: Costeffective campaigns, measurable ROI
 Influence: High  revenue generation depends on advertiser spend
 Needs: Easy campaign creation, realtime control, detailed analytics
 Success Metrics: 50%+ cost savings, 3x ROI on campaigns

 9.1.3 Ad Agencies
 Interest: New revenue stream, client satisfaction
 Influence: Medium  can drive significant advertiser volume
 Needs: Bulk management tools, whitelabel options, training
 Success Metrics: 10+ active clients, 20%+ revenue increase

 9.1.4 Internal Team
 Interest: Project success, timely delivery
 Influence: High  responsible for execution
 Needs: Clear requirements, adequate resources, support
 Success Metrics: Ontime delivery, quality, team satisfaction

 9.2 Secondary Stakeholders

 9.2.1 Vehicle Owners (Individual)
 Interest: Vehicle safety, payment reliability
 Influence: Medium  can impact network growth through wordofmouth
 Needs: Safety assurance, transparent terms, fair compensation

 9.2.2 Technology Partners
 Interest: Platform stability, integration opportunities
 Influence: Medium  critical for technical success
 Needs: Clear API documentation, support, timely updates

 9.2.3 Regulatory Bodies
 Interest: Compliance, consumer protection
 Influence: High  can impact market viability
 Needs: Compliance with regulations, safety standards

 9.3 Stakeholder Engagement Plan

| Stakeholder | Frequency | Method | Key Messages |
|||||
| Fleet Owners | Weekly | Email, Portal | Revenue opportunity, training |
| Advertisers | Biweekly | Webinar, Demo | Cost savings, ROI, ease of use |
| Ad Agencies | Monthly | Meeting, Newsletter | Client solutions, revenue share |
| Internal Team | Daily | Standup, Chat | Progress, blockers, support |
| Regulators | Quarterly | Meeting, Report | Compliance, safety, transparency |



 10. Business Rules & Policies

 10.1 Revenue Rules

 10.1.1 Revenue Sharing
 Base revenue: 50% to vehicle owner, 50% to platform
 Performance bonus: Additional 510% if >95% uptime
 Volume discount: 5% reduction for agencies with >100 impressions/day
 Early payment: 2% discount if paid within 5 days

 10.1.2 Budget Management
 Minimum campaign budget: $100
 Maximum daily spend: Configurable per advertiser
 Budget holdback: 5% reserve for system maintenance
 Unused budget: Refunded within 30 days

 10.1.3 Payment Terms
 Monthly settlement for vehicle owners
 Payment on 15th of following month
 Minimum payout threshold: $50
 Payment methods: Bank transfer, ewallet

 10.2 Campaign Rules

 10.2.1 Campaign Approval
 All campaigns require approval before activation
 Approval timeframe: <4 hours during business hours
 Rejection criteria: Brand safety, compliance, content quality
 Appeals process: Escalation to senior manager within 24 hours

 10.2.2 Content Guidelines
 No adult, offensive, or illegal content
 No competitor comparison claims
 No personal data collection allowed
 No misleading or false claims
 All content must adhere to advertising standards

 10.2.3 Campaign Duration
 Minimum: 1 day
 Maximum: 365 days
 Automatic renewal: Must be explicitly enabled
 Campaign modification: Allowed with 1 hour notice

 10.3 Operational Rules

 10.3.1 Vehicle Operation
 Minimum uptime: 95% required
 Heartbeat check: Every 60 seconds
 Mandatory maintenance window: Monthly, 1 hour
 Deactivation: After 7 days of inactivity

 10.3.2 Support Policy
 Response time: <4 hours for critical issues
 Resolution time: <24 hours for most issues
 SLA: 99.9% for critical functions
 Escalation: After 12 hours without resolution

 10.3.3 Compliance
 Agerestricted content: Only during 10 PM  6 AM
 News/Politics: Restricted to specific hours
 Competitor ads: Not display on competitor vehicles
 Brand safety: Realtime monitoring



 11. Use Cases & Scenarios

 11.1 Primary Use Cases

 UC001: Vehicle Owner Onboarding
Actor: Fleet Owner  
Precondition: Vehicle meets hardware requirements

Main Flow:
1. Owner registers account on platform
2. Enters vehicle details (make, model, year, plate)
3. Uploads ownership documents (registration, insurance)
4. Confirms bank details for payments
5. System sends verification email
6. Admin reviews and approves within 24 hours
7. Vehicle activated in system
8. Owner receives login credentials
9. Hardware installation scheduled

Postcondition: Vehicle active and ready for ad display

Alternate Flows:
 Document rejection: Owner notified, resubmission requested
 Verification failure: Admin contact for manual verification



 UC002: Create & Launch Campaign
Actor: Advertiser  
Precondition: Advertiser account with credit

Main Flow:
1. Advertiser logs into dashboard
2. Clicks "Create Campaign"
3. Enters campaign details (name, budget, dates)
4. Uploads media files (images/videos via draganddrop)
5. Sets targeting (time, location, vehicle type)
6. Reviews and submits for approval
7. System validates budget and content
8. Campaign submitted to approval queue
9. Admin reviews within 4 hours
10. Campaign approved and activated
11. System distributes to selected vehicles
12. Realtime metrics displayed on dashboard

Postcondition: Campaign live and delivering impressions

Alternate Flows:
 Content rejected: Advertiser notified with rejection reason
 Budget insufficient: System suggests reduced targeting
 File format unsupported: User prompted to reupload



 UC003: Monitor Campaign Performance
Actor: Advertiser/Admin  
Precondition: Campaign is active

Main Flow:
1. User navigates to campaign dashboard
2. System displays realtime metrics (impressions, spend, ROI)
3. User views geographic distribution of impressions
4. User checks current budget consumption
5. User can adjust budget or targeting
6. System shows performance trends over time
7. User can export report for analysis
8. Notifications alert if metrics exceed thresholds

Postcondition: User has complete visibility into campaign performance



 UC004: Execute Emergency Stop
Actor: Admin/System  
Precondition: Campaign is active and emergency condition detected

Main Flow:
1. Admin identifies emergency (security breach, legal issue)
2. Clicks "Emergency Stop" button
3. System confirms action
4. Admin provides reason
5. System immediately stops campaign on all vehicles
6. All vehicles revert to default content
7. Campaign marked as suspended
8. Admin and relevant stakeholders notified
9. Investigation process initiated
10. Campaign can be reenabled after review

Postcondition: Campaign stopped, vehicles displaying backup content



 UC005: RealTime Ad Synchronization
Actor: System  
Precondition: Vehicle is connected and online

Main Flow:
1. Dashboard user updates campaign content
2. System detects change
3. System identifies affected vehicles
4. System pushes update via Firebase
5. Vehicle receives update notification
6. Vehicle downloads new content (if needed)
7. Vehicle caches content locally
8. Vehicle displays new content within 200ms
9. Vehicle sends confirmation back to system
10. System logs successful sync

Postcondition: All vehicles displaying updated content

Error Handling:
 If vehicle offline: Update queued for when vehicle reconnects
 If content too large: Streamed progressively
 If update fails: Retry with exponential backoff



 11.2 Business Scenarios

 Scenario 1: Small Restaurant Campaign
Business Context: Local restaurant launching new location

Scenario Flow:
1. Restaurant creates account and verifies identity
2. Creates campaign with 5day duration, $500 budget
3. Uploads promotional video (15 seconds)
4. Targets vehicles within 5km of new location, 11 AM  11 PM
5. Campaign approved and activated within 2 hours
6. Over 5 days: Delivers 50,000 impressions
7. Restaurant receives 200 website visits, 50 new customers
8. Final ROI: 400% ($2,000 revenue from $500 ad spend)
9. Restaurant impressed, commits to monthly campaigns

Business Impact:
 Advertiser satisfied with ROI
 Platform gains recurring revenue stream
 Positive reviews lead to 5+ similar clients



 Scenario 2: Large Brand Campaign
Business Context: National brand launching new product

Scenario Flow:
1. Ad agency creates account for brand client
2. Sets up 30day campaign, $50,000 budget
3. Coordinates with 10 other agencies for inventory
4. Creates 3 variations of video content (10s, 15s, 20s)
5. Targets all vehicles in 3 major cities during peak hours
6. Uses AI scheduling for optimal distribution
7. Campaign goes live across 2,000 vehicles
8. Delivers 10M impressions over 30 days
9. Brand measures 30% awareness lift through survey
10. Agency reports $45,000 spend with 2M impressions and exceptional ROI

Business Impact:
 $45K revenue for platform ($22.5K to vehicle owners)
 National brand established as key client
 Case study for future enterprise clients



 Scenario 3: Crisis Management
Business Context: Realtime event requiring immediate response

Scenario Timeline:
 2 PM: Breaking news event occurs
 2:05 PM: Advertiser wants emergency campaign (crisis response)
 2:10 PM: Campaign uploaded and approved (expedited)
 2:15 PM: Campaign goes live on 500 vehicles
 2:30 PM: 100K impressions delivered
 Key information reaching commuters in realtime

Business Impact:
 Demonstrates platform's realtime capabilities
 Establishes AdMotion as critical communication channel
 Media coverage increases brand awareness



 12. Data & Information Requirements

 12.1 Data Model Overview

 12.1.1 Core Entities
 Users: Admin accounts, roles, permissions
 Vehicles: Vehicle details, status, owner, location
 Campaigns: Campaign details, budget, targeting, content
 Ads: Media files, metadata, performance data
 Impressions: Ad display events, metrics, analytics
 Revenue: Payment records, settlements, reconciliation
 Alerts: System notifications, events, logs

 12.1.2 Data Volume Expectations
 Users: 10,000+ active
 Vehicles: 5,000+ managed
 Campaigns: 1,000+ monthly
 Impressions: 500M+ monthly
 Transactions: 50,000+ monthly

 12.2 Data Requirements

 12.2.1 Vehicle Data
 Vehicle identification (VIN, plate, RFID)
 Owner information (name, contact, bank details)
 Hardware specification (LED type, compute node, connectivity)
 Location (GPS coordinates, city, zone)
 Status and health metrics
 Uptime and performance history

 12.2.2 Campaign Data
 Campaign metadata (title, duration, budget)
 Media content (files, formats, resolution)
 Targeting criteria (time, geography, vehicle type)
 Approval status and history
 Performance metrics (impressions, spend, ROI)
 Content modifications and versioning

 12.2.3 Financial Data
 Impressionbased revenue calculation
 Campaign spending and budget tracking
 Vehicle owner earnings and settlements
 Payment records and status
 Tax calculations and withholding
 Reconciliation and audit trail

 12.2.4 Analytics Data
 Realtime impression metrics
 Performance trends and comparisons
 Geographic distribution of impressions
 Audience engagement metrics
 Campaign effectiveness data
 System performance metrics

 12.3 Data Quality Requirements
 Accuracy: 99.99% for financial data
 Completeness: 100% for required fields
 Consistency: Realtime synchronization
 Timeliness: Realtime for operational data, daily for historical
 Auditability: Complete audit trail for all transactions



 13. Process Flows & Workflows

 13.1 Vehicle Onboarding Process

```
START
  │
  ├─► Vehicle Owner Registration
  │   • Create account
  │   • Set password
  │   • Email verification
  │
  ├─► Submit Vehicle Details
  │   • Vehicle information
  │   • Owner information
  │   • Bank details
  │
  ├─► Document Upload
  │   • Vehicle registration
  │   • Insurance certificate
  │   • Owner ID/CNIC
  │
  ├─► System Validation
  │   • Document authenticity check
  │   • Data completeness validation
  │   • Bank account verification
  │   │
  │   ├─ If validation fails ──► Notify Owner ──► Request Resubmission
  │   │
  │   └─ If validation passes ──► Continue
  │
  ├─► Admin Review
  │   • Manual document verification
  │   • Background check
  │   • Final approval
  │   │
  │   ├─ If rejected ──► Notify Owner ──► Can Appeal
  │   │
  │   └─ If approved ──► Continue
  │
  ├─► Vehicle Activated
  │   • Status set to "Active"
  │   • Initial display ID generated
  │   • Credentials sent to owner
  │
  ├─► Hardware Setup Instructions
  │   • Installation guide sent
  │   • Configuration steps
  │   • Support contact information
  │
  ├─► Network Connection Test
  │   • Vehicle connects to cloud
  │   • Initial heartbeat received
  │   • System confirmed operational
  │
  └─► END (Vehicle Ready for Ads)
```

 13.2 Campaign Launch Process

```
START
  │
  ├─► Advertiser Login
  │   • Authenticate to dashboard
  │   • Verify account status
  │
  ├─► Create Campaign
  │   • Enter campaign details
  │   • Set budget and dates
  │   • Select targeting options
  │
  ├─► Upload Media Content
  │   • Images (PNG, JPG, GIF)
  │   • Videos (MP4, WebM)
  │   • Animations and interactive content
  │   │
  │   • System validation:
  │   ├─ File format check
  │   ├─ File size validation
  │   ├─ Content preview
  │   ├─ Virus scanning
  │   │
  │   ├─ If invalid ──► Error notification ──► Retry upload
  │   │
  │   └─ If valid ──► Continue
  │
  ├─► Set Campaign Parameters
  │   • Duration and schedule
  │   • Geographic targeting
  │   • Vehicle type selection
  │   • Timebased targeting
  │
  ├─► Review & Submit
  │   • Campaign preview
  │   • Cost estimation
  │   • Budget allocation
  │   • Confirmation
  │
  ├─► Approval Workflow
  │   │
  │   • Content Review
  │   ├─ Brand safety check
  │   ├─ Regulatory compliance
  │   ├─ Content quality
  │   │
  │   • Automated Checks
  │   ├─ Keyword filtering
  │   ├─ Image recognition
  │   ├─ Audio analysis
  │   │
  │   • Human Review (if needed)
  │   ├─ Assigned to moderator
  │   ├─ Decision within 4 hours
  │   │
  │   ├─ If rejected ──► Notify advertiser ──► Revision and resubmit
  │   │
  │   └─ If approved ──► Continue
  │
  ├─► Campaign Activation
  │   • Status set to "Active"
  │   • Budget tracking initiated
  │   • Targeting rules enforced
  │
  ├─► AI Distribution
  │   • Algorithm processes vehicles
  │   • Schedule generated based on optimization
  │   • Content pushed to selected vehicles
  │
  ├─► Vehicle Confirmation
  │   • Each vehicle confirms content received
  │   • Content cached locally
  │   • Heartbeat status maintained
  │
  ├─► Live Campaign
  │   • Realtime impression tracking
  │   • Budget monitoring
  │   • Performance dashboard updated
  │   • Metrics streamed to advertiser dashboard
  │
  ├─► Campaign Monitoring
  │   • Continuous performance tracking
  │   • Realtime alerts for anomalies
  │   • Budget consumption monitoring
  │   • ROI calculation
  │
  └─► END (Campaign Running)
```



 14. Assumptions & Constraints

 14.1 Key Assumptions

 14.1.1 Technical Assumptions
 Firebase will remain operational and scalable
 4G/LTE connectivity available in target areas
 Android TV boxes compatible with specified software
 Open internet available for vehicles 24/7

 14.1.2 Business Assumptions
 Fleet owners willing to install hardware
 Advertisers will adopt the platform
 Regulatory approval will be granted
 Market size projections are accurate
 Revenue sharing model will work at scale

 14.1.3 Market Assumptions
 Target market exists and is reachable
 Price point competitive with traditional alternatives
 No major disruptive competition
 Technology adoption curve follows projections
 Economic conditions remain stable

 14.2 Project Constraints

 14.2.1 Resource Constraints
 Budget: Limited to $500K for development
 Team: 15 people (developers, designers, managers)
 Timeline: 8 months to MVP, 12 months to full platform
 Infrastructure: Shared cloud resources, initial limited budget

 14.2.2 Technical Constraints
 Must use existing infrastructure (Firebase, Vercel) for cost
 Legacy Android TV compatibility requirements
 Network bandwidth limitations in some areas
 Video streaming quality tradeoffs

 14.2.3 Regulatory Constraints
 No vehicle modifications without local approval
 Advertising content must comply with local laws
 Data protection laws (GDPR, local privacy laws)
 Financial regulations for money handling
 Tax implications in multiple regions



 15. Risk Analysis

 15.1 Technology Risks

 TR001: RealTime Synchronization Failure
 Probability: Medium
 Impact: Critical  Core functionality broken
 Mitigation: Redundant connections, offline queuing, retry mechanisms
 Contingency: Fallback to polling mechanism

 TR002: Data Consistency Issues
 Probability: Low
 Impact: Critical  Financial and operational impact
 Mitigation: Transaction logs, verification mechanisms, backups
 Contingency: Manual reconciliation procedures

 TR003: Security Breach
 Probability: Medium
 Impact: Critical  Regulatory, financial, reputational damage
 Mitigation: Security audits, penetration testing, encryption
 Contingency: Breach response plan, legal team notification

 15.2 Business Risks

 BR001: Low Fleet Owner Adoption
 Probability: Medium
 Impact: High  Revenue target miss
 Mitigation: Incentives, easy onboarding, support
 Contingency: Pivot to fleet partnerships

 BR002: Limited Advertiser Interest
 Probability: Medium
 Impact: High  Revenue model fails
 Mitigation: Competitive pricing, ROI proof, successful pilots
 Contingency: B2B focus, partnership with agencies

 BR003: Regulatory Rejection
 Probability: Medium
 Impact: Critical  Market prohibition
 Mitigation: Early engagement, compliance, content guidelines
 Contingency: Geographic expansion, policy influence

 15.3 Market Risks

 MR001: Competition from Established Players
 Probability: High
 Impact: Medium  Price pressure, market share
 Mitigation: Firstmover advantage, technology leadership, partnerships
 Contingency: Niche focus, geographic expansion

 MR002: Economic Downturn
 Probability: Medium
 Impact: High  Reduced advertising spend
 Mitigation: Flexible pricing, longterm contracts, cost leadership
 Contingency: Diversified revenue streams



 16. Financial Projections

 16.1 Revenue Projections

 Year 1 (Months 112)
 Active Vehicles: 500
 Monthly Impressions: 5M
 Average CPM: $5
 Monthly Revenue: $25K
 Annual Revenue: $300K

 Year 2
 Active Vehicles: 2,000
 Monthly Impressions: 50M
 Average CPM: $4 (scale pricing)
 Monthly Revenue: $200K
 Annual Revenue: $2.4M

 Year 3
 Active Vehicles: 5,000
 Monthly Impressions: 200M
 Average CPM: $3.5
 Monthly Revenue: $700K
 Annual Revenue: $8.4M

 16.2 Cost Projections

 Year 1
 Development: $300K
 Infrastructure: $30K
 Marketing: $100K
 Operations: $50K
 Total Costs: $480K
 Net Loss: $180K

 Year 2
 Development: $200K
 Infrastructure: $100K
 Marketing: $300K
 Operations: $200K
 Total Costs: $800K
 Net Profit: $1.6M (cumulative investment recovery)

 Year 3
 Development: $150K
 Infrastructure: $300K
 Marketing: $500K
 Operations: $600K
 Total Costs: $1.55M
 Net Profit: $6.85M

 16.3 BreakEven Analysis
 Breakeven point: Month 24
 Cash flow positive: Month 28
 RhythROI: Year 3



 17. Success Metrics & KPIs

 17.1 Business KPIs

 Fleet Growth
 Target: 500 vehicles by EOY1, 2000 by EOY2, 5000 by EOY3
 Current: 0
 Success Threshold: 80% of target achieved

 Revenue
 Target: $300K in Year 1, $2.4M in Year 2, $8.4M in Year 3
 Current: $0
 Success Threshold: 75% of revenue target achieved

 Advertiser Acquisition
 Target: 500 active advertisers by EOY1
 Current: 0
 Success Threshold: 400+ active advertisers

 Customer Retention
 Vehicle Owner: 90%+ monthly retention
 Advertiser: 80%+ monthly retention
 Target: Churn <10% monthly

 17.2 Operational KPIs

 System Performance
 Uptime: 99.9% target
 Sync latency: <200ms target
 Dashboard response: <2s target
 Report generation: <30s target

 Delivery Metrics
 Content delivery rate: 98%+ target
 Campaign approval time: <4 hours target
 Payment processing: <48 hours target
 Support resolution: <24 hours target



 18. Implementation Timeline

 Phase 1: Foundation (Months 12)
 Project kickoff and team setup
 Core infrastructure development
 User management system
 Basic dashboard framework

 Phase 2: Core Features (Months 34)
 Vehicle registration system
 Ad management and uploading
 AI scheduling engine basics
 Campaign management

 Phase 3: Advanced Features (Months 56)
 Realtime synchronization
 Vehicle app development
 Analytics and reporting
 Payment integration

 Phase 4: Testing & Launch (Months 78)
 Comprehensive testing
 Pilot program (100 vehicles)
 Feedback incorporation
 Production launch



 19. Approval & SignOff

This Business Requirements Document has been reviewed and approved by:

Business Sponsor: _____________________________ Date: _________

Project Manager: _____________________________ Date: _________

Finance Director: _____________________________ Date: _________

Operations Lead: _____________________________ Date: _________



 20. Appendices

 Appendix A: Glossary
 DOOH: Digital OutofHome Advertising
 CPM: Cost Per Thousand Impressions
 PWA: Progressive Web Application
 ROI: Return On Investment
 KPI: Key Performance Indicator
 MVP: Minimum Viable Product

 Appendix B: References
 Market research reports
 Technology documentation
 Regulatory guidelines
 Financial models



END OF DOCUMENT

