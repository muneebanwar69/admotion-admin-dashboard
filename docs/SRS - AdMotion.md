# Software Requirements Specification (SRS): AdMotion Vehicle Advertising Platform

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the AdMotion system. It serves as a reference for developers, testers, and stakeholders to understand the system's capabilities and constraints.

### 1.2 Scope
The SRS covers the complete AdMotion software ecosystem including the Admin Dashboard web application, Vehicle Display Application, backend APIs, and supporting services.

### 1.3 Definitions and Acronyms
- **DOOH**: Digital Out-of-Home advertising
- **PWA**: Progressive Web Application
- **API**: Application Programming Interface
- **UI**: User Interface
- **GPS**: Global Positioning System

## 2. Overall Description

### 2.1 Product Perspective
AdMotion is a comprehensive platform that connects advertisers with vehicle owners to create a dynamic DOOH advertising network. The system consists of:
- Web-based admin dashboard
- Vehicle-mounted display application
- Cloud-based backend services
- AI-powered scheduling engine

### 2.2 Product Functions
- User authentication and authorization
- Vehicle registration and management
- Advertising campaign creation and management
- Automated ad scheduling and distribution
- Real-time content synchronization
- Performance monitoring and analytics

### 2.3 User Characteristics
- **Super Admin**: Technical expertise, system-wide access
- **Admin**: Business operations, regional management
- **Moderator**: Limited access, reporting focus
- **Vehicle Owner**: Basic technical skills, revenue tracking
- **Advertiser**: Marketing knowledge, campaign management

### 2.4 Constraints
- Web-based interface must be responsive
- Vehicle app must work offline for limited periods
- Real-time synchronization required
- Security and data protection compliance

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
- **Admin Dashboard**: Responsive web interface with sidebar navigation
- **Login Screen**: Secure authentication form
- **Vehicle Registration Wizard**: Multi-step form with validation
- **Ad Upload Interface**: Drag-and-drop file upload with preview
- **Analytics Dashboard**: Charts and graphs for KPIs

#### 3.1.2 Hardware Interfaces
- **Vehicle Display**: Android TV Box with LED screen output
- **GPS Module**: Location tracking for vehicles
- **Network Connectivity**: 4G/LTE for real-time communication

#### 3.1.3 Software Interfaces
- **Firebase Firestore**: Real-time database
- **Firebase Storage**: File storage for ads
- **Firebase Authentication**: User management
- **FastAPI Backend**: AI scheduling and business logic

### 3.2 Functional Requirements

#### 3.2.1 Authentication System
**FR1.1**: The system shall authenticate users with username/password
**FR1.2**: The system shall support role-based access control
**FR1.3**: The system shall implement session management
**FR1.4**: The system shall provide password reset functionality

#### 3.2.2 User Management
**FR2.1**: The system shall allow creation of admin users
**FR2.2**: The system shall support user profile updates
**FR2.3**: The system shall enable user deactivation
**FR2.4**: The system shall maintain audit logs of user actions

#### 3.2.3 Vehicle Management
**FR3.1**: The system shall support vehicle registration with complete details
**FR3.2**: The system shall validate vehicle documents
**FR3.3**: The system shall track vehicle status and location
**FR3.4**: The system shall monitor vehicle connectivity and health

#### 3.2.4 Advertising Management
**FR4.1**: The system shall allow ad creation with media upload
**FR4.2**: The system shall support campaign scheduling
**FR4.3**: The system shall track campaign budgets and performance
**FR4.4**: The system shall enable campaign targeting options

#### 3.2.5 AI Scheduling
**FR5.1**: The system shall automatically assign ads to vehicles
**FR5.2**: The system shall optimize distribution based on availability
**FR5.3**: The system shall respect budget constraints
**FR5.4**: The system shall ensure fair distribution across vehicles

#### 3.2.6 Real-time Synchronization
**FR6.1**: The system shall sync ad assignments in real-time
**FR6.2**: The system shall handle offline scenarios gracefully
**FR6.3**: The system shall provide conflict resolution
**FR6.4**: The system shall maintain data consistency

#### 3.2.7 Analytics and Reporting
**FR7.1**: The system shall track ad impressions and metrics
**FR7.2**: The system shall generate performance reports
**FR7.3**: The system shall provide real-time dashboards
**FR7.4**: The system shall export data in multiple formats

### 3.3 Non-Functional Requirements

#### 3.3.1 Performance
**NFR1.1**: System shall respond to user actions within 2 seconds
**NFR1.2**: Real-time updates shall propagate within 200ms
**NFR1.3**: System shall support 1000 concurrent vehicles
**NFR1.4**: File uploads shall complete within 30 seconds

#### 3.3.2 Security
**NFR2.1**: All data transmission shall use HTTPS/TLS
**NFR2.2**: User passwords shall be hashed and salted
**NFR2.3**: System shall implement rate limiting
**NFR2.4**: File uploads shall be validated for security

#### 3.3.3 Reliability
**NFR3.1**: System shall maintain 99.9% uptime
**NFR3.2**: System shall recover from failures automatically
**NFR3.3**: Data shall be backed up regularly
**NFR3.4**: System shall handle network interruptions gracefully

#### 3.3.5 Usability
**NFR4.1**: Interface shall be intuitive and self-explanatory
**NFR4.2**: System shall provide helpful error messages
**NFR4.3**: Forms shall include validation and guidance
**NFR4.4**: System shall support keyboard navigation

#### 3.3.6 Maintainability
**NFR5.1**: Code shall follow established patterns and standards
**NFR5.2**: System shall include comprehensive logging
**NFR5.3**: Documentation shall be kept up-to-date
**NFR5.4**: System shall support modular updates

## 4. System Features

### 4.1 Admin Dashboard
- **Feature 4.1.1**: User-friendly interface for system management
- **Feature 4.1.2**: Real-time notifications and alerts
- **Feature 4.1.3**: Comprehensive search and filtering
- **Feature 4.1.4**: Export capabilities for reports

### 4.2 Vehicle Application
- **Feature 4.2.1**: Automatic ad playback and rotation
- **Feature 4.2.2**: Offline content caching
- **Feature 4.2.3**: Health monitoring and reporting
- **Feature 4.2.4**: Remote configuration updates

### 4.3 AI Engine
- **Feature 4.3.1**: Intelligent ad distribution
- **Feature 4.3.2**: Performance optimization
- **Feature 4.3.3**: Predictive analytics
- **Feature 4.3.4**: Automated decision making

## 5. Data Requirements

### 5.1 Data Models
- **Users**: Profile information, roles, credentials
- **Vehicles**: Registration details, status, location
- **Ads**: Media files, metadata, targeting rules
- **Campaigns**: Budget, schedule, performance metrics

### 5.2 Data Storage
- **Firestore**: Real-time data and user sessions
- **Firebase Storage**: Media files and documents
- **Local Storage**: Vehicle app cache and offline data

## 6. Assumptions and Dependencies

### 6.1 Assumptions
- Stable internet connectivity for vehicles
- Compatible hardware for vehicle displays
- Firebase services availability
- User acceptance of new technology

### 6.2 Dependencies
- Firebase platform services
- Third-party libraries and frameworks
- Hardware manufacturers for displays
- Network providers for connectivity

## 7. Appendices

### 7.1 Glossary
- **Heartbeat**: Periodic status update from vehicles
- **Impression**: Single display of an advertisement
- **Round-Robin**: Fair distribution algorithm
- **Sync**: Real-time data synchronization

### 7.2 References
- Business Requirements Document
- System Architecture Document
- User Interface Mockups
- API Documentation

---

**Approval:**

This SRS is approved by:

**Business Analyst:** ___________________________ Date: __________

**Technical Lead:** ___________________________ Date: __________

**Project Manager:** ___________________________ Date: __________</content>
<parameter name="filePath">d:\fyp\docs\SRS - AdMotion.md