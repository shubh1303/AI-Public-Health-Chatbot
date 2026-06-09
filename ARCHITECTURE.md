# HealthGuard AI - Phase 2 System Architecture

This document details the system design, authentication workflow, scheduling notification engine, and database entity relationships for the HealthGuard AI Public Health & Vaccination Platform.

---

## 1. System Components Diagram

The application uses a modern decoupled architecture separating the single-page application (React/Vite) from the web services API layer (FastAPI/SQLAlchemy).

```mermaid
graph TD
    subgraph Client Layer
        Landing[Public Landing Page]
        Login[Unified Login Page]
        Signup[Patient Signup Page]
        AdminConsole[Admin Dashboard / Console]
        PatientPortal[Patient Portal / Dashboard]
    end

    subgraph API Gateway & Service Layer (FastAPI)
        AuthRouter[Authentication & JWT Router]
        AdminRouter[Admin Aggregated Analytics Router]
        PatientRouter[Patient Profile & PDF Docs Router]
        ChatRouter[Chatbot Router - HuggingFace/T5]
        VaccRouter[Vaccination Schedule Router]
    end

    subgraph Messaging & Delivery Layer
        TwilioClient[Twilio SMS / Mock Engine]
    end

    subgraph Database Layer
        DB[(PostgreSQL / SQLite)]
    end

    %% Client Interactions
    Landing -->|Route| Login
    Landing -->|Route| Signup
    Login -->|JWT Exchange| AuthRouter
    Signup -->|Insert Patient| PatientRouter
    AdminConsole -->|Aggregated Metrics| AdminRouter
    AdminConsole -->|CRUD Schedules| VaccRouter
    PatientPortal -->|Stream ReportLab PDF| PatientRouter
    PatientPortal -->|Check Doses| PatientRouter
    PatientPortal -->|Ask AI| ChatRouter
    AdminConsole -->|Ask AI| ChatRouter

    %% Backend Dependencies
    AuthRouter -->|SQLAlchemy ORM| DB
    AdminRouter -->|SQLAlchemy ORM| DB
    PatientRouter -->|SQLAlchemy ORM| DB
    VaccRouter -->|SQLAlchemy ORM| DB
    VaccRouter -->|SMS Reminders| TwilioClient
    DB -->|Migrated via| Alembic
```

---

## 2. Authentication Flow

HealthGuard AI features two separate onboarding streams mapped under a single authentication middleware signature.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient User
    actor Admin as Administrator
    participant API as FastAPI Backend
    participant DB as SQLite/PostgreSQL Database

    %% Admin Login Flow
    Admin->>API: POST /api/v1/admin/login (Form-urlencoded: Phone + PW)
    API->>DB: Query User where phone/name matches and is_admin=true
    DB-->>API: User profile (Hashed Password)
    API->>API: Verify Password Hash
    API-->>Admin: Return JWT access_token + refresh_token
    Admin->>API: GET /api/v1/admin/me (Bearer Token)
    API-->>Admin: Profile JSON (Access Granted)

    %% Patient Login Flow
    Patient->>API: POST /api/v1/patient/login (JSON: Email/Phone + PW)
    API->>DB: Query User where email/phone matches and status='active'
    DB-->>API: User profile (Hashed Password)
    API->>API: Verify Password Hash
    API-->>Patient: Return JWT access_token + refresh_token
    Patient->>API: GET /api/v1/patient/me (Bearer Token)
    API-->>Patient: Profile JSON (Access Granted)
```

### Access Control Highlights
1. **Admin Routes** (`/admin/*`): Intercepted by `ProtectedRoute` in the React client requiring `isAdmin === true`. API requests verified via `get_current_admin_user` dependency.
2. **Patient Routes** (`/patient/*`): Intercepted by `ProtectedRoute` requiring `isAdmin === false`. API requests verified via `get_current_patient_user` dependency.
3. **Session Expiry**: Interceptors check for HTTP `401 Unauthorized` responses and clear local authentication storage immediately, routing the agent/member back to the Login view with a session expiry notification.

---

## 3. Database Schema ERD

Database tables mapped using `SQLAlchemy` declarative models and migrated via `Alembic` revisions.

```mermaid
erDiagram
    USERS {
        uuid id PK
        string phone_number UK "Nullable for manual admin entries"
        string email UK "Nullable for legacy manual entries"
        string name
        string language_preference
        string status "active/inactive/suspended"
        string hashed_password "Nullable for legacy manual users"
        boolean is_admin
    }

    VACCINATIONS {
        uuid id PK
        uuid user_id FK "References USERS.id"
        string vaccine_name
        integer dose_number
        date scheduled_date
        date administered_date "Nullable until completed"
        boolean notification_sent
        string sms_delivery_status "sent/failed/pending"
        datetime sms_sent_at "Timestamp of Twilio SMS dispatch"
    }

    CHATBOT_HISTORY {
        uuid id PK
        uuid user_id FK "References USERS.id (Nullable for Guests)"
        string message
        string response_text
        string language "Detected or requested language"
        string channel "web/sms"
        datetime timestamp
    }

    USERS ||--o{ VACCINATIONS : "schedules"
    USERS ||--o{ CHATBOT_HISTORY : "queries"
```

---

## 4. Twilio SMS Notification Pathway

The SMS Engine delivers proactive care logs to patient mobiles safely without double-triggering reminders.

```mermaid
graph LR
    Trigger[Trigger Action: Admin Command or CRON] --> Query[Query DB: Vaccinations scheduled for Target Date]
    Query --> Filter[Filter: Not Administered & Not Sent & Active User]
    Filter --> Dispatch[Dispatch Twilio SMS Payload]
    Dispatch --> Delivery{Twilio Status Gateway}
    Delivery -->|Success| SuccessState[Update DB: notification_sent=True, sms_delivery_status='sent', sms_sent_at=Now]
    Delivery -->|Failure| FailState[Update DB: notification_sent=True, sms_delivery_status='failed', sms_sent_at=Now]
```

---

## 5. Development and Deployment Setup

- **Backend Dev Server**: FastAPI with Uvicorn (`py -m uvicorn app.main:app --reload`)
- **Frontend Dev Server**: Vite Dev Server (`npm run dev`)
- **Database Engine**: PostgreSQL for production deployments, SQLite with batch alters for local testing.
- **Client Bundling**: Vite building minified ESM components (`npm run build`)
