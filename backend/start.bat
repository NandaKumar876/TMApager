@echo off
echo ============================================
echo   WatchTower Backend Server
echo ============================================
echo.
cd /d %~dp0
echo Starting uvicorn on http://0.0.0.0:8000 ...
echo.
python -m uvicorn watchtower.api.main:app --reload --host 0.0.0.0 --port 8000
pause
