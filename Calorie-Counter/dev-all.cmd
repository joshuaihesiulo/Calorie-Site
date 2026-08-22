@echo off
rem Starts the backend (uvicorn, in the background) then the frontend dev server.
rem Runs everything with a single command - no manual backend startup needed.
cd /d "%~dp0backend"
start /b "" ".venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "%TEMP%\kaloriq-uvicorn.log" 2>&1
cd /d "%~dp0"
npm run dev