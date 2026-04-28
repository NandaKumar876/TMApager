 TMA Pager & WatchTower Backend

A modern, real-time notification platform designed to streamline communication between academic institutions and students. TMA Pager ensures that important updates, announcements, and emergency alerts are delivered instantly and reliably.

## Overview

TMA Pager is built to address communication gaps in academic environments where timely information is critical. The system enables institutions to broadcast updates efficiently while providing students with a clean and distraction-free interface to receive them.

The application emphasizes performance, clarity, and reliability, making it suitable for both routine notifications and high-priority alerts.

## Tech Stack

Frontend: React / React Native / Next.js
Backend: Python / FastAPI / Node.js
Database: SQLite / PostgreSQL / MongoDB
Realtime Communication: WebSockets / Firebase Realtime Database
Deployment: Vercel / AWS / Render

## Repository Structure

```
TMApager/
│── backend/
│   ├── watchtower/
│   ├── start.bat
│   └── requirements.txt
│── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│── package.json (root orchestration)
└── README.md
```

## Local Development Workflow

This project integrates the **Pager TMA** React/Vite frontend with the **WatchTower** Python/FastAPI observability backend. WatchTower monitors endpoint health, parses backend logs, and ingests frontend errors, which are then displayed beautifully on the Pager TMA dashboard.

### Prerequisites
- Node.js & npm
- Python 3.9+ & pip

### Getting Started

1. **Install All Routing Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Environment Setup:**
   The `backend/.env` file requires your SMTP credentials:
   
   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | SQLite or PostgreSQL connection string |
   | `SMTP_HOST` | Email server host (e.g., `smtp.gmail.com`) |
   | `SMTP_PORT` | Email server port (e.g., `587`) |
   | `SMTP_USER` | Email username |
   | `SMTP_PASS` | Email app password |
   | `ALERT_EMAIL` | Comma-separated list of emails to receive alerts |
   | `WATCHTOWER_INGEST_KEY` | Secret key used by the JS SDK for frontend error ingest |

3. **Monitoring Config:**
   Targets to monitor are configured in `backend/config.yaml`. By default, it monitors the React frontend and WatchTower's own health endpoint.

### Running the Application

This project uses `concurrently` to start both the Vite dev server and the Python FastAPI backend in a single command. 

```bash
# Starts BOTH frontend (port 5173) and backend (port 8000)
npm run dev:full
```

Alternatively, you can run them separately:
- **Frontend only**: `npm run dev:frontend`
- **Backend only**: `npm run dev:backend` (or run `backend\start.bat` on Windows)
