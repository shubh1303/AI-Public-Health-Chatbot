<div align="center">

# 🏥 HealthGuard

### AI-Driven Public Health Portal & Chatbot

**A production-grade, full-stack healthcare management platform featuring an immunization analytics dashboard, patient vaccination scheduler, AI-powered multilingual chatbot, and automated SMS reminder system.**

[![Live Backend](https://img.shields.io/badge/Backend-Live%20on%20Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://healthguard-ai-public-health-management.onrender.com)
[![API Docs](https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://healthguard-ai-public-health-management.onrender.com/docs)
[![Health Check](https://img.shields.io/badge/Health-Endpoint-00C7B7?style=for-the-badge&logo=statuspage&logoColor=white)](https://healthguard-ai-public-health-management.onrender.com/health)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20OAuth2-F7B731?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Twilio](https://img.shields.io/badge/SMS-Twilio-F22F46?style=flat-square&logo=twilio&logoColor=white)](https://www.twilio.com/)

</div>

---

## 📌 Project Summary

> **HealthGuard** is a production-deployed, containerized public health management system built for real-world healthcare workflows. It combines a secure administrative immunization dashboard, a patient-facing vaccination scheduler, an NLP-powered multilingual AI chatbot, and a Twilio SMS notification pipeline — all orchestrated with Docker and deployed to Render cloud infrastructure.
>
> Built as a portfolio-grade full-stack project demonstrating expertise in **FastAPI**, **React**, **PostgreSQL**, **JWT authentication**, **Docker**, and **cloud deployment** — suitable for software engineering internship portfolios and professional showcases.

---

## 🚀 Live Deployment

| Service | URL | Status |
|:--------|:----|:-------|
| 🌐 **Backend API** | [healthguard-ai-public-health-management.onrender.com](https://healthguard-ai-public-health-management.onrender.com) | ✅ Live |
| 📄 **Swagger Docs** | [/docs](https://healthguard-ai-public-health-management.onrender.com/docs) | ✅ Live |
| 💓 **Health Check** | [/health](https://healthguard-ai-public-health-management.onrender.com/health) | ✅ Live |

> **Note:** The Render free tier spins down after periods of inactivity. The first request may take 30–60 seconds to cold-start.

---

## ✨ Features

### 🛡️ Administrative Portal
- Secure admin authentication with JWT + OAuth2 refresh token flow
- User management and role-based access control
- Vaccination registry with full CRUD operations
- Immunization analytics dashboard with visual reporting
- Vaccination history tracking per patient

### 🤖 AI Chatbot
- Multilingual health chatbot powered by NLP
- Disease information and vaccination guidance responses
- Conversational interface with context-aware replies
- Sandbox environment for safe testing and demonstration

### 📲 Notification System
- Twilio-powered SMS and WhatsApp vaccination reminders
- Database-backed delivery tracking and logs
- Concurrency-safe deduplication to prevent duplicate sends
- Mock mode for development and testing (no real SMS sent)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│   React 18 + Vite  │  Tailwind CSS  │  Axios HTTP Client   │
│   React Router     │  Error Boundary│  Protected Routes     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                       API GATEWAY                           │
│              Nginx (SPA routing + static serving)           │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      BACKEND LAYER                          │
│   FastAPI  │  OAuth2 + JWT Auth  │  Structured Logging      │
│   Request Middleware  │  Liveness/Readiness Health Checks   │
│   ┌──────────────┬──────────────┬──────────────┐            │
│   │  Admin API   │  Chatbot API │  Vaccs API   │            │
│   └──────────────┴──────────────┴──────────────┘            │
│   NLP Service  │  Translation Service  │  Twilio Service    │
└──────────┬─────────────────────────────────────┬────────────┘
           │                                     │
┌──────────▼──────────┐               ┌──────────▼────────────┐
│    DATABASE LAYER   │               │   NOTIFICATION LAYER  │
│  PostgreSQL (Prod)  │               │   Twilio SMS/WhatsApp │
│  SQLite (Dev/Test)  │               │   Delivery Log DB     │
│  SQLAlchemy ORM     │               └───────────────────────┘
│  Alembic Migrations │
└─────────────────────┘
```

---

## 🧰 Tech Stack

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **FastAPI** | High-performance async Python web framework |
| **SQLAlchemy** | ORM for database interactions |
| **PostgreSQL** | Production relational database |
| **Alembic** | Schema version control and migrations |
| **JWT + OAuth2** | Stateless authentication with refresh token support |
| **Twilio** | SMS/WhatsApp notification dispatch |
| **Pydantic** | Request/response data validation |
| **Structured Logging** | JSON-formatted application logs |

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **React 18** | Component-based UI framework |
| **Vite** | Fast build tooling and dev server |
| **Tailwind CSS** | Utility-first responsive styling |
| **Axios** | Centralized HTTP client with dynamic env config |
| **React Router** | Client-side SPA navigation |
| **Protected Routes** | Auth-gated page access |
| **Error Boundary** | Graceful runtime error handling |

### DevOps & Infrastructure
| Technology | Purpose |
|:-----------|:--------|
| **Docker** | Application containerization |
| **Docker Compose** | Multi-container local orchestration |
| **Multi-stage Builds** | Optimized production Docker images |
| **Nginx** | Frontend static file serving + SPA routing |
| **Render** | Cloud backend and database hosting |
| **Vercel** | Frontend CDN deployment |

---

## 📁 Directory Structure

```
healthguard/
├── backend/
│   ├── app/
│   │   ├── api/             # HTTP endpoints (admin, chatbot, vaccinations, system)
│   │   ├── core/            # Configuration, database, metrics, logging
│   │   ├── models/          # SQLAlchemy model definitions
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Twilio, translation, and NLP services
│   │   └── main.py          # FastAPI startup, middleware registration
│   ├── alembic/             # Database migration revisions
│   ├── requirements.txt     # Python dependency definitions
│   └── Dockerfile           # Backend container definition
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, ProtectedRoute, Toast, ErrorBoundary
│   │   ├── pages/           # Dashboard, Registry, Chatbot, Login
│   │   └── services/        # Centralized api.js, auth, vaccinations clients
│   ├── nginx.conf           # SPA Nginx server config (handles 404 → index.html)
│   ├── vercel.json          # Vercel SPA rewrite configuration
│   └── Dockerfile           # Multi-stage frontend container build
│
├── docker-compose.yml       # Full-stack container orchestration
├── render.yaml              # Render cloud blueprint specification
└── DEPLOYMENT_CHECKLIST.md  # Step-by-step deployment verification
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root or `backend/` directory and configure the following:

| Variable | Description | Default / Example |
|:---------|:------------|:------------------|
| `ENVIRONMENT` | Runtime mode (`development` / `production`) | `development` |
| `SECRET_KEY` | JWT signing key — **must be changed in production** | `super-secret-key-change-in-production-123456789` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./healthbot.db` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID — prefix `ACmock` activates mock mode | `ACmockaccountsd123456789` |
| `TWILIO_AUTH_TOKEN` | Twilio account authentication token | `mockauthtoken123456789` |
| `TWILIO_PHONE_NUMBER` | Twilio virtual phone number | `+18449013032` |
| `BACKEND_CORS_ORIGINS` | Comma-separated list of allowed CORS origins | `*` |
| `VITE_API_URL` | Frontend build-time API base URL | `http://localhost:8000` |

> ⚠️ **Security Note:** Never commit real credentials to version control. Use environment secrets in Render and Vercel dashboards for production deployments.

---

## 🖥️ Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Docker Desktop

### 1. Backend Server

```bash
cd backend
python -m venv venv

# Activate virtual environment
source venv/bin/activate          # macOS / Linux
venv\Scripts\activate             # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API base: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend React App

```bash
cd frontend
npm install
npm run dev
```

- App URL: `http://localhost:5173`

---

## 🐳 Docker Compose (Full Stack)

Spin up PostgreSQL, FastAPI backend, and Nginx frontend together with a single command:

```bash
docker compose up --build
```

| Service | URL |
|:--------|:----|
| Frontend | `http://localhost` |
| Backend API | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/docs` |
| PostgreSQL | `localhost:5432` |

---

## ☁️ Cloud Deployment

### Backend & Database → Render

1. Connect your GitHub monorepo to [Render](https://render.com).
2. Navigate to **Blueprints** and import `render.yaml`.
3. Render will automatically provision a managed PostgreSQL instance and deploy the FastAPI web service.
4. Copy the generated backend URL (e.g. `https://healthguard-backend.onrender.com`) for use in the frontend configuration.

### Frontend → Vercel

1. Connect your repository to [Vercel](https://vercel.com).
2. Select the **Vite** framework preset and set the **Root Directory** to `frontend`.
3. Add the environment variable `VITE_API_URL` pointing to your Render backend URL.
4. Deploy — `vercel.json` automatically handles SPA client-side routing rewrites.

---

## 🗄️ Database Migration Guide (SQLite → PostgreSQL)

Safely migrate your local vaccination registry data to production PostgreSQL:

**Step 1 — Export SQLite data to JSON:**
```bash
sqlite3 healthbot.db -header -json "SELECT * FROM users;" > users.json
sqlite3 healthbot.db -header -json "SELECT * FROM vaccinations;" > vaccinations.json
```

**Step 2 — Apply Alembic schema migrations to PostgreSQL:**
```bash
# Set DATABASE_URL to your PostgreSQL connection string first
alembic upgrade head
```

**Step 3 — Seed PostgreSQL:**
Parse the exported JSON files and insert records into the corresponding PostgreSQL tables, ensuring UUID constraints are preserved.

---

## 🔧 Troubleshooting

| Issue | Cause | Fix |
|:------|:------|:----|
| **Vite page reload returns 404** | SPA routes not handled server-side | Ensure `vercel.json` rewrites and `nginx.conf` redirect unknown paths to `/index.html` |
| **`postgres://` URL crash** | SQLAlchemy 2.0 requires `postgresql://` prefix | `config.py` auto-rewrites this — verify the fix is present |
| **Twilio reminders not sending** | Mock mode active or bad credentials | Ensure `TWILIO_ACCOUNT_SID` does **not** start with `ACmock` for real sends; real credentials required |
| **Cold start delay on Render** | Free tier spins down after inactivity | First request may take 30–60 seconds; upgrade to a paid instance for always-on availability |

---

---

<div align="center">

Built with ❤️ as a full-stack software engineering portfolio project.

</div>
