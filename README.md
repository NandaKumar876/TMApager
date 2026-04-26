# Pager TMA & WatchTower Backend

This project combines the **Pager TMA** React/Vite monitoring dashboard with the **WatchTower** Python/FastAPI observability backend. WatchTower monitors endpoint health, parses backend logs, and ingests frontend errors, which are then displayed beautifully on the Pager TMA dashboard.

## Prerequisites
- Node.js & npm
- Python 3.9+ & pip

## Getting Started

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   python -m pip install -r requirements.txt
   ```

3. **Environment Setup:**
   The `backend/.env` file is already configured with your SMTP credentials, but you can adjust these if needed:
   
   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | SQLite or PostgreSQL connection string |
   | `SMTP_HOST` | Email server host (e.g., `smtp.gmail.com`) |
   | `SMTP_PORT` | Email server port (e.g., `587`) |
   | `SMTP_USER` | Email username |
   | `SMTP_PASS` | Email app password |
   | `ALERT_EMAIL` | Comma-separated list of emails to receive alerts |
   | `WATCHTOWER_INGEST_KEY` | Secret key used by the JS SDK for frontend error ingest |

4. **Monitoring Config:**
   Targets to monitor are configured in `backend/config.yaml`. By default, it monitors the React frontend and WatchTower's own health endpoint.

## Running the Application

This project uses `concurrently` to start both the Vite dev server and the Python FastAPI backend in a single command. 

```bash
# Starts BOTH frontend (port 5173) and backend (port 8000)
npm run dev:full
```

Alternatively, you can run them separately:
- **Frontend only**: `npm run dev:frontend`
- **Backend only**: `npm run dev:backend` (or run `backend\start.bat` on Windows)

## Architecture

- **Frontend**: React + Vite + Zustand store. Proxies `/api`, `/health`, `/ingest`, and `/sdk` to the backend.
- **Backend**: FastAPI + SQLAlchemy + APScheduler. 
   - `core/`: DB, config, schemas
   - `api/`: JSON routes, html dashboard
   - `workers/`: Background endpoint checker and log parser tasks
   - `services/`: Alerts and deduplication
