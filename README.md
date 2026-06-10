# HealthGuard: AI-Driven Public Health Portal & Chatbot

HealthGuard is a production-grade, containerized public health management system. It features an administrative immunization analytics dashboard, patient vaccination scheduler, Twilio SMS reminder dispatch service, and a sandbox multi-lingual chatbot interface.

---

## Architecture Overview
- **Frontend**: Single Page React Application built with Vite, styled using Tailwind CSS, and protected by an Error Boundary wrapper. Centralized Axios client reads environment API endpoints dynamically.
- **Backend**: FastAPI web application running structured logging, request performance monitoring middleware, liveness/readiness indicators, and OAuth2 security flow with refresh token support.
- **Database**: PostgreSQL database managed via SQLAlchemy and Alembic schema migrations. Supports backward-compatible SQLite fallback.
- **Reminders**: Integrated Twilio client dispatching SMS/WhatsApp notifications with database delivery logs and strict concurrency-safe deduplication.
- **URL**: https://ai-public-health-chatbot-j22k.onrender.com/
---

## Directory Structure
```
├── backend/
│   ├── app/
│   │   ├── api/             # HTTP endpoints (admin, chatbot, vaccinations, system)
│   │   ├── core/            # Configuration, database, metrics, logging
│   │   ├── models/          # SQLAlchemy model definitions
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Twilio, translation, and NLP services
│   │   └── main.py          # FastAPI startup and middlewares
│   ├── alembic/             # Migration revisions
│   ├── requirements.txt     # Python requirements definition
│   └── Dockerfile           # Backend container definition
├── frontend/
│   ├── src/                 # React components, pages, hooks, services
│   │   ├── components/      # Layout, ProtectedRoute, Toast, ErrorBoundary
│   │   ├── pages/           # Dashboard, Registry, Chatbot, Login
│   │   └── services/        # Centralized api.js client, auth, vaccinations
│   ├── nginx.conf           # SPA Nginx server config
│   ├── vercel.json          # Vercel rewrite configuration
│   └── Dockerfile           # Multi-stage frontend container build
├── docker-compose.yml       # Full stack container orchestration
├── render.yaml              # Render blueprint specification
└── DEPLOYMENT_CHECKLIST.md  # Step-by-step verification checklist
```

---

## Environment Variables Configuration

Copy `.env.example` in the root (or backend folder) to `.env` and configure:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Development mode or production safety level | `development` |
| `SECRET_KEY` | JWT signature key. Must change in production! | `super-secret-key-change-in-production-123456789` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./healthbot.db` |
| `TWILIO_ACCOUNT_SID` | Twilio SID. Use `ACmock...` to activate mock mode | `ACmockaccountsd123456789` |
| `TWILIO_AUTH_TOKEN` | Twilio account auth token | `mockauthtoken123456789` |
| `TWILIO_PHONE_NUMBER` | Twilio virtual phone number | `+18449013032` |
| `BACKEND_CORS_ORIGINS` | CORS allowed origins list | `*` |
| `VITE_API_URL` | Frontend compiler API root endpoint | `http://localhost:8000` |

---

## Database Migration Guide (SQLite to PostgreSQL)

To safely migrate your vaccination registry data from local SQLite (`healthbot.db`) to your production PostgreSQL database:

1. **Dump SQLite Data to JSON**:
   Run a quick script to extract records from SQLite:
   ```bash
   sqlite3 healthbot.db -header -json "SELECT * FROM users;" > users.json
   sqlite3 healthbot.db -header -json "SELECT * FROM vaccinations;" > vaccinations.json
   ```
2. **Apply Alembic Schema Migrations**:
   Deploy the PostgreSQL database. Configure `DATABASE_URL` to point to it, and apply Alembic migrations to generate tables:
   ```bash
   alembic upgrade head
   ```
3. **Seed PostgreSQL Database**:
   Run a script to parse the JSON files and insert the entries into the corresponding PostgreSQL tables, ensuring matching UUID constraints.

---

## Local Development Setup

### 1. Backend Server Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs are hosted at `http://localhost:8000/docs` (custom HealthGuard branding applied).

### 2. Frontend React Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Docker Compose Setup

Run the entire PostgreSQL database, Backend, and Frontend Nginx servers together:
```bash
docker compose up --build
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## Cloud Deployment

### Backend & Database: Render
1. Connect your Github monorepo to Render.
2. Select **Blueprints** and import `render.yaml`.
3. Render will provision a Managed PostgreSQL database instance and compile the FastAPI Web Service automatically.
4. Obtain the Backend URL provided by Render (e.g. `https://healthguard-backend.onrender.com`).

### Frontend: Vercel
1. Connect your repo to Vercel.
2. Choose **Vite** preset. Set **Root Directory** to `frontend`.
3. Add Environment Variable: `VITE_API_URL` set to your Render backend API URL.
4. Deploy. The `vercel.json` routing configuration handles single-page navigation rewrites.

---

## Troubleshooting Guide

- **Vite direct page reload 404**: Vercel frontend must use `vercel.json` and Docker container Nginx must use `nginx.conf` containing routing overrides redirecting unrecognized assets to `/index.html`.
- **Database URL prefix crashes**: If database URL is provided starting with `postgres://`, config.py automatically rewrites it to `postgresql://` to remain compatible with SQLAlchemy 2.0.
- **Twilio reminders fail to send**: Twilio client checks parameters. If account SID starts with `ACmock`, it acts as a simulated loop mock. Real credentials must not start with `ACmock`.
