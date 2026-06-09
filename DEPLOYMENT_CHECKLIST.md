# HealthGuard Deployment Verification Checklist

Use this checklist to verify that all components of the upgraded HealthGuard portal are functioning properly.

---

## 1. Local Development Testing
- [ ] Install dependencies:
  - Backend: `pip install -r requirements.txt` (within virtualenv)
  - Frontend: `npm install`
- [ ] Initialize local development configurations:
  - Copy `.env.example` to `.env` in both folders (or set environment variables)
- [ ] Start backend server:
  - Command: `uvicorn app.main:app --reload`
  - Output validation:
    - Structured JSON logs visible on console.
    - Diagnostic logging block printed on startup (DB URL, CORS settings, env vars).
- [ ] Run backend automated tests:
  - Command: `pytest`
  - Success validation: 4/4 passing tests.
- [ ] Verify health & readiness endpoints locally:
  - URL check: `GET http://localhost:8000/health` (Returns `{"status": "healthy"}`)
  - URL check: `GET http://localhost:8000/ready` (Returns `{"status": "ready"}`)
- [ ] Verify system info endpoint locally:
  - URL check: `GET http://localhost:8000/api/v1/system/info` (Returns JSON document with database type, connection status, route metrics, and Twilio SMS attempt states).

---

## 2. Docker & Compose Setup Validation
- [ ] Start containerized system:
  - Command: `docker compose up --build`
- [ ] Verify that all containers run successfully:
  - [ ] `healthguard_db` active and healthy.
  - [ ] `healthguard_backend` active (waits for db health check, runs Alembic migrations, starts Uvicorn).
  - [ ] `healthguard_frontend` active on port 80.
- [ ] Verify local browser connection:
  - Browser load: `http://localhost` (Checks React app page loads, layout sidebar active).
- [ ] Stop containerized system:
  - Command: `docker compose down`

---

## 3. PostgreSQL Database Verification
- [ ] Apply database migrations:
  - Backend container startup runs: `alembic upgrade head`
- [ ] Validate tables existence:
  - Connect to postgres database and verify tables exist: `users`, `conversations`, `messages`, `vaccinations`, `alerts`, `faq_cache`, `alembic_version`.
- [ ] Verify data persistence:
  - Create a new vaccination record, restart PostgreSQL container, verify record remains intact.

---

## 4. Twilio Integration & Safety Verification
- [ ] Setup credentials in `.env`:
  - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` to valid values.
- [ ] Trigger reminders:
  - URL trigger: `POST http://localhost:8000/api/v1/vaccinations/trigger-reminders`
  - Check logging: Look for structured log lines: `SMS Delivery Attempt - To: +...`
- [ ] Verify database record tracking:
  - Query vaccinations database table. Verify:
    - `sms_delivery_status` contains "sent" or "failed".
    - `sms_sent_at` timestamp is populated.
- [ ] Concurrency / Duplicate safety test:
  - Execute `/trigger-reminders` a second time. Verify that no duplicate SMS are sent and `notification_sent` items are skipped.

---

## 5. Frontend UI Verification
- [ ] Mobile viewport validation:
  - Open developer console in Chrome/Safari, toggle responsive device tool. Verify responsive drawer menu expands, table headers wrap/scroll, and forms fit mobile sizing.
- [ ] Error Boundary verification:
  - Trigger a mock render error in React. Verify that the custom premium Error Boundary is displayed showing reload buttons instead of blank white screens.
- [ ] Loading indicators validation:
  - Navigate between views and click buttons. Verify loader spinners appear during API requests.
- [ ] Toast alerts validation:
  - Perform actions (saving records, logging out, logging in). Verify toast alerts appear in the top-right corner.

---

## 6. Cloud Hosting Deploy Validation
- [ ] Render Backend validation:
  - Verify Render Blueprint file `render.yaml` successfully provisions PostgreSQL instance and registers web server.
  - Check Uvicorn binding on Render `$PORT` environment variable.
- [ ] Vercel Frontend validation:
  - Verify Vercel router config `vercel.json` rewrites all pages to `/index.html` to allow direct page reloads.
